import uuid
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Feedback(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    type: str  # "bug", "feature", "suggestion", "kind_words"
    message: str
    contact_email: Optional[str] = None
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
