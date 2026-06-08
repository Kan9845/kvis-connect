import logging
import threading
import time

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_GRAPH_SCOPE = "https://graph.microsoft.com/.default"
_token_lock = threading.Lock()
_token_cache: dict[str, float | str] = {"access_token": "", "expires_at": 0.0}


def _get_graph_token() -> str:
    now = time.time()
    with _token_lock:
        if _token_cache["access_token"] and now < float(_token_cache["expires_at"]):
            return str(_token_cache["access_token"])

        url = f"https://login.microsoftonline.com/{settings.MS_TENANT_ID}/oauth2/v2.0/token"
        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "scope": _GRAPH_SCOPE,
            "grant_type": "client_credentials",
        }
        resp = httpx.post(url, data=data, timeout=15)
        resp.raise_for_status()
        payload = resp.json()

        token = payload["access_token"]
        # Refresh 60s before expiry to avoid edge-of-expiry failures.
        _token_cache["access_token"] = token
        _token_cache["expires_at"] = now + int(payload.get("expires_in", 3600)) - 60
        return token


def send_email(to_email: str, subject: str, text: str) -> None:
    if not settings.MS_TENANT_ID or not settings.MS_CLIENT_ID or not settings.MS_CLIENT_SECRET:
        logger.warning("MS Graph not configured — email skipped. To: %s | Subject: %s\n%s", to_email, subject, text)
        return
    token = _get_graph_token()
    url = f"https://graph.microsoft.com/v1.0/users/{settings.MS_SENDER}/sendMail"
    body = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": text},
            "toRecipients": [{"emailAddress": {"address": to_email}}],
        },
        "saveToSentItems": False,
    }
    resp = httpx.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=15,
    )
    resp.raise_for_status()
