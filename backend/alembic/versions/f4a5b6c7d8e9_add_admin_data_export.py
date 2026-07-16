"""add audited administrator data export

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-07-15
"""

import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f4a5b6c7d8e9"
down_revision = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None

EXPORT_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a105")
ADMIN_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-00000000a001")


def upgrade() -> None:
    op.create_table(
        "admin_data_export_audit",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("administrator_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("selected_fields", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("include_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("exported_row_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["administrator_user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_data_export_audit_administrator_user_id", "admin_data_export_audit", ["administrator_user_id"])
    op.create_index("ix_admin_data_export_audit_created_at", "admin_data_export_audit", ["created_at"])

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
    op.bulk_insert(permission_table, [{
        "id": EXPORT_PERMISSION_ID,
        "code": "admin.data_export.download",
        "description": "Preview and download audited user data exports",
        "created_at": datetime.utcnow(),
    }])
    op.bulk_insert(role_permission_table, [{
        "role_id": ADMIN_ROLE_ID,
        "permission_id": EXPORT_PERMISSION_ID,
    }])


def downgrade() -> None:
    op.execute("DELETE FROM role_permission WHERE permission_id = '00000000-0000-0000-0000-00000000a105'")
    op.execute("DELETE FROM access_permission WHERE id = '00000000-0000-0000-0000-00000000a105'")
    op.drop_index("ix_admin_data_export_audit_created_at", table_name="admin_data_export_audit")
    op.drop_index("ix_admin_data_export_audit_administrator_user_id", table_name="admin_data_export_audit")
    op.drop_table("admin_data_export_audit")
