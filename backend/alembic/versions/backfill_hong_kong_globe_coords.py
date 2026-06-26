"""backfill hong kong globe coords"""

from alembic import op

revision = "backfill_hk_coords"
down_revision = "<put_current_latest_revision_here>"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        UPDATE "user"
        SET latitude = 22.396428,
            longitude = 114.109497
        WHERE country IN (
            'Hong Kong',
            'HK',
            'Hong Kong SAR',
            'Hong Kong SAR China',
            'Hong Kong S.A.R.'
        )
        AND (latitude IS NULL OR longitude IS NULL)
    """)


def downgrade():
    pass