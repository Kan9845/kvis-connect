"""add current student fields

Revision ID: c9ee03943e93
Revises: 8afc1cc494a5
Create Date: 2026-05-17 07:27:04.170420

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = 'c9ee03943e93'
down_revision = '8afc1cc494a5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('current_grade', sa.Integer(), nullable=True))
    op.add_column('user', sa.Column('current_class', sa.Integer(), nullable=True))
    op.add_column('user', sa.Column('current_elemental', sqlmodel.AutoString(), nullable=True))
    op.create_index('ix_user_current_grade', 'user', ['current_grade'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_user_current_grade', table_name='user')
    op.drop_column('user', 'current_elemental')
    op.drop_column('user', 'current_class')
    op.drop_column('user', 'current_grade')
