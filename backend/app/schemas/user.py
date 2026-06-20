import uuid
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ─── Education ────────────────────────────────────────────────────────────────

class EducationRead(BaseModel):
    id: uuid.UUID
    uni_name: str
    degree: str
    field_of_study: Optional[str] = None
    major: str
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    scholarship: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    # Extended
    is_public: bool = True
    major2: Optional[str] = None
    minor1: Optional[str] = None
    minors: Optional[List[str]] = None
    scholarship_type: Optional[str] = None
    scholarship_bond: Optional[str] = None
    # Medical track
    med_school: Optional[str] = None
    med_dual_degree: bool = False
    med_dual_type: Optional[str] = None
    med_dual_field: Optional[str] = None
    med_hospital: Optional[str] = None
    med_specialties: Optional[List[str]] = None
    med_subspecialty: Optional[str] = None


class EducationWrite(BaseModel):
    uni_name: str
    field_of_study: Optional[str] = None
    degree: str
    major: str
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    scholarship: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    # Extended
    is_public: bool = True
    major2: Optional[str] = None
    minor1: Optional[str] = None
    minors: Optional[List[str]] = None
    scholarship_type: Optional[str] = None
    scholarship_bond: Optional[str] = None
    # Medical track
    med_school: Optional[str] = None
    med_dual_degree: bool = False
    med_dual_type: Optional[str] = None
    med_dual_field: Optional[str] = None
    med_hospital: Optional[str] = None
    med_specialties: Optional[List[str]] = None
    med_subspecialty: Optional[str] = None


# ─── Career ───────────────────────────────────────────────────────────────────

class CareerRead(BaseModel):
    id: uuid.UUID
    job_title: str
    employer: str
    job_field: Optional[str] = None
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    is_current: bool
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    # Extended
    is_public: bool = True
    company_type: Optional[str] = None
    industry_sector: Optional[str] = None
    role_type: Optional[str] = None


class CareerWrite(BaseModel):
    job_title: str
    employer: str
    job_field: Optional[str] = None
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    is_current: bool = False
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    # Extended
    is_public: bool = True
    company_type: Optional[str] = None
    industry_sector: Optional[str] = None
    role_type: Optional[str] = None


# ─── Project ──────────────────────────────────────────────────────────────────

class ProjectWrite(BaseModel):
    title: str
    advisor: Optional[str] = None
    advisor2: Optional[str] = None
    description: Optional[str] = None
    status: str = "ongoing"
    link: Optional[str] = None


# ─── Publication ──────────────────────────────────────────────────────────────

class PublicationWrite(BaseModel):
    citation: str
    doi: Optional[str] = None


# ─── Portfolio Link ───────────────────────────────────────────────────────────

class PortfolioLinkWrite(BaseModel):
    type: str
    url: str


# ─── Extra Contact ───────────────────────────────────────────────────────────

class ExtraContactWrite(BaseModel):
    type: str
    value: str
    is_public: bool = True


# ─── User Language ───────────────────────────────────────────────────────────

class UserLanguageWrite(BaseModel):
    lang: str
    proficiency: Optional[str] = None


# ─── Research Interest ────────────────────────────────────────────────────────

class ResearchInterestBulkWrite(BaseModel):
    interests: List[str]


# ─── User ─────────────────────────────────────────────────────────────────────

class UserPublic(BaseModel):
    id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    nickname: Optional[str] = None
    nickname_public: bool = True
    kvis_year: Optional[int] = None
    current_grade: Optional[int] = None
    current_status: Optional[str] = None
    # Faculty
    teach_start_year: Optional[int] = None
    teach_end_year: Optional[int] = None
    is_current_teacher: bool = False
    teach_department: Optional[str] = None
    # Location
    place: Optional[str] = None
    place_level2: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    province_of_origin: Optional[str] = None
    # Profile
    profile_pic_url: Optional[str] = None
    goose_config: Optional[str] = None
    bio: Optional[str] = None
    mbti: Optional[str] = None
    zodiac: Optional[str] = None
    chronotype: Optional[str] = None
    interests: Optional[str] = None
    interests_public: bool = True
    # Socials
    contact_email: Optional[str] = None
    contact_email_public: bool = True
    facebook_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_public: bool = True
    facebook_public: bool = True
    instagram_public: bool = True
    website_public: bool = True
    line_id_public: bool = True
    extra_contacts: List[Any] = []
    line_id: Optional[str] = None
    # Research (JSON-serialized lists/objects stored as text in DB)
    research_interests: List[str] = []
    research_keywords: Optional[str] = None
    projects: List[Any] = []
    publications: List[Any] = []
    portfolio_links: List[Any] = []
    is_verified: bool = False
    education: List[EducationRead] = []
    career: List[CareerRead] = []
    created_at: datetime
    # KVIS-only (visible to logged-in users, filtered on frontend)
    hobbies: Optional[Any] = None
    kvis_fav_menu: Optional[str] = None
    kvis_fav_event: Optional[str] = None
    kvis_fav_area: Optional[str] = None
    activities: Optional[List[Any]] = None


class UserMe(UserPublic):
    email: str
    expected_grad_year: Optional[int] = None
    line_id: Optional[str] = None
    contact_email: Optional[str] = None
    contact_email_public: bool = True
    extra_contacts: List[Any] = []
    email_verified: bool
    is_verified: bool
    kvis_email: Optional[str] = None
    personal_email: Optional[str] = None
    google_id: Optional[str] = None
    has_password: bool
    profile_setup_done: bool
    # Personal / KVIS-only (not shown publicly)
    languages: List[Any] = []
    hobbies: Optional[Any] = None
    kvis_fav_menu: Optional[str] = None
    kvis_fav_event: Optional[str] = None
    kvis_fav_area: Optional[str] = None
    activities: Optional[List[Any]] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    nickname: Optional[str] = None
    nickname_public: Optional[bool] = None
    kvis_year: Optional[int] = None
    current_grade: Optional[int] = None
    expected_grad_year: Optional[int] = None
    current_status: Optional[str] = None
    # Faculty
    teach_start_year: Optional[int] = None
    teach_end_year: Optional[int] = None
    is_current_teacher: Optional[bool] = None
    teach_department: Optional[str] = None
    # Location
    place: Optional[str] = None
    place_level2: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    province_of_origin: Optional[str] = None
    # Profile
    bio: Optional[str] = None
    mbti: Optional[str] = None
    zodiac: Optional[str] = None
    chronotype: Optional[str] = None
    interests: Optional[str] = None
    interests_public: Optional[bool] = None
    # Socials
    facebook_url: Optional[str] = None
    facebook_public: Optional[bool] = None
    linkedin_url: Optional[str] = None
    linkedin_public: Optional[bool] = None
    instagram_url: Optional[str] = None
    instagram_public: Optional[bool] = None
    line_id: Optional[str] = None
    line_id_public: Optional[bool] = None
    website_url: Optional[str] = None
    website_public: Optional[bool] = None
    contact_email: Optional[str] = None
    contact_email_public: Optional[bool] = None
    # Research
    research_keywords: Optional[str] = None
    # Personal
    hobbies: Optional[Any] = None
    kvis_fav_menu: Optional[str] = None
    kvis_fav_event: Optional[str] = None
    kvis_fav_area: Optional[str] = None
    activities: Optional[Any] = None
    profile_setup_done: Optional[bool] = None
    profile_pic_url: Optional[str] = None
    goose_config: Optional[str] = None


class UserCard(BaseModel):
    """Lightweight user for directory cards and search results."""
    id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    nickname: Optional[str] = None
    kvis_year: Optional[int] = None
    current_grade: Optional[int] = None
    current_status: Optional[str] = None
    # Faculty
    teach_department: Optional[str] = None
    teach_start_year: Optional[int] = None
    teach_end_year: Optional[int] = None
    is_current_teacher: bool = False
    place: Optional[str] = None
    country: Optional[str] = None
    province_of_origin: Optional[str] = None
    profile_pic_url: Optional[str] = None
    mbti: Optional[str] = None
    interests: Optional[str] = None
    is_verified: bool = False
    education: List[EducationRead] = []
    career: List[CareerRead] = []


class GlobePin(BaseModel):
    user_id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place: Optional[str] = None
    kvis_year: Optional[int] = None
    profile_pic_url: Optional[str] = None
    mbti: Optional[str] = None
    current_job: Optional[str] = None
    country: Optional[str] = None
