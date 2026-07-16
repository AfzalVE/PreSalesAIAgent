from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    full_name: str
    email: EmailStr
    role: UserRole


class OTPRequiredResponse(BaseModel):
    """Returned after login initiation; holds either direct token or pending OTP token."""
    otp_required: bool = True
    pending_token: str | None = None
    message: str | None = None

    # Fields when otp_required is False
    access_token: str | None = None
    token_type: str | None = "bearer"
    user_id: UUID | None = None
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None


class OTPVerifyRequest(BaseModel):
    pending_token: str
    otp: str