from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timezone
from slugify import slugify
import uuid

from app.core.database import get_session
from app.core.deps import get_current_user
from app.core.cache import cached, invalidate_tags
from app.core.config import settings
from app.models.user import User
from app.models.blog import Blog
from app.schemas.blog import BlogRead, BlogDetail, BlogCreate, BlogUpdate
from app.models.blog_interactions import BlogLike, BlogComment as BlogCommentModel
from app.core.deps import get_optional_user


router = APIRouter(prefix="/blogs", tags=["blogs"])


def _blog_to_read(blog: Blog, session: Session = None) -> dict:
    likes = 0
    if session:
        likes = len(session.exec(select(BlogLike).where(BlogLike.blog_id == blog.id)).all())
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
        "likes": likes,
        "comments_enabled": getattr(blog, "comments_enabled", True),
        "author": {
            "id": blog.author.id,
            "slug": blog.author.slug,
            "first_name": blog.author.first_name,
            "last_name": blog.author.last_name,
            "profile_pic_url": blog.author.profile_pic_url,
            "kvis_year": blog.author.kvis_year,
        },
        "visibility": getattr(blog, "visibility", "public"),
    }


@router.get("", response_model=list[BlogRead])
def list_blogs(
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
    tag: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
):
    query = select(Blog).where(Blog.is_published == True).order_by(Blog.published_at.desc())
    blogs = session.exec(query.offset(offset).limit(limit)).all()

    if tag:
        blogs = [b for b in blogs if b.tags and tag.lower() in b.tags.lower()]

    # Filter kvis_only posts for non-verified users
    if not current_user or not current_user.is_verified:
        blogs = [b for b in blogs if getattr(b, "visibility", "public") == "public"]

    return [_blog_to_read(b, session) for b in blogs]


@router.get("/my-drafts", response_model=list[BlogRead])
def my_drafts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    blogs = session.exec(
        select(Blog)
        .where(Blog.author_id == current_user.id, Blog.is_published == False)
        .order_by(Blog.updated_at.desc())
    ).all()
    return [_blog_to_read(b, session) for b in blogs]


@router.get("/{slug}", response_model=BlogDetail)
def get_blog(
    slug: str,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    if not blog.is_published:
        if not current_user or blog.author_id != current_user.id:
            raise HTTPException(404, detail="Blog not found")
    if getattr(blog, "visibility", "public") == "kvis_only":
        if not current_user or not current_user.is_verified:
            raise HTTPException(403, detail="This post is for KVIS members only")
    return {**_blog_to_read(blog, session), "content": blog.content}


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
        published_at=datetime.now(timezone.utc) if body.is_published else None,
    )
    session.add(blog)
    session.commit()
    session.refresh(blog)
    await invalidate_tags("blogs")
    return {**_blog_to_read(blog, session), "content": blog.content} 


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
        data["published_at"] = datetime.now(timezone.utc)
    for k, v in data.items():
        setattr(blog, k, v)
    blog.updated_at = datetime.now(timezone.utc)
    session.add(blog)
    session.commit()
    session.refresh(blog)
    await invalidate_tags("blogs", f"blog:{slug}")
    return {**_blog_to_read(blog, session), "content": blog.content} 


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

    # Delete likes and comments first
    likes = session.exec(select(BlogLike).where(BlogLike.blog_id == blog.id)).all()
    for l in likes:
        session.delete(l)

    comments = session.exec(select(BlogCommentModel).where(BlogCommentModel.blog_id == blog.id)).all()
    for c in comments:
        session.delete(c)

    session.delete(blog)
    session.commit()
    await invalidate_tags("blogs", f"blog:{slug}")

# ── Likes ─────────────────────────────────────────────────────────────────────

@router.get("/{slug}/like")
def get_like(
    slug: str,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    likes = session.exec(select(BlogLike).where(BlogLike.blog_id == blog.id)).all()
    liked = any(l.user_id == current_user.id for l in likes) if current_user else False
    return {"likes": len(likes), "liked": liked}


@router.post("/{slug}/like")
async def toggle_like(
    slug: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    existing = session.exec(
        select(BlogLike).where(BlogLike.blog_id == blog.id, BlogLike.user_id == current_user.id)
    ).first()
    if existing:
        session.delete(existing)
    else:
        session.add(BlogLike(blog_id=blog.id, user_id=current_user.id))
    session.commit()
    likes = session.exec(select(BlogLike).where(BlogLike.blog_id == blog.id)).all()
    await invalidate_tags(f"blog:{slug}")
    return {"likes": len(likes), "liked": not existing}


# ── Comments ──────────────────────────────────────────────────────────────────

def _comment_to_dict(c: BlogCommentModel, author: User) -> dict:
    return {
        "id": str(c.id),
        "blog_id": str(c.blog_id),
        "parent_id": str(c.parent_id) if c.parent_id else None,
        "content": c.content,
        "created_at": c.created_at,
        "author": {
            "id": str(author.id),
            "slug": author.slug,
            "first_name": author.first_name,
            "last_name": author.last_name,
            "profile_pic_url": author.profile_pic_url,
            "kvis_year": author.kvis_year,
        },
    }


@router.get("/{slug}/comments")
def get_comments(slug: str, session: Session = Depends(get_session)):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    comments = session.exec(
        select(BlogCommentModel).where(BlogCommentModel.blog_id == blog.id)
        .order_by(BlogCommentModel.created_at)
    ).all()
    user_ids = list({c.user_id for c in comments})
    users = {u.id: u for u in session.exec(select(User).where(User.id.in_(user_ids))).all()}
    return [_comment_to_dict(c, users[c.user_id]) for c in comments if c.user_id in users]


@router.post("/{slug}/comments")
async def add_comment(
    slug: str,
    body: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    if not blog.comments_enabled:
        raise HTTPException(403, detail="Comments are disabled")
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(400, detail="Content required")
    parent_id = body.get("parent_id")
    comment = BlogCommentModel(
        blog_id=blog.id,
        user_id=current_user.id,
        parent_id=uuid.UUID(parent_id) if parent_id else None,
        content=content,
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _comment_to_dict(comment, current_user)


@router.delete("/{slug}/comments/{comment_id}", status_code=204)
async def delete_comment(
    slug: str,
    comment_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    comment = session.get(BlogCommentModel, uuid.UUID(comment_id))
    if not comment:
        raise HTTPException(404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(403, detail="Not your comment")
    session.delete(comment)
    session.commit()


@router.patch("/{slug}/comments/toggle")
async def toggle_comments(
    slug: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    blog = session.exec(select(Blog).where(Blog.slug == slug)).first()
    if not blog:
        raise HTTPException(404, detail="Blog not found")
    if blog.author_id != current_user.id:
        raise HTTPException(403, detail="Not your blog")
    blog.comments_enabled = not blog.comments_enabled
    session.add(blog)
    session.commit()
    await invalidate_tags(f"blog:{slug}", "blogs")
    return {"comments_enabled": blog.comments_enabled}