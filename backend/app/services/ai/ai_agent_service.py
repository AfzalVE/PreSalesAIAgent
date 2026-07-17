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

# Initialize the OpenAI client asynchronously, pointing to Groq's API
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.GROQ_API_KEY
)

async def extract_proposal_requirements(input_data: AgentTextInput, db: Session) -> AgentExtractionResponse:
    """
    Calls the Groq API (via OpenAI SDK) in JSON mode to parse unstructured text
    and extract the proposal requirements.
    """
    
    request_id = input_data.request_id
    proposal_request = None
    existing_data_str = "{}"
    
    if request_id:
        try:
            req_uuid = uuid.UUID(request_id)
            proposal_request = db.query(ProposalRequest).filter(ProposalRequest.id == req_uuid).first()
            if proposal_request:
                existing_data_str = json.dumps(proposal_request.extracted_json)
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
            extracted_json={}
        )
        db.add(proposal_request)
        db.commit()
        db.refresh(proposal_request)
    
    # We dynamically generate the JSON schema from our Pydantic model to instruct the LLM
    schema_str = json.dumps(AgentExtractionResponse.model_json_schema(), indent=2)

    system_prompt = f"""
    You are an expert Pre-Sales AI Agent for a software development company.
    Your job is to read unstructured text from a user (which could be a transcribed voice message or typed text)
    and extract project requirements into a structured JSON format.
    
    IMPORTANT: You are continuing a conversation. Here is the previously extracted data:
    {existing_data_str}

    Here are the rules:
    1. Merge any new information from the user's message with the existing data.
    2. Extract the `project_name`. If none is apparent, create a generic but descriptive one.
    3. Extract timeline_weeks.
        - If the user specifies one, use it.
        - If the user asks for a recommendation, estimate a realistic timeline based on the project scope and populate timeline_weeks.
        - Otherwise leave it null.

    4. Extract client_budget.
        - If the user specifies one, use it.
        - If the user asks for a recommendation, estimate a realistic budget based on the project scope and populate client_budget.
        - Otherwise leave it null.

    5. Extract or recommend resource_requirements.
        - If the user specifies them, use them.
        - If the user asks for recommendations, suggest an appropriate team.

    6. If the user asks for feature recommendations or says they lack technical expertise, recommend an industry-standard feature set appropriate for the project type.

    7. follow_up_message must always contain a conversational response.
        - If the user requests recommendations, provide them directly AND explicitly state the actual numerical values (budget, timeline) and specific resources you are recommending within this text.
        - Do not ask for information the user has already said they do not know.
        - Ask follow-up questions only when essential information is still required and the user has not requested recommendations.
        
    8. FEASIBILITY & NEGOTIATION: If the user requests a change to the existing budget or timeline that is highly unrealistic (e.g., cutting budget by 70%, or a 2-week timeline for a complex app), DO NOT update the `client_budget` or `timeline_weeks` fields with the unrealistic values. Keep the existing values, and populate `follow_up_message` with a professional explanation of why that request is not feasible and what trade-offs would be required. If the request is reasonable, update the fields and use `follow_up_message` to confirm the adjustment.
    
    9. Evaluate if you have all necessary fields (project_name, timeline_weeks, client_budget, and resource_requirements). If you have them all, set `is_ready_for_proposal` to true and let the user know in the `follow_up_message` that you are generating their proposal. Make sure to summarize the final budget, timeline, and team in the message, AND strictly start your message with: "OK, I have all the information about your project".
    
    Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": input_data.text}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        # Parse the JSON string returned by Groq
        response_content = response.choices[0].message.content
        extracted_dict = json.loads(response_content)
        
        if "proposal_id" not in extracted_dict or not extracted_dict["proposal_id"]:
            extracted_dict["proposal_id"] = f"PROP-{uuid.uuid4().hex[:6].upper()}"
            
        extracted_dict["request_id"] = str(proposal_request.id)
        
        proposal_request.extracted_json = extracted_dict
        if extracted_dict.get("project_name"):
            proposal_request.project_name = extracted_dict.get("project_name")
        if extracted_dict.get("client_budget"):
            proposal_request.budget = float(extracted_dict.get("client_budget"))
        if extracted_dict.get("timeline_weeks"):
            proposal_request.timeline = f"{extracted_dict.get('timeline_weeks')} Weeks"
            
        user_convo = AIConversation(
            request_id=proposal_request.id,
            sender=SenderType.CLIENT,
            message=input_data.text,
            message_type=MessageType.TEXT
        )
        ai_convo = AIConversation(
            request_id=proposal_request.id,
            sender=SenderType.AI,
            message=extracted_dict.get("follow_up_message") or "I've extracted your requirements and updated the project scope.",
            message_type=MessageType.TEXT
        )
        db.add(user_convo)
        db.add(ai_convo)
        db.commit()
        
        # Validate against our Pydantic model
        extracted_data = AgentExtractionResponse(**extracted_dict)
        print(extracted_data)
        
        # Trigger autonomous generation if ready
        if extracted_data.is_ready_for_proposal:
            from app.services.proposal.proposal_generation_service import generate_proposals_for_request
            try:
                await generate_proposals_for_request(db, proposal_request.id)
                print(f"Autonomous proposal generation triggered for {proposal_request.id}")
            except Exception as e:
                print(f"Failed to auto-generate proposal: {e}")
                
        return extracted_data
        
    except ValidationError as ve:
        db.rollback()
        print(f"Pydantic Validation Error: {ve}")
        raise ValueError(f"The LLM returned invalid data: {ve}")
    except Exception as e:
        db.rollback()
        print(f"Error calling Groq API: {str(e)}")
        raise e
async def negotiate_proposal(input_data: NegotiationInput) -> NegotiationResponse:
    """
    Calls the Groq API to negotiate proposal parameters (budget, timeline, tech stack)
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
            model="llama-3.1-8b-instant",
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
        print(f"Error calling Groq API during negotiation: {str(e)}")
        raise e
