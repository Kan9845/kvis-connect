import uuid
from datetime import datetime

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class AdminDataExportAudit(SQLModel, table=True):
    __tablename__ = "admin_data_export_audit"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    administrator_user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    selected_fields: list[str] = Field(sa_column=Column(JSONB, nullable=False))
    include_deleted: bool = False
    exported_row_count: int
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
