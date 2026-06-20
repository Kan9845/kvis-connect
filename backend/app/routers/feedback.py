import threading
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import get_current_user, get_optional_user
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/feedback", tags=["feedback"])

ADMIN_SLUGS = {
    "surapa-panjaphakdee",
    "chayada-pakpoomkamonlert",
    "naruesorn-prabpon",
    "popsuk-sumetchoengprachya",
}

TYPE_COLORS = {
    "bug": 0xE53E3E,
    "feature": 0x805AD5,
    "suggestion": 0x38A169,
    "kind_words": 0x3182CE,
}

GITHUB_LABELS = {
    "bug": ["bug"],
    "feature": ["enhancement"],
    "suggestion": ["enhancement"],
}

def _notify_github(fb: Feedback, submitter_name: str | None) -> None:
    if not settings.GITHUB_TOKEN or fb.type == "kind_words":
        return
    def _send():
        try:
            title = fb.message.splitlines()[0][:72] or fb.type.replace("_", " ").title()
            body_parts = [fb.message]
            if submitter_name:
                body_parts.append(f"\n- Submitted by: {submitter_name}")
            if fb.contact_email:
                body_parts.append(f"- Contact: {fb.contact_email}")
            httpx.post(
                f"https://api.github.com/repos/{settings.GITHUB_REPO}/issues",
                headers={"Authorization": f"Bearer {settings.GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
                json={"title": title, "body": "\n".join(body_parts), "labels": GITHUB_LABELS.get(fb.type, [])},
                timeout=5,
            )
        except Exception:
            pass
    threading.Thread(target=_send, daemon=True).start()


def _notify_discord(fb: Feedback, submitter_name: str | None) -> None:
    if not settings.DISCORD_FEEDBACK_WEBHOOK:
        return
    def _send():
        try:
            color = TYPE_COLORS.get(fb.type, 0x718096)
            label = fb.type.replace("_", " ").title()
            fields = [{"name": "Category", "value": label, "inline": True}]
            if submitter_name:
                fields.append({"name": "From", "value": submitter_name, "inline": True})
            if fb.contact_email:
                fields.append({"name": "Reply to", "value": fb.contact_email, "inline": True})
            httpx.post(settings.DISCORD_FEEDBACK_WEBHOOK, json={
                "embeds": [{
                    "title": "New Feedback",
                    "description": fb.message,
                    "color": color,
                    "fields": fields,
                }]
            }, timeout=5)
        except Exception:
            pass
    threading.Thread(target=_send, daemon=True).start()


@router.post("", response_model=FeedbackRead, status_code=201)
def submit_feedback(
    body: FeedbackCreate,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
):
    fb = Feedback(
        type=body.type,
        message=body.message,
        contact_email=body.contact_email,
        user_id=current_user.id if current_user else None,
    )
    session.add(fb)
    session.commit()
    session.refresh(fb)

    name = f"{current_user.first_name} {current_user.last_name}".strip() if current_user else None
    _notify_discord(fb, name)
    _notify_github(fb, name)

    return fb


@router.get("", response_model=list[FeedbackRead])
def list_feedback(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.slug not in ADMIN_SLUGS:
        raise HTTPException(status_code=403, detail="Forbidden")
    return session.exec(select(Feedback).order_by(Feedback.created_at.desc())).all()