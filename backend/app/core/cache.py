"""Redis-backed cache-aside with tag invalidation.

Public surface:
- ``init_cache()`` / ``close_cache()`` — lifecycle, called from main.py.
- ``cached(key_fn, tags, ttl)`` — decorator for FastAPI handlers.
- ``invalidate_tags(*tags)`` — call after ``session.commit()`` in write handlers.
- ``metrics`` — counters dict, mutated in place.

All Redis ops swallow connection/timeout errors and degrade to a no-op: a
healthy backend should never 500 because the cache is sick.
"""
from __future__ import annotations

import asyncio
import functools
import hashlib
import json
import logging
from datetime import date, datetime
from typing import Any, Awaitable, Callable, Iterable

import redis.asyncio as aioredis
from redis.exceptions import RedisError

from app.core.config import settings

log = logging.getLogger(__name__)

# Atomic invalidation: read tag set, delete every key, delete the tag itself.
_INVALIDATE_LUA = """
local keys = redis.call('SMEMBERS', KEYS[1])
if #keys > 0 then
  redis.call('DEL', unpack(keys))
end
redis.call('DEL', KEYS[1])
return #keys
"""

_client: aioredis.Redis | None = None
_invalidate_script_sha: str | None = None

metrics: dict[str, int] = {
    "cache_hit": 0,
    "cache_miss": 0,
    "cache_error": 0,
    "invalidations": 0,
}


async def init_cache() -> None:
    """Open the singleton client. Called at FastAPI startup."""
    global _client, _invalidate_script_sha
    if not settings.CACHE_ENABLED:
        log.info("cache disabled via CACHE_ENABLED=false")
        return
    _client = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        socket_timeout=0.2,
        socket_connect_timeout=0.5,
        retry_on_timeout=False,
        max_connections=20,
    )
    try:
        await _client.ping()
        _invalidate_script_sha = await _client.script_load(_INVALIDATE_LUA)
        log.info("cache connected at %s", settings.REDIS_URL)
    except (RedisError, OSError) as e:
        log.warning("cache unreachable at startup, degrading: %s", e)


async def close_cache() -> None:
    global _client
    if _client is not None:
        try:
            await _client.aclose()
        except Exception:  # noqa: BLE001
            pass
        _client = None


def _json_default(o: Any) -> Any:
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    import uuid
    if isinstance(o, uuid.UUID):
        return str(o)
    # Pydantic v2 models
    if hasattr(o, "model_dump"):
        return o.model_dump()
    raise TypeError(f"not serialisable: {type(o)}")


def _hash_args(args: tuple, kwargs: dict) -> str:
    """Stable hash of non-FastAPI-dep args. Skips Session, User, Request, Response."""
    skip_types = ("Session", "User", "Request", "Response", "UploadFile")
    parts: list[str] = []
    for a in args:
        if type(a).__name__ in skip_types:
            continue
        parts.append(repr(a))
    for k in sorted(kwargs):
        v = kwargs[k]
        if type(v).__name__ in skip_types:
            continue
        parts.append(f"{k}={v!r}")
    joined = "|".join(parts)
    return hashlib.sha1(joined.encode("utf-8")).hexdigest()[:16]


def cached(
    key: str | Callable[..., str],
    tags: Iterable[str] | Callable[..., Iterable[str]],
    ttl: int,
):
    """Cache-aside decorator for async or sync FastAPI handlers.

    ``key`` and ``tags`` may be strings/iterables or callables receiving the
    same args/kwargs as the handler. Callables let you embed path params (e.g.
    ``slug``) into the key while keeping the schema declarative at the call site.
    """

    def decorator(fn: Callable[..., Any]):
        is_async = asyncio.iscoroutinefunction(fn)

        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            client = _client
            if client is None or not settings.CACHE_ENABLED:
                return await _call(fn, is_async, args, kwargs)

            raw_key = key(*args, **kwargs) if callable(key) else key
            if "<args>" in raw_key:
                raw_key = raw_key.replace("<args>", _hash_args(args, kwargs))
            full_key = f"cache:{raw_key}"

            try:
                hit = await client.get(full_key)
            except (RedisError, OSError) as e:
                metrics["cache_error"] += 1
                log.warning("cache GET failed (%s): %s", full_key, e)
                return await _call(fn, is_async, args, kwargs)

            if hit is not None:
                metrics["cache_hit"] += 1
                return json.loads(hit)

            metrics["cache_miss"] += 1
            result = await _call(fn, is_async, args, kwargs)

            try:
                payload = json.dumps(result, default=_json_default)
                resolved_tags = list(
                    tags(*args, **kwargs) if callable(tags) else tags
                )
                pipe = client.pipeline()
                pipe.setex(full_key, ttl, payload)
                for tag in resolved_tags:
                    pipe.sadd(f"tag:{tag}", full_key)
                await pipe.execute()
            except (RedisError, OSError, TypeError) as e:
                metrics["cache_error"] += 1
                log.warning("cache SET failed (%s): %s", full_key, e)

            return result

        return wrapper

    return decorator


async def _call(fn: Callable[..., Any], is_async: bool, args: tuple, kwargs: dict) -> Any:
    if is_async:
        return await fn(*args, **kwargs)
    return await asyncio.to_thread(fn, *args, **kwargs)


async def invalidate_tags(*tags: str) -> int:
    """Atomically drop every cache key in each tag's set, then drop the tag set.

    MUST be called AFTER ``session.commit()`` to preserve read-your-write
    consistency. Returns the total number of keys evicted across all tags.
    """
    client = _client
    if client is None or not settings.CACHE_ENABLED:
        return 0

    if not tags:
        return 0

    total = 0
    try:
        for tag in tags:
            n = await client.evalsha(_invalidate_script_sha, 1, f"tag:{tag}")
            total += int(n)
    except RedisError as e:
        # NOSCRIPT on Redis restart — fall back to direct EVAL once.
        if "NOSCRIPT" in str(e):
            try:
                for tag in tags:
                    n = await client.eval(_INVALIDATE_LUA, 1, f"tag:{tag}")
                    total += int(n)
            except (RedisError, OSError) as e2:
                metrics["cache_error"] += 1
                log.warning("invalidate_tags fallback failed: %s", e2)
                return 0
        else:
            metrics["cache_error"] += 1
            log.warning("invalidate_tags failed: %s", e)
            return 0
    except OSError as e:
        metrics["cache_error"] += 1
        log.warning("invalidate_tags transport failed: %s", e)
        return 0

    metrics["invalidations"] += 1
    log.info("invalidated tags=%s keys=%d", list(tags), total)
    return total


async def metrics_logger() -> None:
    """Background task: every 60s, log + reset counters."""
    while True:
        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            break
        snap = dict(metrics)
        for k in metrics:
            metrics[k] = 0
        if any(snap.values()):
            log.info(
                "cache metrics hit=%d miss=%d error=%d invalidations=%d",
                snap["cache_hit"],
                snap["cache_miss"],
                snap["cache_error"],
                snap["invalidations"],
            )
