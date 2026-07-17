from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User
from app.models.enums import UserStatus
from app.models.proposal_request import ProposalRequest

from app.core.dependencies import get_current_active_admin

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ToggleStatusPayload(BaseModel):
    status: Optional[str] = None

@router.get("", summary="List all registered client/admin users for Users Catalog")
async def get_all_users(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    users = db.query(User).order_by(User.full_name).all()
    result = []
    for usr in users:
        # fetch proposal history
        reqs = db.query(ProposalRequest).filter(ProposalRequest.client_id == usr.id).all()
        history = [r.project_name for r in reqs if r.project_name]

        role_str = usr.role.value if hasattr(usr.role, 'value') else str(usr.role)
        status_str = "Active" if usr.status == UserStatus.ACTIVE else "Deactivated"
        verification_str = "Verified" if usr.is_verified else "Pending"

        result.append({
            "id": str(usr.id),
            "name": usr.full_name,
            "email": usr.email,
            "role": role_str.capitalize() if role_str else "Client",
            "company": usr.company_name or "Individual Workspace",
            "status": status_str,
            "verificationStatus": verification_str,
            "proposalHistory": history
        })
    return result

@router.put("/{email}/toggle-status", summary="Toggle user active status")
async def toggle_user_status(email: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
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
    return {"status": "success", "newStatus": new_status}

@router.put("/{email}/verify", summary="Verify user workspace manually")
async def verify_user(email: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()
    return {"status": "success", "verificationStatus": "Verified"}
