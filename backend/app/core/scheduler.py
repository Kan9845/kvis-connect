import logging
from datetime import date
from sqlmodel import Session, select

from app.core.database import engine
from app.core.email import send_email
from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger(__name__)

# K1 graduated 2018, so kvis_year = grad_year - 2017
KVIS_FIRST_GRAD_YEAR = 2017


def promote_students():
    """
    Run every May 1st (Bangkok time).
    - M.6 (grade 12) → alumni: clear current_grade, assign kvis_year
    - M.5 (grade 11) → M.6: increment current_grade
    - M.4 (grade 10) → M.5: increment current_grade
    Also sends congratulation emails + in-app notifications to newly graduated alumni.
    """
    grad_year = date.today().year
    new_kvis_year = grad_year - KVIS_FIRST_GRAD_YEAR

    with Session(engine) as session:
        students = session.exec(
            select(User).where(User.current_grade != None)
        ).all()

        newly_graduated = []

        for u in students:
            if u.current_grade == 12:
                u.current_grade = None
                u.kvis_year = new_kvis_year
                newly_graduated.append(u)
            elif u.current_grade in (10, 11):
                u.current_grade += 1

        session.commit()

        # Notify newly graduated alumni
        for u in newly_graduated:
            notif = Notification(
                user_id=u.id,
                type="graduated",
                title=f"Welcome to the K{new_kvis_year} alumni network!",
                body=f"You've been moved to the K{new_kvis_year} alumni cohort. Update your profile with your next steps.",
                link="/profile/edit",
            )
            session.add(notif)

            try:
                send_email(
                    to=u.email,
                    subject=f"Welcome to KVIS Connect alumni — K{new_kvis_year}!",
                    body=f"""Hi {u.first_name},

Congratulations on graduating from KVIS! You're now part of the K{new_kvis_year} alumni cohort on KVIS Connect.

Update your profile with your university plans or first job so your fellow Kvisians can follow your journey:

👉 https://kvisconnect.com/profile/edit

Welcome to the network.

— KVIS Connect
""",
                )
            except Exception as e:
                logger.warning(f"Failed to send graduation email to {u.email}: {e}")

        session.commit()

        logger.info(
            f"Graduation run complete: {len(newly_graduated)} graduated as K{new_kvis_year}, "
            f"{len(students) - len(newly_graduated)} promoted."
        )


def notify_expected_graduates():
    """
    Run every May 1st — notify alumni (not current students) whose
    expected_grad_year matches this year. Acknowledges they may not
    have graduated (exchange, gap year, extended program, etc).
    """
    this_year = date.today().year

    with Session(engine) as session:
        users = session.exec(
            select(User)
            .where(User.expected_grad_year == this_year)
            .where(User.current_grade == None)  # exclude current KVIS students
        ).all()

        for u in users:
            notif = Notification(
                user_id=u.id,
                type="profile_update_reminder",
                title="Time to update your profile",
                body=f"You set {this_year} as your expected graduation year. Let us know what's next — or update if your plans changed.",
                link="/profile/edit",
            )
            session.add(notif)

            try:
                send_email(
                    to=u.email,
                    subject="KVIS Connect — How did your year go?",
                    body=f"""Hi {u.first_name},

You set {this_year} as your expected graduation year on KVIS Connect.

Whether you graduated, are on exchange, took a gap year, or extended your program — we'd love to keep your profile up to date so other Kvisians can find you.

👉 Update your profile: https://kvisconnect.com/profile/edit

- If you graduated: add your next university or job.
- If not: just update your expected graduation year and we'll check in again next year.

— KVIS Connect
""",
                )
            except Exception as e:
                logger.warning(f"Failed to send reminder email to {u.email}: {e}")

        session.commit()
        logger.info(f"Notified {len(users)} users for expected graduation year {this_year}")