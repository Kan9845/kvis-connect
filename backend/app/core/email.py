import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str):
    """
    Send a plain-text email via SMTP.
    Requires these env vars:
      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
    """
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning("Email not configured — skipping send to %s", to)
        return

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587)) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        raise