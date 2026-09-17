from app.core.database import engine
from app.core.mailer import send_notification
from app.models.user import User
from sqlmodel import Session, select

EMAIL = "naruesorn_p@kvis.ac.th"

with Session(engine) as session:
    user = session.exec(select(User).where(User.email == EMAIL)).first()
    if not user:
        print("user not found")
    else:
        send_notification(
            session,
            user,
            type="test",
            title="Test notification",
            body="This is a test notification.",
            
            
            
            link="/profile/edit",
        )
        session.commit()
        print("notification created and email sent")
