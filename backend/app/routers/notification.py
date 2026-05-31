import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.auth import get_current_user
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def get_notifications(
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    notifs = session.exec(
        select(Notification)
        .where(Notification.user_id == me.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    ).all()
    return notifs


@router.get("/unread-count")
def unread_count(
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    notifs = session.exec(
        select(Notification)
        .where(Notification.user_id == me.id)
        .where(Notification.is_read == False)
    ).all()
    return {"count": len(notifs)}


@router.patch("/{notif_id}/read")
def mark_read(
    notif_id: uuid.UUID,
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    notif = session.get(Notification, notif_id)
    if notif and notif.user_id == me.id:
        notif.is_read = True
        session.commit()
    return {"ok": True}


@router.patch("/read-all")
def mark_all_read(
    session: Session = Depends(get_session),
    me: User = Depends(get_current_user),
):
    notifs = session.exec(
        select(Notification)
        .where(Notification.user_id == me.id)
        .where(Notification.is_read == False)
    ).all()
    for n in notifs:
        n.is_read = True
    session.commit()
    return {"ok": True}