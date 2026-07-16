import uuid
from datetime import datetime
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core import authorization
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.admin_export import AdminDataExportAudit
from app.models.user import User
from app.routers import admin_export


app = FastAPI()
app.include_router(admin_export.router, prefix="/api")
client = TestClient(app)


def make_user(**overrides) -> User:
    values = {
        "id": uuid.uuid4(),
        "email": "admin@example.com",
        "slug": "admin",
        "first_name": "Test",
        "last_name": "Administrator",
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


def test_export_fields_reject_anonymous_visitors():
    override_session(MagicMock())

    response = client.get("/api/admin/data-export/fields")

    assert response.status_code == 401


def test_export_fields_reject_normal_users(monkeypatch):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: False)

    response = client.get("/api/admin/data-export/fields")

    assert response.status_code == 403


def test_export_allowlist_never_offers_authentication_secrets(monkeypatch):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.get("/api/admin/data-export/fields")

    assert response.status_code == 200
    keys = {field["key"] for field in response.json()}
    assert keys.isdisjoint({"hashed_password", "google_id"})
    assert "kvis_email" in keys


def test_export_allowlist_covers_every_safe_user_column(monkeypatch):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.get("/api/admin/data-export/fields")

    assert response.status_code == 200
    keys = {field["key"] for field in response.json()}
    safe_user_columns = set(User.__table__.columns.keys()) - {"hashed_password", "google_id"}
    assert safe_user_columns <= keys


def test_download_requires_sensitive_data_acknowledgement(monkeypatch):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)

    response = client.post(
        "/api/admin/data-export/download",
        json={"fields": ["id"], "acknowledge_sensitive": False},
    )

    assert response.status_code == 400


def test_preview_is_masked(monkeypatch):
    override_session(MagicMock())
    authenticate(make_user())
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)
    monkeypatch.setattr(
        admin_export,
        "_export_rows",
        lambda *_args, **_kwargs: ([["person@example.com", "Person"]], 1),
    )

    response = client.post(
        "/api/admin/data-export/preview",
        json={"fields": ["email", "first_name"]},
    )

    assert response.status_code == 200
    assert response.json()["rows"] == [["***@example.com", "P***"]]
    assert response.json()["total_rows"] == 1
    assert response.json()["estimated_size_bytes"] > 0


def test_download_neutralizes_formulas_and_creates_audit(monkeypatch):
    session = MagicMock()
    override_session(session)
    administrator = make_user()
    authenticate(administrator)
    monkeypatch.setattr(authorization, "user_has_permission", lambda *_args: True)
    monkeypatch.setattr(
        admin_export,
        "_export_rows",
        lambda *_args, **_kwargs: ([["=HYPERLINK(\"https://invalid.example\")"]], 1),
    )

    response = client.post(
        "/api/admin/data-export/download",
        json={"fields": ["bio"], "acknowledge_sensitive": True},
    )

    assert response.status_code == 200
    assert "'=HYPERLINK" in response.text
    audit = session.add.call_args.args[0]
    assert isinstance(audit, AdminDataExportAudit)
    assert audit.administrator_user_id == administrator.id
    assert audit.selected_fields == ["bio"]
    assert audit.exported_row_count == 1
    session.commit.assert_called_once()
