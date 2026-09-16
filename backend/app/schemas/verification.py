import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class Submission(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    student_id: str | None = Field(default=None, pattern=r"^[0-9]{5}$")
    cohort: str = Field(pattern=r"^[0-9]{2}$")
    full_name: str = Field(min_length=1, max_length=200)
    nickname: str = Field(min_length=1, max_length=100)
    classroom: str = Field(min_length=1, max_length=100)
    applicant_type: Literal["alumni", "student"] = "alumni"
    current_grade: Literal[10, 11, 12] | None = None
    homeroom_teacher: str = Field(default="", max_length=200)
    project_name: str = Field(default="", max_length=300)
    advisor: str = Field(default="", max_length=200)
    personal_email: EmailStr = Field(max_length=254)
    note: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def required_evidence(self):
        if self.applicant_type == "student":
            if self.current_grade is None or not self.homeroom_teacher.strip():
                raise ValueError("Current grade and homeroom teacher are required for students")
            if self.project_name or self.advisor:
                raise ValueError("Students should provide homeroom details, not alumni project details")
        else:
            if not self.project_name.strip() or not self.advisor.strip():
                raise ValueError("Project title and advisor are required for alumni")
            if self.current_grade is not None or self.homeroom_teacher:
                raise ValueError("Alumni should provide project details, not current-student details")
        return self

    @field_validator("cohort")
    @classmethod
    def positive_cohort(cls, value):
        if value == "00":
            raise ValueError("Cohort must be between 01 and 99")
        return value

    @field_validator("personal_email")
    @classmethod
    def normalize_email(cls, value):
        return str(value).lower()


class RequestRead(Submission):
    id: uuid.UUID
    status: Literal["pending", "approved", "rejected", "activated"]
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by: uuid.UUID | None
    review_note: str
    token_expires_at: datetime | None
    activated_at: datetime | None


class RequestPage(BaseModel):
    items: list[RequestRead]
    total: int
    pending: int


class Decision(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    status: Literal["approved", "rejected"]
    student_id: str | None = Field(default=None, pattern=r"^[0-9]{5}$")
    review_note: str = Field(min_length=1, max_length=2000)


class Activation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")
    password: str = Field(min_length=12, max_length=72)

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode("utf-8")) > 72 or not value.strip():
            raise ValueError("Password must contain text and be at most 72 UTF-8 bytes")
        return value
