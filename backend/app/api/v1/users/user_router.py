from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User
from app.models.enums import UserRole, UserStatus
from app.models.proposal_request import ProposalRequest

router = APIRouter()


# ------------------------------------------------------------------
# Database Dependency
# ------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------------------------------------------
# Request Models
# ------------------------------------------------------------------
class ToggleStatusPayload(BaseModel):
    status: Optional[str] = None


# ------------------------------------------------------------------
# Get All Registered Clients (Users Catalog)
# ------------------------------------------------------------------
@router.get("", summary="List all registered client workspaces")
async def get_all_users(
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:

    users = (
        db.query(User)
        .filter(User.role == UserRole.CLIENT)
        .order_by(User.full_name.asc())
        .all()
    )

    result = []

    for usr in users:

        proposal_history = (
            db.query(ProposalRequest)
            .filter(ProposalRequest.client_id == usr.id)
            .all()
        )

        history = [
            proposal.project_name
            for proposal in proposal_history
            if proposal.project_name
        ]

        result.append(
            {
                "id": str(usr.id),
                "name": usr.full_name,
                "email": usr.email,
                "role": usr.role.value.capitalize(),
                "company": usr.company_name
                if usr.company_name
                else "Individual Workspace",
                "status": (
                    "Active"
                    if usr.status == UserStatus.ACTIVE
                    else "Deactivated"
                ),
                "verificationStatus": (
                    "Verified"
                    if usr.is_verified
                    else "Pending"
                ),
                "proposalHistory": history,
            }
        )

    return result


# ------------------------------------------------------------------
# Activate / Deactivate User
# ------------------------------------------------------------------
@router.put("/{email}/toggle-status", summary="Toggle user active status")
async def toggle_user_status(
    email: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.status == UserStatus.ACTIVE:
        user.status = UserStatus.INACTIVE
        new_status = "Deactivated"
    else:
        user.status = UserStatus.ACTIVE
        new_status = "Active"

    db.commit()

    return {
        "status": "success",
        "newStatus": new_status,
    }


# ------------------------------------------------------------------
# Verify User Workspace
# ------------------------------------------------------------------
@router.put("/{email}/verify", summary="Verify user workspace manually")
async def verify_user(
    email: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()

    return {
        "status": "success",
        "verificationStatus": "Verified",
    }