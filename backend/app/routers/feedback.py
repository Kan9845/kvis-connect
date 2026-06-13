from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_optional_user
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/feedback", tags=["feedback"])


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
    return fb
