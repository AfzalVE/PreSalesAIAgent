from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth_schema import LoginRequest, LoginResponse


def authenticate_user(db: Session, credentials: LoginRequest, allowed_roles: list[UserRole]) -> LoginResponse:
    
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to log in through this portal",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )

    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
    )