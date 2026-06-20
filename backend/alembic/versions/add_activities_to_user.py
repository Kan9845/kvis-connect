"""add_activities_to_user

Revision ID: a1b2c3d4e5f6
Revises: fd6031c61b41
Create Date: 2026-06-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = 'f2a3b4c5d6e7'
down_revision = '2b5f7d9a8c01'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('activities', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'activities')
