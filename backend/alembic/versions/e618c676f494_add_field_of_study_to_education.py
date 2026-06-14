"""add field_of_study to education

Revision ID: e618c676f494
Revises: dcd79d2679f3
Create Date: 2026-06-14 01:08:34.881347

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

revision = 'e618c676f494'
down_revision = 'dcd79d2679f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
