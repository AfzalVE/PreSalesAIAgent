from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import UserRole
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import authenticate_user

router = APIRouter()


@router.post("/admin-login", response_model=LoginResponse)
async def admin_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login for Admins and Managers.
    """
    return authenticate_user(db, credentials, allowed_roles=[UserRole.ADMIN, UserRole.MANAGER])


@router.post("/user-login", response_model=LoginResponse)
async def user_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login for Clients (regular users).
    """
    return authenticate_user(db, credentials, allowed_roles=[UserRole.CLIENT])