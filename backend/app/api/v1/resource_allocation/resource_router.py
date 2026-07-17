from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.resource import match_resources, match_resources_from_db_request
from app.core.dependencies import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


class ResourceRequirementItem(BaseModel):
    role: str = Field(..., description="Target role name (e.g. 'Backend Engineer')")
    count: int = Field(1, description="Number of developers needed for this role")
    minimum_experience: int = Field(1, description="Minimum years of experience required")
    skills: Optional[List[str]] = Field(default_factory=list, description="Specific required skills")


class MatchRequestPayload(BaseModel):
    proposal_id: Optional[str] = Field("PROP-DEMO-001", description="Unique identifier for proposal")
    project_name: Optional[str] = Field("AI Proposal Generator MVP", description="Project title")
    timeline_weeks: Optional[int] = Field(12, description="Timeline in weeks (nullable if unknown)")
    client_budget: Optional[float] = Field(85000.0, description="Client budget in USD (nullable if unknown)")
    company_static_cost: Optional[float] = Field(100.0, description="Fixed company static overhead cost ($100 default)")
    resource_requirements: Optional[List[ResourceRequirementItem]] = Field(
        default=[
            ResourceRequirementItem(role="Senior Backend Engineer", count=1, minimum_experience=5, skills=["Python", "FastAPI"]),
            ResourceRequirementItem(role="Senior Frontend Engineer", count=1, minimum_experience=3, skills=["React"])
        ],
        description="List of developer roles needed (nullable if unknown)"
    )


@router.post("/match", summary="Run Resource Matching & Cost Estimation")
async def execute_resource_match(
    payload: MatchRequestPayload = Body(
        ...,
        openapi_examples={
            "with_budget": {
                "summary": "Example 1: Client Provided Budget ($85,000)",
                "description": "Standard matching scenario checking against a client budget cap.",
                "value": {
                    "proposal_id": "PROP-DEMO-001",
                    "project_name": "AI Proposal Generator MVP",
                    "timeline_weeks": 12,
                    "client_budget": 85000.0,
                    "company_static_cost": 100.0,
                    "resource_requirements": [
                        {
                            "role": "Senior Backend Engineer",
                            "count": 1,
                            "minimum_experience": 5,
                            "skills": ["Python", "FastAPI"]
                        },
                        {
                            "role": "Senior Frontend Engineer",
                            "count": 1,
                            "minimum_experience": 3,
                            "skills": ["React"]
                        }
                    ]
                }
            },
            "without_budget": {
                "summary": "Example 2: No Client Budget (client_budget: null)",
                "description": "Scenario where client budget is unknown. Calculates and recommends cost automatically.",
                "value": {
                    "proposal_id": "PROP-DEMO-002",
                    "project_name": "Cloud Migration Platform",
                    "timeline_weeks": 16,
                    "client_budget": None,
                    "company_static_cost": 100.0,
                    "resource_requirements": [
                        {
                            "role": "Solutions Architect",
                            "count": 1,
                            "minimum_experience": 8,
                            "skills": ["AWS", "Microservices"]
                        }
                    ]
                }
            }
        }
    )
) -> Dict[str, Any]:
    """
    Executes the Resource Matching & Cost Estimation engine (`matching.py`).

    - Connects directly with PostgreSQL (`Employee` table, `ACTIVE` status).
    - Filters by job role, experience (`minimum_experience`), and skill overlap.
    - Ranks candidates strictly by bench status, global bench, availability, experience, and hourly rate.
    - Computes developer costs across `timeline_weeks` + fixed $100 company static cost.
    - Returns enriched JSON output with budget comparison ready for downstream Proposal Generation.
    """
    try:
        input_dict = payload.model_dump()
        result = match_resources(input_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resource matching engine failed: {str(e)}")


@router.post("/match/db/{proposal_request_id}", summary="Run Resource Matching from Database Request ID")
async def execute_resource_match_from_db(proposal_request_id: str) -> Dict[str, Any]:
    """
    Fetches the saved `extracted_json` (or proposal data) directly from the `ProposalRequest`
    database table by Request UUID or Proposal ID (`PROP-...`) and executes matching.
    """
    try:
        result = match_resources_from_db_request(proposal_request_id)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database match failed: {str(e)}")
