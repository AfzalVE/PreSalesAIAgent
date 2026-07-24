from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.schemas.admin_request_schema import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminRequestCreate,
    MessageResponse,
)
from app.utils.email_services import send_admin_request_status_email
from app.core.security import (
    verify_password,
    create_access_token,
)

# -------------------------------------------------------
# Request Admin / Manager Access
# -------------------------------------------------------

def request_admin_access(
    db: Session,
    payload: AdminRequestCreate,
) -> MessageResponse:

    existing_user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists.",
        )

    if payload.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ADMIN or MANAGER roles can request access.",
        )

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        status=UserStatus.INACTIVE,
        is_verified=False,
        is_verification_required=False,
    )

    db.add(new_user)
    db.commit()

    return MessageResponse(
        message="Admin access request submitted successfully. Waiting for SuperAdmin approval."
    )


# -------------------------------------------------------
# Get Pending Requests
# -------------------------------------------------------

def get_pending_requests(db: Session):

    return (
        db.query(User)
        .filter(
            User.is_verified == False,
            User.role.in_([UserRole.ADMIN, UserRole.MANAGER]),
        )
        .all()
    )


# -------------------------------------------------------
# Approve Request
# -------------------------------------------------------

def approve_request(
    db: Session,
    user_id: UUID,
) -> MessageResponse:

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user does not require admin approval.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already approved.",
        )

    user.status = UserStatus.ACTIVE
    user.is_verified = True

    db.commit()
    db.refresh(user)

    send_admin_request_status_email(
        to_email=user.email,
        full_name=user.full_name,
        is_approved=True,
    )

    return MessageResponse(
        message="Request approved successfully."
    )


# -------------------------------------------------------
# Reject Request
# -------------------------------------------------------

def reject_request(
    db: Session,
    user_id: UUID,
) -> MessageResponse:

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user does not require admin approval.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approved users cannot be rejected.",
        )

    email = user.email
    full_name = user.full_name

    db.delete(user)
    db.commit()

    send_admin_request_status_email(
        to_email=email,
        full_name=full_name,
        is_approved=False,
    )

    return MessageResponse(
        message="Request rejected successfully."
    )

from app.core.security import (
    verify_password,
    create_access_token,
)

# -------------------------------------------------------
# Admin/Manager Login
# -------------------------------------------------------
def admin_login(
    db: Session,
    payload: AdminLoginRequest,
) -> AdminLoginResponse:

    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    # User not found
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid email or password.",
        )

    # Only ADMIN / MANAGER can login here
    if user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not authorized for admin login.",
        )

    # Password check
    if not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # SuperAdmin approval check
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your admin request is still pending SuperAdmin approval.",
        )

    # Account active check
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value,
        }
    )

    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        full_name=user.full_name,
    )