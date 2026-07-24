from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole
from app.models.enums import UserStatus


# ----------------------------------------
# Request Access
# ----------------------------------------

class AdminRequestCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    company_name: str | None = None
    phone: str | None = None
    role: UserRole


# ----------------------------------------
# Common Success Response
# ----------------------------------------

class AdminRequestResponse(BaseModel):
    message: str = "Admin access request submitted successfully. Waiting for SuperAdmin approval."


# ----------------------------------------
# Pending Request Response
# ----------------------------------------

class PendingAdminRequest(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    company_name: str | None = None
    phone: str | None = None
    role: UserRole
    status: UserStatus

    class Config:
        from_attributes = True


# ----------------------------------------
# Approve / Reject Response
# ----------------------------------------

class MessageResponse(BaseModel):
    message: str


# ----------------------------------------
# Admin/Manager Login
# ----------------------------------------
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    full_name: str