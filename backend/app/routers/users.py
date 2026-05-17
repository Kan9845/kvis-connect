from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from datetime import datetime
import boto3
import uuid

from app.core.database import get_session
from app.core.deps import get_current_user, get_optional_user
from app.core.config import settings
from app.core.cache import cached, invalidate_tags
from app.models.user import User, Education, Career
from app.schemas.user import (
    UserMe, UserPublic, UserUpdate, UserCard,
    EducationWrite, CareerWrite, GlobePin,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserMe)
def get_me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.get(User, current_user.id)
    return _user_to_me(user)


@router.patch("/me", response_model=UserMe)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, current_user.id)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(user, k, v)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    await invalidate_tags("users", f"user:{current_user.id}")
    return _user_to_me(user)


@router.post("/me/profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not settings.S3_ENDPOINT_URL:
        raise HTTPException(503, detail="Storage not configured")

    s3 = boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
    )
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    key = f"profiles/{current_user.id}/{uuid.uuid4()}.{ext}"
    s3.upload_fileobj(file.file, settings.S3_BUCKET, key, ExtraArgs={"ContentType": file.content_type})

    url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET}/{key}"
    user = session.get(User, current_user.id)
    user.profile_pic_url = url
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    await invalidate_tags("users", f"user:{current_user.id}")
    return {"url": url}


@router.get("/{user_id}", response_model=UserPublic)
@cached(key=lambda user_id, session: f"user:{user_id}", tags=lambda user_id, session: ["users", f"user:{user_id}"], ttl=settings.CACHE_TTL_LONG)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, detail="User not found")
    return _user_to_public(user)


# Education
@router.put("/me/education")
async def replace_education(
    items: list[EducationWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(Education).where(Education.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for item in items:
        session.add(Education(user_id=current_user.id, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.id}")
    return {"message": "Education updated"}


# Career
@router.put("/me/career")
async def replace_career(
    items: list[CareerWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(Career).where(Career.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for item in items:
        session.add(Career(user_id=current_user.id, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.id}")
    return {"message": "Career updated"}


@router.get("/globe/pins", response_model=list[GlobePin])
@cached(key="globe", tags=["users"], ttl=settings.CACHE_TTL_LONG)
def get_globe_pins(session: Session = Depends(get_session)):
    users = session.exec(
        select(User).where(User.latitude.isnot(None), User.longitude.isnot(None))
    ).all()
    def _current_job(u: User):
        current = next((c for c in u.career if c.is_current), None) or (u.career[-1] if u.career else None)
        return f"{current.job_title} at {current.employer}" if current else None

    return [
        GlobePin(
            user_id=u.id,
            first_name=u.first_name,
            last_name=u.last_name,
            latitude=u.latitude,
            longitude=u.longitude,
            place=u.place,
            kvis_year=u.kvis_year,
            profile_pic_url=u.profile_pic_url,
            mbti=u.mbti,
            current_job=_current_job(u),
            country=u.country,
        )
        for u in users
    ]


# ── helpers ──────────────────────────────────────────────────────────────────

def _edu_list(user: User):
    return [
        {
            "id": e.id, "uni_name": e.uni_name, "degree": e.degree,
            "major": e.major, "country": e.country, "state": e.state,
            "scholarship": e.scholarship, "start_year": e.start_year, "end_year": e.end_year,
        }
        for e in user.education
    ]


def _career_list(user: User):
    return [
        {
            "id": c.id, "job_title": c.job_title, "employer": c.employer,
            "job_field": c.job_field, "country": c.country, "state": c.state,
            "is_current": c.is_current, "start_year": c.start_year, "end_year": c.end_year,
        }
        for c in user.career
    ]


def _user_to_public(user: User) -> dict:
    return {
        "id": user.id, "first_name": user.first_name, "last_name": user.last_name,
        "kvis_year": user.kvis_year,
        "current_grade": user.current_grade, "current_class": user.current_class,
        "current_elemental": user.current_elemental,
        "place": user.place, "latitude": user.latitude,
        "longitude": user.longitude, "country": user.country,
        "profile_pic_url": user.profile_pic_url, "bio": user.bio,
        "mbti": user.mbti, "interests": user.interests,
        "facebook_url": user.facebook_url, "linkedin_url": user.linkedin_url,
        "website_url": user.website_url, "created_at": user.created_at,
        "education": _edu_list(user), "career": _career_list(user),
    }


def _user_to_me(user: User) -> dict:
    return {**_user_to_public(user), "email": user.email, "line_id": user.line_id,
            "email_verified": user.email_verified, "is_verified": user.is_verified,
            "kvis_email": user.kvis_email}
