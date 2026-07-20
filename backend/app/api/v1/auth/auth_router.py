from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import UserRole
from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    OTPRequiredResponse,
    OTPVerifyRequest,
)
from app.services.auth.auth_service import initiate_login, verify_login_otp
from app.core.dependencies import get_current_user
from app.schemas.user_schema import UserResponse, UserProfileUpdate, PasswordChangeRequest
from app.core.security import verify_password, get_password_hash
from app.models.user import User

router = APIRouter()


# ----------------------------------------
# Step 1: Password check -> sends OTP
# ----------------------------------------

@router.post("/admin-login", response_model=OTPRequiredResponse)
async def admin_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Step 1 for Admins/Managers: verify password, email OTP, return pending_token.
    """
    return initiate_login(db, credentials, allowed_roles=[UserRole.ADMIN, UserRole.MANAGER])


@router.post("/user-login", response_model=OTPRequiredResponse)
async def user_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Step 1 for Clients: verify password, email OTP, return pending_token.
    """
    return initiate_login(db, credentials, allowed_roles=[UserRole.CLIENT])


# ----------------------------------------
# Step 2: OTP verification -> issues access_token
# ----------------------------------------

@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Step 2 for both Admin and User: verify OTP against pending_token, return access_token.
    """
    return verify_login_otp(db, payload)


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