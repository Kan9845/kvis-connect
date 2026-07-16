import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class SiteThemeSettings(SQLModel, table=True):
    __tablename__ = "site_theme_settings"

    id: int = Field(default=1, primary_key=True)
    colors: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False))
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by_user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
