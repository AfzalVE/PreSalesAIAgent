# """
# matching.py
# -----------
# Resource Matching & Cost Estimation Engine

# Flow:
# 1. Receive proposal requirements JSON (from AI Agent extraction or database).
# 2. Fetch active employees from PostgreSQL database.
# 3. Match & filter employees based on role, minimum experience, and skill sets.
# 4. Rank candidates prioritizing bench status, global bench status, and availability.
# 5. Build TWO variants of the requirement set:
#      - MVP: fewer roles, reduced headcount, shorter timeline.
#      - FULL: all roles, higher experience bar (more senior/skilled matches),
#        optional supporting roles (QA/DevOps) added for scalability, full timeline.
# 6. Allocate resources and compute total hours per developer over each variant's timeline.
# 7. Calculate developer cost per variant. (No fixed/static company overhead is added.)
# 8. Compare each variant's cost against client budget (if provided).
# 9. Return an enriched JSON payload with both "mvp" and "full_project" cost options,
#    ready downstream for Proposal Generation.
# """

# from dataclasses import dataclass, field
# from typing import List, Dict, Any, Optional
# import copy
# import uuid
# from sqlalchemy.orm import Session

# from app.core.database import SessionLocal
# from app.models.employee import Employee, EmploymentStatus


# # ==========================================================
# # Dataclasses
# # ==========================================================

# @dataclass
# class ResourceRequirement:
#     role: str
#     count: int
#     minimum_experience: int
#     skills: List[str] = field(default_factory=list)


# @dataclass
# class SelectedResource:
#     employee_id: str
#     name: str
#     role: str
#     hourly_cost: float
#     daily_capacity_hours: int
#     allocated_hours: int
#     available_hours: int
#     bench_status: bool
#     global_bench: bool
#     estimated_cost: float = 0.0
#     experience_years: int = 0
#     skills: List[str] = field(default_factory=list)


# @dataclass
# class ProjectEstimate:
#     """
#     NOTE: No more `company_static_cost`. Fixed company overhead has been
#     removed entirely — total cost is purely developer cost now.
#     """
#     selected_resources: List[SelectedResource] = field(default_factory=list)
#     developer_cost: float = 0.0
#     total_project_cost: float = 0.0


# # ==========================================================
# # Constants
# # ==========================================================

# WORKING_DAYS_PER_WEEK = 5
# DEFAULT_DAILY_CAPACITY = 8
# DEFAULT_TIMELINE_WEEKS = 12

# # ---- MVP vs FULL tuning knobs (adjust freely, no logic changes needed) ----

# # MVP keeps only the top N roles from resource_requirements (by given order).
# # Set to a high number (e.g. 99) if you don't want role-count trimmed at all.
# MVP_MAX_ROLES = 2

# # MVP reduces headcount per role by this fraction (min 1 dev per role kept).
# MVP_COUNT_REDUCTION_RATIO = 0.5

# # MVP timeline is this fraction of the full timeline (min 2 weeks).
# MVP_TIMELINE_RATIO = 0.5
# MVP_MIN_TIMELINE_WEEKS = 2

# # FULL bumps minimum_experience per role by this many years to force
# # selection of more senior / higher-skilled candidates.
# FULL_EXPERIENCE_BOOST_YEARS = 2

# # FULL automatically adds these supporting roles (if not already present
# # in the client's resource_requirements) to reflect a richer, more scalable
# # build. Set to [] to disable this behavior entirely.
# FULL_EXTRA_ROLES: List[Dict[str, Any]] = [
#     {"role": "QA Engineer", "count": 1, "minimum_experience": 3, "skills": ["Testing", "Automation"]},
#     {"role": "DevOps Engineer", "count": 1, "minimum_experience": 3, "skills": ["AWS", "CI/CD"]},
# ]


# # ==========================================================
# # Database Fetching
# # ==========================================================

# def get_employees_from_db(db: Optional[Session] = None) -> List[Dict[str, Any]]:
#     """
#     Fetch all active employees from the PostgreSQL database (`Employee` table).

#     Returns a plain list of dictionaries so the matching
#     logic remains independent of SQLAlchemy ORM instances.
#     """
#     close_db_when_done = False
#     if db is None:
#         db = SessionLocal()
#         close_db_when_done = True

#     try:
#         developers = (
#             db.query(Employee)
#             .filter(
#                 (Employee.employment_status == EmploymentStatus.ACTIVE)
#                 | (Employee.employment_status == "ACTIVE")
#             )
#             .all()
#         )

#         employees = []
#         for dev in developers:
#             # Parse comma-separated skill string to list
#             skills_list = [s.strip() for s in dev.skill_names.split(",") if s.strip()] if dev.skill_names else []

#             employees.append(
#                 {
#                     "employee_id": str(dev.id),
#                     "name": dev.full_name,
#                     "role": dev.designation,
#                     "skills": skills_list,
#                     "experience": dev.experience_years or dev.years_experience or 0,
#                     "hourly_cost": float(dev.hourly_cost),
#                     "daily_capacity_hours": dev.daily_capacity_hours or DEFAULT_DAILY_CAPACITY,
#                     "allocated_hours": dev.allocated_hours or 0,
#                     "available_hours": dev.available_hours or DEFAULT_DAILY_CAPACITY,
#                     "bench_status": bool(dev.bench_status),
#                     "global_bench": bool(dev.global_bench),
#                 }
#             )

#         return employees

#     finally:
#         if close_db_when_done:
#             db.close()


# def fetch_proposal_json_from_db(proposal_id_or_request_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
#     """
#     Helper to fetch a ProposalRequest from the database and return its `extracted_json`
#     payload or structured input dict for resource matching.
#     """
#     from app.models.proposal_request import ProposalRequest

#     close_db = False
#     if db is None:
#         db = SessionLocal()
#         close_db = True

#     try:
#         # Try finding by exact UUID or by checking extracted_json->>'proposal_id'
#         req = None
#         try:
#             req_uuid = uuid.UUID(str(proposal_id_or_request_id))
#             req = db.query(ProposalRequest).filter(ProposalRequest.id == req_uuid).first()
#         except ValueError:
#             pass

#         if not req:
#             # Check inside JSONB for proposal_id
#             requests = db.query(ProposalRequest).all()
#             for r in requests:
#                 if r.extracted_json and r.extracted_json.get("proposal_id") == proposal_id_or_request_id:
#                     req = r
#                     break

#         if not req:
#             raise ValueError(f"No proposal request found for identifier: {proposal_id_or_request_id}")

#         proposal_data = dict(req.extracted_json) if req.extracted_json else {}
#         # Ensure budget and timeline from table fallbacks if missing in extracted_json
#         if not proposal_data.get("client_budget") and req.budget:
#             proposal_data["client_budget"] = float(req.budget)
#         if not proposal_data.get("project_name"):
#             proposal_data["project_name"] = req.project_name

#         return proposal_data
#     finally:
#         if close_db:
#             db.close()


# # ==========================================================
# # Employee Filtering
# # ==========================================================

# def filter_candidates(
#     employees: List[Dict[str, Any]],
#     requirement: ResourceRequirement,
# ) -> List[Dict[str, Any]]:
#     """
#     Filter employees based on:
#     1. Role (Exact match or flexible substring match, e.g. 'Backend Engineer' matches 'Senior Backend Engineer')
#     2. Minimum experience
#     3. Skills alignment if specific required skills are provided

#     Uses multi-tiered normalization to match synonyms ('developer' <-> 'engineer') and domain keywords.
#     """
#     req_role_lower = requirement.role.lower()

#     # Normalize synonyms
#     normalized_req = req_role_lower.replace("developer", "engineer").replace("programmer", "engineer").replace("specialist", "engineer")

#     # Domain keywords to check for overlap if exact strings differ
#     domain_keywords = ["backend", "frontend", "fullstack", "devops", "qa", "testing", "cloud", "security", "solutions", "architect", "data", "ai", "ml", "mobile", "ios", "android"]
#     req_domains = [kw for kw in domain_keywords if kw in req_role_lower]

#     def is_role_match(emp_role: str) -> bool:
#         emp_lower = emp_role.lower()
#         norm_emp = emp_lower.replace("developer", "engineer").replace("programmer", "engineer").replace("specialist", "engineer")
#         if norm_emp == normalized_req or normalized_req in norm_emp or norm_emp in normalized_req:
#             return True
#         if req_domains and any(domain in emp_lower for domain in req_domains):
#             return True
#         return False

#     # Tier 1: Role match + experience + skill overlap
#     tier1 = []
#     for emp in employees:
#         if not is_role_match(emp["role"]):
#             continue
#         if emp["experience"] < requirement.minimum_experience:
#             continue
#         if requirement.skills:
#             emp_skills_lower = [s.lower() for s in emp["skills"]]
#             req_skills_lower = [s.lower() for s in requirement.skills]
#             if any(req_s in emp_skills_lower for req_s in req_skills_lower):
#                 tier1.append(emp)
#         else:
#             tier1.append(emp)

#     if tier1:
#         return tier1

#     # Tier 2: Role match + experience (relaxing skill check)
#     tier2 = []
#     for emp in employees:
#         if is_role_match(emp["role"]) and emp["experience"] >= requirement.minimum_experience:
#             tier2.append(emp)
#     if tier2:
#         return tier2

#     # Tier 3: Domain / synonym role match (relaxing experience requirements if exact level not available)
#     tier3 = []
#     for emp in employees:
#         if is_role_match(emp["role"]):
#             tier3.append(emp)
#     if tier3:
#         return tier3

#     # Tier 4: Skill match (if role wording differed but required skills match e.g. Python/FastAPI)
#     if requirement.skills:
#         tier4 = []
#         req_skills_lower = [s.lower() for s in requirement.skills]
#         for emp in employees:
#             emp_skills_lower = [s.lower() for s in emp["skills"]]
#             if any(req_s in emp_skills_lower for req_s in req_skills_lower):
#                 tier4.append(emp)
#         if tier4:
#             return tier4

#     return []


# # ==========================================================
# # Ranking Logic
# # ==========================================================

# def rank_candidates(
#     candidates: List[Dict[str, Any]]
# ) -> List[Dict[str, Any]]:
#     """
#     Ranking Priority:
#     1. Bench developers (bench_status == True)
#     2. Global bench (global_bench == True)
#     3. Highest available hours
#     4. Lowest allocated hours
#     5. Highest experience
#     6. Lowest hourly cost
#     """
#     candidates.sort(
#         key=lambda emp: (
#             not emp["bench_status"],
#             not emp["global_bench"],
#             -emp["available_hours"],
#             emp["allocated_hours"],
#             -emp["experience"],
#             emp["hourly_cost"],
#         )
#     )
#     return candidates


# # ==========================================================
# # Select Developers
# # ==========================================================

# def select_resources(
#     employees: List[Dict[str, Any]],
#     requirement: ResourceRequirement,
# ) -> List[Dict[str, Any]]:
#     """
#     Returns the best N developers for a role.
#     If no specific candidate matched across tiers, falls back to best ranked available candidates
#     to ensure proposal resource allocation is never left empty (`[]`).
#     """
#     candidates = filter_candidates(employees, requirement)
#     if not candidates:
#         candidates = list(employees)
#     ranked = rank_candidates(candidates)
#     return ranked[: requirement.count]


# # ==========================================================
# # MVP / FULL Requirement Variant Builders
# # ==========================================================

# def _default_resource_requirements() -> List[Dict[str, Any]]:
#     """Fallback team used only when the client/AI extraction gave no roles at all."""
#     return [
#         {"role": "Backend Engineer", "count": 1, "minimum_experience": 3, "skills": ["Python"]},
#         {"role": "Frontend Engineer", "count": 1, "minimum_experience": 2, "skills": ["React"]},
#     ]


# def build_mvp_requirements(resource_requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
#     """
#     Build a lean MVP requirement set:
#     - Keep only the first MVP_MAX_ROLES roles (core workflows only).
#     - Reduce headcount per role by MVP_COUNT_REDUCTION_RATIO (never below 1).
#     - Experience / skills requirements are left as-is (still need competent devs,
#       just fewer of them and fewer roles).
#     """
#     trimmed_roles = resource_requirements[:MVP_MAX_ROLES]
#     mvp_requirements = []
#     for res in trimmed_roles:
#         res = copy.deepcopy(res)
#         original_count = int(res.get("count", 1))
#         reduced_count = max(1, round(original_count * MVP_COUNT_REDUCTION_RATIO))
#         res["count"] = reduced_count
#         mvp_requirements.append(res)
#     return mvp_requirements


# def build_full_requirements(resource_requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
#     """
#     Build a full-scope requirement set:
#     - Keep ALL roles as given (full headcount, no trimming).
#     - Bump minimum_experience by FULL_EXPERIENCE_BOOST_YEARS to bias matching
#       toward more senior / higher-skilled candidates.
#     - Add supporting roles (QA/DevOps etc.) from FULL_EXTRA_ROLES if the client
#       didn't already request them, to reflect richer integrations & scalable infra.
#     """
#     full_requirements = []
#     existing_roles_lower = set()

#     for res in resource_requirements:
#         res = copy.deepcopy(res)
#         res["minimum_experience"] = int(res.get("minimum_experience", 1)) + FULL_EXPERIENCE_BOOST_YEARS
#         full_requirements.append(res)
#         existing_roles_lower.add(str(res.get("role", "")).lower())

#     for extra_role in FULL_EXTRA_ROLES:
#         if extra_role["role"].lower() not in existing_roles_lower:
#             full_requirements.append(copy.deepcopy(extra_role))

#     return full_requirements


# def _build_variant_proposal(proposal: Dict[str, Any], variant: str) -> Dict[str, Any]:
#     """
#     Returns a shallow-copied proposal dict with resource_requirements and
#     timeline_weeks swapped out for either the "mvp" or "full" variant.
#     """
#     variant_proposal = dict(proposal)

#     base_requirements = proposal.get("resource_requirements") or _default_resource_requirements()

#     base_timeline = proposal.get("timeline_weeks")
#     if not base_timeline or int(base_timeline) <= 0:
#         base_timeline = DEFAULT_TIMELINE_WEEKS
#     base_timeline = int(base_timeline)

#     if variant == "mvp":
#         variant_proposal["resource_requirements"] = build_mvp_requirements(base_requirements)
#         variant_proposal["timeline_weeks"] = max(
#             MVP_MIN_TIMELINE_WEEKS, round(base_timeline * MVP_TIMELINE_RATIO)
#         )
#     elif variant == "full":
#         variant_proposal["resource_requirements"] = build_full_requirements(base_requirements)
#         variant_proposal["timeline_weeks"] = base_timeline
#     else:
#         raise ValueError(f"Unknown variant: {variant}")

#     return variant_proposal


# # ==========================================================
# # Resource Allocation & Cost Estimation
# # ==========================================================

# def allocate_resources(
#     proposal: Dict[str, Any],
#     employees: List[Dict[str, Any]],
# ) -> ProjectEstimate:
#     """
#     Allocate the best developers for each required role and calculate total
#     developer cost. No fixed/static company overhead is added anymore —
#     total_project_cost is purely a function of matched developer cost.
#     """
#     estimate = ProjectEstimate()

#     timeline_weeks = proposal.get("timeline_weeks")
#     if not timeline_weeks or int(timeline_weeks) <= 0:
#         timeline_weeks = DEFAULT_TIMELINE_WEEKS

#     resource_reqs_raw = proposal.get("resource_requirements") or _default_resource_requirements()

#     total_developer_cost = 0.0

#     for resource in resource_reqs_raw:
#         requirement = ResourceRequirement(
#             role=resource.get("role", "FullStack Engineer"),
#             count=int(resource.get("count", 1)),
#             minimum_experience=int(resource.get("minimum_experience", 1)),
#             skills=resource.get("skills", []),
#         )

#         selected = select_resources(employees, requirement)

#         for emp in selected:
#             # Total working hours for the project timeline
#             allocated_hours = (
#                 timeline_weeks
#                 * WORKING_DAYS_PER_WEEK
#                 * emp["daily_capacity_hours"]
#             )

#             estimated_cost = float(allocated_hours * emp["hourly_cost"])
#             total_developer_cost += estimated_cost

#             estimate.selected_resources.append(
#                 SelectedResource(
#                     employee_id=emp["employee_id"],
#                     name=emp["name"],
#                     role=emp["role"],
#                     hourly_cost=emp["hourly_cost"],
#                     daily_capacity_hours=emp["daily_capacity_hours"],
#                     allocated_hours=allocated_hours,
#                     available_hours=emp["available_hours"],
#                     bench_status=emp["bench_status"],
#                     global_bench=emp["global_bench"],
#                     estimated_cost=estimated_cost,
#                     experience_years=emp["experience"],
#                     skills=emp["skills"],
#                 )
#             )

#     estimate.developer_cost = round(total_developer_cost, 2)
#     # Total cost == developer cost. No company static overhead added.
#     estimate.total_project_cost = estimate.developer_cost

#     return estimate


# def _estimate_to_json(estimate: ProjectEstimate, timeline_weeks: int, resource_requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
#     resources = []
#     for dev in estimate.selected_resources:
#         resources.append(
#             {
#                 "employee_id": dev.employee_id,
#                 "name": dev.name,
#                 "role": dev.role,
#                 "hourly_cost": dev.hourly_cost,
#                 "daily_capacity_hours": dev.daily_capacity_hours,
#                 "allocated_hours": dev.allocated_hours,
#                 "available_hours": dev.available_hours,
#                 "bench_status": dev.bench_status,
#                 "global_bench": dev.global_bench,
#                 "estimated_cost": round(dev.estimated_cost, 2),
#                 "experience_years": dev.experience_years,
#                 "skills": dev.skills,
#             }
#         )

#     return {
#         "timeline_weeks": timeline_weeks,
#         "resource_requirements": resource_requirements,
#         "selected_resources": resources,
#         "developer_cost": estimate.developer_cost,
#         "total_project_cost": estimate.total_project_cost,
#         "estimated_cost": estimate.total_project_cost,
#     }


# # ==========================================================
# # Main Matching Function
# # ==========================================================

# def match_resources(
#     proposal: Dict[str, Any],
#     employees: Optional[List[Dict[str, Any]]] = None,
# ) -> Dict[str, Any]:
#     """
#     Main entry point for resource matching and cost estimation.

#     Can accept the JSON dictionary from `AgentExtractionResponse` or `ProposalRequest.extracted_json`.
#     If `employees` list is not provided, queries active employees directly from PostgreSQL DB.

#     Returns a JSON structure containing TWO cost options:
#       - "mvp": lean MVP scope (fewer roles/headcount, shorter timeline)
#       - "full_project": full scope (all roles, higher-skilled matches, extra
#         supporting roles, full timeline)
#     No fixed company static cost is included in either option anymore.
#     """
#     if employees is None:
#         employees = get_employees_from_db()

#     mvp_proposal = _build_variant_proposal(proposal, "mvp")
#     full_proposal = _build_variant_proposal(proposal, "full")

#     mvp_estimate = allocate_resources(mvp_proposal, employees)
#     full_estimate = allocate_resources(full_proposal, employees)

#     mvp_json = _estimate_to_json(
#         mvp_estimate, mvp_proposal["timeline_weeks"], mvp_proposal["resource_requirements"]
#     )
#     full_json = _estimate_to_json(
#         full_estimate, full_proposal["timeline_weeks"], full_proposal["resource_requirements"]
#     )

#     # Client budget analysis (compared against both options independently)
#     client_budget = proposal.get("client_budget")
#     if client_budget is None and proposal.get("budget") is not None:
#         client_budget = float(proposal.get("budget"))
#     elif client_budget is not None:
#         client_budget = float(client_budget)

#     for option_json in (mvp_json, full_json):
#         if client_budget is not None:
#             option_json["is_within_budget"] = client_budget >= option_json["total_project_cost"]
#             option_json["budget_variance_usd"] = round(client_budget - option_json["total_project_cost"], 2)
#         else:
#             option_json["is_within_budget"] = True
#             option_json["budget_variance_usd"] = 0.0

#     return {
#         "proposal_id": proposal.get("proposal_id", f"PROP-{uuid.uuid4().hex[:6].upper()}"),
#         "project_name": proposal.get("project_name", "Untitled AI Project Proposal"),
#         "client_budget": client_budget,
#         "mvp": mvp_json,
#         "full_project": full_json,
#     }


# def match_resources_from_db_request(proposal_request_id: str) -> Dict[str, Any]:
#     """
#     End-to-end wrapper: fetches proposal requirements JSON from PostgreSQL by request ID,
#     runs matching, and returns the updated JSON payload ready for Proposal Generation.
#     """
#     proposal_json = fetch_proposal_json_from_db(proposal_request_id)
#     return match_resources(proposal_json)


# # ==========================================================
# # Standalone Testing
# # ==========================================================

# if __name__ == "__main__":
#     import json

#     # Sample test data mimicking AI Agent Extraction Response
#     sample_input = {
#         "proposal_id": "PROP-DEMO-001",
#         "project_name": "AI Proposal Generator MVP",
#         "timeline_weeks": 12,
#         "client_budget": 55000.0,
#         "resource_requirements": [
#             {
#                 "role": "Senior Backend Engineer",
#                 "count": 1,
#                 "minimum_experience": 5,
#                 "skills": ["Python", "FastAPI"]
#             },
#             {
#                 "role": "Senior Frontend Engineer",
#                 "count": 1,
#                 "minimum_experience": 3,
#                 "skills": ["React"]
#             }
#         ]
#     }

#     print("\n========================================================")
#     print(" 1. Testing MVP + Full Resource Match against REAL PostgreSQL DB ")
#     print("========================================================\n")
#     try:
#         db_result = match_resources(sample_input)
#         print("[SUCCESS] Matched successfully using live database candidates:")
#         print(json.dumps(db_result, indent=4))
#     except Exception as e:
#         print(f"[WARNING] Note: DB match encountered an issue or no active DB ({e}).")

#     print("\n========================================================")
#     print(" 2. Testing Resource Match with NO CLIENT BUDGET (client_budget: None)")
#     print("========================================================\n")
#     sample_no_budget = dict(sample_input)
#     sample_no_budget["client_budget"] = None
#     try:
#         no_budget_result = match_resources(sample_no_budget)
#         print("[SUCCESS] Matched successfully without client budget using live DB candidates:")
#         print(json.dumps(no_budget_result, indent=4))
#     except Exception as e:
#         print(f"[WARNING] Note: DB match encountered an issue ({e}).")
"""
matching.py
-----------
Resource Matching & Cost Estimation Engine

Flow:
1. Receive proposal requirements JSON (from AI Agent extraction or database).
2. Fetch active employees from PostgreSQL database.
3. Match & filter employees based on role, minimum experience, and skill sets.
4. Rank candidates prioritizing bench status, global bench status, and availability.
5. Build TWO variants of the requirement set:
     - MVP: fewer roles, reduced headcount, shorter timeline.
     - FULL: all roles, higher experience bar (more senior/skilled matches),
       optional supporting roles (QA/DevOps) added for scalability, full timeline.
6. Allocate resources and compute total hours per developer over each variant's timeline.
7. Calculate developer cost per variant. (No fixed/static company overhead is added.)
8. Compare each variant's cost against client budget (if provided).
9. Return an enriched JSON payload with both "mvp" and "full_project" cost options,
   ready downstream for Proposal Generation.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import copy
import uuid
import csv
import os
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
    experience_years: int = 0
    skills: List[str] = field(default_factory=list)


@dataclass
class ProjectEstimate:
    """
    NOTE: No more `company_static_cost`. Fixed company overhead has been
    removed entirely — total cost is purely developer cost now.
    """
    selected_resources: List[SelectedResource] = field(default_factory=list)
    developer_cost: float = 0.0
    total_project_cost: float = 0.0


# ==========================================================
# Constants
# ==========================================================

WORKING_DAYS_PER_WEEK = 5
DEFAULT_DAILY_CAPACITY = 8
DEFAULT_TIMELINE_WEEKS = 12

# ---- MVP vs FULL tuning knobs (adjust freely, no logic changes needed) ----

# MVP keeps only the top N roles from resource_requirements (by given order).
# Set to a high number (e.g. 99) if you don't want role-count trimmed at all.
MVP_MAX_ROLES = 2

# MVP reduces headcount per role by this fraction (min 1 dev per role kept).
MVP_COUNT_REDUCTION_RATIO = 0.5

# MVP timeline is this fraction of the full timeline (min 2 weeks).
MVP_TIMELINE_RATIO = 0.5
MVP_MIN_TIMELINE_WEEKS = 2

# FULL bumps minimum_experience per role by this many years to force
# selection of more senior / higher-skilled candidates.
FULL_EXPERIENCE_BOOST_YEARS = 2

# FULL automatically adds these supporting roles (if not already present
# in the client's resource_requirements) to reflect a richer, more scalable
# build. Set to [] to disable this behavior entirely.
FULL_EXTRA_ROLES: List[Dict[str, Any]] = [
    {"role": "QA Engineer", "count": 1, "minimum_experience": 3, "skills": ["Testing", "Automation"]},
    {"role": "DevOps Engineer", "count": 1, "minimum_experience": 3, "skills": ["AWS", "CI/CD"]},
]


# ==========================================================
# Database Fetching
# ==========================================================

def get_employees_from_db(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    Fetch all active employees from employees.csv file.

    Returns a plain list of dictionaries so the matching
    logic remains independent of SQLAlchemy ORM instances.
    """
    print("Fetching employee for calculating budget from CSV")
    employees = []
    
    # Path to employees.csv in the same directory
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "employees.csv"))
    
    try:
        with open(csv_path, mode="r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                status = row.get("employment_status", "").upper()
                if status == "ACTIVE":
                    # Parse comma-separated skill string to list
                    skill_names = row.get("skill_names", "")
                    skills_list = [s.strip() for s in skill_names.split(",") if s.strip()] if skill_names else []

                    experience = int(row.get("experience_years") or row.get("years_experience") or 0)
                    hourly_cost = float(row.get("hourly_cost") or 0.0)
                    
                    try:
                        daily_capacity_hours = int(row.get("daily_capacity_hours") or 8)
                    except:
                        daily_capacity_hours = 8
                        
                    try:
                        allocated_hours = int(row.get("allocated_hours") or 0)
                    except:
                        allocated_hours = 0
                        
                    try:
                        available_hours = int(row.get("available_hours") or 8)
                    except:
                        available_hours = 8

                    bench_status = str(row.get("bench_status", "")).lower() == "true"
                    global_bench = str(row.get("global_bench", "")).lower() == "true"

                    employees.append(
                        {
                            "employee_id": str(row.get("id")),
                            "name": row.get("full_name"),
                            "role": row.get("designation"),
                            "skills": skills_list,
                            "experience": experience,
                            "hourly_cost": hourly_cost,
                            "daily_capacity_hours": daily_capacity_hours,
                            "allocated_hours": allocated_hours,
                            "available_hours": available_hours,
                            "bench_status": bench_status,
                            "global_bench": global_bench,
                        }
                    )
        print("Employees fetched from CSV")
        return employees

    except Exception as e:
        print(f"Error reading employees.csv: {e}")
        return []


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
        print(tier1)
        return tier1

    # Tier 2: Role match + experience (relaxing skill check)
    tier2 = []
    for emp in employees:
        if is_role_match(emp["role"]) and emp["experience"] >= requirement.minimum_experience:
            tier2.append(emp)
    if tier2:
        print(tier2)
        return tier2

    # Tier 3: Domain / synonym role match (relaxing experience requirements if exact level not available)
    tier3 = []
    for emp in employees:
        if is_role_match(emp["role"]):
            tier3.append(emp)
    if tier3:
        print(tier3)
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
            print(tier4)
            return tier4

    return []


# ==========================================================
# Ranking Logic
# ==========================================================

def rank_candidates(
    candidates: List[Dict[str, Any]],
    mode: str = "balanced",
) -> List[Dict[str, Any]]:
    """
    Ranking Priority depends on `mode`:

    - "balanced" (default/original behavior):
        1. Bench developers, 2. Global bench, 3. Highest available hours,
        4. Lowest allocated hours, 5. Highest experience, 6. Lowest hourly cost.

    - "cost_efficient" (used for MVP — minimize cost, junior/mid devs are fine
      as long as they meet the role's minimum experience):
        1. Bench developers, 2. Global bench, 3. Lowest hourly cost,
        4. Highest available hours, 5. Lowest allocated hours,
        6. Lowest experience (just enough to meet the bar, not over-qualified).

    - "high_skill" (used for Full — pick the most senior/skilled devs
      available, cost is secondary):
        1. Bench developers, 2. Global bench, 3. Highest experience,
        4. Highest available hours, 5. Lowest allocated hours,
        6. Lowest hourly cost (tiebreaker only).
    """
    if mode == "cost_efficient":
        candidates.sort(
            key=lambda emp: (
                not emp["bench_status"],
                not emp["global_bench"],
                emp["hourly_cost"],
                -emp["available_hours"],
                emp["allocated_hours"],
                emp["experience"],
            )
        )
    elif mode == "high_skill":
        candidates.sort(
            key=lambda emp: (
                not emp["bench_status"],
                not emp["global_bench"],
                -emp["experience"],
                -emp["available_hours"],
                emp["allocated_hours"],
                emp["hourly_cost"],
            )
        )
    else:
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
    print("Ranked candidates:", candidates)
    return candidates


# ==========================================================
# Select Developers
# ==========================================================

def select_resources(
    employees: List[Dict[str, Any]],
    requirement: ResourceRequirement,
    mode: str = "balanced",
    exclude_ids: Optional[set] = None,
) -> List[Dict[str, Any]]:
    """
    Returns the best N developers for a role, ranked according to `mode`
    ("balanced" / "cost_efficient" / "high_skill" — see rank_candidates).

    If `exclude_ids` is given, those employees are preferred to be left out
    (e.g. so the Full-project team doesn't just reuse the MVP team) — but
    only when enough other qualified candidates exist; otherwise the
    exclusion is dropped so a role is never left unstaffed.

    If no specific candidate matched across tiers, falls back to best ranked
    available candidates to ensure proposal resource allocation is never
    left empty (`[]`).
    """
    candidates = filter_candidates(employees, requirement)
    if not candidates:
        candidates = list(employees)

    if exclude_ids:
        remaining = [c for c in candidates if c["employee_id"] not in exclude_ids]
        if len(remaining) >= requirement.count:
            candidates = remaining

    ranked = rank_candidates(candidates, mode=mode)
    return ranked[: requirement.count]


# ==========================================================
# MVP / FULL Requirement Variant Builders
# ==========================================================

def _default_resource_requirements() -> List[Dict[str, Any]]:
    """Fallback team used only when the client/AI extraction gave no roles at all."""
    return [
        {"role": "Backend Engineer", "count": 1, "minimum_experience": 3, "skills": ["Python"]},
        {"role": "Frontend Engineer", "count": 1, "minimum_experience": 2, "skills": ["React"]},
    ]


def build_mvp_requirements(resource_requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Build a lean MVP requirement set:
    - Keep only the first MVP_MAX_ROLES roles (core workflows only).
    - Reduce headcount per role by MVP_COUNT_REDUCTION_RATIO (never below 1).
    - Experience / skills requirements are left as-is (still need competent devs,
      just fewer of them and fewer roles).
    """
    trimmed_roles = resource_requirements[:MVP_MAX_ROLES]
    mvp_requirements = []
    for res in trimmed_roles:
        res = copy.deepcopy(res)
        original_count = int(res.get("count", 1))
        reduced_count = max(1, round(original_count * MVP_COUNT_REDUCTION_RATIO))
        res["count"] = reduced_count
        mvp_requirements.append(res)
    return mvp_requirements


def build_full_requirements(resource_requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Build a full-scope requirement set:
    - Keep ALL roles as given (full headcount, no trimming).
    - Bump minimum_experience by FULL_EXPERIENCE_BOOST_YEARS to bias matching
      toward more senior / higher-skilled candidates.
    - Add supporting roles (QA/DevOps etc.) from FULL_EXTRA_ROLES if the client
      didn't already request them, to reflect richer integrations & scalable infra.
    """
    full_requirements = []
    existing_roles_lower = set()

    for res in resource_requirements:
        res = copy.deepcopy(res)
        res["minimum_experience"] = int(res.get("minimum_experience", 1)) + FULL_EXPERIENCE_BOOST_YEARS
        full_requirements.append(res)
        existing_roles_lower.add(str(res.get("role", "")).lower())

    for extra_role in FULL_EXTRA_ROLES:
        if extra_role["role"].lower() not in existing_roles_lower:
            full_requirements.append(copy.deepcopy(extra_role))

    return full_requirements


def _build_variant_proposal(proposal: Dict[str, Any], variant: str) -> Dict[str, Any]:
    """
    Returns a shallow-copied proposal dict with resource_requirements and
    timeline_weeks swapped out for either the "mvp" or "full" variant.
    """
    variant_proposal = dict(proposal)

    base_requirements = proposal.get("resource_requirements") or _default_resource_requirements()

    base_timeline = proposal.get("timeline_weeks")
    if not base_timeline or int(base_timeline) <= 0:
        base_timeline = DEFAULT_TIMELINE_WEEKS
    base_timeline = int(base_timeline)

    if variant == "mvp":
        variant_proposal["resource_requirements"] = build_mvp_requirements(base_requirements)
        variant_proposal["timeline_weeks"] = max(
            MVP_MIN_TIMELINE_WEEKS, round(base_timeline * MVP_TIMELINE_RATIO)
        )
    elif variant == "full":
        variant_proposal["resource_requirements"] = build_full_requirements(base_requirements)
        variant_proposal["timeline_weeks"] = base_timeline
    else:
        raise ValueError(f"Unknown variant: {variant}")

    return variant_proposal


# ==========================================================
# Resource Allocation & Cost Estimation
# ==========================================================

def allocate_resources(
    proposal: Dict[str, Any],
    employees: List[Dict[str, Any]],
    mode: str = "balanced",
    exclude_ids: Optional[set] = None,
) -> ProjectEstimate:
    """
    Allocate the best developers for each required role and calculate total
    developer cost. No fixed/static company overhead is added anymore —
    total_project_cost is purely a function of matched developer cost.

    `mode` controls ranking strategy ("cost_efficient" for MVP, "high_skill"
    for Full). `exclude_ids` lets a second allocation call (e.g. Full) avoid
    re-picking developers already committed to a first call (e.g. MVP),
    subject to availability.
    """
    estimate = ProjectEstimate()

    timeline_weeks = proposal.get("timeline_weeks")
    if not timeline_weeks or int(timeline_weeks) <= 0:
        timeline_weeks = DEFAULT_TIMELINE_WEEKS

    resource_reqs_raw = proposal.get("resource_requirements") or _default_resource_requirements()

    total_developer_cost = 0.0
    already_picked_in_this_call = set(exclude_ids) if exclude_ids else set()

    for resource in resource_reqs_raw:
        requirement = ResourceRequirement(
            role=resource.get("role", "FullStack Engineer"),
            count=int(resource.get("count", 1)),
            minimum_experience=int(resource.get("minimum_experience", 1)),
            skills=resource.get("skills", []),
        )

        selected = select_resources(
            employees, requirement, mode=mode, exclude_ids=already_picked_in_this_call
        )
        already_picked_in_this_call.update(emp["employee_id"] for emp in selected)

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
                    experience_years=emp["experience"],
                    skills=emp["skills"],
                )
            )

    estimate.developer_cost = round(total_developer_cost, 2)
    # Total cost == developer cost. No company static overhead added.
    estimate.total_project_cost = estimate.developer_cost

    return estimate


def _estimate_to_json(estimate: ProjectEstimate, timeline_weeks: int, resource_requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
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
                "experience_years": dev.experience_years,
                "skills": dev.skills,
            }
        )

    return {
        "timeline_weeks": timeline_weeks,
        "resource_requirements": resource_requirements,
        "selected_resources": resources,
        "developer_cost": estimate.developer_cost,
        "total_project_cost": estimate.total_project_cost,
        "estimated_cost": estimate.total_project_cost,
    }


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

    Returns a JSON structure containing TWO cost options:
      - "mvp": lean MVP scope (fewer roles/headcount, shorter timeline)
      - "full_project": full scope (all roles, higher-skilled matches, extra
        supporting roles, full timeline)
    No fixed company static cost is included in either option anymore.
    """
    if employees is None:
        employees = get_employees_from_db()

    mvp_proposal = _build_variant_proposal(proposal, "mvp")
    full_proposal = _build_variant_proposal(proposal, "full")

    # MVP: cheapest devs that still meet the (unboosted) minimum experience —
    # keeps cost minimal, matching the "lean MVP" brief.
    mvp_estimate = allocate_resources(mvp_proposal, employees, mode="cost_efficient")

    # Full: most experienced/highest-skilled devs available, and avoid
    # reusing anyone already committed to the MVP team where possible —
    # matching the "richer, more efficient, high-skilled" brief.
    mvp_employee_ids = {r.employee_id for r in mvp_estimate.selected_resources}
    full_estimate = allocate_resources(
        full_proposal, employees, mode="high_skill", exclude_ids=mvp_employee_ids
    )

    mvp_json = _estimate_to_json(
        mvp_estimate, mvp_proposal["timeline_weeks"], mvp_proposal["resource_requirements"]
    )
    full_json = _estimate_to_json(
        full_estimate, full_proposal["timeline_weeks"], full_proposal["resource_requirements"]
    )

    # Client budget analysis (compared against both options independently)
    client_budget = proposal.get("client_budget")
    if client_budget is None and proposal.get("budget") is not None:
        client_budget = float(proposal.get("budget"))
    elif client_budget is not None:
        client_budget = float(client_budget)

    for option_json in (mvp_json, full_json):
        if client_budget is not None:
            option_json["is_within_budget"] = client_budget >= option_json["total_project_cost"]
            option_json["budget_variance_usd"] = round(client_budget - option_json["total_project_cost"], 2)
        else:
            option_json["is_within_budget"] = True
            option_json["budget_variance_usd"] = 0.0

    return {
        "proposal_id": proposal.get("proposal_id", f"PROP-{uuid.uuid4().hex[:6].upper()}"),
        "project_name": proposal.get("project_name", "Untitled AI Project Proposal"),
        "client_budget": client_budget,
        "mvp": mvp_json,
        "full_project": full_json,
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
    print(" 1. Testing MVP + Full Resource Match against REAL PostgreSQL DB ")
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