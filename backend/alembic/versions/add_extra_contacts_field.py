"""add_extra_contacts_field

Revision ID: 3a7f2c9e1b84
Revises: fd6031c61b41
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = '3a7f2c9e1b84'
down_revision = 'fd6031c61b41'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('extra_contacts', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'extra_contacts')
