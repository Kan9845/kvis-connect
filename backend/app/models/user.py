import uuid
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


class Education(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    uni_name: str
    degree: str
    major: str
    country: str
    state: Optional[str] = None
    scholarship: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None

    # Extended
    is_public: bool = True
    major2: Optional[str] = None
    minor1: Optional[str] = None
    scholarship_type: Optional[str] = None
    scholarship_bond: Optional[str] = None

    # Medical track
    med_school: Optional[str] = None
    med_dual_degree: bool = False
    med_dual_type: Optional[str] = None
    med_dual_field: Optional[str] = None
    med_hospital: Optional[str] = None
    med_specialties: Optional[str] = None   # JSON list stored as text
    med_subspecialty: Optional[str] = None

    user: Optional["User"] = Relationship(back_populates="education")


class Career(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    job_title: str
    employer: str
    job_field: str
    country: str
    state: Optional[str] = None
    is_current: bool = False
    start_year: Optional[int] = None
    end_year: Optional[int] = None

    # Extended
    is_public: bool = True
    company_type: Optional[str] = None
    industry_sector: Optional[str] = None
    role_type: Optional[str] = None

    user: Optional["User"] = Relationship(back_populates="career")


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Auth
    email: str = Field(unique=True, index=True)
    hashed_password: Optional[str] = None
    google_id: Optional[str] = Field(default=None, index=True)
    email_verified: bool = False
    is_verified: bool = False
    kvis_email: Optional[str] = None

    # Basic info
    slug: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    nickname: Optional[str] = None
    nickname_public: bool = True
    kvis_year: Optional[int] = Field(default=None, index=True)

    # Current student fields
    current_grade: Optional[int] = Field(default=None, index=True)
    expected_grad_year: Optional[int] = None

    # Status
    current_status: Optional[str] = None

    # Faculty / staff fields
    teach_start_year: Optional[int] = Field(default=None, index=True)
    teach_end_year: Optional[int] = None
    is_current_teacher: bool = Field(default=False, index=True)
    teach_department: Optional[str] = None

    # Contact & social
    facebook_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    line_id: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_email_public: bool = True

    # Location
    place: Optional[str] = None
    place_level2: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = Field(default=None, index=True)

    # Profile
    profile_pic_url: Optional[str] = None
    bio: Optional[str] = None
    mbti: Optional[str] = None
    zodiac: Optional[str] = None
    chronotype: Optional[str] = None
    interests: Optional[str] = None
    interests_public: bool = True

    # Research (JSON stored as text)
    research_interests: Optional[str] = None
    research_keywords: Optional[str] = None
    projects: Optional[str] = None
    publications: Optional[str] = None
    portfolio_links: Optional[str] = None

    # Personal / KVIS-only (JSON stored as text)
    languages: Optional[str] = None
    hobbies: Optional[str] = None
    kvis_fav_menu: Optional[str] = None
    kvis_fav_event: Optional[str] = None
    kvis_fav_area: Optional[str] = None

    profile_setup_done: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    education: List[Education] = Relationship(back_populates="user")
    career: List[Career] = Relationship(back_populates="user")
    blogs: List["Blog"] = Relationship(back_populates="author")