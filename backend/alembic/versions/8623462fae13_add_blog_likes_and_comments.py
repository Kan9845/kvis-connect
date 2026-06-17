"""add blog likes and comments

Revision ID: 8623462fae13
Revises: 1919d14b75c4
Create Date: 2026-06-17 19:06:48.994446

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

revision = '8623462fae13'
down_revision = '1919d14b75c4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass