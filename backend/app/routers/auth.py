import secrets
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from authlib.integrations.starlette_client import OAuth

from app.core.database import get_session
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.cache import invalidate_tags
from app.core.slug import unique_user_slug
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, OTPRequestBody, OTPVerifyBody, PasswordResetRequest, PasswordResetConfirm, KvisVerifyBody, EmailVerifyBody

router = APIRouter(prefix="/auth", tags=["auth"])

# Google OAuth setup
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

KVIS_DOMAIN = "kvis.ac.th"

COOKIE_OPTS = dict(
    httponly=True,
    samesite="none" if settings.is_production else "lax",
    secure=settings.is_production,
)

# In-memory OTP store: {email: {"otp": str, "expires_at": datetime}}
_otp_store: dict[str, dict] = {}
OTP_TTL_MINUTES = 10

# In-memory password reset store: {token: {"email": str, "expires_at": datetime}}
_reset_store: dict[str, dict] = {}
RESET_TTL_MINUTES = 30


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_reset_email(to_email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    body = (
        f"You requested a password reset for your KVIS Connect account.\n\n"
        f"Click the link below to set a new password:\n\n"
        f"  {reset_url}\n\n"
        f"This link expires in {RESET_TTL_MINUTES} minutes. If you did not request this, ignore this email."
    )
    msg = MIMEText(body)
    msg["Subject"] = "KVIS Connect – Password Reset"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())


def _send_otp_email(to_email: str, otp: str) -> None:
    body = (
        f"Your KVIS Connect verification code is:\n\n"
        f"  {otp}\n\n"
        f"This code expires in {OTP_TTL_MINUTES} minutes. Do not share it with anyone."
    )
    msg = MIMEText(body)
    msg["Subject"] = "KVIS Connect – Email Verification Code"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())


def _set_auth_cookies(response: Response, user_id: int):
    response.set_cookie("access_token", create_access_token(user_id), max_age=3600, **COOKIE_OPTS)
    response.set_cookie("refresh_token", create_refresh_token(user_id), max_age=86400 * 30, **COOKIE_OPTS)


@router.post("/register")
async def register(body: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing and existing.email_verified:
        raise HTTPException(400, detail="Email already registered")

    if len(body.password) < 6:
        raise HTTPException(400, detail="Password must be at least 6 characters")

    if existing and not existing.email_verified:
        # Update credentials in case they changed name/password
        existing.hashed_password = hash_password(body.password)
        existing.first_name = body.first_name
        existing.last_name = body.last_name
        session.add(existing)
        session.commit()
        user = existing
    else:
        slug = unique_user_slug(session, body.first_name, body.last_name)
        user = User(
            email=body.email,
            hashed_password=hash_password(body.password),
            first_name=body.first_name,
            last_name=body.last_name,
            slug=slug,
            email_verified=False,
        )
        session.add(user)
        session.commit()
        await invalidate_tags("users")

    otp = _generate_otp()
    _otp_store[body.email] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
    }
    try:
        _send_otp_email(body.email, otp)
    except Exception:
        del _otp_store[body.email]
        raise HTTPException(500, detail="Account created but failed to send verification email. Check SMTP config.")

    return {"message": "Account created. Check your email for a verification code.", "email": body.email}


@router.post("/email/verify")
async def verify_registration_email(body: EmailVerifyBody, response: Response, session: Session = Depends(get_session)):
    record = _otp_store.get(body.email)
    if not record:
        raise HTTPException(400, detail="No verification code found. Request a new one.")
    if datetime.now(timezone.utc) > record["expires_at"]:
        del _otp_store[body.email]
        raise HTTPException(400, detail="Code expired. Request a new one.")
    if record["otp"] != body.otp:
        raise HTTPException(400, detail="Invalid code.")

    del _otp_store[body.email]

    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user:
        raise HTTPException(404, detail="Account not found.")

    user.email_verified = True
    user.is_verified = True
    user.kvis_email = user.email
    session.add(user)
    session.commit()
    await invalidate_tags("users", f"user:{user.id}")
    session.refresh(user)

    _set_auth_cookies(response, user.id)
    return {"message": "Email verified", "user_id": user.id}


@router.post("/login")
def login(body: LoginRequest, response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, detail="Invalid credentials")
    if not user.email_verified:
        otp = _generate_otp()
        _otp_store[user.email] = {
            "otp": otp,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
        }
        try:
            _send_otp_email(user.email, otp)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send OTP email: {e}")
        raise HTTPException(403, detail="EMAIL_NOT_VERIFIED")

    _set_auth_cookies(response, user.id)
    return {"message": "Logged in", "user_id": user.id}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.post("/refresh")
def refresh(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    # Read refresh token from cookie
    token = request.cookies.get("refresh_token") if request else None
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    response.set_cookie("access_token", create_access_token(user.id), max_age=3600, **COOKIE_OPTS)
    return {"message": "Token refreshed"}


# Email OTP
@router.post("/otp/request")
def request_otp(body: OTPRequestBody):
    if not body.email.endswith(f"@{KVIS_DOMAIN}"):
        raise HTTPException(400, detail="Only @kvis.ac.th emails are allowed")

    otp = _generate_otp()
    _otp_store[body.email] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
    }

    try:
        _send_otp_email(body.email, otp)
    except Exception:
        del _otp_store[body.email]
        raise HTTPException(500, detail="Failed to send OTP email. Check SMTP configuration.")

    return {"message": f"OTP sent to {body.email}"}


@router.post("/otp/verify")
async def verify_otp(body: OTPVerifyBody, response: Response, session: Session = Depends(get_session)):
    record = _otp_store.get(body.email)
    if not record:
        raise HTTPException(400, detail="No OTP requested for this email")
    if datetime.now(timezone.utc) > record["expires_at"]:
        del _otp_store[body.email]
        raise HTTPException(400, detail="OTP has expired. Please request a new one.")
    if record["otp"] != body.otp:
        raise HTTPException(400, detail="Invalid OTP")

    del _otp_store[body.email]

    user = session.exec(select(User).where(User.email == body.email)).first()
    is_new_user = user is None
    if not user:
        slug = unique_user_slug(session, "", "")
        user = User(email=body.email, first_name="", last_name="", email_verified=True,
                    is_verified=True, kvis_email=body.email, slug=slug)
        session.add(user)
    else:
        user.email_verified = True
        user.is_verified = True
        user.kvis_email = body.email
        session.add(user)

    session.commit()
    if is_new_user:
        await invalidate_tags("users")
    else:
        await invalidate_tags(f"user:{user.id}")
    session.refresh(user)

    _set_auth_cookies(response, user.id)
    return {"message": "Email verified", "user_id": user.id}


# KVIS email verification (for logged-in Google users)
@router.post("/kvis/verify")
async def verify_kvis_email(
    body: KvisVerifyBody,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    kvis_email = str(body.kvis_email)
    if not kvis_email.endswith(f"@{KVIS_DOMAIN}"):
        raise HTTPException(400, detail="Must be a @kvis.ac.th email")

    record = _otp_store.get(kvis_email)
    if not record:
        raise HTTPException(400, detail="No OTP requested for this email")
    if datetime.now(timezone.utc) > record["expires_at"]:
        del _otp_store[kvis_email]
        raise HTTPException(400, detail="OTP has expired. Please request a new one.")
    if record["otp"] != body.otp:
        raise HTTPException(400, detail="Invalid OTP")

    del _otp_store[kvis_email]

    user = session.get(User, current_user.id)
    user.is_verified = True
    user.kvis_email = kvis_email
    session.add(user)
    session.commit()
    await invalidate_tags("users", f"user:{user.id}")

    return {"message": "KVIS email verified"}


# Google OAuth
@router.get("/google")
async def google_login(request: Request):
    redirect_uri = f"{request.base_url}api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, session: Session = Depends(get_session)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or await oauth.google.userinfo(token=token)

    google_id = userinfo["sub"]
    email = userinfo.get("email", "")

    user = session.exec(select(User).where(User.google_id == google_id)).first()
    if not user:
        user = session.exec(select(User).where(User.email == email)).first()
        is_new_user = user is None
        is_kvis = email.endswith(f"@{KVIS_DOMAIN}")
        if user:
            user.google_id = google_id
            user.email_verified = True
            if is_kvis and not user.is_verified:
                user.is_verified = True
                user.kvis_email = email
        else:
            name_parts = userinfo.get("name", "").split(" ", 1)
            slug = unique_user_slug(session, name_parts[0] if name_parts else "", name_parts[1] if len(name_parts) > 1 else "")
            user = User(
                email=email,
                google_id=google_id,
                first_name=name_parts[0] if name_parts else "",
                last_name=name_parts[1] if len(name_parts) > 1 else "",
                email_verified=True,
                is_verified=is_kvis,
                kvis_email=email if is_kvis else None,
                slug=slug,
            )
        session.add(user)
        session.commit()
        if is_new_user:
            await invalidate_tags("users")
        session.refresh(user)

    response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback")
    _set_auth_cookies(response, user.id)
    return response


# Password Reset
@router.post("/password-reset/request")
def password_reset_request(body: PasswordResetRequest, session: Session = Depends(get_session)):
    # Always return 200 to avoid leaking whether an email is registered
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not user.hashed_password:
        return {"message": "If that email is registered, a reset link has been sent."}

    # Invalidate any existing token for this email
    for t, data in list(_reset_store.items()):
        if data["email"] == body.email:
            del _reset_store[t]

    token = secrets.token_urlsafe(32)
    _reset_store[token] = {
        "email": body.email,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=RESET_TTL_MINUTES),
    }

    try:
        _send_reset_email(body.email, token)
    except Exception:
        del _reset_store[token]
        raise HTTPException(500, detail="Failed to send reset email. Check SMTP configuration.")

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/password-reset/confirm")
def password_reset_confirm(body: PasswordResetConfirm, session: Session = Depends(get_session)):
    record = _reset_store.get(body.token)
    if not record:
        raise HTTPException(400, detail="Invalid or expired reset token.")
    if datetime.now(timezone.utc) > record["expires_at"]:
        del _reset_store[body.token]
        raise HTTPException(400, detail="Reset link has expired. Please request a new one.")

    if len(body.new_password) < 6:
        raise HTTPException(400, detail="Password must be at least 6 characters.")

    user = session.exec(select(User).where(User.email == record["email"])).first()
    if not user:
        raise HTTPException(404, detail="User not found.")

    user.hashed_password = hash_password(body.new_password)
    session.add(user)
    session.commit()

    del _reset_store[body.token]
    return {"message": "Password updated successfully."}
