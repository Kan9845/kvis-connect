"""add missing is_deleted columns to user

Revision ID: 9dc9f1c92efa
Revises: dcd79d2679f3
Create Date: 2026-06-13 12:16:41.194332

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = '9dc9f1c92efa'
down_revision = 'dcd79d2679f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false')
    op.execute('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_deleted_at TIMESTAMP WITH TIME ZONE')


def downgrade() -> None:
    op.execute('ALTER TABLE "user" DROP COLUMN IF EXISTS is_deleted_at')
    op.execute('ALTER TABLE "user" DROP COLUMN IF EXISTS is_deleted')
