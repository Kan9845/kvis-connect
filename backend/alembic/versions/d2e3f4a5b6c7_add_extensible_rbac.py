"""add extensible role based access control

Revision ID: d2e3f4a5b6c7
Revises: c9d1e2f3a4b5
Create Date: 2026-07-14
"""

import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "d2e3f4a5b6c7"
down_revision = "c9d1e2f3a4b5"
branch_labels = None
depends_on = None


ADMIN_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-00000000a001")
OVERVIEW_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a101")
USERS_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a102")
FEEDBACK_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a103")


def upgrade() -> None:
    op.create_table(
        "access_role",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_access_role_name", "access_role", ["name"], unique=True)

    op.create_table(
        "access_permission",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_access_permission_code", "access_permission", ["code"], unique=True)

    op.create_table(
        "role_permission",
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("permission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["access_permission.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["access_role.id"]),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    op.create_table(
        "user_role_assignment",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("granted_at", sa.DateTime(), nullable=False),
        sa.Column("granted_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["granted_by_user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["revoked_by_user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["access_role.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_role_assignment_user_id", "user_role_assignment", ["user_id"])
    op.create_index("ix_user_role_assignment_role_id", "user_role_assignment", ["role_id"])
    op.create_index(
        "uq_active_user_role_assignment",
        "user_role_assignment",
        ["user_id", "role_id"],
        unique=True,
        postgresql_where=sa.text("revoked_at IS NULL"),
    )

    now = datetime.utcnow()
    role_table = sa.table(
        "access_role",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
        sa.column("created_at", sa.DateTime()),
    )
    permission_table = sa.table(
        "access_permission",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("code", sa.String()),
        sa.column("description", sa.String()),
        sa.column("created_at", sa.DateTime()),
    )
    role_permission_table = sa.table(
        "role_permission",
        sa.column("role_id", postgresql.UUID(as_uuid=True)),
        sa.column("permission_id", postgresql.UUID(as_uuid=True)),
    )

    op.bulk_insert(
        role_table,
        [{
            "id": ADMIN_ROLE_ID,
            "name": "administrator",
            "description": "Read-only access to administrative information",
            "created_at": now,
        }],
    )
    op.bulk_insert(
        permission_table,
        [
            {
                "id": OVERVIEW_PERMISSION_ID,
                "code": "admin.overview.read",
                "description": "View administrative overview statistics",
                "created_at": now,
            },
            {
                "id": USERS_PERMISSION_ID,
                "code": "admin.users.read",
                "description": "View the paginated administrative user list",
                "created_at": now,
            },
            {
                "id": FEEDBACK_PERMISSION_ID,
                "code": "admin.feedback.read",
                "description": "View submitted feedback",
                "created_at": now,
            },
        ],
    )
    op.bulk_insert(
        role_permission_table,
        [
            {"role_id": ADMIN_ROLE_ID, "permission_id": OVERVIEW_PERMISSION_ID},
            {"role_id": ADMIN_ROLE_ID, "permission_id": USERS_PERMISSION_ID},
            {"role_id": ADMIN_ROLE_ID, "permission_id": FEEDBACK_PERMISSION_ID},
        ],
    )


def downgrade() -> None:
    op.drop_index("uq_active_user_role_assignment", table_name="user_role_assignment")
    op.drop_index("ix_user_role_assignment_role_id", table_name="user_role_assignment")
    op.drop_index("ix_user_role_assignment_user_id", table_name="user_role_assignment")
    op.drop_table("user_role_assignment")
    op.drop_table("role_permission")
    op.drop_index("ix_access_permission_code", table_name="access_permission")
    op.drop_table("access_permission")
    op.drop_index("ix_access_role_name", table_name="access_role")
    op.drop_table("access_role")
