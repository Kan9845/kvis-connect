"""Add current-student verification evidence without changing existing accounts."""
from alembic import op
import sqlalchemy as sa

revision = "c7d8e9f002"
down_revision = "b6c7d8e9f001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("verification_request", sa.Column("applicant_type", sa.String(16), nullable=False, server_default="alumni"))
    op.add_column("verification_request", sa.Column("current_grade", sa.Integer(), nullable=True))
    op.add_column("verification_request", sa.Column("homeroom_teacher", sa.String(200), nullable=False, server_default=""))


def downgrade():
    op.drop_column("verification_request", "homeroom_teacher")
    op.drop_column("verification_request", "current_grade")
    op.drop_column("verification_request", "applicant_type")
