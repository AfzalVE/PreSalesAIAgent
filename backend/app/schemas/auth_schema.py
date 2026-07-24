from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


# ----------------------------------------
# Register
# ----------------------------------------

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    company_name: str | None = None
    phone: str | None = None
    password: str


class RegisterInitiatedResponse(BaseModel):
    message: str = "OTP sent to your email. Please verify to complete registration."


class RegisterVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


# ----------------------------------------
# Login
# ----------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginInitiatedResponse(BaseModel):
    message: str = "OTP sent to your email. Please verify to log in."


class LoginVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


# ----------------------------------------
# Resend OTP (shared by register + login)
# ----------------------------------------

class ResendOTPRequest(BaseModel):
    email: EmailStr


# ----------------------------------------
# Shared success response (both flows end here)
# ----------------------------------------

class AuthResponse(BaseModel):
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
    email: str | None = None
    role: UserRole | None = None


class OTPVerifyRequest(BaseModel):
    pending_token: str
    otp: str
