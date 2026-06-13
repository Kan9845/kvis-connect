import uuid
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    type: str
    message: str
    contact_email: Optional[str] = None


class FeedbackRead(BaseModel):
    id: uuid.UUID
    type: str
    message: str
    contact_email: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    created_at: datetime
