"""Grant a verified existing account reviewer access; dry-run unless --apply."""
import argparse
import uuid
from sqlalchemy import func
from sqlmodel import Session, select
from app.core.database import engine
from app.models.authorization import AccessRole, UserRoleAssignment
from app.models.user import User


def provision(session, user_id, apply=False):
    user = session.get(User, user_id)
    if not user or user.is_deleted or not user.email_verified or not user.is_verified:
        raise ValueError("Select an existing, active, email-verified and KVIS-verified account")
    role = session.exec(select(AccessRole).where(AccessRole.name == "verification_reviewer")).one()
    assignment = session.exec(select(UserRoleAssignment).where(UserRoleAssignment.user_id == user_id,
        UserRoleAssignment.role_id == role.id, UserRoleAssignment.revoked_at.is_(None))).first()
    if not assignment:
        session.add(UserRoleAssignment(user_id=user_id, role_id=role.id))
    if apply:
        session.commit()
    else:
        session.rollback()
    return not bool(assignment)


def find_user_id(session, email):
    user = session.exec(select(User).where(func.lower(User.email) == email.strip().lower())).first()
    if not user:
        raise ValueError("No account was found for that email")
    return user.id


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    identity = parser.add_mutually_exclusive_group(required=True)
    identity.add_argument("--user-id", type=uuid.UUID)
    identity.add_argument("--email", help="Existing account email")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    with Session(engine) as session:
        user_id = args.user_id or find_user_id(session, args.email)
        changed = provision(session, user_id, args.apply)
    print(f"{'APPLIED' if args.apply else 'DRY RUN'}: new reviewer grant={changed}")
