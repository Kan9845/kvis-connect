from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from sqlalchemy import text
from typing import Optional

from app.core.cache import cached
from app.core.config import settings
from app.core.database import get_session
from app.models.user import User, Education, Career
from app.schemas.user import UserCard

router = APIRouter(prefix="/search", tags=["search"])

VALID_SORT = {"name", "kvis_year", "created_at"}


@router.get("/directory")
@cached(key="directory", tags=["users"], ttl=settings.CACHE_TTL_SHORT)
def directory_list(session: Session = Depends(get_session)):
    """Lean endpoint for the Kvisian directory page — no nested arrays."""
    rows = session.exec(text("""
        SELECT
            u.id::text, u.slug, u.first_name, u.last_name, u.kvis_year,
            u.current_grade,
            u.hobbies,
            u.teach_start_year, u.teach_end_year, u.is_current_teacher,
            u.profile_pic_url, u.goose_config, u.country, u.place, u.mbti, u.interests,
            u.is_verified,
            (SELECT string_agg(interest, ' ') FROM research_interest
             WHERE user_id = u.id) AS research_interests_text,
            (SELECT job_title FROM career
         WHERE user_id = u.id 
         ORDER BY is_current DESC, start_year DESC NULLS LAST LIMIT 1) AS job_title,
        (SELECT employer FROM career
         WHERE user_id = u.id 
         ORDER BY is_current DESC, start_year DESC NULLS LAST LIMIT 1) AS employer,
        (SELECT job_field FROM career
         WHERE user_id = u.id 
         ORDER BY is_current DESC, start_year DESC NULLS LAST LIMIT 1) AS job_field,
        (SELECT start_year FROM career
         WHERE user_id = u.id 
         ORDER BY is_current DESC, start_year DESC NULLS LAST LIMIT 1) AS job_start_year,
        (SELECT end_year FROM education
         WHERE user_id = u.id ORDER BY end_year DESC NULLS FIRST LIMIT 1) AS edu_end_year,
        (SELECT major FROM education
         WHERE user_id = u.id 
         ORDER BY is_current DESC, end_year DESC NULLS FIRST LIMIT 1) AS edu_major,
        (SELECT degree FROM education
         WHERE user_id = u.id 
         ORDER BY is_current DESC, end_year DESC NULLS FIRST LIMIT 1) AS edu_degree,
        (SELECT uni_name FROM education
         WHERE user_id = u.id 
         ORDER BY is_current DESC, end_year DESC NULLS FIRST LIMIT 1) AS edu_uni
        FROM "user" u
        ORDER BY u.kvis_year ASC NULLS LAST, u.first_name ASC
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.get("", response_model=list[UserCard])
@cached(key="search:<args>", tags=["users"], ttl=settings.CACHE_TTL_SHORT)
def search_users(
    session: Session = Depends(get_session),
    name: Optional[str] = Query(default=None),
    kvis_year: Optional[int] = Query(default=None),
    country: Optional[str] = Query(default=None),
    place_level2: Optional[str] = Query(default=None),
    place: Optional[str] = Query(default=None),
    uni_name: Optional[str] = Query(default=None),
    degree: Optional[str] = Query(default=None),
    field_of_study: Optional[str] = Query(default=None),
    major: Optional[str] = Query(default=None),
    scholarship: Optional[str] = Query(default=None),
    job_title: Optional[str] = Query(default=None),
    employer: Optional[str] = Query(default=None),
    job_field: Optional[str] = Query(default=None),
    sort: str = Query(default="name"),
    order: str = Query(default="asc"),
    limit: int = Query(default=50, le=2000),
    offset: int = Query(default=0),
):
    query = select(User).options(
        selectinload(User.education),
        selectinload(User.career),
    )
    if name:
        term = f"%{name}%"
        query = query.where(
            (User.first_name.ilike(term)) | (User.last_name.ilike(term))
        )
    if kvis_year:
        query = query.where(User.kvis_year == kvis_year)
    if country:
        query = query.where(User.country.ilike(f"%{country}%"))
    if place_level2:
        query = query.where(User.place_level2.ilike(f"%{place_level2}%"))
    if place:
        query = query.where(User.place.ilike(f"%{place}%"))

    users = session.exec(query).all()

    result = []
    for user in users:
        if not _matches_education(user.education, uni_name, degree, major, scholarship, field_of_study):
            continue
        if not _matches_career(user.career, job_title, employer, job_field):
            continue
        result.append(user)

    sort_key = sort if sort in VALID_SORT else "name"
    reverse = order == "desc"
    if sort_key == "name":
        result.sort(key=lambda u: (u.first_name or "", u.last_name or ""), reverse=reverse)
    elif sort_key == "kvis_year":
        result.sort(key=lambda u: u.kvis_year or 9999, reverse=reverse)
    elif sort_key == "created_at":
        result.sort(key=lambda u: u.created_at, reverse=reverse)

    result = result[offset: offset + limit]
    return [_to_card(u) for u in result]


def _matches_education(education, uni_name, degree, major, scholarship, field_of_study) -> bool:
    if not any([uni_name, degree, major, scholarship, field_of_study]):
        return True
    for e in education:
        match = True
        if uni_name and uni_name.lower() not in (e.uni_name or "").lower():
            match = False
        if degree and degree.lower() not in (e.degree or "").lower():
            match = False
        if major and major.lower() not in (e.major or "").lower():
            match = False
        if scholarship and scholarship.lower() not in (e.scholarship or "").lower():
            match = False
        if field_of_study and field_of_study.lower() not in (e.field_of_study or "").lower():
            match = False
        if match:
            return True
    return False


def _matches_career(career, job_title, employer, job_field) -> bool:
    if not any([job_title, employer, job_field]):
        return True
    for c in career:
        match = True
        if job_title and job_title.lower() not in (c.job_title or "").lower():
            match = False
        if employer and employer.lower() not in (c.employer or "").lower():
            match = False
        if job_field and c.job_field != job_field:
            match = False
        if match:
            return True
    return False


def _to_card(user: User) -> dict:
    return {
        "id": user.id,
        "slug": user.slug,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "nickname": getattr(user, "nickname", None),
        "kvis_year": user.kvis_year,
        "current_grade": user.current_grade,
        "current_status": getattr(user, "current_status", None),
        "teach_start_year": getattr(user, "teach_start_year", None),
        "teach_end_year": getattr(user, "teach_end_year", None),
        "is_current_teacher": getattr(user, "is_current_teacher", False),
        "place": user.place,
        "country": user.country,
        "profile_pic_url": user.profile_pic_url,
        "mbti": user.mbti,
        "interests": user.interests,
        "is_verified": user.is_verified,
        "education": [
            {
                "id": e.id, "uni_name": e.uni_name, "degree": e.degree,
                "field_of_study": getattr(e, "field_of_study", None),
                "major": e.major, "country": e.country, "state": e.state,
                "scholarship": e.scholarship, "start_year": e.start_year,
                "end_year": e.end_year, "is_public": getattr(e, "is_public", True),
                "major2": getattr(e, "major2", None), "minor1": getattr(e, "minor1", None),
                "minors": (lambda v, m1: __import__("json").loads(v) if isinstance(v, str) else (v or ([m1] if m1 else [])))(getattr(e, "minors", None), getattr(e, "minor1", None)),
            }
            for e in user.education
        ],
        "career": [
            {
                "id": c.id, "job_title": c.job_title, "employer": c.employer,
                "job_field": c.job_field, "country": c.country, "state": c.state,
                "is_current": c.is_current, "start_year": c.start_year,
                "end_year": c.end_year, "is_public": getattr(c, "is_public", True),
                "company_type": getattr(c, "company_type", None),
                "industry_sector": getattr(c, "industry_sector", None),
                "role_type": getattr(c, "role_type", None),
            }
            for c in user.career
        ],
    }