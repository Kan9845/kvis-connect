from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime
from slugify import slugify

from app.core.database import get_session
from app.core.deps import get_current_user
from app.core.cache import cached, invalidate_tags
from app.core.config import settings
from app.models.user import User
from app.models.blog import Blog
from app.schemas.blog import BlogRead, BlogDetail, BlogCreate, BlogUpdate

router = APIRouter(prefix="/blogs", tags=["blogs"])


def _blog_to_read(blog: Blog) -> dict:
    return {
        "id": blog.id,
        "slug": blog.slug,
        "title": blog.title,
        "excerpt": blog.excerpt or blog.content[:200].rstrip() + "…",
        "cover_image_url": blog.cover_image_url,
        "tags": blog.tags,
        "is_published": blog.is_published,
        "published_at": blog.published_at,
        "created_at": blog.created_at,
        "author": {
            "id": blog.author.id,
            "first_name": blog.author.first_name,
            "last_name": blog.author.last_name,
            "profile_pic_url": blog.author.profile_pic_url,
            "kvis_year": blog.author.kvis_year,
        },
    }


@router.get("", response_model=list[BlogRead])
@cached(key="blogs:list:<args>", tags=["blogs"], ttl=settings.CACHE_TTL_SHORT)
def list_blogs(
    session: Session = Depends(get_session),
    tag: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
):
    query = select(Blog).where(Blog.is_published == True).order_by(Blog.published_at.desc())
    blogs = session.exec(query.offset(offset).limit(limit)).all()

    if tag:
        blogs = [b for b in blogs if b.tags and tag.lower() in b.tags.lower()]

    return [_blog_to_read(b) for b in blogs]


@router.get("/{slug}", response_model=BlogDetail)
@cached(key=lambda slug, session: f"blogs:slug:{slug}", tags=lambda slug, session: ["blogs", f"blog:{slug}"], ttl=settings.CACHE_TTL_LONG)
def get_blog(slug: str, session: Session = Depends(get_session)):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog or not blog.is_published:
        raise HTTPException(404, detail="Blog not found")
    return {**_blog_to_read(blog), "content": blog.content}


@router.post("", response_model=BlogDetail, status_code=201)
async def create_blog(
    body: BlogCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    base_slug = slugify(body.title)
    slug = base_slug
    counter = 1
    while session.exec(select(Blog).where(Blog.slug == slug)).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    blog = Blog(
        author_id=current_user.id,
        slug=slug,
        title=body.title,
        content=body.content,
        excerpt=body.excerpt,
        cover_image_url=body.cover_image_url,
        tags=body.tags,
        is_published=body.is_published,
        published_at=datetime.utcnow() if body.is_published else None,
    )
    session.add(blog)
    session.commit()
    session.refresh(blog)
    await invalidate_tags("blogs")
    return {**_blog_to_read(blog), "content": blog.content}


@router.patch("/{slug}", response_model=BlogDetail)
async def update_blog(
    slug: str,
    body: BlogUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    if blog.author_id != current_user.id:
        raise HTTPException(403, detail="Not your blog")

    data = body.model_dump(exclude_unset=True)
    if data.get("is_published") and not blog.is_published:
        data["published_at"] = datetime.utcnow()
    for k, v in data.items():
        setattr(blog, k, v)
    blog.updated_at = datetime.utcnow()
    session.add(blog)
    session.commit()
    session.refresh(blog)
    await invalidate_tags("blogs", f"blog:{slug}")
    return {**_blog_to_read(blog), "content": blog.content}


@router.delete("/{slug}", status_code=204)
async def delete_blog(
    slug: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    if blog.author_id != current_user.id:
        raise HTTPException(403, detail="Not your blog")
    session.delete(blog)
    session.commit()
    await invalidate_tags("blogs", f"blog:{slug}")
