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
            mvp_timeline = match_response.get("mvp", {}).get("timeline_weeks", "N/A")
            full_timeline = match_response.get("full_project", {}).get("timeline_weeks", "N/A")
            client_budget = match_response.get("client_budget")
            
            match_summary = f"\n\n**Estimation Complete!**\n- MVP Budget: ${mvp_cost}\n- Full Product Budget: ${full_cost}\n- MVP Timeline: {mvp_timeline} Weeks\n- Full Product Timeline: {full_timeline} Weeks\n"
            
            if client_budget is not None and mvp_cost != "N/A":
                if mvp_cost > client_budget:
                    match_summary += f"\n**Notice:** The estimated cost for the MVP (${mvp_cost}) exceeds your approved budget (${client_budget}). The project is not feasible within the current budget constraints.\n"
                elif full_cost != "N/A" and full_cost > client_budget:
                    match_summary += f"\n**Notice:** The estimated cost for the Full Product (${full_cost}) exceeds your approved budget (${client_budget}), although the MVP is feasible.\n"
                    
            match_summary += "\nWould you like me to generate the proposal based on these estimates?"
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
                
            # Inject context that might be missing from old match_data saved in DB
            if proposal_request and proposal_request.extracted_json:
                match_response["project_name"] = proposal_request.extracted_json.get("project_name", match_response.get("project_name"))
                match_response["business_domain"] = proposal_request.extracted_json.get("business_domain", match_response.get("business_domain"))
                match_response["project_description"] = proposal_request.extracted_json.get("project_description", match_response.get("project_description"))
                match_response["preferred_technology"] = proposal_request.extracted_json.get("preferred_technology", match_response.get("preferred_technology"))
                
                # Fix missing timeline in old MVP data
                extracted_timeline = proposal_request.extracted_json.get("mvp_timeline_weeks") or proposal_request.extracted_json.get("timeline_weeks")
                extracted_full_timeline = proposal_request.extracted_json.get("full_timeline_weeks") or proposal_request.extracted_json.get("timeline_weeks")
                if match_response.get("mvp") and not match_response["mvp"].get("timeline_weeks"):
                    match_response["mvp"]["timeline_weeks"] = extracted_timeline
                if match_response.get("full_project") and not match_response["full_project"].get("timeline_weeks"):
                    match_response["full_project"]["timeline_weeks"] = extracted_full_timeline
            
            # Merge match_response with the full extracted_json so AI has description, domain, etc.
            full_proposal_payload = proposal_request.extracted_json.copy() if proposal_request and proposal_request.extracted_json else {}
            full_proposal_payload.update(match_response)
            
            # 3. Generate Proposal (handles budget validation internally)
            proposals = await generate_proposals_for_request(
                db=db, 
                client_id=client_id, 
                proposal_input=full_proposal_payload, 
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

