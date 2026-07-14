import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AdminOverview(BaseModel):
    total_users: int
    eligible_users: int
    completed_profiles: int
    recent_users_30d: int


class AdminUserSummary(BaseModel):
    id: uuid.UUID
    slug: str
    first_name: str
    last_name: str
    email: str
    email_verified: bool
    is_verified: bool
    profile_setup_done: bool
    created_at: datetime
    roles: list[str] = Field(default_factory=list)


class AdminUserPage(BaseModel):
    items: list[AdminUserSummary]
    total: int
    page: int
    page_size: int
