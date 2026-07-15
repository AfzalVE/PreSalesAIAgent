from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    full_name: str
    email: EmailStr
    role: UserRole


class OTPRequiredResponse(BaseModel):
    """Returned after password check passes; OTP has been emailed."""
    pending_token: str
    message: str = "OTP sent to your registered email"


class OTPVerifyRequest(BaseModel):
    pending_token: str
    otp: str