"""preserve the earlier blog interaction migration

Revision ID: 2469b47106ea
Revises: 8623462fae13
"""

revision = "2469b47106ea"
down_revision = "8623462fae13"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # blog_like and blog_comment are created by b1c2d3e4f5a6.
    pass


def downgrade() -> None:
    pass
