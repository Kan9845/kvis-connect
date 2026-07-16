import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Index, text
from sqlmodel import Field, SQLModel


class AccessRole(SQLModel, table=True):
    __tablename__ = "access_role"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AccessPermission(SQLModel, table=True):
    __tablename__ = "access_permission"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(unique=True, index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RolePermission(SQLModel, table=True):
    __tablename__ = "role_permission"

    role_id: uuid.UUID = Field(foreign_key="access_role.id", primary_key=True)
    permission_id: uuid.UUID = Field(foreign_key="access_permission.id", primary_key=True)


class UserRoleAssignment(SQLModel, table=True):
    __tablename__ = "user_role_assignment"
    __table_args__ = (
        Index(
            "uq_active_user_role_assignment",
            "user_id",
            "role_id",
            unique=True,
            postgresql_where=text("revoked_at IS NULL"),
        ),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    role_id: uuid.UUID = Field(foreign_key="access_role.id", index=True)
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    granted_by_user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    revoked_at: Optional[datetime] = None
    revoked_by_user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
