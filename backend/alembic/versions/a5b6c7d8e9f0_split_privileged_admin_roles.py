"""split privileged administrator capabilities into dedicated roles

Revision ID: a5b6c7d8e9f0
Revises: f4a5b6c7d8e9
Create Date: 2026-07-16
"""

import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "a5b6c7d8e9f0"
down_revision = "f4a5b6c7d8e9"
branch_labels = None
depends_on = None


ADMIN_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-00000000a001")
THEME_MANAGER_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-00000000b001")
DATA_EXPORTER_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-00000000b002")
THEME_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a104")
EXPORT_PERMISSION_ID = uuid.UUID("00000000-0000-0000-0000-00000000a105")


def upgrade() -> None:
    role_table = sa.table(
        "access_role",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String()),
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
        [
            {
                "id": THEME_MANAGER_ROLE_ID,
                "name": "theme_manager",
                "description": "Manage the persistent site-wide visual theme",
                "created_at": datetime.utcnow(),
            },
            {
                "id": DATA_EXPORTER_ROLE_ID,
                "name": "data_exporter",
                "description": "Preview and download audited maintenance exports",
                "created_at": datetime.utcnow(),
            },
        ],
    )
    op.bulk_insert(
        role_permission_table,
        [
            {"role_id": THEME_MANAGER_ROLE_ID, "permission_id": THEME_PERMISSION_ID},
            {"role_id": DATA_EXPORTER_ROLE_ID, "permission_id": EXPORT_PERMISSION_ID},
        ],
    )

    # Administrators retain read-only administration; sensitive capabilities
    # must be granted through their dedicated roles.
    op.execute(
        sa.delete(role_permission_table).where(
            role_permission_table.c.role_id == ADMIN_ROLE_ID,
            role_permission_table.c.permission_id.in_([THEME_PERMISSION_ID, EXPORT_PERMISSION_ID]),
        )
    )


def downgrade() -> None:
    role_permission_table = sa.table(
        "role_permission",
        sa.column("role_id", postgresql.UUID(as_uuid=True)),
        sa.column("permission_id", postgresql.UUID(as_uuid=True)),
    )
    user_role_assignment_table = sa.table(
        "user_role_assignment",
        sa.column("role_id", postgresql.UUID(as_uuid=True)),
    )

    op.execute(
        sa.delete(user_role_assignment_table).where(
            user_role_assignment_table.c.role_id.in_([THEME_MANAGER_ROLE_ID, DATA_EXPORTER_ROLE_ID])
        )
    )
    op.execute(
        sa.delete(role_permission_table).where(
            role_permission_table.c.role_id.in_([THEME_MANAGER_ROLE_ID, DATA_EXPORTER_ROLE_ID])
        )
    )
    op.execute(
        sa.insert(role_permission_table).values(
            [
                {"role_id": ADMIN_ROLE_ID, "permission_id": THEME_PERMISSION_ID},
                {"role_id": ADMIN_ROLE_ID, "permission_id": EXPORT_PERMISSION_ID},
            ]
        )
    )
    op.execute(
        "DELETE FROM access_role WHERE id IN "
        "('00000000-0000-0000-0000-00000000b001', "
        "'00000000-0000-0000-0000-00000000b002')"
    )
