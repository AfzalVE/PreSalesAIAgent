from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.schemas.ai_agent_schema import AgentTextInput, AgentExtractionResponse, NegotiationInput, NegotiationResponse
from app.services.ai.ai_agent_service import extract_proposal_requirements, negotiate_proposal
import uuid
from app.services.resource import match_resources_from_db_request
from app.services.proposal.proposal_generation_service import generate_proposals_for_request
from app.models.proposal_request import ProposalRequest

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/extract-requirements", response_model=AgentExtractionResponse)
async def extract_requirements(input_data: AgentTextInput, db: Session = Depends(get_db)):
    """
    Extracts proposal requirements from unstructured text using the AI Agent.
    If some information is missing, the agent will suggest values and provide a follow-up message.
    """
    try:
        extracted_data = await extract_proposal_requirements(input_data, db) 
        
        if extracted_data.ready_for_match and not extracted_data.ready_for_proposal_generation and extracted_data.request_id:
            # 1. Execute Resource Match
            match_response = match_resources_from_db_request(extracted_data.request_id)
            
            # Format match summary into the chat message
            mvp_cost = match_response.get("mvp", {}).get("total_project_cost", "N/A")
            full_cost = match_response.get("full_project", {}).get("total_project_cost", "N/A")
            timeline = match_response.get("mvp", {}).get("timeline_weeks", "N/A")
            match_summary = f"\n\n**Estimation Complete!**\n- MVP Budget: ${mvp_cost}\n- Full Product Budget: ${full_cost}\n- Timeline: {timeline} Weeks\n\nWould you like me to generate the proposal based on these estimates?"
            extracted_data.follow_up_message += match_summary
            
            # Save the match data to the database so the LLM has context in the next turn
            proposal_request = db.query(ProposalRequest).filter(ProposalRequest.id == uuid.UUID(extracted_data.request_id)).first()
            if proposal_request:
                updated_json = proposal_request.extracted_json.copy() if proposal_request.extracted_json else {}
                updated_json["match_data"] = match_response
                proposal_request.extracted_json = updated_json
                
                # Also save the AI's follow-up message about the match results so it's in the chat context
                from app.models.ai_conversation import AIConversation, SenderType, MessageType
                ai_convo = AIConversation(
                    request_id=proposal_request.id,
                    sender=SenderType.AI,
                    message=extracted_data.follow_up_message,
                    message_type=MessageType.TEXT
                )
                db.add(ai_convo)
                db.commit()

        elif extracted_data.ready_for_proposal_generation and extracted_data.request_id:
            proposal_request = db.query(ProposalRequest).filter(ProposalRequest.id == uuid.UUID(extracted_data.request_id)).first()
            client_id = proposal_request.client_id if proposal_request else uuid.UUID("aec18ec4-9350-4d57-91a6-0adffa952774")
            
            match_response = proposal_request.extracted_json.get("match_data") if proposal_request and proposal_request.extracted_json else None
            if not match_response:
                match_response = match_resources_from_db_request(extracted_data.request_id)
            
            # 3. Generate Proposal (handles budget validation internally)
            proposals = await generate_proposals_for_request(
                db=db, 
                client_id=client_id, 
                proposal_input=match_response, 
                existing_request_id=uuid.UUID(extracted_data.request_id)
            )
            
            # 4. Attach to response
            extracted_data.proposal_data = proposals

        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract requirements: {str(e)}")

@router.post("/negotiate", response_model=NegotiationResponse)
async def negotiate(input_data: NegotiationInput):
    """
    Negotiates proposal parameters using the AI Agent.
    """
    try:
        negotiation_data = await negotiate_proposal(input_data)
        return negotiation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to negotiate: {str(e)}")

