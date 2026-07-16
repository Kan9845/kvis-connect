"""add persistent site theme settings

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-07-15
"""

import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e3f4a5b6c7d8"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


THEME_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a104")
ADMIN_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-00000000a001")


def upgrade() -> None:
    op.create_table(
        "site_theme_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colors", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
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
    op.bulk_insert(permission_table, [{
        "id": THEME_PERMISSION_ID,
        "code": "admin.site_theme.manage",
        "description": "Update the site-wide visual theme",
        "created_at": datetime.utcnow(),
    }])
    op.bulk_insert(role_permission_table, [{
        "role_id": ADMIN_ROLE_ID,
        "permission_id": THEME_PERMISSION_ID,
    }])


def downgrade() -> None:
    op.execute("DELETE FROM role_permission WHERE permission_id = '00000000-0000-0000-0000-00000000a104'")
    op.execute("DELETE FROM access_permission WHERE id = '00000000-0000-0000-0000-00000000a104'")
    op.drop_table("site_theme_settings")
