"""
DB-backed OTP store (uses the existing email_otp table, no new columns).

Survives server restarts and works across multiple workers/instances,
since all workers share the same Postgres database.

Postgres has no built-in "delete this row when expires_at passes" timer,
so expired rows are purged lazily: every call here first deletes any
rows in this table whose expires_at is already in the past. This keeps
the table clean without a cron job or Postgres extension.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_otp
from app.models.email_otp import EmailOTP
from app.models.enums import OTPPurpose
from app.models.user import User


def _purge_expired(db: Session) -> None:
    """Deletes every OTP row (any email, any purpose) whose expiry has passed."""
    db.query(EmailOTP).filter(EmailOTP.expires_at < datetime.now(timezone.utc)).delete(
        synchronize_session=False
    )
    db.commit()


def _get_active_otp(db: Session, email: str, purpose: OTPPurpose) -> EmailOTP | None:
    return (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email,
            EmailOTP.purpose == purpose,
            EmailOTP.is_verified.is_(False),
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )


def create_otp(db: Session, email: str, purpose: OTPPurpose) -> str:
    """
    Generates a fresh OTP row for this email + purpose.
    Any previous unverified OTP for the same email+purpose is removed first,
    so only one is ever active at a time.
    """
    _purge_expired(db)

    # A user row must exist first (FK is NOT NULL) — true for both register and login flows.
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise ValueError("User not found")

    existing = _get_active_otp(db, email, purpose)
    if existing is not None:
        db.delete(existing)
        db.flush()

    otp = generate_otp()
    otp_record = EmailOTP(
        user_id=user.id,
        email=email,
        otp=otp,
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(otp_record)
    db.commit()
    return otp


def verify_otp(db: Session, email: str, purpose: OTPPurpose, submitted_otp: str) -> tuple[bool, str | None]:
    """
    Checks the submitted OTP for this email + purpose.
    Returns (success, error_message). On success, marks the row verified so it can't be reused.
    On failure (wrong code), increments attempts but keeps the row so the user can retry.
    """
    _purge_expired(db)

    entry = _get_active_otp(db, email, purpose)

    if entry is None:
        return False, "No OTP found, please try again"

    if entry.attempts >= settings.MAX_OTP_ATTEMPTS:
        db.delete(entry)
        db.commit()
        return False, "Too many attempts, please try again"

    if entry.otp != submitted_otp:
        entry.attempts += 1
        db.commit()
        return False, "Incorrect OTP"

    entry.is_verified = True
    entry.verified_at = datetime.now(timezone.utc)
    db.commit()
    return True, None


def clear_otp(db: Session, email: str, purpose: OTPPurpose) -> None:
    entry = _get_active_otp(db, email, purpose)
    if entry is not None:
        db.delete(entry)
        db.commit()