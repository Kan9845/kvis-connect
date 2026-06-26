from alembic import op
import sqlalchemy as sa

revision = "add_research_public_flags"
down_revision = "1919d14b75c4"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("project", sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("publication", sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("portfolio_link", sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("launch", sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.true()))

def downgrade():
    op.drop_column("launch", "is_public")
    op.drop_column("portfolio_link", "is_public")
    op.drop_column("publication", "is_public")
    op.drop_column("project", "is_public")