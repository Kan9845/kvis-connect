from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.authorization import ADMIN_OVERVIEW_READ, ADMIN_USERS_READ, require_permission
from app.core.database import get_session
from app.models.authorization import AccessRole, UserRoleAssignment
from app.models.user import User
from app.schemas.admin import AdminOverview, AdminUserPage, AdminUserSummary


router = APIRouter(prefix="/admin", tags=["admin"])


def _count(session: Session, *conditions) -> int:
    statement = select(func.count()).select_from(User)
    if conditions:
        statement = statement.where(*conditions)
    return int(session.exec(statement).one())


@router.get("/overview", response_model=AdminOverview)
def get_admin_overview(
    _admin: User = Depends(require_permission(ADMIN_OVERVIEW_READ)),
    session: Session = Depends(get_session),
):
    not_deleted = User.is_deleted == False
    return AdminOverview(
        total_users=_count(session, not_deleted),
        eligible_users=_count(
            session,
            not_deleted,
            User.email_verified == True,
            User.is_verified == True,
        ),
        completed_profiles=_count(session, not_deleted, User.profile_setup_done == True),
        recent_users_30d=_count(
            session,
            not_deleted,
            User.created_at >= datetime.utcnow() - timedelta(days=30),
        ),
    )


@router.get("/users", response_model=AdminUserPage)
def list_admin_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    _admin: User = Depends(require_permission(ADMIN_USERS_READ)),
    session: Session = Depends(get_session),
):
    base_filter = User.is_deleted == False
    total = _count(session, base_filter)
    users = session.exec(
        select(User)
        .where(base_filter)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    roles_by_user: dict = {}
    if users:
        rows = session.exec(
            select(UserRoleAssignment.user_id, AccessRole.name)
            .join(AccessRole, AccessRole.id == UserRoleAssignment.role_id)
            .where(
                UserRoleAssignment.user_id.in_([user.id for user in users]),
                UserRoleAssignment.revoked_at.is_(None),
            )
        ).all()
        for user_id, role_name in rows:
            roles_by_user.setdefault(user_id, []).append(role_name)

    items = [
        AdminUserSummary(
            id=user.id,
            slug=user.slug,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            email_verified=user.email_verified,
            is_verified=user.is_verified,
            profile_setup_done=user.profile_setup_done,
            created_at=user.created_at,
            roles=sorted(roles_by_user.get(user.id, [])),
        )
        for user in users
    ]
    return AdminUserPage(items=items, total=total, page=page, page_size=page_size)
