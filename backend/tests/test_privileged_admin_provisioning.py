import uuid
from unittest.mock import MagicMock

import pytest

from app.models.authorization import AccessRole
from app.models.user import User
from scripts.provision_privileged_admin import provision


def make_verified_user(**overrides) -> User:
    values = {
        "id": uuid.uuid4(),
        "email": "owner@example.test",
        "slug": "owner",
        "first_name": "Site",
        "last_name": "Owner",
        "email_verified": True,
        "is_verified": True,
    }
    values.update(overrides)
    return User(**values)


def make_roles() -> list[AccessRole]:
    return [AccessRole(id=uuid.uuid4(), name=name) for name in ("administrator", "theme_manager", "data_exporter")]


def test_apply_requires_exclusive_mode():
    with pytest.raises(ValueError, match="--exclusive"):
        provision(MagicMock(), uuid.uuid4(), apply=True, exclusive=False)


@pytest.mark.parametrize(
    "overrides",
    [
        {"email_verified": False},
        {"is_verified": False},
        {"is_deleted": True},
    ],
)
def test_ineligible_account_cannot_be_provisioned(overrides):
    session = MagicMock()
    session.get.return_value = make_verified_user(**overrides)

    with pytest.raises(ValueError, match="active, email-verified, and KVIS-verified"):
        provision(session, session.get.return_value.id, apply=False, exclusive=False)


def test_dry_run_plans_all_three_roles_without_committing():
    user = make_verified_user()
    session = MagicMock()
    session.get.return_value = user
    roles_result = MagicMock()
    roles_result.all.return_value = make_roles()
    assignments_result = MagicMock()
    assignments_result.all.return_value = []
    session.exec.side_effect = [roles_result, assignments_result]

    result = provision(session, user.id, apply=False, exclusive=False)

    assert result == {"grants": 3, "revocations": 0}
    assert session.add.call_count == 3
    session.rollback.assert_called_once()
    session.commit.assert_not_called()


def test_exclusive_apply_revokes_sensitive_roles_from_other_users():
    user = make_verified_user()
    roles = make_roles()
    sensitive_role = next(role for role in roles if role.name == "theme_manager")
    other_assignment = MagicMock(
        user_id=uuid.uuid4(),
        role_id=sensitive_role.id,
        revoked_at=None,
        revoked_by_user_id=None,
    )
    session = MagicMock()
    session.get.return_value = user
    roles_result = MagicMock()
    roles_result.all.return_value = roles
    assignments_result = MagicMock()
    assignments_result.all.return_value = [other_assignment]
    session.exec.side_effect = [roles_result, assignments_result]

    result = provision(session, user.id, apply=True, exclusive=True)

    assert result == {"grants": 3, "revocations": 1}
    assert other_assignment.revoked_at is not None
    assert other_assignment.revoked_by_user_id == user.id
    session.commit.assert_called_once()
