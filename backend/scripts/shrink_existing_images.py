"""Backfill: shrink every image already in Supabase Storage.

Overwrites each object in place (same key), so no DB or blog-body URLs change.
Sets ContentType=image/webp and a `compressed` marker so re-runs skip done files
(re-encoding webp repeatedly would degrade quality).

Run from backend/:  python -m scripts.shrink_existing_images [--dry-run]

The `immutable` cache header means clients that already fetched an original may
keep it for up to a year; egress is dominated by cache-miss fetches, which this
fixes immediately.
"""
import io
import sys

import boto3

from app.core.config import settings
from app.core.images import compress_image

# max dimension per storage prefix
PREFIX_MAX_DIM = {"profiles/": 512, "blogs/": 1600}
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")


def s3_client():
    kwargs = {
        "aws_access_key_id": settings.S3_ACCESS_KEY,
        "aws_secret_access_key": settings.S3_SECRET_KEY,
    }
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    else:
        kwargs["region_name"] = settings.S3_REGION
    return boto3.client("s3", **kwargs)


def main(dry_run: bool):
    if not settings.S3_ACCESS_KEY:
        sys.exit("S3 not configured (check .env)")

    s3 = s3_client()
    bucket = settings.S3_BUCKET
    paginator = s3.get_paginator("list_objects_v2")

    done = skipped = 0
    saved = 0
    for prefix, max_dim in PREFIX_MAX_DIM.items():
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                if not key.lower().endswith(IMAGE_EXTS):
                    continue

                head = s3.head_object(Bucket=bucket, Key=key)
                if head.get("Metadata", {}).get("compressed") == "1":
                    skipped += 1
                    continue

                orig = obj["Size"]
                raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
                try:
                    body = compress_image(io.BytesIO(raw), max_dim=max_dim)
                except Exception as e:  # corrupt / non-image object - leave it
                    print(f"  skip (unreadable) {key}: {e}")
                    skipped += 1
                    continue

                new_size = body.getbuffer().nbytes
                print(f"  {key}: {orig:>9} -> {new_size:>9} bytes")
                if not dry_run:
                    body.seek(0)
                    s3.put_object(
                        Bucket=bucket,
                        Key=key,
                        Body=body,
                        ContentType="image/webp",
                        CacheControl="public, max-age=31536000, immutable",
                        Metadata={"compressed": "1"},
                    )
                done += 1
                saved += max(orig - new_size, 0)

    print(f"\n{'DRY RUN - ' if dry_run else ''}compressed {done}, skipped {skipped}, "
          f"~{saved / 1_048_576:.1f} MB saved on disk")


if __name__ == "__main__":
    main(dry_run="--dry-run" in sys.argv)
