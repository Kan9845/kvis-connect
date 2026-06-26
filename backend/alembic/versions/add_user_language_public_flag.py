from alembic import op
import sqlalchemy as sa

revision = "add_user_language_public_flag"
down_revision = "add_research_public_flags"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "user_language",
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

def downgrade():
    op.drop_column("user_language", "is_public")