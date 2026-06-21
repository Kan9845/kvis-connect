"""add_experience_fields_to_user

Revision ID: a3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Branch_labels = None
depends_on = None

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = 'a3b4c5d6e7f8'
down_revision = 'f2a3b4c5d6e7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('competitions', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('experience_camps', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('clubs', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'clubs')
    op.drop_column('user', 'experience_camps')
    op.drop_column('user', 'competitions')
