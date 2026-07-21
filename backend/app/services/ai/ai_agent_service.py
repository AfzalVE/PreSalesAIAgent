import json
import uuid
from openai import AsyncOpenAI
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.schemas.ai_agent_schema import AgentTextInput, AgentExtractionResponse, NegotiationInput, NegotiationResponse
from app.models.user import User
from app.models.enums import UserRole
from app.models.proposal_request import ProposalRequest, CommunicationType
from app.models.ai_conversation import AIConversation, SenderType, MessageType

# Initialize the OpenAI client asynchronously
client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY
)

async def extract_proposal_requirements(input_data: AgentTextInput, db: Session) -> AgentExtractionResponse:
    """
    Calls the LangGraph workflow to parse unstructured text
    and extract the proposal requirements.
    """
    from app.services.ai.workflow.graph import app_graph
    from app.services.ai.workflow.state import AgentState
    
    request_id = input_data.request_id
    proposal_request = None
    
    if request_id:
        try:
            req_uuid = uuid.UUID(request_id)
            proposal_request = db.query(ProposalRequest).filter(ProposalRequest.id == req_uuid).first()
        except ValueError:
            pass
            
    if not proposal_request:
        client_user = db.query(User).filter(User.role == UserRole.CLIENT).first()
        if not client_user:
            client_user = db.query(User).first()
        
        client_id = client_user.id if client_user else uuid.UUID("aec18ec4-9350-4d57-91a6-0adffa952774")
        
        proposal_request = ProposalRequest(
            client_id=client_id,
            project_name="Draft Project",
            project_description="TBD",
            business_domain="General",
            budget=0.0,
            timeline="TBD",
            communication_type=CommunicationType.FORM,
            extracted_json={},
            workflow_state={}
        )
        db.add(proposal_request)
        db.commit()
        db.refresh(proposal_request)
    
    recent_messages_context = ""
    conversations = db.query(AIConversation).filter(
        AIConversation.request_id == proposal_request.id
    ).order_by(AIConversation.timestamp.desc()).limit(10).all()
    if conversations:
        conversations.reverse()
        recent_messages_context = "Here is the conversation history (last 10 messages):\n"
        for msg in conversations:
            recent_messages_context += f"{msg.sender.value}: {msg.message}\n"

    # Prepare input state for LangGraph
    current_state = proposal_request.workflow_state or {}
    input_state: AgentState = {
        "user_input": input_data.text,
        "request_id": str(proposal_request.id),
        "conversation_history": recent_messages_context,
        "is_gathering_info_complete": current_state.get("is_gathering_info_complete", False),
        "tech_stack_confirmed": current_state.get("tech_stack_confirmed", False),
        "ready_for_match": current_state.get("ready_for_match", False),
        "ready_for_proposal_generation": current_state.get("ready_for_proposal_generation", False),
        "requirements": proposal_request.extracted_json or {},
        "recommended_tech_stack": current_state.get("recommended_tech_stack", []),
    }
    
    try:
        # Run LangGraph workflow
        output_state = app_graph.invoke(input_state)
        print("DEBUG OUTPUT STATE:", output_state)
        
        # Save updated requirements
        merged_reqs = output_state.get("requirements", {})
        proposal_request.extracted_json = merged_reqs
        
        if merged_reqs.get("project_name"):
            proposal_request.project_name = merged_reqs.get("project_name")
        if merged_reqs.get("client_budget"):
            proposal_request.budget = float(merged_reqs.get("client_budget"))
        if merged_reqs.get("timeline_weeks"):
            proposal_request.timeline = f"{merged_reqs.get('timeline_weeks')} Weeks"
            
        # Save workflow state
        new_workflow_state = {
            "is_gathering_info_complete": output_state.get("is_gathering_info_complete", False),
            "tech_stack_confirmed": output_state.get("tech_stack_confirmed", False),
            "ready_for_match": output_state.get("ready_for_match", False),
            "ready_for_proposal_generation": output_state.get("ready_for_proposal_generation", False),
            "recommended_tech_stack": output_state.get("recommended_tech_stack", []),
            "tech_explanation": output_state.get("tech_explanation", ""),
        }
        proposal_request.workflow_state = new_workflow_state
        
        if output_state.get("proposal_comparison"):
            proposal_request.comparison_data = output_state["proposal_comparison"]
        
        user_convo = AIConversation(
            request_id=proposal_request.id,
            sender=SenderType.CLIENT,
            message=input_data.text,
            message_type=MessageType.TEXT
        )
        ai_convo = AIConversation(
            request_id=proposal_request.id,
            sender=SenderType.AI,
            message=output_state.get("follow_up_message") or "I've extracted your requirements.",
            message_type=MessageType.TEXT
        )
        db.add(user_convo)
        db.add(ai_convo)
        db.commit()
        
        # Build backward-compatible AgentExtractionResponse
        extracted_data = AgentExtractionResponse(
            request_id=str(proposal_request.id),
            proposal_id=merged_reqs.get("proposal_id", f"PROP-{uuid.uuid4().hex[:6].upper()}"),
            project_name=merged_reqs.get("project_name"),
            business_domain=merged_reqs.get("business_domain"),
            project_description=merged_reqs.get("project_description"),
            preferred_technology=[output_state.get("recommended_tech_stack", [])] if output_state.get("recommended_tech_stack") else None,
            timeline_weeks=merged_reqs.get("timeline_weeks"),
            client_budget=merged_reqs.get("client_budget"),
            is_gathering_info_complete=output_state.get("is_gathering_info_complete", False),
            tech_stack_confirmed=output_state.get("tech_stack_confirmed", False),
            ready_for_match=output_state.get("ready_for_match", False),
            ready_for_proposal_generation=output_state.get("ready_for_proposal_generation", False),
            follow_up_message=output_state.get("follow_up_message") or "I've processed your request.",
            proposal_data=output_state.get("proposal_comparison") # Passing the comparison block instead of the old full proposal
        )
        
        return extracted_data
        
    except ValidationError as ve:
        db.rollback()
        print(f"Pydantic Validation Error: {ve}")
        raise ValueError(f"The LangGraph node returned invalid data: {ve}")
    except Exception as e:
        db.rollback()
        print(f"Error executing LangGraph: {str(e)}")
        raise e
async def negotiate_proposal(input_data: NegotiationInput) -> NegotiationResponse:
    """
    Calls the OpenAI API to negotiate proposal parameters (budget, timeline, tech stack)
    based on the user's request, returning structured adjustments.
    """
    schema_str = json.dumps(NegotiationResponse.model_json_schema(), indent=2)

    system_prompt = f"""
    You are an expert Pre-Sales AI Agent for a software development company.
    Your job is to read a client's negotiation request (e.g. asking for a lower budget, faster timeline, or different tech stack)
    and intelligently adjust the current project parameters.

    Here are the rules:
    1. Evaluate the `user_request` against the current parameters: 
       - Budget: ${input_data.current_budget}
       - Timeline: {input_data.current_timeline}
       - Tech Stack: {', '.join(input_data.current_tech_stack)}
    2. Make reasonable concessions if requested. However, if a request is entirely unrealistic (e.g., cutting budget by 90%), set `success` to false and explain why in `error_message`.
    3. Calculate and provide a `new_budget` (float), `new_timeline` (string), and `new_tech_stack` (array of strings). If a parameter shouldn't change, keep it the same as the current one.
    4. Provide a conversational `response_message` addressing the client's request directly and explaining the new proposal parameters.
    
    Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": input_data.user_request}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        response_content = response.choices[0].message.content
        extracted_dict = json.loads(response_content)
        
        negotiation_data = NegotiationResponse(**extracted_dict)
        print(negotiation_data)
        return negotiation_data
        
    except ValidationError as ve:
        print(f"Pydantic Validation Error during negotiation: {ve}")
        raise ValueError(f"The LLM returned invalid data for negotiation: {ve}")
    except Exception as e:
        print(f"Error calling OpenAI API during negotiation: {str(e)}")
        raise e
