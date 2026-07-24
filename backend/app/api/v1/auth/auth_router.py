from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth_schema import (
    AuthResponse,
    LoginInitiatedResponse,
    LoginRequest,
    LoginVerifyRequest,
    RegisterInitiatedResponse,
    RegisterRequest,
    RegisterVerifyRequest,
    ResendOTPRequest,
)
from app.services.auth.auth_services import (
    login_user,
    register_user,
    resend_otp,
    verify_register_otp,
)
from app.services.auth.auth_service import initiate_login, verify_login_otp
from app.core.dependencies import get_current_user
from app.schemas.user_schema import UserResponse, UserProfileUpdate, PasswordChangeRequest
from app.core.security import verify_password, get_password_hash
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=RegisterInitiatedResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """New user -> creates unverified account, sends OTP."""
    return register_user(db, payload)


@router.post("/register/verify-otp", response_model=AuthResponse)
def verify_register(payload: RegisterVerifyRequest, db: Session = Depends(get_db)):
    """Verifies OTP -> marks account verified -> logs the user in."""
    return verify_register_otp(db, payload)


@router.post("/resend-otp", response_model=RegisterInitiatedResponse)
def resend(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    """Resends OTP for either register or login verification (60s cooldown)."""
    return resend_otp(db, payload)


@router.post("/login", response_model=LoginInitiatedResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Existing user -> checks password, sends OTP (2FA)."""
    return login_user(db, payload)


# @router.post("/login/verify-otp", response_model=AuthResponse)
# def verify_login(payload: LoginVerifyRequest, db: Session = Depends(get_db)):
#     """Verifies OTP -> logs the user in."""
#     return verify_login_otp(db, payload)


@router.get("/check-email")
async def check_email(email: str, db: Session = Depends(get_db)):
    """
    Check if a user exists with the given email/phone and if they are verified.
    """
    from app.models.user import User
    identifier = email.strip()
    is_phone = "@" not in identifier and any(c.isdigit() for c in identifier)

    if is_phone:
        actual_email = f"{identifier.replace(' ', '').replace('+', '')}@phone-auth.local"
        user = db.query(User).filter(
            (User.phone == identifier) | (User.email == actual_email)
        ).first()
    else:
        user = db.query(User).filter(User.email == identifier).first()

    return {
        "exists": user is not None,
        "is_verified": user.is_verified if user else False
    }

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.email is not None:
        existing = db.query(User).filter(User.email == update_data.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = update_data.email
    if update_data.phone is not None:
        current_user.phone = update_data.phone

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def update_my_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
