import re
import uuid
from typing import Optional

from sqlmodel import Session, select


def slugify_name(first: str, last: str) -> str:
    raw = f"{first}-{last}".lower()
    raw = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return raw or "user"


def unique_user_slug(
    session: Session,
    first: str,
    last: str,
    exclude_id: Optional[uuid.UUID] = None,
) -> str:
    from app.models.user import User

    base = slugify_name(first, last)
    candidate = base
    n = 2
    while True:
        stmt = select(User).where(User.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(User.id != exclude_id)
        if not session.exec(stmt).first():
            return candidate
        candidate = f"{base}-{n}"
        n += 1
