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