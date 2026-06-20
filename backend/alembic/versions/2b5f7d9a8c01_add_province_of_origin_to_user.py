"""add province_of_origin to user

Revision ID: 2b5f7d9a8c01
Revises: f1a2b3c4d5e6
Create Date: 2026-06-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = '2b5f7d9a8c01'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('province_of_origin', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'province_of_origin')
