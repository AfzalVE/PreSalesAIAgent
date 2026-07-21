import json
import uuid
from openai import AsyncOpenAI
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.config import settings
from app.schemas.ai_agent_schema import AgentTextInput, AgentExtractionResponse, NegotiationInput, NegotiationResponse
from app.models.user import User
from app.models.enums import UserRole
from app.models.proposal_request import ProposalRequest, CommunicationType
from app.models.ai_conversation import AIConversation, SenderType, MessageType
from app.models.employee import Employee

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
    
    # Fetch developer costs
    costs = db.query(
        Employee.designation,
        func.avg(Employee.hourly_cost).label('avg_cost')
    ).group_by(Employee.designation).all()
    
    cost_context_lines = []
    for cost in costs:
        if cost.avg_cost is not None:
            cost_context_lines.append(f"- {cost.designation}: ${float(cost.avg_cost):.2f}/hr")
    developer_costs_str = "\n".join(cost_context_lines) if cost_context_lines else "No cost data available."

    history_messages = []
    if proposal_request:
        conversations = db.query(AIConversation).filter(
            AIConversation.request_id == proposal_request.id
        ).order_by(AIConversation.timestamp.desc()).limit(20).all()
        if conversations:
            conversations.reverse()
            for msg in conversations:
                role = "user" if msg.sender == SenderType.CLIENT else "assistant"
                history_messages.append({"role": role, "content": msg.message})

    # We dynamically generate the JSON schema from our Pydantic model to instruct the LLM
    schema_str = json.dumps(AgentExtractionResponse.model_json_schema(), indent=2)

    chat_system_prompt = f"""
    You are an expert Pre-Sales AI Agent for a software development company.
    Your job is to read unstructured text from a user and converse with them to gather project requirements.
    
    # 1. DEVELOPER COSTS (INTERNAL DB DATA)
    Here are the average hourly costs for our developers:
    {developer_costs_str}

    # 2. CONVERSATIONAL GUIDELINES
    - Be helpful and natural.
    - Actively infer details from the user's input. For example, if they say 'ecommerce' or 'WooCommerce', infer that the business domain is E-Commerce. DO NOT interrogate the user for information that is obvious from context.
    - COST & TIMELINE ESTIMATION: Do NOT calculate or invent cost estimates yourself. If the user asks for a cost or time estimate, simply suggest a realistic timeline and team size based on their requirements, and state: "I will run our resource engine to calculate the exact cost for this."
    - The backend engine will automatically append the real, database-backed cost estimate to your message. DO NOT invent or output dollar amounts yourself.
    - DO NOT expose the raw internal hourly rates to the client.
    - If the user provides a budget, gently acknowledge it, but rely on the backend engine to evaluate its feasibility.
    - Keep track of what information is still missing (project name, business domain, description, budget, timeline) and gently ask for it, but only 1 or 2 questions at a time.
    - PROPOSAL/POC GENERATION: If the user asks to "generate POC", "create proposal", or indicates they want to proceed, DO NOT ask any more questions or require further confirmation. Immediately confirm that you are generating it and provide a brief summary of the final scope.
    - If the user asks for suggestions on tech stack, provide a specific and tailored one (not just generic stacks).
    """

    try:
        user_content = f"CURRENT PROJECT STATE (if any):\n{existing_data_str}\n\nUSER INPUT:\n{input_data.text}"
        chat_messages = [{"role": "system", "content": chat_system_prompt}]
        chat_messages.extend(history_messages)
        chat_messages.append({"role": "user", "content": user_content})

        chat_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=chat_messages,
            temperature=0.7
        )
        ai_text_response = chat_response.choices[0].message.content

        extraction_system_prompt = f"""
        You are an internal JSON state extraction bot.
        Your job is to review the conversation and the AI's latest response, and extract the current known project state into the required JSON schema.
        
        RULES:
        1. Look at the CURRENT PROJECT STATE provided, the USER INPUT, and the AI RESPONSE.
        2. Merge or update the state based on new information inferred or provided.
        3. If the AI response suggests a budget, timeline, or tech stack, include it in the extracted state.
        4. You MUST map everything exactly to the schema.
        5. STATE FLAGS: 
           - If all core info is present, set `is_gathering_info_complete` to true.
           - If the user asks for a cost estimate, timeline, or resource allocation, you MUST set `ready_for_match` to true immediately, even if all core info is not yet gathered. This will trigger the backend matching engine.
           - If the user explicitly asks to generate the POC or proposal (e.g., "generate POC"), OR if the AI RESPONSE states that it is now generating the proposal/POC, you MUST set `ready_for_proposal_generation` to true immediately. Do not wait for further confirmation.
        
        Ensure your output strictly follows this JSON schema:
        {schema_str}
        
        Return ONLY valid JSON.
        """

        extraction_user_content = f"CURRENT PROJECT STATE:\n{existing_data_str}\n\nUSER INPUT:\n{input_data.text}\n\nAI RESPONSE:\n{ai_text_response}\n\nExtract the updated JSON state."
        extraction_messages = [
            {"role": "system", "content": extraction_system_prompt},
            {"role": "user", "content": extraction_user_content}
        ]

        extraction_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=extraction_messages,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        # Parse the JSON string returned by OpenAI
        response_content = extraction_response.choices[0].message.content
        extracted_dict = json.loads(response_content)
        
        # Force the follow_up_message to exactly match the generated conversational response
        extracted_dict["follow_up_message"] = ai_text_response
        
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
