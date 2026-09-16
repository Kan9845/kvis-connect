import uuid
from collections.abc import Callable

from fastapi import Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.authorization import AccessPermission, RolePermission, UserRoleAssignment
from app.models.user import User


ADMIN_OVERVIEW_READ = "admin.overview.read"
ADMIN_USERS_READ = "admin.users.read"
ADMIN_FEEDBACK_READ = "admin.feedback.read"
ADMIN_SITE_THEME_MANAGE = "admin.site_theme.manage"
ADMIN_DATA_EXPORT_DOWNLOAD = "admin.data_export.download"
ADMIN_VERIFICATION_MANAGE = "admin.verification.manage"


def get_user_permissions(session: Session, user_id: uuid.UUID) -> list[str]:
    statement = (
        select(AccessPermission.code)
        .join(RolePermission, RolePermission.permission_id == AccessPermission.id)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == RolePermission.role_id)
        .where(
            UserRoleAssignment.user_id == user_id,
            UserRoleAssignment.revoked_at.is_(None),
        )
    )
    return sorted(set(session.exec(statement).all()))


def user_has_permission(session: Session, user_id: uuid.UUID, permission: str) -> bool:
    statement = (
        select(AccessPermission.code)
        .join(RolePermission, RolePermission.permission_id == AccessPermission.id)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == RolePermission.role_id)
        .where(
            UserRoleAssignment.user_id == user_id,
            UserRoleAssignment.revoked_at.is_(None),
            AccessPermission.code == permission,
        )
        .limit(1)
    )
    return session.exec(statement).first() is not None


def require_permission(permission: str) -> Callable[..., User]:
    def dependency(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
    ) -> User:
        if current_user.is_deleted or not current_user.email_verified or not current_user.is_verified:
            raise HTTPException(status_code=403, detail="Administrator account is not eligible")
        if not user_has_permission(session, current_user.id, permission):
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user

    return dependency
