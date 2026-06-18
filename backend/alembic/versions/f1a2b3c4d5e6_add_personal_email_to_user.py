"""add personal_email to user

Revision ID: f1a2b3c4d5e6
Revises: e1b032fd2af7
Create Date: 2026-06-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = 'f1a2b3c4d5e6'
down_revision = 'e1b032fd2af7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('personal_email', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.create_index('ix_user_personal_email', 'user', ['personal_email'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_user_personal_email', table_name='user')
    op.drop_column('user', 'personal_email')
