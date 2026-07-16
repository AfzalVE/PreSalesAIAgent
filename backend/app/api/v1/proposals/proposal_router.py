import os
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.models.proposal import Proposal, ProposalStatus, ProposalType
from app.models.proposal_request import ProposalRequest
from app.models.final_proposal import FinalProposal
from app.schemas.proposal_schema import ProposalResponse, ProposalSelection
from app.services.proposal.proposal_generation_service import generate_proposals_for_request
from app.services.proposal.proposal_generation_service import create_proposal_document

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GenerateDemoRequest(BaseModel):
    project_name: Optional[str] = Field(None, description="Project Name")
    project_description: Optional[str] = Field(None, description="Description")
    business_domain: Optional[str] = Field(None, description="Business Domain")
    preferred_technology: Optional[List[str]] = Field(default_factory=list, description="Technologies")
    budget: Optional[float] = Field(None, description="Budget Goals")
    timeline: Optional[str] = Field(None, description="Timeline Expectation")

from app.services.proposals.proposal_service import get_all_proposals_service, get_proposal_by_id_service

@router.get("", summary="List all proposals for Proposals Console")
@router.get("/all", summary="List all proposals for Proposals Console")
async def get_all_proposals(
    user_email: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    return get_all_proposals_service(db, user_email=user_email, user_id=user_id)

@router.get("/{proposal_id}", summary="Get a single proposal by ID with full details")
async def get_proposal(proposal_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    res = get_proposal_by_id_service(db, proposal_id)
    if not res:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return res

@router.get("/{proposal_id}/export", summary="Export a proposal as a document")
async def export_proposal(proposal_id: str, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse
    res = get_proposal_by_id_service(db, proposal_id)
    if not res:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    output_filepath = os.path.join(os.getcwd(), f"{proposal_id}.docx")
    
    # Check if docx already exists, if not generate it
    if not os.path.exists(output_filepath):
        create_proposal_document(
            project_name=res["project_name"],
            project_description=res["scope"],
            requirements=res["assumptions"] + res["risks"],
            preferred_technology=res["tech_stack"],
            estimated_budget=res["estimated_cost"],
            estimated_duration=res["estimated_duration"],
            proposal_type=res["proposal_type"],
            resources=res["selected_resources"],
            tech_stack=res["tech_stack"],
            output_filepath=output_filepath
        )
        
    return FileResponse(
        path=output_filepath, 
        filename=f"{res['project_name']}_Proposal.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@router.post("/generate-demo", summary="Generate MVP and Full Proposals")
async def generate_demo_proposals(
    payload: GenerateDemoRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generates two proposal options (MVP and Full Product) using AI.
    Infers missing fields if any data is not present.
    """
    client_user = db.query(User).filter(User.role == UserRole.CLIENT).first()
    if not client_user:
        client_user = db.query(User).first()
    
    if client_user:
        client_id = client_user.id
    else:
        # Static UUID fallback if database is empty
        client_id = uuid.UUID("aec18ec4-9350-4d57-91a6-0adffa952774")

    print(f"Generating proposals for client_id: {client_id}")
    try:
        result = await generate_proposals_for_request(
            db=db,
            client_id=client_id,
            project_name=payload.project_name,
            project_description=payload.project_description,
            business_domain=payload.business_domain,
            preferred_technology=payload.preferred_technology,
            budget=payload.budget,
            timeline=payload.timeline
        )
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Proposal generation failed: {str(e)}"
        )

@router.post("/{proposal_id}/select", summary="Approve and finalize a proposal")
async def select_proposal(
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Approves the chosen proposal, rejects other options under the same request,
    creates the final proposal, generates the finalized Word document from the template,
    and returns details including the download path.
    """
    print(proposal_id)
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Proposal not found"
        )

    try:
        # Approve selected proposal
        proposal.status = ProposalStatus.APPROVED
        
        # Reject sibling proposals
        siblings = db.query(Proposal).filter(
            Proposal.request_id == proposal.request_id,
            Proposal.id != proposal_id
        ).all()
        for sib in siblings:
            sib.status = ProposalStatus.REJECTED

        # Create or update FinalProposal record
        final_proposal = db.query(FinalProposal).filter(FinalProposal.proposal_id == proposal_id).first()
        
        # Generate document file path
        static_dir = os.path.join("app", "static", "proposals")
        os.makedirs(static_dir, exist_ok=True)
        docx_filename = f"{proposal_id}.docx"
        output_filepath = os.path.join(static_dir, docx_filename)
        
        # Structure payload for docx generation
        request = proposal.proposal_request

        proposal_data = create_proposal_document(
            project_name=request.project_name,
            project_description=request.project_description,
            requirements=request.project_description,   # Replace with the correct field if you have one
            preferred_technology=request.preferred_technology,
            estimated_budget=float(proposal.estimated_cost),
            estimated_duration=proposal.estimated_duration,
            proposal_type=proposal.proposal_type.value,
            resources=proposal.selected_resources,
            tech_stack=proposal.tech_stack,
            output_filepath=output_filepath,
        )
                
        doc_url = f"/static/proposals/{docx_filename}"
        
        if not final_proposal:
            final_proposal = FinalProposal(
                id=uuid.uuid4(),
                proposal_id=proposal_id,
                final_cost=proposal.estimated_cost,
                final_timeline=proposal.estimated_duration,
                final_scope=proposal.scope,
                poc_url=doc_url,  # Save docx download link here
                pdf_url=doc_url   # Save docx download link here
            )
            db.add(final_proposal)
        else:
            final_proposal.final_cost = proposal.estimated_cost
            final_proposal.final_timeline = proposal.estimated_duration
            final_proposal.final_scope = proposal.scope
            final_proposal.poc_url = doc_url
            final_proposal.pdf_url = doc_url

        db.commit()
        
        return {
            "message": "Proposal approved successfully",
            "proposal_id": str(proposal.id),
            "proposal_type": proposal.proposal_type.value,
            "status": proposal.status.value,
            "estimated_cost": float(proposal.estimated_cost),
            "estimated_duration": proposal.estimated_duration,
            "scope": proposal.scope,
            "docx_url": doc_url
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Proposal selection failed: {str(e)}"
        )

from fastapi.responses import FileResponse
import os

@router.get("/{proposal_id}/download", summary="Download the finalized proposal document")
async def download_proposal_doc(proposal_id: str):
    print("DOWNLOAD ENDPOINT")
    """
    Returns the docx file for the given proposal_id with Content-Disposition attachment.
    """
    print(proposal_id)
    static_dir = os.path.join("app", "static", "proposals")
    filename = f"{proposal_id}.docx"
    file_path = os.path.join(static_dir, filename)
    print(file_path)
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path, 
            filename="Project_Proposal.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    raise HTTPException(status_code=404, detail="Document not found")
