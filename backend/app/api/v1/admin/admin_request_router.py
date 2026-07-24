from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.services.auth.admin_request_services import admin_login
from app.schemas.admin_request_schema import (
    AdminLoginRequest,
    AdminLoginResponse,
)

from app.schemas.admin_request_schema import (
    AdminRequestCreate,
    AdminRequestResponse,
    PendingAdminRequest,
    MessageResponse,
)

from app.services.auth.admin_request_services import (
    request_admin_access,
    get_pending_requests,
    approve_request,
    reject_request,
)

router = APIRouter()


# ----------------------------------------
# Request Admin / Manager Access
# ----------------------------------------

@router.post(
    "/request-access",
    response_model=AdminRequestResponse,
)
def request_access(
    payload: AdminRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Submit request for ADMIN / MANAGER access.
    """
    return request_admin_access(db, payload)


# ----------------------------------------
# View Pending Requests
# ----------------------------------------

@router.get(
    "/pending-requests",
    response_model=list[PendingAdminRequest],
)
def pending_requests(
    db: Session = Depends(get_db),
):
    """
    Returns all pending ADMIN / MANAGER requests.
    """
    return get_pending_requests(db)


# ----------------------------------------
# Approve Request
# ----------------------------------------

@router.put(
    "/approve/{user_id}",
    response_model=MessageResponse,
)
def approve(
    user_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Approve ADMIN / MANAGER request.
    """
    return approve_request(db, user_id)


# ----------------------------------------
# Reject Request
# ----------------------------------------

@router.delete(
    "/reject/{user_id}",
    response_model=MessageResponse,
)
def reject(
    user_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Reject ADMIN / MANAGER request.
    """
    return reject_request(db, user_id)

# ----------------------------------------
# Admin / Manager Login
# ----------------------------------------

@router.post(
    "/login",
    response_model=AdminLoginResponse,
)
def login(
    payload: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Login for ADMIN / MANAGER after SuperAdmin approval.
    """
    return admin_login(db, payload)