"""merge heads

Revision ID: 1919d14b75c4
Revises: b1c2d3e4f5a6, e618c676f494
Create Date: 2026-06-17 19:03:14.014176

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = '1919d14b75c4'
down_revision = ('b1c2d3e4f5a6', 'e618c676f494')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
