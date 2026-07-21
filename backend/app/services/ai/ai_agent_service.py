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
    1. NEVER use generic placeholder values. Your suggestions for budget, timeline, and tech stack MUST be highly customized and directly derived from the specific complexity, scale, and features mentioned in the project description.
    2. Every value must either come from the user, be inferred ONLY when explicitly asked to suggest it, or come from the Resource Matching Engine.
    3. You MUST generate the required developers for the project initially in the `resource_requirements` field based on the project description and tech stack. Include the role, count, and required skills (e.g.
    
    Example:

[
    {{
        "role": "<developer_role>",
        "count": <value>,
        "skills": ["<skill1>", "<skill2>"]
    }}
]).

    STATE MACHINE & CONVERSATION FLOW:
    
    Step 1: GATHERING INFO
    Required fields: project_name, business_domain, project_description, client_budget, and timeline_weeks.
    - If any of these are missing (except timeline_weeks), you MUST ask follow-up questions to gather them.
    - NEVER assume values unless the user explicitly asks you to "suggest" or "recommend" them.
    - For `timeline_weeks`, you MUST estimate and provide a realistic timeline in weeks based on the project scope and complexity.
    - IF the user asks you to suggest ANY missing field (e.g., project name, business domain, budget, tech stack), you MUST generate a realistic suggestion tailored to their specific project concept, inform the user in your message, AND automatically populate that field in the JSON output immediately. Do not keep asking for it if you just suggested and populated it.
    - Once ALL required fields are present (whether provided by the user or suggested by you), set `is_gathering_info_complete` to true.

    Step 2: PROJECT BUDGET
    - Evaluate if the budget is feasible. If it's not feasible, suggest a realistic one based on the exact features requested. If the user asks you to suggest a budget, calculate a logical estimate based on the scope and populate the `client_budget` field.

    Step 3: TECH STACK
    - If `preferred_technology` is missing: Suggest a highly specific and optimized technology stack based purely on the unique requirements of the project.
    - CRITICAL INSTRUCTION FOR TECH STACK: You MUST diversify your technology recommendations based on the project domain and scale. Do NOT default to generic stacks like React, Node.js, PostgreSQL, Docker, AWS, Figma, or Jenkins every time. Instead, deeply analyze the project domain (e.g., use Python/Django for data-heavy apps, Vue/Laravel for traditional web, Swift/Kotlin for mobile, Go/Rust for high performance, Azure/GCP for cloud) and suggest a highly customized tech stack.
    - Format it as a list of lists (e.g. [["Frontend", "Backend", "Database", "Cloud"]]).
    - If the budget is low, recommend a cost-effective tech stack. If the budget is high, recommend an enterprise-grade scalable stack.
    - You MUST ask the user: "Would you like to proceed with this technology stack?"
    - Once the user explicitly confirms the tech stack, set `tech_stack_confirmed` to true.
    - If `is_gathering_info_complete` is true AND `tech_stack_confirmed` is true, set `ready_for_match` to true.

    Step 4: AFTER MATCH FUNCTION (Reviewing Estimates)
    - If the backend has provided match results (see previously extracted data for `match_data`), you must present the Estimated Cost, Recommended Budget, Timeline, and Selected Developers to the user.
    - Then ask: "Would you like me to generate the proposal?"
    - Only after the user explicitly confirms, set `ready_for_proposal_generation` to true.

    Step 5: SUGGESTIONS & AUTODETECT
    - If the user asks for a project name or business domain suggestion, generate a creative and relevant one based on the description and output it directly in the JSON.
    - If the user provides a project name and business domain, update those fields accordingly.

    

    OUTPUT FORMAT:
    - `follow_up_message` must ALWAYS contain your conversational response.
    - Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
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
        if merged_json.get("timeline_weeks"):
            proposal_request.timeline = f"{merged_json.get('timeline_weeks')} Weeks"
            
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
