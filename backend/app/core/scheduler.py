import logging
from datetime import date
from sqlmodel import Session, select

from app.core.database import engine
from app.core.mailer import send_notification
from app.models.user import User

logger = logging.getLogger(__name__)

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
        students = session.exec(select(User).where(User.current_grade != None)).all()

        newly_graduated = []
        for u in students:
            if u.current_grade == 12:
                u.current_grade = None
                u.kvis_year = new_kvis_year
                newly_graduated.append(u)
            elif u.current_grade in (10, 11):
                u.current_grade += 1

        session.commit()

        for u in newly_graduated:
            send_notification(
                session,
                u,
                type="graduated",
                title=f"Welcome to the K{new_kvis_year} alumni network!",
                body=f"You've been moved to the K{new_kvis_year} alumni cohort. Update your profile with your next steps.",
                link="/profile/edit",
            )

        session.commit()
        logger.info(
            f"Graduation run complete: {len(newly_graduated)} graduated as K{new_kvis_year}, "
            f"{len(students) - len(newly_graduated)} promoted."
        )


def notify_expected_graduates():
    """
    Run every May 1st — notify alumni whose expected_grad_year matches this year.
    """
    this_year = date.today().year

    with Session(engine) as session:
        users = session.exec(
            select(User)
            .where(User.expected_grad_year == this_year)
            .where(User.current_grade == None)
        ).all()

        for u in users:
            send_notification(
                session,
                u,
                type="profile_update_reminder",
                title="Time to update your profile",
                body=f"You set {this_year} as your expected graduation year. Let us know what's next — or update if your plans changed.",
                link="/profile/edit",
            )

        session.commit()
        logger.info(f"Notified {len(users)} users for expected graduation year {this_year}")
