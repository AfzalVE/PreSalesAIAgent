import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from app.models.proposal_request import ProposalRequest, ProposalRequestStatus, CommunicationType
from app.models.ai_conversation import AIConversation
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.proposal_request_schema import ProposalRequestCreate, ProposalRequestUpdate, ProposalRequestResponse

from app.core.dependencies import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", summary="List all proposal requests with details")
async def list_proposal_requests(
    user_email: str | None = None,
    user_id: str | None = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    query = db.query(ProposalRequest).options(
        joinedload(ProposalRequest.proposals),
        joinedload(ProposalRequest.conversations),
        joinedload(ProposalRequest.client)
    )

    if user_email:
        query = query.join(User, ProposalRequest.client_id == User.id).filter(
            func.lower(User.email) == func.lower(user_email.strip())
        )
    elif user_id:
        try:
            uid = uuid.UUID(user_id)
            query = query.filter(ProposalRequest.client_id == uid)
        except ValueError:
            pass

    requests = query.order_by(ProposalRequest.created_at.desc()).all()
    
    result = []
    for req in requests:
        c_email = getattr(req.client, "email", "") or "" if hasattr(req, "client") and req.client else ""
        c_name = getattr(req.client, "full_name", "") or "" if hasattr(req, "client") and req.client else ""
        result.append({
            "id": str(req.id),
            "client_id": str(req.client_id),
            "client_email": c_email.lower(),
            "client_name": c_name,
            "project_name": req.project_name,
            "project_description": req.project_description,
            "business_domain": req.business_domain,
            "preferred_technology": req.preferred_technology or [],
            "budget": float(req.budget or 0),
            "timeline": req.timeline,
            "communication_type": req.communication_type.value if hasattr(req.communication_type, 'value') else str(req.communication_type),
            "status": req.status.value if hasattr(req.status, 'value') else str(req.status),
            "created_at": req.created_at.isoformat() if req.created_at else "",
            "extracted_json": req.extracted_json or {},
            "proposals_count": len(req.proposals) if req.proposals else 0,
            "conversations_count": len(req.conversations) if req.conversations else 0
        })
    return result

@router.get("/{request_id}", summary="Get proposal request by ID")
async def get_proposal_request(request_id: str, db: Session = Depends(get_db)):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
        
    req = db.query(ProposalRequest).options(
        joinedload(ProposalRequest.proposals),
        joinedload(ProposalRequest.conversations)
    ).filter(ProposalRequest.id == req_uuid).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Proposal Request not found")
        
    return {
        "id": str(req.id),
        "client_id": str(req.client_id),
        "project_name": req.project_name,
        "project_description": req.project_description,
        "business_domain": req.business_domain,
        "preferred_technology": req.preferred_technology or [],
        "budget": float(req.budget or 0),
        "timeline": req.timeline,
        "communication_type": req.communication_type.value if hasattr(req.communication_type, 'value') else str(req.communication_type),
        "status": req.status.value if hasattr(req.status, 'value') else str(req.status),
        "created_at": req.created_at.isoformat() if req.created_at else "",
        "extracted_json": req.extracted_json or {},
        "proposals": [
            {
                "id": str(p.id),
                "title": p.title,
                "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
                "budget_estimate": float(p.budget_estimate or 0),
                "timeline_estimate": p.timeline_estimate
            } for p in req.proposals
        ] if req.proposals else [],
        "conversations": [
            {
                "id": str(c.id),
                "sender": c.sender.value if hasattr(c.sender, 'value') else str(c.sender),
                "message": c.message,
                "message_type": c.message_type.value if hasattr(c.message_type, 'value') else str(c.message_type),
                "created_at": c.created_at.isoformat() if c.created_at else ""
            } for c in sorted(req.conversations, key=lambda x: x.created_at if x.created_at else "")
        ] if req.conversations else []
    }

@router.post("", summary="Create a new proposal request")
async def create_proposal_request(payload: dict, db: Session = Depends(get_db)):
    client_id = None
    user_email = payload.get("user_email") or payload.get("client_email")
    user_id = payload.get("user_id") or payload.get("client_id")
    
    if user_id:
        try:
            uid = uuid.UUID(str(user_id))
            user_by_id = db.query(User).filter(User.id == uid).first()
            if user_by_id:
                client_id = user_by_id.id
        except ValueError:
            pass
            
    if not client_id and user_email:
        from sqlalchemy import func
        user_by_email = db.query(User).filter(func.lower(User.email) == func.lower(str(user_email).strip())).first()
        if user_by_email:
            client_id = user_by_email.id
            
    if not client_id:
        client_user = db.query(User).filter(User.role == UserRole.CLIENT).first()
        if not client_user:
            client_user = db.query(User).first()
        client_id = client_user.id if client_user else uuid.UUID("aec18ec4-9350-4d57-91a6-0adffa952774")
    
    tech_list = payload.get("preferred_technology", [])
    if isinstance(tech_list, str):
        tech_list = [t.strip() for t in tech_list.split(",") if t.strip()]
        
    new_req = ProposalRequest(
        client_id=client_id,
        project_name=payload.get("project_name", "New Project Request"),
        project_description=payload.get("project_description", "Project scope under evaluation"),
        business_domain=payload.get("business_domain", "Enterprise"),
        preferred_technology=tech_list,
        budget=float(payload.get("budget", 50000)),
        timeline=payload.get("timeline", "12 Weeks"),
        communication_type=CommunicationType.FORM,
        status=ProposalRequestStatus.DRAFT,
        extracted_json={
            "project_name": payload.get("project_name", "New Project Request"),
            "client_budget": float(payload.get("budget", 50000)),
            "timeline_weeks": payload.get("timeline", "12 Weeks"),
            "preferred_technology": tech_list
        }
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    return {
        "id": str(new_req.id),
        "project_name": new_req.project_name,
        "business_domain": new_req.business_domain,
        "budget": float(new_req.budget),
        "timeline": new_req.timeline,
        "status": new_req.status.value if hasattr(new_req.status, 'value') else str(new_req.status)
    }

@router.delete("/{request_id}", summary="Delete proposal request by ID")
async def delete_proposal_request(request_id: str, db: Session = Depends(get_db)):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
        
    req = db.query(ProposalRequest).filter(ProposalRequest.id == req_uuid).first()
    if not req:
        raise HTTPException(status_code=404, detail="Proposal Request not found")
        
    db.delete(req)
    db.commit()
    return {"status": "success", "message": "Proposal request deleted successfully"}

@router.get("/{request_id}/conversations", summary="Get chat history for a proposal request")
async def get_request_conversations(request_id: str, db: Session = Depends(get_db)):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
        
    convos = db.query(AIConversation).filter(AIConversation.request_id == req_uuid).order_by(AIConversation.created_at.asc()).all()
    
    result = []
    for c in convos:
        result.append({
            "id": str(c.id),
            "sender": c.sender.value.lower() if hasattr(c.sender, 'value') else str(c.sender).lower(),
            "text": c.message,
            "created_at": c.created_at.isoformat() if c.created_at else ""
        })
    return result
