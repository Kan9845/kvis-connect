import uuid
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Notification(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    type: str  # "graduated" | "profile_update_reminder" | "general"
    title: str
    body: str
    link: Optional[str] = None
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)