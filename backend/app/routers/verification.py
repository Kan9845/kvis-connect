import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from sqlalchemy import delete, func, or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.authorization import ADMIN_VERIFICATION_MANAGE, require_permission
from app.core.config import settings
from app.core.database import get_session
from app.core.security import hash_password
from app.models.user import User
from app.models.verification import VerificationRateLimit, VerificationRequest
from app.routers.auth import _set_auth_cookies
from app.schemas.verification import Activation, Decision, RequestPage, RequestRead, Submission

router = APIRouter(tags=["verification"])
reviewer = require_permission(ADMIN_VERIFICATION_MANAGE)


def mutation_header(x_verification_action: str = Header(default="")):
    # Cross-origin HTML forms cannot send this header. CORS permits only our frontend.
    if x_verification_action != "v1":
        raise HTTPException(403, "Missing verification action header")


def private_response(response: Response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"


def rate_limit(session: Session, request: Request, scope: str, maximum: int):
    """Database-backed limit shared by workers; trust only the server's client address."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert

    peer = request.client.host if request.client else "unknown"
    key = hmac.new(settings.SECRET_KEY.encode(), f"{scope}:{peer}".encode(), hashlib.sha256).hexdigest()
    now = datetime.utcnow()
    insert = pg_insert if session.get_bind().dialect.name == "postgresql" else sqlite_insert
    session.exec(insert(VerificationRateLimit).values(key=key, started_at=now, count=0).on_conflict_do_nothing())
    record = session.exec(select(VerificationRateLimit).where(VerificationRateLimit.key == key).with_for_update()).one()
    if record.started_at < now - timedelta(hours=1):
        record.started_at, record.count = now, 0
    if record.count >= maximum:
        session.rollback()
        raise HTTPException(429, "Too many attempts. Try again in an hour.", headers={"Retry-After": "3600"})
    record.count += 1
    session.add(record)
    session.exec(delete(VerificationRateLimit).where(VerificationRateLimit.started_at < now - timedelta(days=1)))
    session.commit()


def existing_account(session: Session, email: str):
    # Deleted and unverified accounts also need recovery, never a second identity.
    return session.exec(select(User.id).where(or_(
        func.lower(User.email) == email, func.lower(User.personal_email) == email,
        func.lower(User.kvis_email) == email,
    )).limit(1)).first()


def activation_origin() -> str:
    origin = settings.VERIFICATION_FRONTEND_URL or settings.FRONTEND_URL
    parsed = urlsplit(origin)
    if (parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username
            or parsed.password or parsed.query or parsed.fragment or parsed.path not in {"", "/"}
            or "," in origin or (settings.is_production and parsed.scheme != "https")
            or (parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1"})):
        raise HTTPException(503, "Configure a trusted VERIFICATION_FRONTEND_URL first")
    return origin.rstrip("/")


@router.post("/verification/requests", status_code=202, dependencies=[Depends(mutation_header)])
def submit(body: Submission, request: Request, response: Response, session: Session = Depends(get_session)):
    private_response(response)
    rate_limit(session, request, "submit", 10)
    receipt = {"message": "Request received. If you already have an account or an open request, use sign in or contact the admin."}
    if existing_account(session, str(body.personal_email)):
        return receipt
    session.add(VerificationRequest(**body.model_dump()))
    try:
        session.commit()
    except IntegrityError:
        session.rollback()  # Duplicate submissions have the same response; no account enumeration.
    return receipt


@router.get("/admin/verification-requests", response_model=RequestPage)
def list_requests(response: Response, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                  _admin: User = Depends(reviewer), session: Session = Depends(get_session)):
    private_response(response)
    total = session.exec(select(func.count()).select_from(VerificationRequest)).one()
    pending = session.exec(select(func.count()).select_from(VerificationRequest).where(VerificationRequest.status == "pending")).one()
    items = session.exec(select(VerificationRequest).order_by(VerificationRequest.created_at.desc(), VerificationRequest.id)
                         .offset((page - 1) * page_size).limit(page_size)).all()
    return {"items": items, "total": total, "pending": pending}


def locked_request(session: Session, request_id: uuid.UUID):
    record = session.exec(select(VerificationRequest).where(VerificationRequest.id == request_id).with_for_update()).first()
    if not record:
        raise HTTPException(404, "Request not found")
    return record


@router.post("/admin/verification-requests/{request_id}/review", response_model=RequestRead,
             dependencies=[Depends(mutation_header)])
def review(request_id: uuid.UUID, body: Decision, response: Response,
           admin: User = Depends(reviewer), session: Session = Depends(get_session)):
    private_response(response)
    record = locked_request(session, request_id)
    if record.status != "pending":
        raise HTTPException(409, "Request was already reviewed. Refresh the list.")
    if body.status == "approved":
        if existing_account(session, record.personal_email):
            raise HTTPException(409, "An account already uses this email. Use account recovery.")
        if not (body.student_id or record.student_id):
            raise HTTPException(422, "Confirm the five-digit student ID before approval")
        record.student_id = body.student_id or record.student_id
    record.status = body.status
    record.review_note = body.review_note
    record.reviewed_at = datetime.utcnow()
    record.reviewed_by = admin.id
    session.add(record)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "This student ID and cohort already have an approved request or account") from None
    session.refresh(record)
    return record


@router.post("/admin/verification-requests/{request_id}/activation-link", dependencies=[Depends(mutation_header)])
def issue_link(request_id: uuid.UUID, response: Response, admin: User = Depends(reviewer), session: Session = Depends(get_session)):
    private_response(response)
    origin = activation_origin()
    record = locked_request(session, request_id)
    if record.status != "approved":
        raise HTTPException(409, "Only approved, unactivated requests can receive links")
    if existing_account(session, record.personal_email):
        raise HTTPException(409, "An account already uses this email. Use account recovery.")
    token = secrets.token_urlsafe(32)
    record.token_hash = hashlib.sha256(token.encode()).hexdigest()
    record.token_issued_at = datetime.utcnow()
    record.token_expires_at = record.token_issued_at + timedelta(hours=48)
    record.token_issued_by = admin.id
    session.add(record)
    session.commit()
    # The fragment stays out of web server access logs and is posted only during activation.
    link = f"{origin}/auth/activate#token={token}"
    message = (f"Hello {record.full_name},\n\nYour KVIS Connect request has been approved. "
               f"Open this link within 48 hours to set your password and complete your profile:\n\n{link}\n\n"
               "This link works only once. Do not forward it. If you did not request access, contact the KVIS Connect admin.")
    return {"activation_url": link, "email_message": message, "recipient": record.personal_email, "expires_at": record.token_expires_at}


@router.post("/auth/activate", dependencies=[Depends(mutation_header)])
def activate(body: Activation, request: Request, response: Response, session: Session = Depends(get_session)):
    private_response(response)
    rate_limit(session, request, "activate", 20)
    digest = hashlib.sha256(body.token.encode()).hexdigest()
    record = session.exec(select(VerificationRequest).where(VerificationRequest.token_hash == digest).with_for_update()).first()
    if not record or record.status != "approved" or not record.token_expires_at or record.token_expires_at <= datetime.utcnow():
        raise HTTPException(400, "Activation link is invalid, expired, or already used. Contact the admin for a new link.")
    if existing_account(session, record.personal_email):
        raise HTTPException(409, "An account already uses this email. Use sign in or account recovery.")
    first, _, last = record.full_name.partition(" ")
    user = User(email=record.personal_email, first_name=first, last_name=last,
                nickname=record.nickname, kvis_year=int(record.cohort),
                current_grade=record.current_grade if record.applicant_type == "student" else None,
                slug=f"alumnus-{uuid.uuid4().hex}", hashed_password=hash_password(body.password),
                email_verified=True, is_verified=True, profile_setup_done=False)
    try:
        session.add(user)
        session.flush()  # Satisfy the user FK before linking this request, without committing.
        record.status = "activated"
        record.user_id = user.id
        record.activated_at = datetime.utcnow()
        record.token_hash = None
        session.add(record)
        session.commit()  # Account creation and token consumption are one transaction.
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "Account could not be created. Contact the admin.") from None
    _set_auth_cookies(response, user.id)
    return {"message": "Account activated", "next": "/onboarding"}
