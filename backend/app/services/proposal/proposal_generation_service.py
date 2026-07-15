import json
import uuid
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.proposal import Proposal, ProposalType, ProposalStatus
from app.models.proposal_request import ProposalRequest, CommunicationType, ProposalRequestStatus
from app.models.resource_allocation import ResourceAllocation
from app.services.resource.cost_estimation import match_resources

# Initialize the OpenAI client asynchronously, pointing to Groq's API
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.GROQ_API_KEY
)

async def generate_proposals_for_request(
    db: Session,
    client_id: uuid.UUID,
    project_name: Optional[str] = None,
    project_description: Optional[str] = None,
    business_domain: Optional[str] = None,
    preferred_technology: Optional[List[str]] = None,
    budget: Optional[float] = None,
    timeline: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates two proposals (MVP and Full) for a new/existing project request.
    Uses LLM to infer/suggest missing fields and builds structured scoping details.
    Uses the Resource Allocation engine to match developers and calculate precise costs.
    Saves everything to the database and returns the generated details.
    """
    
    # 1. Ask the LLM to process details, complete missing fields, and draft the core architectures/scopes/timelines
    user_input_summary = {
        "project_name": project_name or "",
        "project_description": project_description or "",
        "business_domain": business_domain or "",
        "preferred_technology": preferred_technology or [],
        "budget": budget,
        "timeline": timeline
    }

    system_prompt = """
    You are an expert technical director and pre-sales solutions architect.
    Your task is to analyze user-provided project specifications and draft TWO options for building their software:
    1. A lean MVP (Minimum Viable Product): Focuses on core workflows, short timeline, minimal cost.
    2. A Full Product: Complete ecosystem, richer features, integrations, scalable infrastructure.

    RULES FOR INFERENCE:
    - If project name, description, or domain are missing or sparse, intelligently infer/elaborate them to make a professional pitch.
    - If preferred technologies are missing, select a modern stack (e.g. React/Vite, FastAPI/Python, PostgreSQL, AWS).
    - If budget is missing or 0, suggest standard pricing (e.g., $20k-$40k for MVP, $70k-$150k for Full Product).
    - If timeline is missing, suggest a reasonable duration (e.g. 6 weeks for MVP, 12-16 weeks for Full Product).

    RULES FOR TIMELINE PHASES:
    - Every option MUST include a detailed development roadmap/timeline of phases.
    - Take the exact formatting style from 'City_Canvas_POC.docx'. Each phase in the timeline must contain:
      - 'Phase': Name of development phase (e.g. "UI/UX Design", "Core API Integration", "Security Auditing")
      - 'Duration': Number of days/weeks (e.g. "3-5 Days", "2 Weeks")
      - 'Output': Tangible deliverable (e.g. "Responsive Prototype", "Tested REST Endpoints")
    - Keep timeline phases realistic and aligned with the estimated duration.

    Return ONLY a valid JSON object matching this structure:
    {
      "inferred_project_name": "string",
      "inferred_business_domain": "string",
      "inferred_project_description": "string",
      "inferred_preferred_technology": ["string"],
      "inferred_budget": float,
      "inferred_timeline": "string",
      "mvp": {
        "tech_stack": {
          "backend": "string",
          "frontend": "string",
          "db": "string",
          "cloud": "string"
        },
        "scope": "string",
        "assumptions": "string",
        "risks": "string",
        "estimated_duration_weeks": int,
        "timeline_phases": [
          {"Phase": "string", "Duration": "string", "Output": "string"}
        ],
        "resource_requirements": [
          {"role": "string", "count": int, "minimum_experience": int, "skills": ["string"]}
        ]
      },
      "full": {
        "tech_stack": {
          "backend": "string",
          "frontend": "string",
          "db": "string",
          "cloud": "string"
        },
        "scope": "string",
        "assumptions": "string",
        "risks": "string",
        "estimated_duration_weeks": int,
        "timeline_phases": [
          {"Phase": "string", "Duration": "string", "Output": "string"}
        ],
        "resource_requirements": [
          {"role": "string", "count": int, "minimum_experience": int, "skills": ["string"]}
        ]
      }
    }
    """
    print("HEre")
    response = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_input_summary)}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    
    generation_content = json.loads(response.choices[0].message.content)
    
    # 2. Extract inferred data
    final_project_name = generation_content.get("inferred_project_name") or "Untitled AI Project"
    final_domain = generation_content.get("inferred_business_domain") or "Software Development"
    final_desc = generation_content.get("inferred_project_description") or "Custom software application development"
    final_tech = generation_content.get("inferred_preferred_technology") or []
    final_budget = float(generation_content.get("inferred_budget") or budget or 50000.0)
    final_timeline = generation_content.get("inferred_timeline") or timeline or "12 Weeks"

    # 3. Create ProposalRequest record in the database
    proposal_request = ProposalRequest(
        id=uuid.uuid4(),
        client_id=client_id,
        project_name=final_project_name,
        project_description=final_desc,
        business_domain=final_domain,
        preferred_technology=final_tech,
        budget=final_budget,
        timeline=final_timeline,
        communication_type=CommunicationType.FORM,
        extracted_json=generation_content,
        status=ProposalRequestStatus.PROCESSING
    )
    db.add(proposal_request)
    db.flush()

    # 4. Generate MVP Proposal
    mvp_data = generation_content["mvp"]
    # Run resource matching for MVP
    mvp_match_payload = {
        "proposal_id": f"PROP-MVP-{uuid.uuid4().hex[:6].upper()}",
        "project_name": f"{final_project_name} (MVP)",
        "timeline_weeks": mvp_data["estimated_duration_weeks"],
        "client_budget": final_budget * 0.5, # Assume MVP budget is a fraction of target budget
        "resource_requirements": mvp_data["resource_requirements"]
    }
    mvp_estimate = match_resources(mvp_match_payload)
    
    mvp_proposal = Proposal(
        id=uuid.uuid4(),
        request_id=proposal_request.id,
        proposal_type=ProposalType.MVP,
        tech_stack=mvp_data["tech_stack"],
        estimated_cost=mvp_estimate["total_project_cost"],
        estimated_duration=f"{mvp_data['estimated_duration_weeks']} Weeks",
        selected_resources={"resources": mvp_estimate["selected_resources"]},
        scope=mvp_data["scope"],
        assumptions=mvp_data["assumptions"],
        risks=mvp_data["risks"],
        generated_by_ai=True,
        version=1,
        status=ProposalStatus.GENERATED,
        timeline_phases=mvp_data["timeline_phases"]
    )
    db.add(mvp_proposal)

    # Save MVP Resource Allocations
    for res in mvp_estimate["selected_resources"]:
        alloc = ResourceAllocation(
            id=uuid.uuid4(),
            proposal_id=mvp_proposal.id,
            employee_id=uuid.UUID(res["employee_id"]),
            role=res["role"],
            allocated_hours=res["allocated_hours"],
            duration_weeks=mvp_data["estimated_duration_weeks"],
            estimated_cost=res["estimated_cost"]
        )
        db.add(alloc)

    # 5. Generate Full Product Proposal
    full_data = generation_content["full"]
    # Run resource matching for Full Product
    full_match_payload = {
        "proposal_id": f"PROP-FULL-{uuid.uuid4().hex[:6].upper()}",
        "project_name": final_project_name,
        "timeline_weeks": full_data["estimated_duration_weeks"],
        "client_budget": final_budget,
        "resource_requirements": full_data["resource_requirements"]
    }
    full_estimate = match_resources(full_match_payload)
    
    full_proposal = Proposal(
        id=uuid.uuid4(),
        request_id=proposal_request.id,
        proposal_type=ProposalType.FULL,
        tech_stack=full_data["tech_stack"],
        estimated_cost=full_estimate["total_project_cost"],
        estimated_duration=f"{full_data['estimated_duration_weeks']} Weeks",
        selected_resources={"resources": full_estimate["selected_resources"]},
        scope=full_data["scope"],
        assumptions=full_data["assumptions"],
        risks=full_data["risks"],
        generated_by_ai=True,
        version=1,
        status=ProposalStatus.GENERATED,
        timeline_phases=full_data["timeline_phases"]
    )
    db.add(full_proposal)

    # Save Full Product Resource Allocations
    for res in full_estimate["selected_resources"]:
        alloc = ResourceAllocation(
            id=uuid.uuid4(),
            proposal_id=full_proposal.id,
            employee_id=uuid.UUID(res["employee_id"]),
            role=res["role"],
            allocated_hours=res["allocated_hours"],
            duration_weeks=full_data["estimated_duration_weeks"],
            estimated_cost=res["estimated_cost"]
        )
        db.add(alloc)

    proposal_request.status = ProposalRequestStatus.COMPLETED
    db.commit()

    return {
        "proposal_request_id": str(proposal_request.id),
        "project_name": final_project_name,
        "project_description": final_desc,
        "business_domain": final_domain,
        "preferred_technology": final_tech,
        "budget": final_budget,
        "timeline": final_timeline,
        "proposals": [
            {
                "id": str(mvp_proposal.id),
                "proposal_type": mvp_proposal.proposal_type.value,
                "tech_stack": mvp_proposal.tech_stack,
                "estimated_cost": float(mvp_proposal.estimated_cost),
                "estimated_duration": mvp_proposal.estimated_duration,
                "selected_resources": mvp_proposal.selected_resources,
                "scope": mvp_proposal.scope,
                "assumptions": mvp_proposal.assumptions,
                "risks": mvp_proposal.risks,
                "status": mvp_proposal.status.value,
                "timeline_phases": mvp_proposal.timeline_phases
            },
            {
                "id": str(full_proposal.id),
                "proposal_type": full_proposal.proposal_type.value,
                "tech_stack": full_proposal.tech_stack,
                "estimated_cost": float(full_proposal.estimated_cost),
                "estimated_duration": full_proposal.estimated_duration,
                "selected_resources": full_proposal.selected_resources,
                "scope": full_proposal.scope,
                "assumptions": full_proposal.assumptions,
                "risks": full_proposal.risks,
                "status": full_proposal.status.value,
                "timeline_phases": full_proposal.timeline_phases
            }
        ]
    }
