"""
matching.py
-----------
Resource Matching & Cost Estimation Engine

Flow:
1. Receive proposal requirements JSON (from AI Agent extraction or database).
2. Fetch active employees from PostgreSQL database.
3. Match & filter employees based on role, minimum experience, and skill sets.
4. Rank candidates prioritizing bench status, global bench status, and availability.
5. Allocate resources and compute total hours per developer over the timeline.
6. Calculate developer cost and add fixed company static cost ($100 default).
7. Compare total estimated project cost against client budget (if provided).
8. Return enriched JSON payload ready downstream for Proposal Generation.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import uuid
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee, EmploymentStatus


# ==========================================================
# Dataclasses
# ==========================================================

@dataclass
class ResourceRequirement:
    role: str
    count: int
    minimum_experience: int
    skills: List[str] = field(default_factory=list)


@dataclass
class SelectedResource:
    employee_id: str
    name: str
    role: str
    hourly_cost: float
    daily_capacity_hours: int
    allocated_hours: int
    available_hours: int
    bench_status: bool
    global_bench: bool
    estimated_cost: float = 0.0


@dataclass
class ProjectEstimate:
    selected_resources: List[SelectedResource] = field(default_factory=list)
    developer_cost: float = 0.0
    company_static_cost: float = 0.0
    total_project_cost: float = 0.0


# ==========================================================
# Constants
# ==========================================================

WORKING_DAYS_PER_WEEK = 5
DEFAULT_DAILY_CAPACITY = 8
DEFAULT_TIMELINE_WEEKS = 12
FIXED_COMPANY_STATIC_COST = 100.0


# ==========================================================
# Database Fetching
# ==========================================================

def get_employees_from_db(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    Fetch all active employees from the PostgreSQL database (`Employee` table).

    Returns a plain list of dictionaries so the matching
    logic remains independent of SQLAlchemy ORM instances.
    """
    close_db_when_done = False
    if db is None:
        db = SessionLocal()
        close_db_when_done = True

    try:
        developers = (
            db.query(Employee)
            .filter(
                (Employee.employment_status == EmploymentStatus.ACTIVE)
                | (Employee.employment_status == "ACTIVE")
            )
            .all()
        )

        employees = []
        for dev in developers:
            # Parse comma-separated skill string to list
            skills_list = [s.strip() for s in dev.skill_names.split(",") if s.strip()] if dev.skill_names else []

            employees.append(
                {
                    "employee_id": str(dev.id),
                    "name": dev.full_name,
                    "role": dev.designation,
                    "skills": skills_list,
                    "experience": dev.experience_years or dev.years_experience or 0,
                    "hourly_cost": float(dev.hourly_cost),
                    "daily_capacity_hours": dev.daily_capacity_hours or DEFAULT_DAILY_CAPACITY,
                    "allocated_hours": dev.allocated_hours or 0,
                    "available_hours": dev.available_hours or DEFAULT_DAILY_CAPACITY,
                    "bench_status": bool(dev.bench_status),
                    "global_bench": bool(dev.global_bench),
                }
            )

        return employees

    finally:
        if close_db_when_done:
            db.close()


def fetch_proposal_json_from_db(proposal_id_or_request_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Helper to fetch a ProposalRequest from the database and return its `extracted_json`
    payload or structured input dict for resource matching.
    """
    from app.models.proposal_request import ProposalRequest

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Try finding by exact UUID or by checking extracted_json->>'proposal_id'
        req = None
        try:
            req_uuid = uuid.UUID(str(proposal_id_or_request_id))
            req = db.query(ProposalRequest).filter(ProposalRequest.id == req_uuid).first()
        except ValueError:
            pass

        if not req:
            # Check inside JSONB for proposal_id
            requests = db.query(ProposalRequest).all()
            for r in requests:
                if r.extracted_json and r.extracted_json.get("proposal_id") == proposal_id_or_request_id:
                    req = r
                    break

        if not req:
            raise ValueError(f"No proposal request found for identifier: {proposal_id_or_request_id}")

        proposal_data = dict(req.extracted_json) if req.extracted_json else {}
        # Ensure budget and timeline from table fallbacks if missing in extracted_json
        if not proposal_data.get("client_budget") and req.budget:
            proposal_data["client_budget"] = float(req.budget)
        if not proposal_data.get("project_name"):
            proposal_data["project_name"] = req.project_name

        return proposal_data
    finally:
        if close_db:
            db.close()


# ==========================================================
# Employee Filtering
# ==========================================================

def filter_candidates(
    employees: List[Dict[str, Any]],
    requirement: ResourceRequirement,
) -> List[Dict[str, Any]]:
    """
    Filter employees based on:
    1. Role (Exact match or flexible substring match, e.g. 'Backend Engineer' matches 'Senior Backend Engineer')
    2. Minimum experience
    3. Skills alignment if specific required skills are provided

    Uses multi-tiered normalization to match synonyms ('developer' <-> 'engineer') and domain keywords.
    """
    req_role_lower = requirement.role.lower()

    # Normalize synonyms
    normalized_req = req_role_lower.replace("developer", "engineer").replace("programmer", "engineer").replace("specialist", "engineer")

    # Domain keywords to check for overlap if exact strings differ
    domain_keywords = ["backend", "frontend", "fullstack", "devops", "qa", "testing", "cloud", "security", "solutions", "architect", "data", "ai", "ml", "mobile", "ios", "android"]
    req_domains = [kw for kw in domain_keywords if kw in req_role_lower]

    def is_role_match(emp_role: str) -> bool:
        emp_lower = emp_role.lower()
        norm_emp = emp_lower.replace("developer", "engineer").replace("programmer", "engineer").replace("specialist", "engineer")
        if norm_emp == normalized_req or normalized_req in norm_emp or norm_emp in normalized_req:
            return True
        if req_domains and any(domain in emp_lower for domain in req_domains):
            return True
        return False

    # Tier 1: Role match + experience + skill overlap
    tier1 = []
    for emp in employees:
        if not is_role_match(emp["role"]):
            continue
        if emp["experience"] < requirement.minimum_experience:
            continue
        if requirement.skills:
            emp_skills_lower = [s.lower() for s in emp["skills"]]
            req_skills_lower = [s.lower() for s in requirement.skills]
            if any(req_s in emp_skills_lower for req_s in req_skills_lower):
                tier1.append(emp)
        else:
            tier1.append(emp)

    if tier1:
        return tier1

    # Tier 2: Role match + experience (relaxing skill check)
    tier2 = []
    for emp in employees:
        if is_role_match(emp["role"]) and emp["experience"] >= requirement.minimum_experience:
            tier2.append(emp)
    if tier2:
        return tier2

    # Tier 3: Domain / synonym role match (relaxing experience requirements if exact level not available)
    tier3 = []
    for emp in employees:
        if is_role_match(emp["role"]):
            tier3.append(emp)
    if tier3:
        return tier3

    # Tier 4: Skill match (if role wording differed but required skills match e.g. Python/FastAPI)
    if requirement.skills:
        tier4 = []
        req_skills_lower = [s.lower() for s in requirement.skills]
        for emp in employees:
            emp_skills_lower = [s.lower() for s in emp["skills"]]
            if any(req_s in emp_skills_lower for req_s in req_skills_lower):
                tier4.append(emp)
        if tier4:
            return tier4

    return []


# ==========================================================
# Ranking Logic
# ==========================================================

def rank_candidates(
    candidates: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranking Priority:
    1. Bench developers (bench_status == True)
    2. Global bench (global_bench == True)
    3. Highest available hours
    4. Lowest allocated hours
    5. Highest experience
    6. Lowest hourly cost
    """
    candidates.sort(
        key=lambda emp: (
            not emp["bench_status"],
            not emp["global_bench"],
            -emp["available_hours"],
            emp["allocated_hours"],
            -emp["experience"],
            emp["hourly_cost"],
        )
    )
    return candidates


# ==========================================================
# Select Developers
# ==========================================================

def select_resources(
    employees: List[Dict[str, Any]],
    requirement: ResourceRequirement,
) -> List[Dict[str, Any]]:
    """
    Returns the best N developers for a role.
    If no specific candidate matched across tiers, falls back to best ranked available candidates
    to ensure proposal resource allocation is never left empty (`[]`).
    """
    candidates = filter_candidates(employees, requirement)
    if not candidates:
        candidates = list(employees)
    ranked = rank_candidates(candidates)
    return ranked[: requirement.count]


# ==========================================================
# Resource Allocation & Cost Estimation
# ==========================================================

def allocate_resources(
    proposal: Dict[str, Any],
    employees: List[Dict[str, Any]],
) -> ProjectEstimate:
    """
    Allocate the best developers for each required role, calculate total developer cost,
    and incorporate fixed company static overhead.
    """
    estimate = ProjectEstimate()

    # Fixed company cost: default $100 or use provided parameter
    estimate.company_static_cost = float(
        proposal.get("company_static_cost", FIXED_COMPANY_STATIC_COST)
    )

    # Handle nullable timeline from AI extraction (default to 12 weeks if null)
    timeline_weeks = proposal.get("timeline_weeks")
    if not timeline_weeks or int(timeline_weeks) <= 0:
        timeline_weeks = DEFAULT_TIMELINE_WEEKS

    # Handle nullable resource requirements from AI extraction
    resource_reqs_raw = proposal.get("resource_requirements")
    if not resource_reqs_raw:
        # If AI didn't specify resources, auto-default to standard full-stack team
        resource_reqs_raw = [
            {"role": "Backend Engineer", "count": 1, "minimum_experience": 3, "skills": ["Python"]},
            {"role": "Frontend Engineer", "count": 1, "minimum_experience": 2, "skills": ["React"]},
        ]

    total_developer_cost = 0.0

    for resource in resource_reqs_raw:
        requirement = ResourceRequirement(
            role=resource.get("role", "FullStack Engineer"),
            count=int(resource.get("count", 1)),
            minimum_experience=int(resource.get("minimum_experience", 1)),
            skills=resource.get("skills", []),
        )

        selected = select_resources(employees, requirement)

        for emp in selected:
            # Total working hours for the project timeline
            allocated_hours = (
                timeline_weeks
                * WORKING_DAYS_PER_WEEK
                * emp["daily_capacity_hours"]
            )

            estimated_cost = float(allocated_hours * emp["hourly_cost"])
            total_developer_cost += estimated_cost

            estimate.selected_resources.append(
                SelectedResource(
                    employee_id=emp["employee_id"],
                    name=emp["name"],
                    role=emp["role"],
                    hourly_cost=emp["hourly_cost"],
                    daily_capacity_hours=emp["daily_capacity_hours"],
                    allocated_hours=allocated_hours,
                    available_hours=emp["available_hours"],
                    bench_status=emp["bench_status"],
                    global_bench=emp["global_bench"],
                    estimated_cost=estimated_cost,
                )
            )

    estimate.developer_cost = round(total_developer_cost, 2)
    estimate.total_project_cost = round(
        estimate.developer_cost + estimate.company_static_cost, 2
    )

    return estimate


# ==========================================================
# Main Matching Function
# ==========================================================

def match_resources(
    proposal: Dict[str, Any],
    employees: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Main entry point for resource matching and cost estimation.

    Can accept the JSON dictionary from `AgentExtractionResponse` or `ProposalRequest.extracted_json`.
    If `employees` list is not provided, queries active employees directly from PostgreSQL DB.

    Returns the updated, fully populated JSON structure required by Proposal Generator downstream.
    """
    if employees is None:
        employees = get_employees_from_db()

    estimate = allocate_resources(
        proposal=proposal,
        employees=employees,
    )

    resources = []
    for dev in estimate.selected_resources:
        resources.append(
            {
                "employee_id": dev.employee_id,
                "name": dev.name,
                "role": dev.role,
                "hourly_cost": dev.hourly_cost,
                "daily_capacity_hours": dev.daily_capacity_hours,
                "allocated_hours": dev.allocated_hours,
                "available_hours": dev.available_hours,
                "bench_status": dev.bench_status,
                "global_bench": dev.global_bench,
                "estimated_cost": round(dev.estimated_cost, 2),
            }
        )

    # Determine timeline used
    timeline_weeks = proposal.get("timeline_weeks") or DEFAULT_TIMELINE_WEEKS

    # Client budget analysis
    client_budget = proposal.get("client_budget")
    if client_budget is None and proposal.get("budget") is not None:
        client_budget = float(proposal.get("budget"))
    elif client_budget is not None:
        client_budget = float(client_budget)

    is_within_budget = True
    budget_variance_usd = 0.0
    if client_budget is not None:
        is_within_budget = client_budget >= estimate.total_project_cost
        budget_variance_usd = round(client_budget - estimate.total_project_cost, 2)

    # Reconstruct updated resource requirements list if it was null initially
    resource_requirements_used = proposal.get("resource_requirements")
    if not resource_requirements_used:
        resource_requirements_used = [
            {"role": "Backend Engineer", "count": 1, "minimum_experience": 3},
            {"role": "Frontend Engineer", "count": 1, "minimum_experience": 2},
        ]

    return {
        "proposal_id": proposal.get("proposal_id", f"PROP-{uuid.uuid4().hex[:6].upper()}"),
        "project_name": proposal.get("project_name", "Untitled AI Project Proposal"),
        "timeline_weeks": timeline_weeks,
        "client_budget": client_budget,
        "recommended_budget": estimate.total_project_cost if client_budget is None else client_budget,
        "budget": estimate.total_project_cost if client_budget is None else client_budget,
        "resource_requirements": resource_requirements_used,
        "selected_resources": resources,
        "developer_cost": estimate.developer_cost,
        "company_static_cost": estimate.company_static_cost,
        "total_project_cost": estimate.total_project_cost,
        "estimated_cost": estimate.total_project_cost,
        "is_within_budget": is_within_budget,
        "budget_variance_usd": budget_variance_usd,
    }


def match_resources_from_db_request(proposal_request_id: str) -> Dict[str, Any]:
    """
    End-to-end wrapper: fetches proposal requirements JSON from PostgreSQL by request ID,
    runs matching, and returns the updated JSON payload ready for Proposal Generation.
    """
    proposal_json = fetch_proposal_json_from_db(proposal_request_id)
    return match_resources(proposal_json)


# ==========================================================
# Standalone Testing
# ==========================================================

if __name__ == "__main__":
    import json

    # Sample test data mimicking AI Agent Extraction Response
    sample_input = {
        "proposal_id": "PROP-DEMO-001",
        "project_name": "AI Proposal Generator MVP",
        "timeline_weeks": 12,
        "client_budget": 55000.0,
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

    print("\n========================================================")
    print(" 1. Testing Resource Match against REAL PostgreSQL DB ")
    print("========================================================\n")
    try:
        db_result = match_resources(sample_input)
        print("[SUCCESS] Matched successfully using live database candidates:")
        print(json.dumps(db_result, indent=4))
    except Exception as e:
        print(f"[WARNING] Note: DB match encountered an issue or no active DB ({e}).")

    print("\n========================================================")
    print(" 2. Testing Resource Match with NO CLIENT BUDGET (client_budget: None)")
    print("========================================================\n")
    sample_no_budget = dict(sample_input)
    sample_no_budget["client_budget"] = None
    try:
        no_budget_result = match_resources(sample_no_budget)
        print("[SUCCESS] Matched successfully without client budget using live DB candidates:")
        print(json.dumps(no_budget_result, indent=4))
    except Exception as e:
        print(f"[WARNING] Note: DB match encountered an issue ({e}).")

