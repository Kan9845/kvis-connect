"""Private verification requests and dedicated reviewer role."""
from datetime import datetime
import uuid
from alembic import op
import sqlalchemy as sa

revision = "b6c7d8e9f001"
down_revision = "a5b6c7d8e9f0"
branch_labels = None
depends_on = None
ROLE = uuid.UUID("00000000-0000-0000-0000-00000000b003")
PERMISSION = uuid.UUID("00000000-0000-0000-0000-00000000a106")


def upgrade():
    op.create_table("verification_request",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("student_id", sa.String(5)),
        sa.Column("cohort", sa.String(2), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("nickname", sa.String(100), nullable=False),
        sa.Column("classroom", sa.String(100), nullable=False),
        sa.Column("project_name", sa.String(300), nullable=False),
        sa.Column("advisor", sa.String(200), nullable=False),
        sa.Column("personal_email", sa.String(254), nullable=False),
        sa.Column("note", sa.String(2000), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime()),
        sa.Column("reviewed_by", sa.Uuid(), sa.ForeignKey("user.id")),
        sa.Column("review_note", sa.String(2000), nullable=False),
        sa.Column("token_hash", sa.String(64), unique=True),
        sa.Column("token_expires_at", sa.DateTime()),
        sa.Column("token_issued_by", sa.Uuid(), sa.ForeignKey("user.id")),
        sa.Column("token_issued_at", sa.DateTime()),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("user.id"), unique=True),
        sa.Column("activated_at", sa.DateTime()),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected', 'activated')", name="ck_verification_status"),
    )
    op.create_index("ix_verification_request_status", "verification_request", ["status"])
    op.create_index("uq_verification_email", "verification_request", ["personal_email"], unique=True,
                    postgresql_where=sa.text("status <> 'rejected'"))
    op.create_index("uq_verification_identity", "verification_request", ["student_id", "cohort"], unique=True,
                    postgresql_where=sa.text("status IN ('approved', 'activated')"))
    op.create_table("verification_rate_limit", sa.Column("key", sa.String(64), primary_key=True),
                    sa.Column("started_at", sa.DateTime(), nullable=False), sa.Column("count", sa.Integer(), nullable=False))
    roles = sa.table("access_role", sa.column("id", sa.Uuid()), sa.column("name", sa.String()), sa.column("description", sa.String()), sa.column("created_at", sa.DateTime()))
    permissions = sa.table("access_permission", sa.column("id", sa.Uuid()), sa.column("code", sa.String()), sa.column("description", sa.String()), sa.column("created_at", sa.DateTime()))
    mappings = sa.table("role_permission", sa.column("role_id", sa.Uuid()), sa.column("permission_id", sa.Uuid()))
    op.bulk_insert(roles, [{"id": ROLE, "name": "verification_reviewer", "description": "Review alumni requests and issue manual activation links", "created_at": datetime.utcnow()}])
    op.bulk_insert(permissions, [{"id": PERMISSION, "code": "admin.verification.manage", "description": "Review private verification details and issue activation links", "created_at": datetime.utcnow()}])
    op.bulk_insert(mappings, [{"role_id": ROLE, "permission_id": PERMISSION}])


def downgrade():
    for table, column, value in [("user_role_assignment", "role_id", ROLE), ("role_permission", "role_id", ROLE), ("access_role", "id", ROLE), ("access_permission", "id", PERMISSION)]:
        target = sa.table(table, sa.column(column, sa.Uuid()))
        op.execute(target.delete().where(target.c[column] == value))
    op.drop_table("verification_rate_limit")
    op.drop_table("verification_request")
