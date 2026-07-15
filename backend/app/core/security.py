import random
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PENDING_TOKEN_EXPIRE_MINUTES = 10


def generate_otp(length: int = 6) -> str:
    """Generates a numeric OTP"""
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_pending_token(user_id: str) -> str:
    """
    Short-lived token issued after password check passes, before OTP is verified.
    Scoped with 'stage': 'pending_otp' so it cannot be used as a real access token.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=PENDING_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "stage": "pending_otp", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None