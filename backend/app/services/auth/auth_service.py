from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_pending_token,
    decode_token,
    generate_otp,
    verify_password,
    get_password_hash,
)
from app.models.email_otp import EmailOTP
from app.models.enums import OTPPurpose, UserRole
from app.models.user import User
from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    OTPRequiredResponse,
    OTPVerifyRequest,
)
from app.services.auth.email_service import send_otp_email

OTP_EXPIRE_MINUTES = 5
MAX_OTP_ATTEMPTS = 5


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


def verify_login_otp(db: Session, payload: OTPVerifyRequest) -> LoginResponse:
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


    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
    )