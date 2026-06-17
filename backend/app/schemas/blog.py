import uuid
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BlogAuthor(BaseModel):
    id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    profile_pic_url: Optional[str]
    kvis_year: Optional[int]


class BlogRead(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    excerpt: Optional[str]
    cover_image_url: Optional[str]
    tags: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    created_at: datetime
    likes: int = 0
    comments_enabled: bool = True
    author: BlogAuthor


class BlogDetail(BlogRead):
    content: str


class BlogCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    is_published: bool = False


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    is_published: Optional[bool] = None
