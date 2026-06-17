import uuid
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime, timezone

from app.models.user import User


class Blog(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    author_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    title: str
    slug: str = Field(unique=True, index=True)
    content: str                          # markdown
    excerpt: Optional[str] = None         # short description, auto-generated if empty
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None            # comma-separated

    visibility: str = Field(default="public")  # "public" or "kvis_only"
    is_published: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    author: Optional["User"] = Relationship(back_populates="blogs")
    comments_enabled: bool = Field(default=True)


