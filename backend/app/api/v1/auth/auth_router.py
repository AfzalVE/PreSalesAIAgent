from fastapi import APIRouter, Depends
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
    Check if a user exists with the given email and if they are verified.
    """
    from app.models.user import User
    user = db.query(User).filter(User.email == email).first()
    return {
        "exists": user is not None,
        "is_verified": user.is_verified if user else False
    }