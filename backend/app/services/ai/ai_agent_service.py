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
    Your job is to have a natural conversation with a client to gather their project requirements, then analyze and present a complete project plan.
    
    IMPORTANT: You are continuing a conversation. Here is the previously extracted data:
    {existing_data_str}
    {recent_messages_context}

    =============================================
    CONVERSATION FLOW (STRICT ORDER)
    =============================================

    You MUST follow this exact flow. Do NOT skip steps or jump ahead.

    STEP 1: GATHER CLIENT REQUIREMENTS (one at a time)
    --------------------------------------------------
    Collect these fields FROM THE CLIENT, exactly one at a time, in this strict priority order. 
    You must NOT mention cost estimation or show a summary during this step.

    1. `project_description` — Ask: "Could you describe your project idea or what you're looking to build?" (If client already provided a description, SKIP asking this).
    2. `project_name` — Generate one silently based on the description. Do not ask for confirmation.
    3. `business_domain` — Generate one silently based on the description. Do not ask for confirmation.
    4. `preferred_technology` — Check if they already mentioned technologies or platforms (e.g. WooCommerce, WordPress, Shopify, React) in their description. If they did, extract them as the tech stack and SKIP asking this question. If not, ask: "Do you have a preferred tech stack, or would you like me to recommend one?" If client says "you suggest", recommend a stack and ask: "Is this tech stack okay?"
    5. `client_budget` — Check if they already provided a budget. If not, ask: "What is your approximate budget for the full project?" If they say "you suggest", suggest one and ask: "Is this budget okay?"
    6. `timeline_days` — Check if they already provided a timeline. If not, ask: "What is your expected timeline for the full project?" Accept input in days, weeks, or months and convert to days internally. If they say "you suggest", suggest one and ask: "Is this timeline okay?"

    RULES FOR GATHERING (CRITICAL):
    - DO NOT ASK FOR INFORMATION YOU ALREADY HAVE. If the client provided the budget and timeline in their very first message, extract them immediately into the JSON and SKIP asking questions 5 and 6.
    - Never ask multiple questions at once. Ask exactly ONE missing question.
    - If the client answers "yes", "ok", or "looks good" to your suggestion, accept it as confirmed, populate the JSON, and IMMEDIATELY move to the next missing field. Do not keep asking them to confirm the same thing.
    - The budget and timeline represent the FULL PROJECT scope.
    - DO NOT show any project summary yet. DO NOT ask to proceed to cost estimation yet.

    STEP 2: AI ANALYSIS (automatic, no user interaction needed)
    -----------------------------------------------------------
    Once ALL 6 client fields above are completely populated AND confirmed by the client, you MUST automatically generate these 4 AI-analyzed fields:
    
    - `full_timeline_days`: This is exactly the `timeline_days` agreed upon in Step 1.
    - `mvp_timeline_days`: Analyze project complexity to suggest a realistic MVP timeline in days. Must be shorter than the full timeline.
    - `mvp_resource_requirements`: Generate the minimal team needed for MVP. Roles must match tech stack. Count=1 unless timeline is tight and budget allows.
    - `full_resource_requirements`: Generate the complete team for full build. Include QA/DevOps if justified.

    After generating these, set `is_gathering_info_complete` to true. If they are already generated, keep the existing values and do NOT regenerate them.

    STEP 3: SHOW COMPLETE PROJECT SUMMARY
    --------------------------------------
    If `is_gathering_info_complete` is true AND the user has NOT YET confirmed the summary, you MUST display the COMPLETE summary in your `follow_up_message`.

    You MUST include ALL 7 bullet points below. Do NOT omit any bullet points. 

    📋 **Project Summary**
    - **Project Name**: [name]
    - **Business Domain**: [domain]
    - **Description**: [full description]
    - **Tech Stack**: [all technologies]
    - **Budget**: $[amount]
    - **MVP Timeline**: [formatted — use Days if <7, Weeks if multiple of 7, Months if multiple of 30]
    - **Full Project Timeline**: [formatted same way]

    Then ask: "Does this complete summary look correct? Should we proceed to cost estimation, or would you like to modify anything?"

    CRITICAL NEGATIVE CONSTRAINT: DO NOT show a partial summary. DO NOT omit the Full Project Timeline. DO NOT ask "Should we proceed to cost estimation?" if `is_gathering_info_complete` is false.

    STEP 4: CONFIRMATION, MODIFICATION, OR COST ESTIMATION
    ------------------------------------------------------
    - If the client wants to modify anything in the summary, update the JSON fields accordingly and show the updated summary.
    - If the user confirms the summary is correct (e.g. says "yes", "looks good", "proceed to cost estimation"):
      1. You MUST set `summary_confirmed` to true in your JSON output.
      2. You MUST set `ready_for_match` to true in your JSON output.
      3. CRITICAL: Do NOT show the Project Summary again! Just reply with a brief message exactly like this: "Great! The project summary is confirmed. We will proceed to cost estimation. Please hold on..."
      4. The backend will automatically run cost estimation and append the results to the chat.

    STEP 5: PROPOSAL GENERATION
    ----------------------------
    - Once the user approves the cost estimation (says "yes", "generate proposal"), set `estimation_confirmed` to true and `ready_for_proposal_generation` to true.

    =============================================
    TIMELINE FORMATTING RULES
    =============================================
    In your `follow_up_message`, always format timelines as:
    - Under 7 days → show as "X Days"
    - Multiple of 7 → show as "X Weeks" (e.g. 14 days = "2 Weeks")
    - Multiple of 30 → show as "X Months" (e.g. 90 days = "3 Months")
    - Other → show as "X Weeks Y Days" or "X Months Y Days"

    =============================================
    OUTPUT FORMAT
    =============================================
    - `follow_up_message` must ALWAYS contain your conversational response.
    - Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4.1",
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
            model="gpt-4.1",
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
