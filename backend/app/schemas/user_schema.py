from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import UserRole, UserStatus


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.CLIENT
    company_name: str | None = None
    phone: str | None = None
    status: UserStatus = UserStatus.ACTIVE
    is_verification_required: bool = True
    is_verified: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    company_name: str | None = None
    phone: str | None = None
    status: UserStatus | None = None
    is_verified: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)