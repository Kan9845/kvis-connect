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

    user: Optional["User"] = Relationship(back_populates="career")


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Auth
    email: str = Field(unique=True, index=True)
    hashed_password: Optional[str] = None
    google_id: Optional[str] = Field(default=None, index=True)
    email_verified: bool = False
    is_verified: bool = False  # KVIS-Verified: confirmed @kvis.ac.th email ownership
    kvis_email: Optional[str] = None  # the verified @kvis.ac.th email

    # Basic info
    slug: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    kvis_year: Optional[int] = Field(default=None, index=True)

    # Current student fields. Null = alumni or not enrolled.
    # current_grade: 10 (M.4), 11 (M.5), 12 (M.6)
    # current_class: 1-4
    # current_elemental: earth | water | air | fire
    current_grade: Optional[int] = Field(default=None, index=True)
    current_class: Optional[int] = None
    current_elemental: Optional[str] = None

    # Contact & social
    facebook_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    line_id: Optional[str] = None
    website_url: Optional[str] = None

    # Location
    place: Optional[str] = None          # Display text e.g. "Bangkok, Thailand"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = Field(default=None, index=True)

    # Profile
    profile_pic_url: Optional[str] = None
    bio: Optional[str] = None
    mbti: Optional[str] = None           # e.g. "INTJ"
    interests: Optional[str] = None      # comma-separated tags

    profile_setup_done: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    education: List[Education] = Relationship(back_populates="user")
    career: List[Career] = Relationship(back_populates="user")
    blogs: List["Blog"] = Relationship(back_populates="author")
