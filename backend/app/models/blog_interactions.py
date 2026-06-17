import uuid
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone


class BlogLike(SQLModel, table=True):
    __tablename__ = "blog_like"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    blog_id: uuid.UUID = Field(foreign_key="blog.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BlogComment(SQLModel, table=True):
    __tablename__ = "blog_comment"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    blog_id: uuid.UUID = Field(foreign_key="blog.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="blog_comment.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))