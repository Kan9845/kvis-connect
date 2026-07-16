"""Provision one verified account as the exclusive privileged administrator.

Run from the backend directory after applying migrations:
    python -m scripts.provision_privileged_admin --user-id UUID
    python -m scripts.provision_privileged_admin --user-id UUID --apply --exclusive
"""

import argparse
import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.core.database import engine
from app.models.authorization import AccessRole, UserRoleAssignment
from app.models.user import User


ADMIN_ROLE_NAMES = ("administrator", "theme_manager", "data_exporter")
SENSITIVE_ROLE_NAMES = ("theme_manager", "data_exporter")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Grant one verified account all administrator roles. Defaults to a dry run."
    )
    parser.add_argument("--user-id", required=True, type=uuid.UUID)
    parser.add_argument("--apply", action="store_true", help="Commit the role changes")
    parser.add_argument(
        "--exclusive",
        action="store_true",
        help="Revoke theme_manager and data_exporter from every other account",
    )
    return parser.parse_args()


def provision(session: Session, user_id: uuid.UUID, *, apply: bool, exclusive: bool) -> dict[str, int]:
    if apply and not exclusive:
        raise ValueError("Refusing to apply without --exclusive; sensitive roles must have one owner")

    user = session.get(User, user_id)
    if user is None:
        raise ValueError("The requested user does not exist")
    if user.is_deleted or not user.email_verified or not user.is_verified:
        raise ValueError("The requested user must be active, email-verified, and KVIS-verified")

    roles = session.exec(select(AccessRole).where(AccessRole.name.in_(ADMIN_ROLE_NAMES))).all()
    roles_by_name = {role.name: role for role in roles}
    missing_roles = sorted(set(ADMIN_ROLE_NAMES) - set(roles_by_name))
    if missing_roles:
        raise ValueError(f"Required roles are missing; apply migrations first: {', '.join(missing_roles)}")

    managed_role_ids = {role.id for role in roles}
    active_assignments = session.exec(
        select(UserRoleAssignment).where(
            UserRoleAssignment.role_id.in_(managed_role_ids),
            UserRoleAssignment.revoked_at.is_(None),
        )
    ).all()
    active_pairs = {(assignment.user_id, assignment.role_id) for assignment in active_assignments}

    grants = 0
    for role_name in ADMIN_ROLE_NAMES:
        role = roles_by_name[role_name]
        if (user_id, role.id) not in active_pairs:
            session.add(
                UserRoleAssignment(
                    user_id=user_id,
                    role_id=role.id,
                    granted_by_user_id=user_id,
                )
            )
            grants += 1

    sensitive_role_ids = {roles_by_name[name].id for name in SENSITIVE_ROLE_NAMES}
    revocations = 0
    if exclusive:
        now = datetime.utcnow()
        for assignment in active_assignments:
            if assignment.user_id != user_id and assignment.role_id in sensitive_role_ids:
                assignment.revoked_at = now
                assignment.revoked_by_user_id = user_id
                session.add(assignment)
                revocations += 1

    if apply:
        session.commit()
    else:
        session.rollback()

    return {"grants": grants, "revocations": revocations}


def main() -> None:
    args = parse_args()
    with Session(engine) as session:
        result = provision(session, args.user_id, apply=args.apply, exclusive=args.exclusive)

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(f"{mode}: grants={result['grants']}, sensitive-role revocations={result['revocations']}")
    if not args.apply:
        print("No database changes were committed. Re-run with --apply --exclusive after review.")


if __name__ == "__main__":
    main()
