from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire, "refresh": True}, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None
