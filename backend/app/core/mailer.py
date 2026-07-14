import logging
import threading
import time
from typing import TYPE_CHECKING, Optional

import httpx

from app.core.config import settings

if TYPE_CHECKING:
    from sqlmodel import Session
    from app.models.user import User

logger = logging.getLogger(__name__)

_GRAPH_SCOPE = "https://graph.microsoft.com/.default"
_token_lock = threading.Lock()
_token_cache: dict[str, float | str] = {"access_token": "", "expires_at": 0.0}


class EmailDeliveryError(RuntimeError):
    """Email delivery failed without exposing provider or message details."""


def _get_graph_token() -> str:
    now = time.time()
    with _token_lock:
        if _token_cache["access_token"] and now < float(_token_cache["expires_at"]):
            return str(_token_cache["access_token"])

        url = f"https://login.microsoftonline.com/{settings.MS_TENANT_ID}/oauth2/v2.0/token"
        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "scope": _GRAPH_SCOPE,
            "grant_type": "client_credentials",
        }
        resp = httpx.post(url, data=data, timeout=15)
        resp.raise_for_status()
        payload = resp.json()

        token = payload["access_token"]
        # Refresh 60s before expiry to avoid edge-of-expiry failures.
        _token_cache["access_token"] = token
        _token_cache["expires_at"] = now + int(payload.get("expires_in", 3600)) - 60
        return token


def send_email(to_email: str, subject: str, text: str) -> None:
    if not all(
        (
            settings.MS_TENANT_ID,
            settings.MS_CLIENT_ID,
            settings.MS_CLIENT_SECRET,
            settings.MS_SENDER,
        )
    ):
        logger.error("Email delivery is unavailable because Microsoft Graph is not configured")
        raise EmailDeliveryError("Email delivery is not configured")

    try:
        token = _get_graph_token()
        url = f"https://graph.microsoft.com/v1.0/users/{settings.MS_SENDER}/sendMail"
        body = {
            "message": {
                "subject": subject,
                "body": {"contentType": "Text", "content": text},
                "toRecipients": [{"emailAddress": {"address": to_email}}],
            },
            "saveToSentItems": False,
        }
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=body,
            timeout=15,
        )
        resp.raise_for_status()
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        logger.error("Microsoft Graph email delivery failed")
        raise EmailDeliveryError("Email delivery failed") from None


def send_notification(
    session: "Session",
    user: "User",
    type: str,
    title: str,
    body: str,
    link: Optional[str] = None,
    send_email_notification: bool = False,
) -> None:
    from app.models.notification import Notification

    notif = Notification(user_id=user.id, type=type, title=title, body=body, link=link)
    session.add(notif)

    if send_email_notification:  # only send email if explicitly requested
        try:
            send_email(
                user.email,
                f"KVIS Connect - {title}",
                f"Hi {user.first_name},\n\n{body}\n\n"
                + (f"Open: {settings.FRONTEND_URL}{link}\n\n" if link else "")
                + "- KVIS Connect",
            )
        except EmailDeliveryError:
            logger.warning("Notification email delivery failed")
