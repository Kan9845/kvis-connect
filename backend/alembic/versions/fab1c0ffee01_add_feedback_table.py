"""add feedback table

Revision ID: fab1c0ffee01
Revises: 9dc9f1c92efa
Create Date: 2026-06-13 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = 'fab1c0ffee01'
down_revision = '9dc9f1c92efa'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'feedback',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('type', sqlmodel.AutoString(), nullable=False),
        sa.Column('message', sqlmodel.AutoString(), nullable=False),
        sa.Column('contact_email', sqlmodel.AutoString(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_feedback_user_id', 'feedback', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_feedback_user_id', table_name='feedback')
    op.drop_table('feedback')
