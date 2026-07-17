from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

from app.models.enums import UserRole

reusable_oauth2 = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    token_auth: HTTPAuthorizationCredentials | None = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = None
    if token_auth:
        token = token_auth.credentials
    else:
        # Fallback to query parameter 'token'
        token = request.query_params.get("token")
        
    if not token:
        raise credentials_exception
        
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
        
    user_id = token_data.get("sub")
    stage = token_data.get("stage")
    
    # Ensure this isn't a temporary pending_otp stage token
    if user_id is None or stage == "pending_otp":
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    # Check if user role is ADMIN or MANAGER, or if user is superadmin by email
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.MANAGER]
    is_superadmin_email = "superadmin" in current_user.email.lower()
    
    if not (is_admin or is_superadmin_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return current_user
