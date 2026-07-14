"""add comments_enabled to blog

Revision ID: 5075e62e1883
Revises: 2469b47106ea
Create Date: 2026-06-17 19:15:39.262700

"""
revision = '5075e62e1883'
down_revision = '2469b47106ea'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # comments_enabled is added by b1c2d3e4f5a6.
    pass


def downgrade() -> None:
    pass
