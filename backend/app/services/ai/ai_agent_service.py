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
    Calls the OpenAI API in JSON mode to parse unstructured text
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
    
    recent_messages_context = ""
    if proposal_request:
        conversations = db.query(AIConversation).filter(
            AIConversation.request_id == proposal_request.id
        ).order_by(AIConversation.timestamp.desc()).limit(10).all()
        if conversations:
            conversations.reverse()
            recent_messages_context = "Here is the conversation history (last 10 messages):\n"
            for msg in conversations:
                recent_messages_context += f"{msg.sender.value}: {msg.message}\n"

    # We dynamically generate the JSON schema from our Pydantic model to instruct the LLM
    schema_str = json.dumps(AgentExtractionResponse.model_json_schema(), indent=2)

    system_prompt = f"""
    You are an expert Pre-Sales AI Agent for a software development company.
    Your job is to read unstructured text from a user and extract project requirements into a structured JSON format following a strict multi-step conversation flow.
    
    IMPORTANT: You are continuing a conversation. Here is the previously extracted data:
    {existing_data_str}
    {recent_messages_context}

    GENERAL RULES:
    1. The AI should collect these project details: Project Name (Title), Business Domain (Category), Project Description (Required), Tech Stack, Budget, Timeline, and Resource Requirements.
    2. If the client provides all the information in the first message, do not ask any additional questions. Immediately populate all fields and set `is_gathering_info_complete` to true.
    3. If any information is missing, ask ONLY for the missing fields. Never ask for details that have already been provided. Ask ONLY one follow-up question at a time.
    4. If the client responds with phrases like "Not decided", "You suggest", or "Recommend one", intelligently suggest suitable values based on the project requirements and industry best practices. Inform the user of your suggestion and populate the JSON fields immediately.
    5. Treat any clear affirmative response as confirmation (e.g., "yes", "looks good", "proceed").

    STATE MACHINE & CONVERSATION FLOW:

    Step 1: INFORMATION GATHERING
    - Check if project_name, business_domain, project_description, preferred_technology (tech stack), client_budget, timeline_days, mvp_timeline_days, full_timeline_days, mvp_resource_requirements, and full_resource_requirements are present.
    - If `project_description` is missing, you must ask for it first.
    - If any other field is missing, ask for exactly one missing field at a time. Do not combine questions.
    - For `mvp_resource_requirements` and `full_resource_requirements`, automatically generate the necessary roles, counts, and skills based on the tech stack and complexity for an MVP vs a Full Production build (do not ask the user for this unless they specifically want to customize it).
    - For `mvp_timeline_days` and `full_timeline_days`, dynamically suggest realistic timelines for the MVP and Full versions respectively in days, based on the project requirements. They don't have to be a fixed ratio.
    - If the user asks you to suggest a field, or skips it, infer a realistic value based on the project description, state your suggestion in `follow_up_message`, and populate the field.
    - Once ALL fields are populated, set `is_gathering_info_complete` to true.

    Step 2: PROJECT SUMMARY
    - Only proceed here once `is_gathering_info_complete` is true and `summary_confirmed` is false.
    - Display a clean, organized Project Summary containing all the extracted and AI-generated information (Project Name, Domain, Description, Tech Stack, Budget, Timeline).
    - Ask the client: "Does this summary look correct? Should we proceed to cost estimation?"
    - Once the user confirms the summary, set `summary_confirmed` to true, and `ready_for_match` to true.

    Step 3: RESOURCE MATCHING & ESTIMATION
    - Once `summary_confirmed` is true, the backend system will automatically calculate estimates, present them to the user, and ask for their approval.
    - You do NOT need to present the estimates yourself. Just read the chat history to see if the user approved the estimates presented by the system.
    - If the user confirms or approves the estimates (e.g. says "yes", "generate the proposal"), set `estimation_confirmed` to true, and `ready_for_proposal_generation` to true.

    OUTPUT FORMAT:
    - `follow_up_message` must ALWAYS contain your conversational response.
    - Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": input_data.text}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        
        # Parse the JSON string returned by OpenAI
        response_content = response.choices[0].message.content
        extracted_dict = json.loads(response_content)
        
        if "proposal_id" not in extracted_dict or not extracted_dict["proposal_id"]:
            if proposal_request.extracted_json and "proposal_id" in proposal_request.extracted_json:
                extracted_dict["proposal_id"] = proposal_request.extracted_json["proposal_id"]
            else:
                extracted_dict["proposal_id"] = f"PROP-{uuid.uuid4().hex[:6].upper()}"
            
        extracted_dict["request_id"] = str(proposal_request.id)
        
        # Merge with existing data so we don't lose context
        existing_json = proposal_request.extracted_json or {}
        merged_json = existing_json.copy()
        
        for k, v in extracted_dict.items():
            if v is not None:
                if isinstance(v, list) and not v and merged_json.get(k):
                    continue
                if isinstance(v, str) and not v.strip() and merged_json.get(k):
                    continue
                merged_json[k] = v
                
        proposal_request.extracted_json = merged_json
        
        if merged_json.get("project_name"):
            proposal_request.project_name = merged_json.get("project_name")
        if merged_json.get("client_budget"):
            proposal_request.budget = float(merged_json.get("client_budget"))
            
        def format_timeline(days):
            try:
                days = int(days)
            except:
                return str(days)
            if days < 7:
                return f"{days} Day{'s' if days > 1 else ''}"
            elif days % 30 == 0:
                months = days // 30
                return f"{months} Month{'s' if months > 1 else ''}"
            elif days % 7 == 0:
                weeks = days // 7
                return f"{weeks} Week{'s' if weeks > 1 else ''}"
            else:
                if days >= 30:
                    return f"{days // 30} Month{'s' if days // 30 > 1 else ''} {days % 30} Days"
                elif days >= 7:
                    return f"{days // 7} Week{'s' if days // 7 > 1 else ''} {days % 7} Days"
                return f"{days} Days"
                
        if merged_json.get("timeline_days"):
            proposal_request.timeline = format_timeline(merged_json.get('timeline_days'))
            
        user_convo = AIConversation(
            request_id=proposal_request.id,
            sender=SenderType.CLIENT,
            message=input_data.text,
            message_type=MessageType.TEXT
        )
        ai_convo = AIConversation(
            request_id=proposal_request.id,
            sender=SenderType.AI,
            message=merged_json.get("follow_up_message") or "I've extracted your requirements and updated the project scope.",
            message_type=MessageType.TEXT
        )
        db.add(user_convo)
        db.add(ai_convo)
        db.commit()
        
        # Validate against our Pydantic model
        extracted_data = AgentExtractionResponse(**merged_json)
        print(extracted_data)
        
        return extracted_data
        
    except ValidationError as ve:
        db.rollback()
        print(f"Pydantic Validation Error: {ve}")
        raise ValueError(f"The LLM returned invalid data: {ve}")
    except Exception as e:
        db.rollback()
        print(f"Error calling OpenAI API: {str(e)}")
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
