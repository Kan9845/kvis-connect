"""add field_of_study to education

Revision ID: 356e419a60a5
Revises: 34c7d7ad5a85
Create Date: 2026-06-13 11:48:07.931418

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

revision = '356e419a60a5'
down_revision = '34c7d7ad5a85'
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass


def downgrade() -> None:
    pass