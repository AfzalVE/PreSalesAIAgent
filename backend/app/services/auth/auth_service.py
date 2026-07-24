from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_pending_token,
    decode_token,
    generate_otp,
    get_password_hash,
    verify_password,
)
from app.models.email_otp import EmailOTP
from app.models.enums import OTPPurpose, UserRole
from app.models.user import User
from app.schemas.auth_schema import (
    AuthResponse,
    LoginRequest,
    OTPRequiredResponse,
    OTPVerifyRequest,
    RegisterInitiatedResponse,
    RegisterRequest,
    RegisterVerifyRequest,
    ResendOTPRequest,
)
from app.utils.email_services import send_otp_email
from app.utils.otp_store import create_otp, verify_otp

OTP_EXPIRE_MINUTES = 5
MAX_OTP_ATTEMPTS = 5


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


# ----------------------------------------
# Legacy: initiate_login / verify_login_otp (OTP-based 2FA)
# ----------------------------------------

def initiate_login(db: Session, credentials: LoginRequest, allowed_roles: list[UserRole]) -> OTPRequiredResponse:
    """
    Step 1: Verify email/password + role, then generate and email an OTP.
    Returns a pending_token to be used in step 2 (verify_login_otp).
    """
    login_identifier = credentials.email.strip()
    is_phone = "@" not in login_identifier and any(c.isdigit() for c in login_identifier)

    if is_phone:
        actual_email = f"{login_identifier.replace(' ', '').replace('+', '')}@phone-auth.local"
        user = db.query(User).filter(
            (User.phone == login_identifier) | (User.email == actual_email)
        ).first()
    else:
        actual_email = login_identifier
        user = db.query(User).filter(User.email == actual_email).first()

    if not user:
        import uuid
        default_role = allowed_roles[0] if allowed_roles else UserRole.CLIENT

        if is_phone:
            default_name = credentials.full_name or f"User{str(uuid.uuid4())[:4]}"
        else:
            default_name = credentials.full_name or actual_email.split('@')[0].capitalize()

        user = User(
            id=uuid.uuid4(),
            email=actual_email,
            full_name=default_name,
            password_hash=get_password_hash(credentials.password),
            role=default_role,
            is_verified=True,
            is_verification_required=False,
            phone=credentials.phone or (login_identifier if is_phone else None),
            company_name=credentials.company_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to log in through this portal",
        )

    if user.is_verified:
        # User is verified - check password
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password",
            )
        # Directly generate access token, no OTP!
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
        return OTPRequiredResponse(
            otp_required=False,
            access_token=access_token,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role
        )
    else:
        # User is not verified - set the password from this request
        user.password_hash = get_password_hash(credentials.password)
        db.commit()

    otp_code = generate_otp()
    otp_record = EmailOTP(
        user_id=user.id,
        email=user.email,
        otp=otp_code,
        purpose=OTPPurpose.LOGIN,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(otp_record)
    db.commit()

    try:
        send_otp_email(user.email, otp_code)
    except Exception as e:
        print(f"[SMTP WARNING] Failed to send OTP email: {e}")
        print(f"[DEVELOPMENT ONLY] OTP code for {user.email} is: {otp_code}")

    pending_token = create_pending_token(str(user.id))
    return OTPRequiredResponse(
        otp_required=True,
        pending_token=pending_token,
        message="OTP sent to your registered email"
    )


def verify_login_otp(db: Session, payload: OTPVerifyRequest) -> AuthResponse:
    """
    Step 2: Verify the pending_token + OTP, then issue the real access token.
    """
    token_data = decode_token(payload.pending_token)
    if not token_data or token_data.get("stage") != "pending_otp":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session, please log in again",
        )

    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.user_id == user.id,
            EmailOTP.purpose == OTPPurpose.LOGIN,
            EmailOTP.is_verified.is_(False),
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP found, please log in again")

    if otp_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired, please log in again")

    if otp_record.attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts, please log in again")

    if otp_record.otp != payload.otp:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect OTP")

    otp_record.is_verified = True
    otp_record.verified_at = datetime.now(timezone.utc)

    # Mark user as verified upon successful OTP confirmation
    if not user.is_verified:
        user.is_verified = True

    db.commit()

    return _issue_auth_response(user)
