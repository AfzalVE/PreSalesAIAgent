from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.enums import OTPPurpose
from app.models.user import User
from app.schemas.auth_schema import (
    AuthResponse,
    LoginRequest,
    RegisterInitiatedResponse,
    RegisterRequest,
    RegisterVerifyRequest,
    ResendOTPRequest,
)
from app.utils.email_services import send_otp_email
from app.utils.otp_store import create_otp, verify_otp


def _issue_auth_response(user: User) -> AuthResponse:
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return AuthResponse(
        access_token=access_token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
    )


# ----------------------------------------
# Register: new user -> OTP -> verified -> let him enter
# ----------------------------------------

def register_user(db: Session, payload: RegisterRequest) -> RegisterInitiatedResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        # user = existing  # unverified retry: resend OTP on the same row
    else:
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            company_name=payload.company_name,
            phone=payload.phone,
            is_verified=False,
        )
        db.add(user)
        db.commit()

    otp = create_otp(db, payload.email, OTPPurpose.REGISTRATION)
    send_otp_email(payload.email, otp)
    return RegisterInitiatedResponse()


def verify_register_otp(db: Session, payload: RegisterVerifyRequest) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    success, error = verify_otp(db, payload.email, OTPPurpose.REGISTRATION, payload.otp)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    user.is_verified = True
    user.is_verification_required = False
    db.commit()

    return _issue_auth_response(user)


# ----------------------------------------
# Login: existing verified user -> straight in, no OTP
# ----------------------------------------

def login_user(db: Session, payload: LoginRequest) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please complete registration first.",
        )

    return _issue_auth_response(user)


# ----------------------------------------
# Resend OTP: registration flow only
# ----------------------------------------

def resend_otp(db: Session, payload: ResendOTPRequest) -> RegisterInitiatedResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp = create_otp(db, payload.email, OTPPurpose.REGISTRATION)
    send_otp_email(payload.email, otp)
    return RegisterInitiatedResponse(message="A new OTP has been sent to your email.")