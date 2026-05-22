import uuid
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class EducationRead(BaseModel):
    id: uuid.UUID
    uni_name: str
    degree: str
    major: str
    country: str
    state: Optional[str]
    scholarship: Optional[str]
    start_year: Optional[int]
    end_year: Optional[int]


class EducationWrite(BaseModel):
    uni_name: str
    degree: str
    major: str
    country: str
    state: Optional[str] = None
    scholarship: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class CareerRead(BaseModel):
    id: uuid.UUID
    job_title: str
    employer: str
    job_field: str
    country: str
    state: Optional[str]
    is_current: bool
    start_year: Optional[int]
    end_year: Optional[int]


class CareerWrite(BaseModel):
    job_title: str
    employer: str
    job_field: str
    country: str
    state: Optional[str] = None
    is_current: bool = False
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class UserPublic(BaseModel):
    id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    kvis_year: Optional[int]
    current_grade: Optional[int] = None
    current_class: Optional[int] = None
    current_elemental: Optional[str] = None
    place: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    country: Optional[str]
    profile_pic_url: Optional[str]
    bio: Optional[str]
    mbti: Optional[str]
    interests: Optional[str]
    facebook_url: Optional[str]
    linkedin_url: Optional[str]
    website_url: Optional[str]
    education: List[EducationRead] = []
    career: List[CareerRead] = []
    created_at: datetime


class UserMe(UserPublic):
    email: str
    line_id: Optional[str]
    email_verified: bool
    is_verified: bool
    kvis_email: Optional[str]
    profile_setup_done: bool


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    kvis_year: Optional[int] = None
    current_grade: Optional[int] = None
    current_class: Optional[int] = None
    current_elemental: Optional[str] = None
    place: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    bio: Optional[str] = None
    mbti: Optional[str] = None
    interests: Optional[str] = None
    facebook_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    line_id: Optional[str] = None
    website_url: Optional[str] = None
    profile_setup_done: Optional[bool] = None


class UserCard(BaseModel):
    """Lightweight user for cards/search results."""
    id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    kvis_year: Optional[int]
    current_grade: Optional[int] = None
    current_class: Optional[int] = None
    current_elemental: Optional[str] = None
    place: Optional[str]
    country: Optional[str]
    profile_pic_url: Optional[str]
    mbti: Optional[str]
    education: List[EducationRead] = []
    career: List[CareerRead] = []


class GlobePin(BaseModel):
    user_id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    latitude: float
    longitude: float
    place: Optional[str]
    kvis_year: Optional[int]
    profile_pic_url: Optional[str]
    mbti: Optional[str]
    current_job: Optional[str]
    country: Optional[str]
