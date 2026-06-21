"""add launch table

Revision ID: b2c3d4e5f6a8
Revises: a3b4c5d6e7f8
Create Date: 2026-06-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = 'b2c3d4e5f6a8'
down_revision = 'a3b4c5d6e7f8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'launch',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('innovation_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('innovation_type_other', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('role', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('link', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_launch_user_id', 'launch', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_launch_user_id', table_name='launch')
    op.drop_table('launch')
