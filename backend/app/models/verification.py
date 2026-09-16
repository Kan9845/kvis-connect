"""Private application records; never included in public profiles or exports."""
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Index, text
from sqlmodel import Field, SQLModel


class VerificationRequest(SQLModel, table=True):
    __tablename__ = "verification_request"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected', 'activated')", name="ck_verification_status"),
        Index("uq_verification_email", "personal_email", unique=True,
              postgresql_where=text("status <> 'rejected'"), sqlite_where=text("status <> 'rejected'")),
        Index("uq_verification_identity", "student_id", "cohort", unique=True,
              postgresql_where=text("status IN ('approved', 'activated')"),
              sqlite_where=text("status IN ('approved', 'activated')")),
    )
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: str | None = Field(default=None, max_length=5)
    cohort: str = Field(max_length=2)
    full_name: str = Field(max_length=200)
    nickname: str = Field(max_length=100)
    classroom: str = Field(max_length=100)
    applicant_type: str = Field(default="alumni", max_length=16)
    current_grade: int | None = None
    homeroom_teacher: str = Field(default="", max_length=200)
    project_name: str = Field(max_length=300)
    advisor: str = Field(max_length=200)
    personal_email: str = Field(max_length=254)
    note: str = Field(default="", max_length=2000)
    status: str = Field(default="pending", max_length=16, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: datetime | None = None
    reviewed_by: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    review_note: str = Field(default="", max_length=2000)
    token_hash: str | None = Field(default=None, max_length=64, unique=True)
    token_expires_at: datetime | None = None
    token_issued_by: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    token_issued_at: datetime | None = None
    user_id: uuid.UUID | None = Field(default=None, foreign_key="user.id", unique=True)
    activated_at: datetime | None = None


class VerificationRateLimit(SQLModel, table=True):
    __tablename__ = "verification_rate_limit"
    key: str = Field(primary_key=True, max_length=64)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    count: int = Field(default=1)
