"""add public flags to contact fields

Revision ID: 7d90fe6b64e3
Revises: 356e419a60a5
Create Date: 2026-06-13 12:01:53.889730

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

revision = '7d90fe6b64e3'
down_revision = '356e419a60a5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user', sa.Column('linkedin_public', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user', sa.Column('facebook_public', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user', sa.Column('instagram_public', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user', sa.Column('website_public', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user', sa.Column('line_id_public', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('user', 'line_id_public')
    op.drop_column('user', 'website_public')
    op.drop_column('user', 'instagram_public')
    op.drop_column('user', 'facebook_public')
    op.drop_column('user', 'linkedin_public')
