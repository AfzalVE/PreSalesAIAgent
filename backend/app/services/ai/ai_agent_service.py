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
        existing_json = {}
    else:
        existing_json = proposal_request.extracted_json if proposal_request and proposal_request.extracted_json else {}
    
    # recent_messages_context = ""
    # if proposal_request:
    #     conversations = db.query(AIConversation).filter(
    #         AIConversation.request_id == proposal_request.id
    #     ).order_by(AIConversation.timestamp.desc()).limit(20).all()
    #     if conversations:
    #         conversations.reverse()
    #         recent_messages_context = "Here is the conversation history (last 10 messages):\n"
    #         for msg in conversations:
    #             recent_messages_context += f"{msg.sender.value}: {msg.message}\n"
    conversations = (
        db.query(AIConversation)
        .filter(AIConversation.request_id == proposal_request.id)
        .order_by(AIConversation.timestamp.asc())
        .limit(20)
        .all()
    )

    # We dynamically generate the JSON schema from our Pydantic model to instruct the LLM
    schema_str = json.dumps(AgentExtractionResponse.model_json_schema(), indent=2)
    print(f"\033[92m{conversations}\033[0m")
    print()
    print(f"\033[92m{existing_data_str}\033[0m")
    from app.schemas.ai_agent_schema import WorkflowState
    
    # 1. Deterministic State Calculation
    workflow_state = WorkflowState.PROJECT_DISCOVERY
    
    if existing_json.get("project_name") and existing_json.get("business_domain") and existing_json.get("project_description"):
        workflow_state = WorkflowState.TIMELINE
        if existing_json.get("full_timeline_weeks"):
            workflow_state = WorkflowState.TECH_STACK
            if existing_json.get("tech_stack_confirmed") and existing_json.get("preferred_technology"):
                workflow_state = WorkflowState.RESOURCE_GENERATION
                if existing_json.get("resource_requirements"):
                    workflow_state = WorkflowState.COST_ESTIMATION
                    if existing_json.get("match_data"):
                        workflow_state = WorkflowState.FINAL_APPROVAL
                        if existing_json.get("ready_for_proposal_generation"):
                            workflow_state = WorkflowState.PROPOSAL_GENERATION

    # Persist the calculated state to the JSON for router use
    existing_json["workflow_state"] = workflow_state.value
    
    # 2. Base Rules
    system_prompt = f"""
    You are an expert Pre-Sales AI Agent for a software development company.
    Your job is to read unstructured text from a user and extract project requirements into a structured JSON format following a strict multi-step conversation flow.
    
    IMPORTANT: You are continuing a conversation. Here is the previously extracted data:
    {json.dumps(existing_json, indent=2)}
    
    CURRENT WORKFLOW STATE: {workflow_state.value}

    GENERAL RULES:
    1. Only focus on fulfilling the requirements of the CURRENT WORKFLOW STATE. Do NOT ask for information required in future states.
    2. NEVER use generic placeholder values. Your suggestions MUST be highly customized and directly derived from the specific complexity, scale, and features mentioned.
    3. Ensure your output strictly follows the JSON schema provided below.
    4. You MUST retain all previously extracted values unless the user explicitly wants to change them.
    5. The `follow_up_message` must ALWAYS contain your conversational response to the user.
    
    """
    
    # 3. State-Specific Instructions
    if workflow_state == WorkflowState.PROJECT_DISCOVERY:
        system_prompt += """
    STATE RULES - PROJECT DISCOVERY:
    - Your goal is to collect: Project Name, Business Domain, and Project Description.
    - If Project Name is missing, ask for it. If the client asks for a suggestion, generate a professional name and store it.
    - If Business Domain is missing, infer it whenever possible and store it.
    - Do NOT ask about budget, timeline or technology yet.
    - Once you have the Project Name, Business Domain, and Project Description, inform the user you have what you need and proceed to ask if they have a preferred timeline. Set `is_gathering_info_complete` to true if you have these three fields.
    """
    elif workflow_state == WorkflowState.TIMELINE:
        system_prompt += """
    STATE RULES - TIMELINE:
    - Your goal is to collect the Project Timeline (full_timeline_weeks).
    - If the user provides a timeline, store it in `full_timeline_weeks`. Also calculate a shorter `mvp_timeline_weeks` logically.
    - If the user asks you to suggest a timeline, calculate a realistic `mvp_timeline_weeks` and `full_timeline_weeks` based on project complexity, features, integrations, security, and scalability.
    - Do not generate random numbers. Inform the user of your estimates for BOTH MVP and Full Product, ask if they agree, and store them.
    - Once a timeline is agreed upon or provided, ask: "Do you already have a preferred technology stack?"
    """
    elif workflow_state == WorkflowState.TECH_STACK:
        system_prompt += """
    STATE RULES - TECH STACK:
    - Your goal is to collect and confirm the Technology Stack (preferred_technology).
    - If the user provides one, validate it and suggest improvements if necessary.
    - If the user asks you to decide, generate a highly customized stack based on business domain, scale, budget, and timeline. 
    - CRITICAL: Do NOT always suggest React + Node.js. Use domain-appropriate tech (e.g. Python/VectorDB for AI, Swift/Kotlin for Mobile, Go/Rust for High Performance).
    - Format it as a list of lists (e.g. [["Frontend", "Backend", "Database", "Cloud"]]).
    - You MUST explicitly ask the user: "Would you like to proceed with this technology stack?"
    - ONLY set `tech_stack_confirmed` to true if the user explicitly confirms or agrees to the stack.
    """
    elif workflow_state == WorkflowState.RESOURCE_GENERATION:
        system_prompt += """
    STATE RULES - RESOURCE GENERATION:
    - Your goal is to dynamically generate the required developers based on features, timeline, complexity, and tech stack.
    - Populate `resource_requirements` with the roles, counts, and skills required.
    - Do NOT hardcode developer counts. Generate them realistically based on the project scope.
    - After generating the resources, inform the user that you are calculating the cost estimates and the backend will provide the numbers momentarily.
    - Set `ready_for_match` to true.
    """
    elif workflow_state == WorkflowState.COST_ESTIMATION:
        # Backend handles this state immediately after RESOURCE_GENERATION, so LLM won't usually get stuck here unless it fails.
        system_prompt += """
    STATE RULES - COST ESTIMATION:
    - The backend is currently computing costs. If you see this, just inform the user that cost estimates are being finalized.
    """
    elif workflow_state in [WorkflowState.FINAL_APPROVAL, WorkflowState.NEGOTIATION]:
        system_prompt += """
    STATE RULES - NEGOTIATION & FINAL APPROVAL:
    - The backend has provided match results (see `match_data` in existing_json). Present the Estimated Cost, Timeline, and Selected Developers to the user.
    - If the client says the budget is too high, or they need a faster delivery:
      - Do NOT simply change the numbers. Instead, propose recalculating by reducing developers, increasing timeline, reducing scope, or using lower-cost technologies.
      - Adjust `resource_requirements`, `full_timeline_weeks`, or `preferred_technology` based on the negotiation, and inform the user you will recalculate. The backend will handle the recalculation automatically.
    - If the user approves the current estimates and stack, ask: "Would you like me to generate the proposal?"
    - ONLY after the user explicitly confirms to generate the proposal, set `ready_for_proposal_generation` to true.
    """
    
    system_prompt += f"""
    OUTPUT FORMAT:
    - Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """
    
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },

        {
            "role": "system",
            "content":
            f"""
Current extracted project information.

Only update fields if the user explicitly changes them.

Existing JSON:

{json.dumps(existing_json, indent=2)}
"""
        }
    ]

    # Conversation history

    for msg in conversations:

        messages.append({

            "role":
                "assistant"
                if msg.sender == SenderType.AI
                else "user",

            "content": msg.message

        })

    # Current message

    messages.append({

        "role": "user",

        "content": input_data.text

    })


    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            # temperature=0.3
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
        if merged_json.get("full_timeline_weeks"):
            proposal_request.timeline = f"{merged_json.get('full_timeline_weeks')} Weeks"
            
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
