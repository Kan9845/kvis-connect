import uuid
from datetime import datetime
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core import authorization
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.routers import admin


app = FastAPI()
app.include_router(admin.router, prefix="/api")
client = TestClient(app)


def make_user(**overrides) -> User:
    values = {
        "id": uuid.uuid4(),
        "email": "member@example.com",
        "slug": "member",
        "first_name": "Test",
        "last_name": "Member",
        "email_verified": True,
        "is_verified": True,
        "profile_setup_done": True,
        "created_at": datetime(2026, 1, 1),
    }
    values.update(overrides)
    return User(**values)


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def override_session(session: MagicMock) -> None:
    def provide_session():
        yield session

    app.dependency_overrides[get_session] = provide_session


def authenticate(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.mark.parametrize("route", ["/api/admin/overview", "/api/admin/users"])
def test_admin_routes_reject_anonymous_visitors(route: str):
    override_session(MagicMock())

    response = client.get(route)

    assert response.status_code == 401


@pytest.mark.parametrize("route", ["/api/admin/overview", "/api/admin/users"])
def test_admin_routes_reject_invalid_tokens(route: str):
    override_session(MagicMock())

    response = client.get(route, headers={"Cookie": "access_token=not-a-valid-token"})

    assert response.status_code == 401


@pytest.mark.parametrize("route", ["/api/admin/overview", "/api/admin/users"])
def test_admin_routes_reject_normal_users(monkeypatch, route: str):
    session = MagicMock()
    override_session(session)
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: False)

    response = client.get(route)

    assert response.status_code == 403


@pytest.mark.parametrize(
    "user_overrides",
    [
        {"email_verified": False},
        {"is_verified": False},
        {"is_deleted": True},
    ],
)
def test_admin_routes_require_an_eligible_account(monkeypatch, user_overrides: dict):
    override_session(MagicMock())
    authenticate(make_user(**user_overrides))
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.get("/api/admin/overview")

    assert response.status_code == 403


def test_authorized_admin_can_read_overview(monkeypatch):
    session = MagicMock()
    count_results = []
    for value in [10, 8, 7, 2]:
        result = MagicMock()
        result.one.return_value = value
        count_results.append(result)
    session.exec.side_effect = count_results
    override_session(session)
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.get("/api/admin/overview")

    assert response.status_code == 200
    assert response.json() == {
        "total_users": 10,
        "eligible_users": 8,
        "completed_profiles": 7,
        "recent_users_30d": 2,
    }


def test_authorized_admin_gets_paginated_minimal_user_data(monkeypatch):
    admin_user = make_user(email="admin@example.com", slug="admin")
    listed_user = make_user(email="listed@example.com", slug="listed")
    session = MagicMock()

    count_result = MagicMock()
    count_result.one.return_value = 1
    users_result = MagicMock()
    users_result.all.return_value = [listed_user]
    roles_result = MagicMock()
    roles_result.all.return_value = [(listed_user.id, "administrator")]
    session.exec.side_effect = [count_result, users_result, roles_result]

    override_session(session)
    authenticate(admin_user)
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.get("/api/admin/users?page=1&page_size=25")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["page"] == 1
    assert payload["page_size"] == 25
    assert payload["items"][0]["roles"] == ["administrator"]
    assert set(payload["items"][0]) == {
        "id",
        "slug",
        "first_name",
        "last_name",
        "email",
        "email_verified",
        "is_verified",
        "profile_setup_done",
        "created_at",
        "roles",
    }


def test_user_list_rejects_excessive_page_size(monkeypatch):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.get("/api/admin/users?page_size=101")

    assert response.status_code == 422


@pytest.mark.parametrize("route", ["/api/admin/overview", "/api/admin/users"])
def test_request_parameters_cannot_impersonate_an_admin(monkeypatch, route: str):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: False)

    response = client.get(
        route,
        params={"role": "administrator", "is_admin": "true", "slug": "admin"},
    )

    assert response.status_code == 403
