from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime
import boto3
import uuid
import httpx
import json
from typing import Optional, List

from app.core.database import get_session
from app.core.deps import get_current_user, get_optional_user
from app.core.config import settings
from app.core.cache import cached, invalidate_tags
from app.core.slug import unique_user_slug
from app.models.user import User, Education, Career, Project, Publication, PortfolioLink, ExtraContact, UserLanguage, ResearchInterest, Launch
from app.schemas.user import (
    UserMe, UserPublic, UserUpdate, UserCard,
    EducationWrite, CareerWrite, GlobePin,
    ProjectWrite, PublicationWrite, PortfolioLinkWrite,
    ExtraContactWrite, UserLanguageWrite, ResearchInterestBulkWrite, LaunchWrite,
)
from app.models.blog import Blog
from app.models.blog_interactions import BlogLike, BlogComment

router = APIRouter(prefix="/users", tags=["users"])

COUNTRY_CODES = {
    "Afghanistan": "af", "Albania": "al", "Algeria": "dz", "Andorra": "ad",
    "Angola": "ao", "Argentina": "ar", "Armenia": "am", "Australia": "au",
    "Austria": "at", "Azerbaijan": "az", "Bahrain": "bh", "Bangladesh": "bd",
    "Belarus": "by", "Belgium": "be", "Belize": "bz", "Benin": "bj",
    "Bhutan": "bt", "Bolivia": "bo", "Bosnia and Herzegovina": "ba",
    "Botswana": "bw", "Brazil": "br", "Brunei": "bn", "Bulgaria": "bg",
    "Burkina Faso": "bf", "Burundi": "bi", "Cambodia": "kh", "Cameroon": "cm",
    "Canada": "ca", "Chile": "cl", "China": "cn", "Colombia": "co",
    "Costa Rica": "cr", "Croatia": "hr", "Cuba": "cu", "Cyprus": "cy",
    "Czech Republic": "cz", "Denmark": "dk", "Ecuador": "ec", "Egypt": "eg",
    "El Salvador": "sv", "Estonia": "ee", "Ethiopia": "et", "Finland": "fi",
    "France": "fr", "Georgia": "ge", "Germany": "de", "Ghana": "gh",
    "Greece": "gr", "Guatemala": "gt", "Honduras": "hn", "Hong Kong": "hk",
    "Hungary": "hu", "Iceland": "is", "India": "in", "Indonesia": "id",
    "Iran": "ir", "Iraq": "iq", "Ireland": "ie", "Israel": "il",
    "Italy": "it", "Jamaica": "jm", "Japan": "jp", "Jordan": "jo",
    "Kazakhstan": "kz", "Kenya": "ke", "Kuwait": "kw", "Kyrgyzstan": "kg",
    "Laos": "la", "Latvia": "lv", "Lebanon": "lb", "Libya": "ly",
    "Liechtenstein": "li", "Lithuania": "lt", "Luxembourg": "lu",
    "Macau": "mo", "Malaysia": "my", "Maldives": "mv", "Malta": "mt",
    "Mexico": "mx", "Moldova": "md", "Monaco": "mc", "Mongolia": "mn",
    "Montenegro": "me", "Morocco": "ma", "Mozambique": "mz", "Myanmar": "mm",
    "Namibia": "na", "Nepal": "np", "Netherlands": "nl", "New Zealand": "nz",
    "Nicaragua": "ni", "Nigeria": "ng", "North Korea": "kp",
    "North Macedonia": "mk", "Norway": "no", "Oman": "om", "Pakistan": "pk",
    "Palestine": "ps", "Panama": "pa", "Paraguay": "py", "Peru": "pe",
    "Philippines": "ph", "Poland": "pl", "Portugal": "pt", "Qatar": "qa",
    "Romania": "ro", "Russia": "ru", "Rwanda": "rw", "Saudi Arabia": "sa",
    "Senegal": "sn", "Serbia": "rs", "Singapore": "sg", "Slovakia": "sk",
    "Slovenia": "si", "Somalia": "so", "South Africa": "za",
    "South Korea": "kr", "South Sudan": "ss", "Spain": "es", "Sri Lanka": "lk",
    "Sudan": "sd", "Sweden": "se", "Switzerland": "ch", "Syria": "sy",
    "Taiwan": "tw", "Tajikistan": "tj", "Tanzania": "tz", "Thailand": "th",
    "Tunisia": "tn", "Turkey": "tr", "Turkmenistan": "tm", "Uganda": "ug",
    "Ukraine": "ua", "United Arab Emirates": "ae", "United Kingdom": "gb",
    "United States": "us", "Uruguay": "uy", "Uzbekistan": "uz",
    "Venezuela": "ve", "Vietnam": "vn", "Yemen": "ye", "Zambia": "zm",
    "Zimbabwe": "zw",
}

async def _geocode(query: str, country: str = None) -> tuple[float, float] | None:
    try:
        params = {"q": query, "format": "json", "limit": 1}
        if country and country in COUNTRY_CODES:
            params["countrycodes"] = COUNTRY_CODES[country]
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers={"User-Agent": "kvis-connect/1.0 (contact@kvis.ac.th)"},
            )
            results = r.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass
    return None


def _load_me(session: Session, user_id) -> User:
    return session.exec(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.education),
            selectinload(User.career),
            selectinload(User.projects),
            selectinload(User.publications),
            selectinload(User.portfolio_links),
            selectinload(User.extra_contacts),
            selectinload(User.languages),
            selectinload(User.research_interests),
            selectinload(User.launches),
        )
    ).first()


@router.get("/me", response_model=UserMe)
def get_me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    user = _load_me(session, current_user.id)
    return _user_to_me(user)


@router.patch("/me", response_model=UserMe)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, current_user.id)
    old_slug = user.slug
    data = body.model_dump(exclude_unset=True)
    name_changed = ("first_name" in data and data["first_name"] != user.first_name) or \
                   ("last_name" in data and data["last_name"] != user.last_name)
    import json as _json
    for k, v in data.items():
        if k in ("hobbies", "activities", "competitions", "experience_camps", "clubs") and isinstance(v, (dict, list)):
            setattr(user, k, _json.dumps(v))
        else:
            setattr(user, k, v)
    if name_changed:
        user.slug = unique_user_slug(session, user.first_name, user.last_name, exclude_id=user.id)
    if any(k in data for k in ("place", "place_level2", "country")):
        geo_query = ", ".join(filter(None, [
            user.place,
            user.place_level2,
            user.country,
        ]))
        coords = None
        if geo_query:
            coords = await _geocode(geo_query, user.country)
        if not coords and user.country:
            coords = await _geocode(user.country, user.country)
        if coords:
            user.latitude, user.longitude = coords
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    await invalidate_tags("users", f"user:{old_slug}", f"user:{user.slug}")
    return _user_to_me(_load_me(session, user.id))


@router.post("/me/profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not settings.S3_ACCESS_KEY:
        raise HTTPException(503, detail="Storage not configured")

    s3_kwargs = {
        "aws_access_key_id": settings.S3_ACCESS_KEY,
        "aws_secret_access_key": settings.S3_SECRET_KEY,
    }
    if settings.S3_ENDPOINT_URL:
        s3_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    else:
        s3_kwargs["region_name"] = settings.S3_REGION

    s3 = boto3.client("s3", **s3_kwargs)
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    key = f"profiles/{current_user.id}/{uuid.uuid4()}.{ext}"
    s3.upload_fileobj(file.file, settings.S3_BUCKET, key, ExtraArgs={"ContentType": file.content_type})

    public_url = getattr(settings, "S3_PUBLIC_URL", "")
    if public_url:
        url = f"{public_url}/{key}"
    elif settings.S3_ENDPOINT_URL:
        url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET}/{key}"
    elif settings.S3_REGION:
        url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{key}"
    else:
        url = f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{key}"

    user = session.get(User, current_user.id)
    user.profile_pic_url = url
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    await invalidate_tags("users", f"user:{user.slug}")
    return {"url": url}


@router.get("/{slug}", response_model=UserPublic)
def get_user(
    slug: str,
    session: Session = Depends(get_session),
    viewer: Optional[User] = Depends(get_optional_user),
):
    user = session.exec(
        select(User)
        .where(User.slug == slug)
        .options(
            selectinload(User.education),
            selectinload(User.career),
            selectinload(User.projects),
            selectinload(User.publications),
            selectinload(User.portfolio_links),
            selectinload(User.research_interests),
            selectinload(User.launches),
            selectinload(User.extra_contacts),
        )
    ).first()
    if not user or user.is_deleted:
        raise HTTPException(404, detail="User not found")

    # A verified KVIS member (or the owner) sees KVIS-only content
    is_kvis_viewer = viewer is not None and (viewer.is_verified or viewer.id == user.id)
    return _user_to_public(user, public_only=not is_kvis_viewer, is_kvis=is_kvis_viewer)


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
    import json as _json
    for item in items:
        data = item.model_dump()
        if data.get("med_specialties") is not None:
            data["med_specialties"] = _json.dumps(data["med_specialties"])
        if data.get("minors") is not None:
            data["minors"] = _json.dumps(data["minors"])
        session.add(Education(user_id=current_user.id, **data))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
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
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Career updated"}


# Projects
@router.put("/me/projects")
async def replace_projects(
    items: list[ProjectWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(Project).where(Project.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, item in enumerate(items):
        session.add(Project(user_id=current_user.id, order_index=i, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Projects updated"}


# Publications
@router.put("/me/publications")
async def replace_publications(
    items: list[PublicationWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(Publication).where(Publication.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, item in enumerate(items):
        session.add(Publication(user_id=current_user.id, order_index=i, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Publications updated"}


# Portfolio Links
@router.put("/me/portfolio-links")
async def replace_portfolio_links(
    items: list[PortfolioLinkWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(PortfolioLink).where(PortfolioLink.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, item in enumerate(items):
        session.add(PortfolioLink(user_id=current_user.id, order_index=i, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Portfolio links updated"}


# Extra Contacts
@router.put("/me/extra-contacts")
async def replace_extra_contacts(
    items: list[ExtraContactWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(ExtraContact).where(ExtraContact.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, item in enumerate(items):
        session.add(ExtraContact(user_id=current_user.id, order_index=i, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Extra contacts updated"}


# Languages
@router.put("/me/languages")
async def replace_languages(
    items: list[UserLanguageWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(UserLanguage).where(UserLanguage.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, item in enumerate(items):
        session.add(UserLanguage(user_id=current_user.id, order_index=i, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Languages updated"}


# Research Interests
@router.put("/me/research-interests")
async def replace_research_interests(
    body: ResearchInterestBulkWrite,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(ResearchInterest).where(ResearchInterest.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, interest in enumerate(body.interests):
        session.add(ResearchInterest(user_id=current_user.id, interest=interest, order_index=i))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Research interests updated"}


@router.put("/me/launches")
async def replace_launches(
    items: list[LaunchWrite],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(Launch).where(Launch.user_id == current_user.id)).all()
    for e in existing:
        session.delete(e)
    for i, item in enumerate(items):
        session.add(Launch(user_id=current_user.id, order_index=i, **item.model_dump()))
    session.commit()
    await invalidate_tags("users", f"user:{current_user.slug}")
    return {"message": "Launches updated"}


@router.get("/globe/pins", response_model=list[GlobePin])
@cached(key="globe", tags=["users"], ttl=settings.CACHE_TTL_LONG)
def get_globe_pins(session: Session = Depends(get_session)):
    users = session.exec(select(User).where(User.is_deleted == False)).all()
    def _current_job(u: User):
        current = next((c for c in u.career if c.is_current), None) or (u.career[-1] if u.career else None)
        return f"{current.job_title} at {current.employer}" if current else None

    return [
        GlobePin(
            user_id=u.id,
            slug=u.slug,
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
            teach_start_year=u.teach_start_year,
            is_current_teacher=u.is_current_teacher,
        )
        for u in users
        if u.latitude is not None and u.longitude is not None
    ]


# ── helpers ──────────────────────────────────────────────────────────────────

def _edu_list(user: User, public_only: bool = False):
    import json as _json
    entries = [e for e in user.education if not public_only or e.is_public is not False]
    return [
        {
            "id": e.id, "uni_name": e.uni_name, "degree": e.degree,
            "field_of_study": e.field_of_study,
            "major": e.major, "major2": e.major2, "minor1": e.minor1,
            "minors": _json.loads(e.minors) if isinstance(e.minors, str) else (e.minors or ([e.minor1] if e.minor1 else [])),
            "country": e.country, "state": e.state, "city": e.city,
            "scholarship": e.scholarship, "scholarship_type": e.scholarship_type,
            "scholarship_bond": e.scholarship_bond,
            "start_year": e.start_year, "end_year": e.end_year,
            "is_current": getattr(e, "is_current", False),
            "is_public": e.is_public,
            "med_school": e.med_school, "med_dual_degree": e.med_dual_degree,
            "med_dual_type": e.med_dual_type, "med_dual_field": e.med_dual_field,
            "med_hospital": e.med_hospital,
            "med_specialties": _json.loads(e.med_specialties) if isinstance(e.med_specialties, str) else (e.med_specialties or []),
            "med_subspecialty": e.med_subspecialty,
        }
        for e in entries
    ]


def _career_list(user: User, public_only: bool = False):
    entries = [c for c in user.career if not public_only or c.is_public is not False]
    return [
        {
            "id": c.id, "job_title": c.job_title, "employer": c.employer,
            "job_field": c.job_field, "country": c.country, "state": c.state,
            "city": c.city, "is_current": c.is_current,
            "start_year": c.start_year, "end_year": c.end_year,
            "is_public": c.is_public,
            "company_type": c.company_type, "industry_sector": c.industry_sector,
            "role_type": c.role_type,
        }
        for c in entries
    ]


def _user_to_public(user: User, public_only: bool = True, is_kvis: bool = False) -> dict:
    return {
        "id": user.id,
        "slug": user.slug,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "nickname": user.nickname if (user.nickname_public or is_kvis) else None,
        "nickname_public": user.nickname_public,
        "kvis_year": user.kvis_year,
        "current_grade": user.current_grade,
        "current_status": user.current_status,
        # Faculty
        "teach_start_year": user.teach_start_year,
        "teach_end_year": user.teach_end_year,
        "is_current_teacher": user.is_current_teacher,
        "teach_department": user.teach_department,
        # Location
        "place": user.place,
        "place_level2": user.place_level2,
        "latitude": user.latitude,
        "longitude": user.longitude,
        "country": user.country,
        "province_of_origin": user.province_of_origin,
        # Profile
        "profile_pic_url": user.profile_pic_url,
        "goose_config": user.goose_config,
        "bio": user.bio,
        # KVIS-only fields
        "mbti": user.mbti if is_kvis else None,
        "zodiac": user.zodiac if is_kvis else None,
        "chronotype": user.chronotype if is_kvis else None,
        "hobbies": (lambda h: __import__('json').loads(h) if isinstance(h, str) else h)(user.hobbies) if (user.hobbies and is_kvis) else None,
        "kvis_fav_menu": user.kvis_fav_menu if is_kvis else None,
        "kvis_fav_event": user.kvis_fav_event if is_kvis else None,
        "kvis_fav_area": user.kvis_fav_area if is_kvis else None,
        "activities": (lambda a: __import__('json').loads(a) if isinstance(a, str) else a)(user.activities) if user.activities else None,
        "competitions": [e for e in ((lambda v: __import__('json').loads(v) if isinstance(v, str) else v or [])(user.competitions)) if is_kvis or e.get("is_public", True)],
        "experience_camps": [e for e in ((lambda v: __import__('json').loads(v) if isinstance(v, str) else v or [])(user.experience_camps)) if is_kvis or e.get("is_public", True)],
        "clubs": [e for e in ((lambda v: __import__('json').loads(v) if isinstance(v, str) else v or [])(user.clubs)) if is_kvis or e.get("is_public", True)],
        # Privacy-gated fields
        "interests": user.interests if (user.interests_public or is_kvis) else None,
        "interests_public": user.interests_public,
        "facebook_url": user.facebook_url if (getattr(user, 'facebook_public', True) or is_kvis) else None,
        "facebook_public": getattr(user, 'facebook_public', True),
        "linkedin_url": user.linkedin_url if (getattr(user, 'linkedin_public', True) or is_kvis) else None,
        "linkedin_public": getattr(user, 'linkedin_public', True),
        "instagram_url": user.instagram_url if (getattr(user, 'instagram_public', True) or is_kvis) else None,
        "instagram_public": getattr(user, 'instagram_public', True),
        "website_url": user.website_url if (getattr(user, 'website_public', True) or is_kvis) else None,
        "website_public": getattr(user, 'website_public', True),
        "line_id": user.line_id if (getattr(user, 'line_id_public', True) or is_kvis) else None,
        "line_id_public": getattr(user, 'line_id_public', True),
        "contact_email": user.contact_email if (user.contact_email_public or is_kvis) else None,
        "contact_email_public": user.contact_email_public,
        "is_verified": user.is_verified,
        "research_keywords": user.research_keywords,
        "research_interests": [r.interest for r in sorted(user.research_interests, key=lambda x: x.order_index)],
        "projects": [
            {"title": p.title, "advisor": p.advisor, "advisor2": p.advisor2,
             "description": p.description, "status": p.status, "link": p.link}
            for p in sorted(user.projects, key=lambda x: x.order_index)
        ],
        "publications": [
            {"citation": p.citation, "doi": p.doi}
            for p in sorted(user.publications, key=lambda x: x.order_index)
        ],
        "portfolio_links": [
            {"type": p.type, "url": p.url}
            for p in sorted(user.portfolio_links, key=lambda x: x.order_index)
        ],
        "launches": [
            {"name": l.name, "innovation_type": l.innovation_type, "innovation_type_other": l.innovation_type_other,
             "role": l.role, "status": l.status, "description": l.description, "link": l.link}
            for l in sorted(user.launches, key=lambda x: x.order_index)
        ],
        "extra_contacts": [
            {"type": c.type, "value": c.value, "public": c.is_public}
            for c in sorted(user.extra_contacts, key=lambda x: x.order_index)
            if c.is_public or is_kvis
        ],
        "created_at": user.created_at,
        "education": _edu_list(user, public_only=public_only),
        "career": _career_list(user, public_only=public_only),
        "google_id": user.google_id if is_kvis else None,
    }


def _user_to_me(user: User) -> dict:
    import json as _json
    hobbies = user.hobbies
    if isinstance(hobbies, str):
        try:
            hobbies = _json.loads(hobbies)
        except Exception:
            hobbies = {}
    activities = user.activities
    if isinstance(activities, str):
        try:
            activities = _json.loads(activities)
        except Exception:
            activities = []

    def _parse_json_list(val):
        if isinstance(val, str):
            try:
                return _json.loads(val)
            except Exception:
                return []
        return val or []

    return {
        **_user_to_public(user, public_only=False, is_kvis=True),
        "email": user.email,
        "expected_grad_year": user.expected_grad_year,
        "line_id": user.line_id,
        "email_verified": user.email_verified,
        "is_verified": user.is_verified,
        "kvis_email": user.kvis_email,
        "personal_email": user.personal_email,
        "profile_setup_done": user.profile_setup_done,
        "contact_email": user.contact_email,
        "contact_email_public": user.contact_email_public,
        "google_id": user.google_id,
        "has_password": bool(user.hashed_password),
        "hobbies": hobbies,
        "kvis_fav_menu": user.kvis_fav_menu,
        "kvis_fav_event": user.kvis_fav_event,
        "kvis_fav_area": user.kvis_fav_area,
        "activities": activities,
        "competitions": _parse_json_list(user.competitions),
        "experience_camps": _parse_json_list(user.experience_camps),
        "clubs": _parse_json_list(user.clubs),
        "projects": [
            {"title": p.title, "advisor": p.advisor, "advisor2": p.advisor2,
             "description": p.description, "status": p.status, "link": p.link}
            for p in sorted(user.projects, key=lambda x: x.order_index)
        ],
        "publications": [
            {"citation": p.citation, "doi": p.doi}
            for p in sorted(user.publications, key=lambda x: x.order_index)
        ],
        "portfolio_links": [
            {"type": p.type, "url": p.url}
            for p in sorted(user.portfolio_links, key=lambda x: x.order_index)
        ],
        "launches": [
            {"name": l.name, "innovation_type": l.innovation_type, "innovation_type_other": l.innovation_type_other,
             "role": l.role, "status": l.status, "description": l.description, "link": l.link}
            for l in sorted(user.launches, key=lambda x: x.order_index)
        ],
        "education": _edu_list(user, public_only=False),
        "career": _career_list(user, public_only=False),
        "interests": user.interests,
        "extra_contacts": [
            {"type": c.type, "value": c.value, "public": c.is_public}
            for c in sorted(user.extra_contacts, key=lambda x: x.order_index)
        ],
        "languages": [
            {"lang": l.lang, "proficiency": l.proficiency}
            for l in sorted(user.languages, key=lambda x: x.order_index)
        ],
        "research_interests": [
            r.interest
            for r in sorted(user.research_interests, key=lambda x: x.order_index)
        ],
    }


@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, current_user.id)
    
    # Delete all user's blogs and their associated data (comments, likes)
    user_blogs = session.exec(
        select(Blog).where(Blog.author_id == current_user.id)
    ).all()
    
    for blog in user_blogs:
        # Delete all comments for this blog (replies first, then top-level)
        all_comments = session.exec(
            select(BlogComment).where(BlogComment.blog_id == blog.id)
        ).all()
        
        # Delete replies first (comments with parent_id)
        for comment in all_comments:
            if comment.parent_id is not None:
                session.delete(comment)
        session.flush()
        
        # Then delete top-level comments
        for comment in all_comments:
            if comment.parent_id is None:
                session.delete(comment)
        session.flush()
        
        # Delete all likes for this blog
        blog_likes = session.exec(
            select(BlogLike).where(BlogLike.blog_id == blog.id)
        ).all()
        for like in blog_likes:
            session.delete(like)
        session.flush()
        
        # Finally delete the blog itself
        session.delete(blog)
        
        # Invalidate cache for this blog
        await invalidate_tags(f"blog:{blog.slug}")
    
    # Soft delete the user account
    user.is_deleted = True
    user.is_deleted_at = datetime.utcnow()
    session.add(user)
    session.commit()
    
    response = Response()
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    await invalidate_tags("users", f"user:{user.slug}", "blogs")
    return response
