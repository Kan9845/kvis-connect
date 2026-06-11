"""make_job_field_nullable

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('career', 'job_field', nullable=True)


def downgrade() -> None:
    op.execute("UPDATE career SET job_field = '' WHERE job_field IS NULL")
    op.alter_column('career', 'job_field', nullable=False)
