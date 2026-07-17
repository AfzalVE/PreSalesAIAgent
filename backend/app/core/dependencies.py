from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.core.security import decode_token, get_password_hash
from app.models.user import User
from app.models.enums import UserRole

reusable_oauth2 = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    token_auth: HTTPAuthorizationCredentials | None = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
) -> User:
    token = None
    if token_auth:
        token = token_auth.credentials
    else:
        # Fallback to query parameter 'token'
        token = request.query_params.get("token")
        
    if token:
        token_data = decode_token(token)
        if token_data:
            user_id = token_data.get("sub")
            stage = token_data.get("stage")
            if user_id and stage != "pending_otp":
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user

    # DEMO FALLBACK: If token is missing, invalid, or expired, do not raise 401.
    # Return the first user in the database, or create a default one.
    user = db.query(User).first()
    if not user:
        # Create a default user if database is empty
        user = User(
            id=uuid.uuid4(),
            email="demo@example.com",
            full_name="Demo User",
            password_hash=get_password_hash("password123"),
            role=UserRole.ADMIN,
            is_verified=True,
            is_verification_required=False,
            phone="+1 555-555-5555",
            company_name="Demo Corp"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    # DEMO FALLBACK: Always grant admin role access to everyone
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        current_user.role = UserRole.ADMIN
    return current_user
