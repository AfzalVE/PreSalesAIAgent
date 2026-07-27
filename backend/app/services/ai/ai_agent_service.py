import asyncio
import json
import logging
import uuid

from openai import AsyncOpenAI
from pydantic import ValidationError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.ai_agent_schema import AgentTextInput, AgentExtractionResponse, NegotiationInput, NegotiationResponse
from app.models.user import User
from app.models.enums import UserRole
from app.models.proposal_request import ProposalRequest, CommunicationType
from app.models.ai_conversation import AIConversation, SenderType, MessageType

logger = logging.getLogger(__name__)

# Initialize the OpenAI client asynchronously
client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY
)

# --------------------------------------------------------------------------
# PERFORMANCE: these schemas are static for the lifetime of the process
# (they're derived purely from the Pydantic model definitions), so they're
# generated once at import time instead of on every single request. This
# was previously ~1-2ms of avoidable JSON serialization work per call, on
# top of the payload being embedded in every OpenAI request either way.
# --------------------------------------------------------------------------
_EXTRACTION_SCHEMA_STR = json.dumps(AgentExtractionResponse.model_json_schema(), indent=2)
_NEGOTIATION_SCHEMA_STR = json.dumps(NegotiationResponse.model_json_schema(), indent=2)


def format_timeline(days) -> str:
    """Shared timeline formatter (was duplicated inline in two places)."""
    try:
        days = int(days)
    except (TypeError, ValueError):
        return str(days)
    if days < 7:
        return f"{days} Day{'s' if days > 1 else ''}"
    if days % 30 == 0:
        months = days // 30
        return f"{months} Month{'s' if months > 1 else ''}"
    if days % 7 == 0:
        weeks = days // 7
        return f"{weeks} Week{'s' if weeks > 1 else ''}"
    if days >= 30:
        return f"{days // 30} Month{'s' if days // 30 > 1 else ''} {days % 30} Days"
    if days >= 7:
        return f"{days // 7} Week{'s' if days // 7 > 1 else ''} {days % 7} Days"
    return f"{days} Days"


# --------------------------------------------------------------------------
# PERFORMANCE: pull the blocking SQLAlchemy work into small sync functions
# that get dispatched via asyncio.to_thread(). This is an `async def`
# request handler — every un-threaded db.query()/commit() call was blocking
# the whole event loop, which stalls every other in-flight request on the
# same worker for the duration of the DB round trip.
# --------------------------------------------------------------------------

def _load_or_create_proposal_request(db: Session, request_id: str | None, input_data) -> tuple[ProposalRequest, dict, str, str]:
    proposal_request = None
    existing_json: dict = {}
    existing_data_str: str = "{}"

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

        # Prefer client_id from input if provided
        if getattr(input_data, "client_id", None):
            try:
                client_id = uuid.UUID(input_data.client_id)
            except ValueError:
                # Try to look up by email
                user_by_email = db.query(User).filter(User.email == input_data.client_id).first()
                if user_by_email:
                    client_id = user_by_email.id
                else:
                    client_id = client_user.id if client_user else uuid.UUID("aec18ec4-9350-4d57-91a6-0adffa952774")
        else:
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

    return proposal_request, existing_json, existing_data_str, recent_messages_context


def _persist_turn(db: Session, proposal_request: ProposalRequest, merged_json: dict, user_text: str) -> None:
    """Persist the merged extraction result and conversation turns to the database."""
    proposal_request.extracted_json = merged_json

    if merged_json.get("project_name"):
        proposal_request.project_name = merged_json.get("project_name")
    if merged_json.get("client_budget"):
        proposal_request.budget = float(merged_json.get("client_budget"))
    if merged_json.get("timeline_days"):
        proposal_request.timeline = format_timeline(merged_json.get("timeline_days"))

    user_convo = AIConversation(
        request_id=proposal_request.id,
        sender=SenderType.CLIENT,
        message=user_text,
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


async def extract_proposal_requirements(input_data: AgentTextInput, db: Session) -> AgentExtractionResponse:
    """
    Calls the OpenAI API in JSON mode to parse unstructured text
    and extract the proposal requirements.
    """
    request_id = input_data.request_id

    proposal_request, existing_json, existing_data_str, recent_messages_context = await asyncio.to_thread(
        _load_or_create_proposal_request, db, request_id, input_data
    )

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
    4. `timeline_days` — Check if they already provided a timeline. If not, FIRST ASK the user: "Do you have a specific timeline in mind for the full project? (If you're not sure, I can suggest one)." DO NOT suggest a timeline until you have asked this. If the user replies that they do not know or asks you to suggest one, THEN estimate a realistic full project timeline based on the description, POPULATE the `timeline_days` JSON field immediately with your suggestion (in days), and ask: "I suggest a timeline of [X] for the full project. Is this okay?"
    5. `preferred_technology` — Check if they already mentioned technologies or platforms in their description. If they did, extract them and SKIP this question. If not, FIRST ASK the user: "Do you have any preferred technologies or platforms? (If not, I can recommend a modern tech stack for you)." DO NOT suggest a stack until you have asked this. If the user replies that they do not know or asks you to suggest one, THEN analyze the description and suggest a modern, current tech stack (e.g. React, Next.js, Node.js, Python), POPULATE the `preferred_technology` JSON field immediately with your suggestion, and ask: "I recommend we build this using [Stack]. Is this tech stack okay?"
    6. `client_budget` — Check if they already provided a budget. If not, FIRST ASK the user: "Do you have an approximate budget in mind? (If not, I can estimate an initial budget based on our discussion)." DO NOT suggest a budget until you have asked this. If the user replies that they do not know or asks you to suggest one, THEN analyze the timeline and tech stack to estimate a realistic numeric budget in USD, POPULATE the `client_budget` JSON field immediately, and ask: "Based on the requirements, I estimate an initial budget of $[X]. (Note: Our system will run a precise cost calculation later). Is this approximate budget okay?"

    RULES FOR GATHERING (CRITICAL):
    - DO NOT ASK FOR INFORMATION YOU ALREADY HAVE. If the client provided the budget and timeline in their very first message, extract them immediately into the JSON and SKIP asking questions 5 and 6.
    - Never ask multiple questions at once. Ask exactly ONE missing question.
    - If the client asks for a budget estimate BEFORE the timeline or tech stack are finalized, you MUST automatically estimate a realistic timeline and tech stack, POPULATE all three fields (`timeline_days`, `preferred_technology`, `client_budget`) in the JSON, and say: "To estimate the budget, I assume we will use [Tech Stack] and it will take around [Timeline]. This brings the approximate budget to $[X]. Does this plan look okay?"
    - If you suggest a value (like a tech stack, budget, or timeline) or if the client asks you to change your suggestion, you MUST IMMEDIATELY update the corresponding JSON field in your output. Do not leave it null.
    - If the client answers "yes", "ok", "it is now ok", or "looks good" to your suggestion, accept it as confirmed. DO NOT keep asking them to confirm the same thing. IMMEDIATELY move to the next missing field.
    - The budget and timeline represent the FULL PROJECT scope.
    - DO NOT show any project summary yet. DO NOT ask to proceed to cost estimation yet.

    STEP 2: AI ANALYSIS (automatic, no user interaction needed)
    -----------------------------------------------------------
    Once ALL 6 client fields above are completely populated AND confirmed by the client, you MUST automatically generate these 4 AI-analyzed fields:
    
    - `full_timeline_days`: This is exactly the `timeline_days` agreed upon in Step 1.
    - `mvp_timeline_days`: Analyze the core essential features required for launch to calculate a realistic MVP timeline in days. DO NOT blindly divide the full timeline in half, and DO NOT make it identical to the full timeline. It MUST vary intelligently based on the specific requirements.
    - `mvp_resource_requirements`: Generate the minimal team needed for MVP. Roles must match tech stack. Count MUST be exactly 1 for each role/department.
    - `full_resource_requirements`: Generate the complete team for full build. The size and composition of the team MUST be strictly aligned with the `client_budget` and timeline. Do not overallocate resources if the budget is limited. Include QA/DevOps if justified by the budget and scope.

    After generating these, set `is_gathering_info_complete` to true. If they are already generated, keep the existing values and do NOT regenerate them.

    STEP 3: EVALUATE USER CONFIRMATION (CRITICAL)
    ---------------------------------------------
    If `is_gathering_info_complete` is already true, first evaluate the user's current message:
    - If the client wants to modify anything in the summary, update the JSON fields accordingly, keep `summary_confirmed` false, and proceed to Step 4 to show the updated summary.
    - If the user confirms the summary is correct (e.g. says "yes", "looks good", "ok", "proceed"):
      1. You MUST set `summary_confirmed` to true in your JSON output.
      2. You MUST set `ready_for_match` to true in your JSON output.
      3. CRITICAL: Do NOT show the Project Summary again! Just reply exactly like this: "Great! The project summary is confirmed. We will proceed to cost estimation. Please hold on..."
      4. STOP HERE. Do not execute Step 4.

    STEP 4: SHOW SUMMARY / HANDLE MODIFICATION / MOVE TO COST ESTIMATION
    ----------------------------------------------------------------------
    If `is_gathering_info_complete` is true AND you did NOT set `summary_confirmed` to true in Step 3:

    You MUST display the COMPLETE summary in your `follow_up_message`, including ALL 6 bullet points below (do not omit any):

    📋 **Project Summary**
    - **Project Name**: [name]
    - **Business Domain**: [domain]
    - **Description**: [full description]
    - **Tech Stack**: [all technologies]
    - **Budget**: $[amount]
    - **Timeline**: [formatted timeline — use Days if <7, Weeks if multiple of 7, Months if multiple of 30]

    Then ask: "Does this complete summary look correct? Should we proceed to cost estimation, or would you like to modify anything?"

    - If the client wants to modify anything, update the JSON fields accordingly and show the updated summary (as above).
    - If the user confirms (e.g. "ok", "it is ok", "yes", "looks good", "proceed to cost estimation"):
      1. Set `summary_confirmed` to true and `ready_for_match` to true.
      2. Do NOT show the Project Summary again. Reply with exactly: "Great! The project summary is confirmed. We will proceed to cost estimation. Please hold on..."
      3. The backend will automatically run cost estimation and append the results to the chat.

    CRITICAL NEGATIVE CONSTRAINT: DO NOT show a partial summary. DO NOT ask "Should we proceed to cost estimation?" if `is_gathering_info_complete` is false.

    STEP 5: PROPOSAL GENERATION
    ----------------------------
    - Once the user approves the cost estimation (says "ok", "it is ok", "yes", "looks good", "generate proposal", "generate poc", "go for it"), set `estimation_confirmed` to true and `ready_for_proposal_generation` to true.
    - Reply ONLY with: "Thank you for your confirmation. The proposal will now be generated and shared with you shortly."
    - NEVER show the project summary in this step.

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
    {_EXTRACTION_SCHEMA_STR}
    
    Return ONLY valid JSON.
    """

    if "[SYSTEM OVERRIDE: Form Submission Mode]" in input_data.text:
        system_prompt += """
        
        CRITICAL OVERRIDE DETECTED: 
        You are in Form Submission Mode. You MUST SKIP ALL GATHERING STEPS.
        You MUST IMMEDIATELY execute STEP 2 to generate `mvp_timeline_days`, `full_timeline_days`, `mvp_resource_requirements`, and `full_resource_requirements`.
        You MUST calculate `mvp_timeline_days` and `full_timeline_days` such that they are DIFFERENT values (e.g., MVP is 30-40% of the full project time).
        You MUST set `is_gathering_info_complete`, `summary_confirmed`, `ready_for_match`, `estimation_confirmed`, and `ready_for_proposal_generation` ALL to TRUE.
        DO NOT ask any questions in `follow_up_message`. Just say "Form submitted successfully."
        """

    # -------------------------------------------------------------------------
    # POST-PROPOSAL NEGOTIATION MODE
    # Detected when all gathering & generation flags are already true.
    # The user has an existing generated proposal and wants to negotiate it —
    # NOT start a new requirements gathering session.
    # -------------------------------------------------------------------------
    elif (
        existing_json.get("is_gathering_info_complete")
        and existing_json.get("summary_confirmed")
        and existing_json.get("ready_for_proposal_generation")
        and "[SYSTEM OVERRIDE" not in input_data.text
    ):
        project_name = existing_json.get("project_name", "the project")
        budget = existing_json.get("client_budget", "unknown")
        timeline = existing_json.get("timeline_days", "unknown")
        tech = existing_json.get("preferred_technology", [])
        tech_str = ", ".join(
            tech[0] if tech and isinstance(tech[0], list) else tech
        ) if tech else "as previously discussed"

        system_prompt += f"""

        =============================================
        CRITICAL: POST-PROPOSAL NEGOTIATION MODE
        =============================================
        The proposal for "{project_name}" has ALREADY been generated and confirmed.
        Current parameters: Budget=${budget}, Timeline={timeline} days, Tech={tech_str}
        
        ALL requirements-gathering steps are COMPLETE. You MUST NOT:
        - Re-ask for project details, budget, timeline, or tech stack
        - Show the Project Summary again
        - Set any flags to false
        - Restart the gathering flow
        
        You are now a POST-PROPOSAL NEGOTIATION AGENT. The user wants to negotiate
        or adjust their existing proposal. Your responsibilities:
        1. Understand the change the user is requesting (budget, timeline, tech, features, team size, scope)
        2. Explain the impact of that change clearly (trade-offs, risks, cost implications)
        3. Suggest alternative approaches if the request presents challenges
        4. Update only the specific JSON fields the user wants to change
        5. Keep ALL boolean flags (is_gathering_info_complete, summary_confirmed, ready_for_match,
           estimation_confirmed, ready_for_proposal_generation) as TRUE
        6. Respond conversationally in `follow_up_message` — be direct, helpful, and concise
        
        Example responses:
        - If user says "reduce budget by 20%": Acknowledge the target, explain what trade-offs
          this implies (e.g. smaller team, longer timeline), and confirm what you can do.
        - If user says "can we use Vue instead of React?": Confirm the tech switch is feasible,
          note any implications, and update preferred_technology.
        - If user asks a question about the proposal: Answer it directly from the context.
        """

    try:
        response = await client.chat.completions.create(
            model="gpt-5.5",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": input_data.text}
            ],
            response_format={"type": "json_object"},
        )

        response_content = response.choices[0].message.content
        extracted_dict = json.loads(response_content)

        if not extracted_dict.get("proposal_id"):
            extracted_dict["proposal_id"] = (
                existing_json.get("proposal_id") or f"PROP-{uuid.uuid4().hex[:6].upper()}"
            )

        extracted_dict["request_id"] = str(proposal_request.id)

        # Merge with existing data so we don't lose context
        merged_json = existing_json.copy()
        for k, v in extracted_dict.items():
            if v is None:
                continue
            if isinstance(v, list) and not v and merged_json.get(k):
                continue
            if isinstance(v, str) and not v.strip() and merged_json.get(k):
                continue
            merged_json[k] = v

        await asyncio.to_thread(_persist_turn, db, proposal_request, merged_json, input_data.text)

        extracted_data = AgentExtractionResponse(**merged_json)
        logger.debug("Extraction result: %s", extracted_data)

        return extracted_data

    except ValidationError as ve:
        await asyncio.to_thread(db.rollback)
        logger.error("Pydantic validation error during extraction: %s", ve)
        raise ValueError(f"The LLM returned invalid data: {ve}")
    except Exception as e:
        await asyncio.to_thread(db.rollback)
        logger.exception("Error calling OpenAI API during extraction")
        raise e


async def negotiate_proposal(input_data: NegotiationInput) -> NegotiationResponse:
    """
    Calls the OpenAI API to negotiate proposal parameters (budget, timeline, tech stack)
    based on the user's request, returning structured adjustments.
    """
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
    {_NEGOTIATION_SCHEMA_STR}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-5.5",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": input_data.user_request}
            ],
            response_format={"type": "json_object"}
        )

        response_content = response.choices[0].message.content
        extracted_dict = json.loads(response_content)

        negotiation_data = NegotiationResponse(**extracted_dict)
        logger.debug("Negotiation result: %s", negotiation_data)
        return negotiation_data

    except ValidationError as ve:
        logger.error("Pydantic validation error during negotiation: %s", ve)
        raise ValueError(f"The LLM returned invalid data for negotiation: {ve}")
    except Exception as e:
        logger.exception("Error calling OpenAI API during negotiation")
        raise e


async def transcribe_audio_bytes(file_bytes: bytes, filename: str = "voice.webm") -> str:
    """
    Transcribes audio bytes using OpenAI Whisper-1 model.
    """
    try:
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, file_bytes)
        )
        return response.text
    except Exception as e:
        logger.exception("Error transcribing audio with OpenAI Whisper")
        raise e