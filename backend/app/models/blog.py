from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

from app.models.user import User


class Blog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="user.id", index=True)

    title: str
    slug: str = Field(unique=True, index=True)
    content: str                          # markdown
    excerpt: Optional[str] = None         # short description, auto-generated if empty
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None            # comma-separated

    is_published: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    author: Optional["User"] = Relationship(back_populates="blogs")
