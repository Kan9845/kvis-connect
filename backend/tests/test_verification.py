"""Verification lifecycle with an isolated database and real authorization checks.

SQLite covers constraints and transactions; PostgreSQL lock/concurrency behavior
must also be exercised against staging before public launch.
"""
import hashlib
from datetime import datetime, timedelta
from types import SimpleNamespace
from urllib.parse import parse_qs, urlsplit

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine, select

from app.core.authorization import ADMIN_VERIFICATION_MANAGE
from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, verify_password
from app.models.authorization import AccessPermission, AccessRole, RolePermission, UserRoleAssignment
from app.models.user import User
from app.models.verification import VerificationRateLimit, VerificationRequest
from app.routers import verification
from scripts.provision_verification_reviewer import provision


@compiles(JSONB, "sqlite")
def sqlite_json(_type, _compiler, **_kwargs):
    return "JSON"


HEADERS = {"X-Verification-Action": "v1"}
BASE = "/api/admin/verification-requests"
PAYLOAD = dict(student_id="00123", cohort="01", full_name="Test Alumnus", nickname="Test",
               classroom="12/1", project_name="Synthetic project", advisor="Test Advisor",
               personal_email="alumnus@example.org", note="Synthetic test data only")


@pytest.fixture
def system(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    @event.listens_for(engine, "connect")
    def foreign_keys(connection, _record):
        connection.execute("PRAGMA foreign_keys=ON")

    models = [User, AccessRole, AccessPermission, RolePermission, UserRoleAssignment,
              VerificationRequest, VerificationRateLimit]
    SQLModel.metadata.create_all(engine, tables=[model.__table__ for model in models])
    with Session(engine) as db:
        admin = User(email="reviewer@example.org", slug="reviewer", first_name="Reviewer", last_name="Test",
                     email_verified=True, is_verified=True)
        ordinary = User(email="existing@example.org", slug="existing", first_name="Existing", last_name="Test",
                        email_verified=True, is_verified=True)
        role = AccessRole(name="verification_reviewer")
        permission = AccessPermission(code=ADMIN_VERIFICATION_MANAGE)
        db.add_all([admin, ordinary, role, permission]); db.commit()
        db.add(RolePermission(role_id=role.id, permission_id=permission.id))
        db.add(UserRoleAssignment(user_id=admin.id, role_id=role.id)); db.commit()
        admin_id, ordinary_id = admin.id, ordinary.id

    app = FastAPI()
    app.include_router(verification.router, prefix="/api")

    def session_override():
        with Session(engine) as db:
            yield db

    app.dependency_overrides[get_session] = session_override
    monkeypatch.setattr(settings, "VERIFICATION_FRONTEND_URL", "https://connect.example.org")
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    with TestClient(app) as client:
        yield SimpleNamespace(client=client, engine=engine, admin_id=admin_id, ordinary_id=ordinary_id)
    engine.dispose()


def sign_in(system, user_id=None):
    system.client.cookies.set("access_token", create_access_token(user_id or system.admin_id))


def submit(system, **overrides):
    return system.client.post("/api/verification/requests", json={**PAYLOAD, **overrides}, headers=HEADERS)


def pending_request(system, **overrides):
    assert submit(system, **overrides).status_code == 202
    sign_in(system)
    result = system.client.get(BASE)
    assert result.status_code == 200, result.text
    return result.json()["items"][0]["id"]


def decide(system, request_id, status="approved", **overrides):
    return system.client.post(f"{BASE}/{request_id}/review",
        json={"status": status, "review_note": "Matched trusted synthetic roster", **overrides}, headers=HEADERS)


def issue(system, request_id):
    return system.client.post(f"{BASE}/{request_id}/activation-link", headers=HEADERS)


def token_from(result):
    assert result.status_code == 200, result.text
    return parse_qs(urlsplit(result.json()["activation_url"]).fragment)["token"][0]


def activate(system, token, password="a-safe-test-password"):
    return system.client.post("/api/auth/activate", json={"token": token, "password": password}, headers=HEADERS)


@pytest.mark.parametrize("changes", [dict(student_id="123456"), dict(student_id="12a45"),
    dict(cohort="1"), dict(cohort="00"), dict(full_name="  "), dict(advisor=""),
    dict(nickname=""), dict(classroom=""), dict(project_name=""), dict(personal_email="invalid"),
    dict(note="x" * 2001), dict(status="approved")])
def test_submission_validates_untrusted_fields(system, changes):
    assert submit(system, **changes).status_code == 422


def test_receipt_is_generic_and_duplicates_are_not_saved(system):
    first = submit(system)
    duplicate = submit(system, personal_email="ALUMNUS@example.org")
    existing = submit(system, personal_email="EXISTING@example.org")
    assert first.status_code == duplicate.status_code == existing.status_code == 202
    assert first.json() == duplicate.json() == existing.json()
    assert first.headers["cache-control"] == "no-store"
    with Session(system.engine) as db:
        records = db.exec(select(VerificationRequest)).all()
        assert len(records) == 1
        assert records[0].student_id == "00123"


@pytest.mark.parametrize("role", ["anonymous", "ordinary", "ineligible", "revoked"])
def test_all_admin_routes_require_reviewer_permission(system, role):
    request_id = pending_request(system)
    system.client.cookies.clear()
    if role != "anonymous":
        sign_in(system, system.ordinary_id if role == "ordinary" else system.admin_id)
    with Session(system.engine) as db:
        if role == "ineligible":
            admin = db.get(User, system.admin_id); admin.email_verified = False; db.add(admin)
        if role == "revoked":
            assignment = db.exec(select(UserRoleAssignment)).one()
            assignment.revoked_at = datetime.utcnow(); db.add(assignment)
        db.commit()
    expected = 401 if role == "anonymous" else 403
    assert system.client.get(BASE).status_code == expected
    assert decide(system, request_id).status_code == expected
    assert issue(system, request_id).status_code == expected


def test_mutations_require_non_simple_header(system):
    request_id = pending_request(system)
    assert system.client.post("/api/verification/requests", json=PAYLOAD).status_code == 403
    assert system.client.post(f"{BASE}/{request_id}/review", json={"status": "approved", "review_note": "Checked"}).status_code == 403
    assert system.client.post(f"{BASE}/{request_id}/activation-link").status_code == 403
    assert system.client.post("/api/auth/activate", json={"token": "x" * 43, "password": "test-password-123"}).status_code == 403


def test_forgot_id_requires_reviewer_to_confirm_id_and_note(system):
    request_id = pending_request(system, student_id=None)
    assert decide(system, request_id).status_code == 422
    assert decide(system, request_id, student_id="00123", review_note=" ").status_code == 422
    approved = decide(system, request_id, student_id="00123")
    assert approved.status_code == 200, approved.text
    assert approved.json()["reviewed_by"] == str(system.admin_id)
    assert approved.json()["student_id"] == "00123"
    assert decide(system, request_id).status_code == 409


def test_duplicate_identity_cannot_be_approved(system):
    request_id = pending_request(system)
    assert decide(system, request_id).status_code == 200
    other_id = pending_request(system, personal_email="another@example.org")
    assert decide(system, other_id).status_code == 409
    with Session(system.engine) as db:
        assert sorted(record.status for record in db.exec(select(VerificationRequest)).all()) == ["approved", "pending"]


def test_rejected_request_cannot_issue_link_but_allows_resubmission(system):
    request_id = pending_request(system)
    assert issue(system, request_id).status_code == 409
    assert decide(system, request_id, status="rejected").status_code == 200
    assert issue(system, request_id).status_code == 409
    assert submit(system).status_code == 202
    assert system.client.get(BASE).json()["total"] == 2


def test_activation_creates_verified_account_and_consumes_token(system):
    request_id = pending_request(system)
    assert decide(system, request_id).status_code == 200
    result = issue(system, request_id)
    token = token_from(result)
    assert result.headers["cache-control"] == "no-store"
    assert result.json()["recipient"] == PAYLOAD["personal_email"]
    with Session(system.engine) as db:
        record = db.exec(select(VerificationRequest)).one()
        assert record.token_hash == hashlib.sha256(token.encode()).hexdigest()
        assert record.token_issued_by == system.admin_id
        assert db.exec(select(User).where(User.email == PAYLOAD["personal_email"])).first() is None
    listed = system.client.get(BASE)
    assert token not in listed.text and "token_hash" not in listed.text
    system.client.cookies.clear()
    response = activate(system, token)
    assert response.status_code == 200, response.text
    assert response.json()["next"] == "/onboarding"
    assert "HttpOnly" in response.headers["set-cookie"]
    with Session(system.engine) as db:
        user = db.exec(select(User).where(User.email == PAYLOAD["personal_email"])).one()
        assert user.email_verified and user.is_verified and not user.profile_setup_done
        assert verify_password("a-safe-test-password", user.hashed_password)
        assert user.kvis_year == 1
        record = db.exec(select(VerificationRequest)).one()
        assert record.user_id == user.id and record.status == "activated" and record.token_hash is None
    assert activate(system, token).status_code == 400
    sign_in(system)
    assert issue(system, request_id).status_code == 409


def test_replacement_invalidates_old_link_and_expiry_is_enforced(system):
    request_id = pending_request(system)
    assert decide(system, request_id).status_code == 200
    old = token_from(issue(system, request_id))
    new = token_from(issue(system, request_id))
    assert old != new
    assert activate(system, old).status_code == 400
    with Session(system.engine) as db:
        record = db.exec(select(VerificationRequest)).one()
        record.token_expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.add(record); db.commit()
    assert activate(system, new).status_code == 400
    assert activate(system, "x" * 43).status_code == 400


@pytest.mark.parametrize("password", ["short", " " * 12, "x" * 73, "\u0e01" * 25])
def test_activation_validates_password(system, password):
    assert activate(system, "x" * 43, password).status_code == 422


def test_public_rate_limit_is_persisted(system):
    for _ in range(10):
        assert submit(system).status_code == 202
    limited = submit(system)
    assert limited.status_code == 429
    assert limited.headers["retry-after"] == "3600"
    with Session(system.engine) as db:
        record = db.exec(select(VerificationRateLimit)).one()
        record.started_at = datetime.utcnow() - timedelta(hours=2)
        db.add(record); db.commit()
    assert submit(system).status_code == 202


def test_link_origin_is_server_controlled(system, monkeypatch):
    request_id = pending_request(system)
    assert decide(system, request_id).status_code == 200
    monkeypatch.setattr(settings, "VERIFICATION_FRONTEND_URL", "http://untrusted.example.org/path")
    assert issue(system, request_id).status_code == 503


def test_reviewer_provisioning_is_explicit_and_idempotent(system):
    with Session(system.engine) as db:
        assert provision(db, system.ordinary_id) is True
        assert db.exec(select(UserRoleAssignment).where(UserRoleAssignment.user_id == system.ordinary_id)).first() is None
        assert provision(db, system.ordinary_id, apply=True) is True
        assert provision(db, system.ordinary_id, apply=True) is False
    sign_in(system, system.ordinary_id)
    assert system.client.get(BASE).status_code == 200


def test_production_does_not_issue_local_http_links(system, monkeypatch):
    request_id = pending_request(system)
    assert decide(system, request_id).status_code == 200
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "VERIFICATION_FRONTEND_URL", "http://localhost:3000")
    assert issue(system, request_id).status_code == 503


STUDENT = dict(applicant_type="student", current_grade=11, homeroom_teacher="Test Homeroom Teacher",
               project_name="", advisor="")


@pytest.mark.parametrize("changes", [dict(current_grade=None), dict(current_grade=9),
    dict(current_grade=13), dict(homeroom_teacher="  "), dict(classroom=""),
    dict(project_name="Unexpected project"), dict(applicant_type="faculty")])
def test_student_evidence_validation(system, changes):
    assert submit(system, **{**STUDENT, **changes}).status_code == 422


def test_alumni_cannot_substitute_student_evidence(system):
    assert submit(system, current_grade=11, homeroom_teacher="Teacher").status_code == 422
    assert submit(system, project_name="", advisor="").status_code == 422


def test_student_request_review_and_activation(system):
    request_id = pending_request(system, **STUDENT)
    listed = system.client.get(BASE).json()["items"][0]
    assert listed["applicant_type"] == "student"
    assert listed["current_grade"] == 11
    assert listed["homeroom_teacher"] == STUDENT["homeroom_teacher"]
    assert listed["project_name"] == listed["advisor"] == ""
    assert decide(system, request_id).status_code == 200
    token = token_from(issue(system, request_id))
    assert activate(system, token).status_code == 200
    with Session(system.engine) as db:
        user = db.exec(select(User).where(User.email == PAYLOAD["personal_email"])).one()
        assert user.current_grade == 11 and user.kvis_year == 1
        assert user.email_verified and user.is_verified


def test_student_forgot_id_still_requires_admin_confirmation(system):
    request_id = pending_request(system, student_id=None, **STUDENT)
    assert decide(system, request_id).status_code == 422
    assert decide(system, request_id, student_id="00123").status_code == 200
