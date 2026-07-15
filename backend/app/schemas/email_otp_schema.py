from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import OTPPurpose


class EmailOTPBase(BaseModel):
    email: EmailStr
    purpose: OTPPurpose


class EmailOTPCreate(EmailOTPBase):
    user_id: UUID
    otp: str
    expires_at: datetime


class EmailOTPUpdate(BaseModel):
    is_verified: bool | None = None
    attempts: int | None = None
    verified_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class EmailOTPResponse(EmailOTPBase):
    id: UUID
    user_id: UUID
    is_verified: bool
    attempts: int
    is_verification_required: bool
    expires_at: datetime
    created_at: datetime
    verified_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)