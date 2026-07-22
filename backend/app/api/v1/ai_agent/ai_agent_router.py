from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.schemas.ai_agent_schema import (
    AgentTextInput,
    AgentExtractionResponse,
    NegotiationInput,
    NegotiationResponse,
    BudgetNegotiationInput,
    BudgetNegotiationResponse,
)
from app.services.ai.ai_agent_service import extract_proposal_requirements, negotiate_proposal
import uuid
from app.services.resource import (
    match_resources_from_db_request,
    match_resources_with_budget_cap,
    match_resources_with_extended_timeline,
    get_employees_from_db,
)
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
            proposal_request = db.query(ProposalRequest).filter(ProposalRequest.id == uuid.UUID(extracted_data.request_id)).first()
            already_matched = proposal_request and proposal_request.extracted_json and "match_data" in proposal_request.extracted_json
            
            if not already_matched:
                # 1. Execute Resource Match
                match_response = match_resources_from_db_request(extracted_data.request_id)
                
                # Format match summary into the chat message
                mvp_cost = match_response.get("mvp", {}).get("total_project_cost", "N/A")
                full_cost = match_response.get("full_project", {}).get("total_project_cost", "N/A")
                mvp_timeline = match_response.get("mvp", {}).get("timeline_formatted", "N/A")
                full_timeline = match_response.get("full_project", {}).get("timeline_formatted", "N/A")
                client_budget = match_response.get("client_budget")
                
                # Format MVP resources
                mvp_resources_str = ""
                for res in match_response.get("mvp", {}).get("selected_resources", []):
                    skills = ", ".join(res.get("skills", [])[:3]) if res.get("skills") else "General"
                    mvp_resources_str += f"\n  - {res.get('name', 'TBD')} — {res.get('role')} ({skills})"
                
                # Format Full resources
                full_resources_str = ""
                for res in match_response.get("full_project", {}).get("selected_resources", []):
                    skills = ", ".join(res.get("skills", [])[:3]) if res.get("skills") else "General"
                    full_resources_str += f"\n  - {res.get('name', 'TBD')} — {res.get('role')} ({skills})"
                
                match_summary = f"\n\n**📊 Estimation Complete!**\n\n**MVP Option:**\n- Budget: ${mvp_cost}\n- Timeline: {mvp_timeline}\n\n**Full Project Option:**\n- Budget: ${full_cost}\n- Timeline: {full_timeline}\n"
                
                if client_budget is not None and mvp_cost != "N/A":
                    if mvp_cost > client_budget:
                        match_summary += f"\n⚠️ **Notice:** The estimated cost for the MVP (${mvp_cost}) exceeds your approved budget (${client_budget}). The project is not feasible within the current budget constraints.\n"
                    elif full_cost != "N/A" and full_cost > client_budget:
                        match_summary += f"\n⚠️ **Notice:** The estimated cost for the Full Product (${full_cost}) exceeds your approved budget (${client_budget}), although the MVP is feasible.\n"
                        
                match_summary += "\nWould you like me to generate the proposal based on these estimates?"
                extracted_data.follow_up_message += match_summary
                
                # Save the match data to the database so the LLM has context in the next turn
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
                # Save the new match_data to the DB so it persists
                if proposal_request:
                    updated_json = proposal_request.extracted_json.copy() if proposal_request.extracted_json else {}
                    updated_json["match_data"] = match_response
                    proposal_request.extracted_json = updated_json
                    db.commit()
                
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


@router.post("/negotiate-budget", response_model=BudgetNegotiationResponse)
async def negotiate_budget(payload: BudgetNegotiationInput):
    """
    **Tiered Budget Negotiation — Developer Re-Matching.**

    - Attempt 1: Swaps expensive developers for cheaper ones (lower hourly rate /
      lower experience) using the same roles and the same timeline. The employee
      pool is filtered to those whose hourly rate is at or below the computed cap
      derived from the target_budget vs current_cost ratio.

    - Attempt 2+: If dev-swapping is no longer sufficient (all available devs
      are already cheap), extends the project timeline by ~30% and re-runs
      matching. More days = fewer concurrent hours per dev = lower total cost.
    """
    try:
        employees = get_employees_from_db()

        # Derive resource_requirements from the current resources if not explicitly provided.
        # We reconstruct minimal role specs so the matching engine can re-run.
        resource_requirements = payload.resource_requirements
        if not resource_requirements and payload.current_resources:
            # Group current resources by role to rebuild requirements
            role_map: dict = {}
            for dev in payload.current_resources:
                role = dev.role or "Engineer"
                if role not in role_map:
                    role_map[role] = {
                        "role": role,
                        "count": 0,
                        "minimum_experience": max(1, (dev.experience_years or 1) - 1),
                        "skills": list(dev.skills or []),
                    }
                role_map[role]["count"] += 1
            resource_requirements = list(role_map.values())

        if not resource_requirements:
            raise ValueError("No resource requirements could be determined.")

        timeline_days = payload.current_timeline_days or 84  # default 12 weeks

        # ----------------------------------------------------------------
        # ATTEMPT 1 — Developer Swap: same timeline, cheaper developers
        # ----------------------------------------------------------------
        if payload.negotiation_attempt <= 1:
            # Compute a max hourly rate cap proportional to the budget reduction ratio.
            # e.g. target_budget is 80% of current_cost → cap hourly rates at 80% of current max rate
            if payload.current_cost > 0:
                budget_ratio = min(1.0, payload.target_budget / payload.current_cost)
            else:
                budget_ratio = 0.80

            # Find the highest hourly rate in the current team
            current_max_rate = max(
                (dev.hourly_cost or 0 for dev in payload.current_resources),
                default=100.0,
            )
            # Apply ratio with a sensible floor so we don't filter out everyone
            max_hourly_rate = max(10.0, current_max_rate * budget_ratio)

            result = match_resources_with_budget_cap(
                resource_requirements=resource_requirements,
                timeline_days=timeline_days,
                max_hourly_rate=max_hourly_rate,
                employees=employees,
            )

            if result and result["total_project_cost"] < payload.current_cost:
                # Success — we found a cheaper team
                old_devs = {d.name for d in payload.current_resources if d.name}
                new_devs = {r["name"] for r in result["selected_resources"] if r.get("name")}
                swapped = new_devs - old_devs

                swap_note = ""
                if swapped:
                    swap_note = f" New additions: {', '.join(sorted(swapped))}."

                return BudgetNegotiationResponse(
                    success=True,
                    strategy_used="developer_swap",
                    new_cost=round(result["total_project_cost"], 2),
                    new_timeline_days=timeline_days,
                    new_timeline_formatted=result.get("timeline_formatted", f"{timeline_days // 7} Weeks"),
                    new_resources=result["selected_resources"],
                    response_message=(
                        f"✅ **Budget optimised via Developer Swap.**\n\n"
                        f"I've replaced higher-rate engineers with equally capable developers "
                        f"who have slightly less experience but a lower hourly rate — keeping "
                        f"the same project scope and timeline intact.\n\n"
                        f"**Previous cost:** ${payload.current_cost:,.0f}  →  "
                        f"**New cost:** ${result['total_project_cost']:,.0f} "
                        f"(saving ${payload.current_cost - result['total_project_cost']:,.0f}).{swap_note}\n\n"
                        f"The timeline remains **{result.get('timeline_formatted', f'{timeline_days // 7} Weeks')}**. "
                        f"If you'd like to reduce further, I can also extend the timeline to spread costs."
                    ),
                )

            # Dev swap didn't yield enough savings — fall through to timeline extension
            fallback_to_timeline = True
        else:
            fallback_to_timeline = True

        # ----------------------------------------------------------------
        # ATTEMPT 2+ — Timeline Extension: same pool, more days
        # ----------------------------------------------------------------
        if fallback_to_timeline:
            result = match_resources_with_extended_timeline(
                resource_requirements=resource_requirements,
                current_timeline_days=timeline_days,
                extension_ratio=1.30,
                employees=employees,
            )

            if result and result["total_project_cost"] < payload.current_cost:
                new_tl_days = result["timeline_days"]
                old_weeks = timeline_days // 7
                new_weeks = new_tl_days // 7

                return BudgetNegotiationResponse(
                    success=True,
                    strategy_used="timeline_extension",
                    new_cost=round(result["total_project_cost"], 2),
                    new_timeline_days=new_tl_days,
                    new_timeline_formatted=result.get("timeline_formatted", f"{new_weeks} Weeks"),
                    new_resources=result["selected_resources"],
                    response_message=(
                        f"⏳ **Budget optimised via Timeline Extension.**\n\n"
                        f"We've already swapped to the most cost-efficient developers available. "
                        f"To reduce the budget further, I've extended the project timeline from "
                        f"**{old_weeks} weeks** to **{new_weeks} weeks**. "
                        f"Spreading the same workload over more days lowers the parallel resource "
                        f"cost without cutting any features or roles.\n\n"
                        f"**Previous cost:** ${payload.current_cost:,.0f}  →  "
                        f"**New cost:** ${result['total_project_cost']:,.0f} "
                        f"(saving ${payload.current_cost - result['total_project_cost']:,.0f})."
                    ),
                )

            # Neither strategy worked — inform the client
            return BudgetNegotiationResponse(
                success=False,
                strategy_used="none",
                new_cost=payload.current_cost,
                new_timeline_days=timeline_days,
                new_timeline_formatted=f"{timeline_days // 7} Weeks",
                new_resources=[dev.model_dump() for dev in payload.current_resources],
                response_message=(
                    "⚠️ **Unable to reduce the budget further.**\n\n"
                    "We've already assigned the most cost-efficient developers available and "
                    "the timeline has been extended as far as practical. "
                    "To reduce costs any further, you would need to reduce the project scope "
                    "or remove one or more roles. Would you like to discuss scope changes?"
                ),
                error_message="No cheaper resource configuration could be found within the given constraints.",
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget negotiation failed: {str(e)}")
