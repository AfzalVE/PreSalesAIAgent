"""
matching.py
-----------
Resource Matching & Cost Estimation Engine

Flow:
1. Receive proposal requirements JSON (from AI Agent extraction or database).
2. Fetch active employees from employees.csv (cached in-memory, see below).
3. Match & filter employees based on role, minimum experience, and skill sets.
4. Rank candidates prioritizing cost / bench status / global bench / availability.
5. Build TWO variants of the requirement set:
     - MVP: fewer roles, reduced headcount, shorter timeline.
     - FULL: all roles, higher experience bar (more senior/skilled matches),
       optional supporting roles (QA/DevOps) added for scalability, full timeline.
6. Allocate resources and compute total hours per developer over each variant's timeline.
7. Calculate developer cost per variant. (No fixed/static company overhead is added.)
8. Compare each variant's cost against client budget (if provided).
9. Return an enriched JSON payload with both "mvp" and "full_project" cost options,
   ready downstream for Proposal Generation.

PERFORMANCE NOTES (this pass):
- employees.csv is now cached in-process, keyed on the file's mtime, instead
  of being re-read and re-parsed from disk on every single call to
  `get_employees_from_db`. `match_resources` previously triggered this once
  per request; under any real traffic that's a lot of repeated disk + CSV
  parsing work for data that rarely changes.
- Verbose `print()` calls inside hot loops (per-candidate, per-role) have
  been replaced with `logger.debug(...)` using lazy %-style interpolation,
  so the formatting cost disappears entirely when debug logging is off.
  The worst offender — dumping the *entire* ranked candidate list on every
  call to `rank_candidates` — has been removed outright, since it's O(n)
  string building for output nobody reads in production.
- Static per-call lookups (domain keyword list, synonym replacements) are
  now module-level constants instead of being rebuilt on every
  `filter_candidates` invocation.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import copy
import logging
import os
import uuid
import csv
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee, EmploymentStatus

logger = logging.getLogger(__name__)


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
    match_tier: int = 1
    shared_with_mvp: bool = False


@dataclass
class ProjectEstimate:
    """
    NOTE: No more `company_static_cost`. Fixed company overhead has been
    removed entirely — total cost is purely developer cost now.
    """
    selected_resources: List[SelectedResource] = field(default_factory=list)
    unfulfilled_roles: List[Dict[str, Any]] = field(default_factory=list)
    developer_cost: float = 0.0
    total_project_cost: float = 0.0
    budget_overrun_warning: Optional[str] = None


# ==========================================================
# Constants
# ==========================================================

WORKING_DAYS_PER_WEEK = 5
DEFAULT_DAILY_CAPACITY = 8
DEFAULT_TIMELINE_WEEKS = 12

# Precomputed once instead of rebuilt on every filter_candidates() call.
_ROLE_SYNONYMS = (("developer", "engineer"), ("programmer", "engineer"), ("specialist", "engineer"))
_DOMAIN_KEYWORDS = (
    "backend", "frontend", "fullstack", "devops", "qa", "testing", "cloud",
    "security", "solutions", "architect", "data", "ai", "ml", "mobile",
    "ios", "android",
)


def _normalize_role(role: str) -> str:
    normalized = role.lower()
    for old, new in _ROLE_SYNONYMS:
        normalized = normalized.replace(old, new)
    return normalized


# ==========================================================
# Database Fetching (with in-process cache)
# ==========================================================

_CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "employees.csv"))
_employee_cache: Dict[str, Any] = {"mtime": None, "data": None}


def _parse_employees_csv(csv_path: str) -> List[Dict[str, Any]]:
    employees: List[Dict[str, Any]] = []
    with open(csv_path, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            status = row.get("employment_status", "").upper()
            if status != "ACTIVE":
                continue
            try:
                skill_names = row.get("skill_names", "")
                skills_list = [s.strip() for s in skill_names.split(",") if s.strip()] if skill_names else []

                experience = int(row.get("experience_years") or row.get("years_experience") or 0)
                hourly_cost = float(row.get("hourly_cost") or 0.0)

                try:
                    daily_capacity_hours = int(row.get("daily_capacity_hours") or 8)
                except (TypeError, ValueError):
                    daily_capacity_hours = 8

                try:
                    allocated_hours = int(row.get("allocated_hours") or 0)
                except (TypeError, ValueError):
                    allocated_hours = 0

                try:
                    available_hours = int(row.get("available_hours") or 8)
                except (TypeError, ValueError):
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
            except (ValueError, TypeError) as e:
                logger.warning("Skipping malformed employee row %s: %s", row.get("id"), e)
                continue
    return employees


def get_employees_from_db(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    Fetch all active employees from employees.csv, cached in-process and
    only re-read when the file's mtime changes. Returns a plain list of
    dictionaries so the matching logic remains independent of any ORM.

    NOTE: callers must treat the returned list/dicts as read-only — mutate
    copies (`dict(emp)`), not the entries themselves, since the same cached
    objects are shared across calls until the file changes.
    """
    try:
        mtime = os.path.getmtime(_CSV_PATH)
    except OSError as e:
        logger.error("employees.csv not found at %s: %s", _CSV_PATH, e)
        return _employee_cache["data"] or []

    if _employee_cache["data"] is not None and _employee_cache["mtime"] == mtime:
        logger.debug("Using cached employees.csv data (%d active employees)", len(_employee_cache["data"]))
        return _employee_cache["data"]

    logger.info("Loading employees.csv from disk (cache miss / file changed)")
    try:
        employees = _parse_employees_csv(_CSV_PATH)
    except Exception as e:
        logger.error("Error reading employees.csv: %s", e)
        return _employee_cache["data"] or []

    _employee_cache["data"] = employees
    _employee_cache["mtime"] = mtime
    return employees


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
        req = None
        try:
            req_uuid = uuid.UUID(str(proposal_id_or_request_id))
            req = db.query(ProposalRequest).filter(ProposalRequest.id == req_uuid).first()
        except ValueError:
            pass

        if not req:
            # Fallback lookup by JSONB proposal_id. NOTE: for high employee/
            # request volumes this should be replaced with a JSONB containment
            # query (e.g. `ProposalRequest.extracted_json['proposal_id'].astext == ...`)
            # so Postgres can filter server-side instead of loading every row.
            req = (
                db.query(ProposalRequest)
                .filter(ProposalRequest.extracted_json["proposal_id"].astext == str(proposal_id_or_request_id))
                .first()
            )

        if not req:
            raise ValueError(f"No proposal request found for identifier: {proposal_id_or_request_id}")

        proposal_data = dict(req.extracted_json) if req.extracted_json else {}
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
    1. Availability (must have available_hours > 0)
    2. Skills alignment (Primary)
    3. Role match (Secondary)
    4. Minimum experience
    """
    normalized_req = _normalize_role(requirement.role)
    req_role_lower = requirement.role.lower()
    req_domains = [kw for kw in _DOMAIN_KEYWORDS if kw in req_role_lower]

    def is_role_match(emp_role: str) -> bool:
        norm_emp = _normalize_role(emp_role)
        if norm_emp == normalized_req or normalized_req in norm_emp or norm_emp in normalized_req:
            return True
        if req_domains:
            emp_lower = emp_role.lower()
            return any(domain in emp_lower for domain in req_domains)
        return False

    available_employees = [emp for emp in employees if emp.get("available_hours", 0) > 0]
    if not available_employees:
        return []

    req_skills_lower = [s.lower() for s in requirement.skills] if requirement.skills else []

    # Tier 1: Exact skill overlap + Role Match + Experience
    tier1 = []
    for emp in available_employees:
        emp_skills_lower = [s.lower() for s in emp["skills"]]
        if req_skills_lower and any(req_s in emp_skills_lower for req_s in req_skills_lower):
            if is_role_match(emp["role"]) and emp["experience"] >= requirement.minimum_experience:
                emp_copy = dict(emp)
                emp_copy["match_tier"] = 1
                tier1.append(emp_copy)
    if tier1:
        return tier1

    # Tier 2: Exact skill overlap ONLY (Prioritize Technology over Role)
    tier2 = []
    for emp in available_employees:
        emp_skills_lower = [s.lower() for s in emp["skills"]]
        if req_skills_lower and any(req_s in emp_skills_lower for req_s in req_skills_lower):
            emp_copy = dict(emp)
            emp_copy["match_tier"] = 2
            tier2.append(emp_copy)
    if tier2:
        return tier2

    # Tier 3: Role Match + Experience (Fallback if no specific skills matched)
    tier3 = []
    for emp in available_employees:
        if is_role_match(emp["role"]) and emp["experience"] >= requirement.minimum_experience:
            emp_copy = dict(emp)
            emp_copy["match_tier"] = 3
            tier3.append(emp_copy)
    if tier3:
        return tier3

    # Tier 4: Any Role Match (Relaxing experience)
    tier4 = []
    for emp in available_employees:
        if is_role_match(emp["role"]):
            emp_copy = dict(emp)
            emp_copy["match_tier"] = 4
            tier4.append(emp_copy)
    return tier4


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
        1. Lowest hourly cost (low budget)
        2. Bench developers
        3. Global bench
        4. Highest available hours
        5. Lowest allocated hours
        6. Highest experience

    - "cost_efficient" (used for MVP):
        1. Lowest hourly cost (low budget priority)
        2. Bench developers
        3. Global bench
        4. Highest available hours
        5. Lowest allocated hours
        6. Lowest experience

    - "high_skill" (used for Full):
        1. Highest experience
        2. Bench developers
        3. Global bench
        4. Lowest hourly cost
        5. Highest available hours
    """
    if mode == "cost_efficient":
        candidates.sort(
            key=lambda emp: (
                emp["hourly_cost"],
                not emp["bench_status"],
                not emp["global_bench"],
                -emp["available_hours"],
                emp["allocated_hours"],
                emp["experience"],
            )
        )
    elif mode == "high_skill":
        candidates.sort(
            key=lambda emp: (
                -emp["experience"],
                not emp["bench_status"],
                not emp["global_bench"],
                emp["hourly_cost"],
                -emp["available_hours"],
                emp["allocated_hours"],
            )
        )
    else:
        candidates.sort(
            key=lambda emp: (
                emp["hourly_cost"],
                not emp["bench_status"],
                not emp["global_bench"],
                -emp["available_hours"],
                emp["allocated_hours"],
                -emp["experience"],
            )
        )
    # Was previously an unconditional print() of the full candidate list on
    # every call (O(n) string-building for objects almost never inspected).
    # logger.debug's args are only formatted if DEBUG logging is enabled.
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Ranked %d candidates (mode=%s): %s", len(candidates), mode, [c["name"] for c in candidates])
    return candidates


# ==========================================================
# Select Developers
# ==========================================================

def select_resources(
    employees: List[Dict[str, Any]],
    requirement: ResourceRequirement,
    mode: str = "balanced",
    exclude_ids: Optional[set] = None,
    timeline_days: int = 0,
    remaining_budget: float = 0.0,
    total_roles: int = 1,
) -> List[Dict[str, Any]]:
    """
    Returns developers to fulfill the required daily capacity for a role.

    Business-aware allocation:
    - Primarily matches resources whose skills align with the project tech stack.
    - By default, selects 1 developer per role (count=1) to avoid unnecessary duplication.
    - Scales up headcount ONLY when the timeline is very tight relative to
      scope AND the budget can support multiple developers for the same role.
    """
    candidates = filter_candidates(employees, requirement)
    if not candidates:
        candidates = [c for c in employees if c.get("available_hours", 0) > 0]

    if exclude_ids:
        remaining = [c for c in candidates if c["employee_id"] not in exclude_ids]
        if remaining:
            candidates = remaining

    ranked = rank_candidates(candidates, mode=mode)

    effective_count = requirement.count
    logger.debug(
        "Evaluating role '%s' with %d candidates. AI-suggested headcount=%d, timeline=%d days, remaining_budget=$%s",
        requirement.role, len(candidates), effective_count, timeline_days, remaining_budget,
    )

    if remaining_budget <= 0:
        effective_count = 1
        logger.debug("No remaining budget for '%s'; capping headcount at 1.", requirement.role)
    elif effective_count > 1 and timeline_days > 0:
        weeks = max(1, timeline_days / 7)
        top_candidates = ranked[:3]
        avg_hourly = sum(c.get("hourly_cost", 10) for c in top_candidates) / max(len(top_candidates), 1)
        cost_per_dev = weeks * WORKING_DAYS_PER_WEEK * 8 * avg_hourly
        max_affordable_devs = int(remaining_budget / (cost_per_dev * total_roles)) if cost_per_dev > 0 else 1

        if timeline_days >= 42:
            effective_count = 1
            logger.debug("Timeline comfortable for '%s'; capping headcount at 1.", requirement.role)
        else:
            effective_count = min(effective_count, max(1, max_affordable_devs))
            logger.debug("Timeline tight for '%s'; adjusted headcount to %d.", requirement.role, effective_count)

    required_daily_capacity = effective_count * 8
    selected = []
    current_capacity = 0

    for emp in ranked:
        if current_capacity >= required_daily_capacity:
            break

        emp_available_hours = emp.get("available_hours", 0)
        if emp_available_hours <= 0:
            continue

        needed_hours = required_daily_capacity - current_capacity
        hours_to_take = min(emp_available_hours, needed_hours)

        emp_copy = dict(emp)
        emp_copy["allocated_daily_hours"] = hours_to_take
        selected.append(emp_copy)

        current_capacity += hours_to_take

    logger.debug(
        "Selected %d resource(s) for '%s', fulfilling %d/%d required daily hours.",
        len(selected), requirement.role, current_capacity, required_daily_capacity,
    )
    return selected


# ==========================================================
# MVP / FULL Requirement Variant Builders
# ==========================================================

def _default_resource_requirements() -> List[Dict[str, Any]]:
    """Fallback team used only when the client/AI extraction gave no roles at all."""
    return [
        {"role": "Backend Engineer", "count": 1, "minimum_experience": 3, "skills": ["Python"]},
        {"role": "Frontend Engineer", "count": 1, "minimum_experience": 2, "skills": ["React"]},
    ]


def _build_variant_proposal(proposal: Dict[str, Any], variant: str) -> Dict[str, Any]:
    """
    Constructs a variant-specific proposal payload by swapping in the variant's
    requirements and timeline if they were generated by the AI.
    """
    variant_proposal = dict(proposal)

    base_requirements = proposal.get("resource_requirements") or _default_resource_requirements()

    base_timeline = proposal.get("timeline_days")
    if not base_timeline or int(base_timeline) <= 0:
        base_timeline = DEFAULT_TIMELINE_WEEKS * 7
    base_timeline = int(base_timeline)

    if variant == "mvp":
        mvp_reqs = proposal.get("mvp_resource_requirements")
        variant_proposal["resource_requirements"] = mvp_reqs if mvp_reqs else base_requirements

        mvp_timeline = proposal.get("mvp_timeline_days")
        final_mvp = int(mvp_timeline) if mvp_timeline else base_timeline

        # Failsafe: Ensure MVP is genuinely different (roughly 40%) if AI returned identical values
        if final_mvp >= base_timeline:
            final_mvp = max(14, int(base_timeline * 0.4))

        variant_proposal["timeline_days"] = final_mvp

    elif variant == "full":
        full_reqs = proposal.get("full_resource_requirements")
        variant_proposal["resource_requirements"] = full_reqs if full_reqs else base_requirements

        full_timeline = proposal.get("full_timeline_days")
        variant_proposal["timeline_days"] = int(full_timeline) if full_timeline else base_timeline
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

    timeline_days = proposal.get("timeline_days")
    if not timeline_days or int(timeline_days) <= 0:
        timeline_days = DEFAULT_TIMELINE_WEEKS * 7
    timeline_days = int(timeline_days)

    resource_reqs_raw = proposal.get("resource_requirements") or []

    total_developer_cost = 0.0
    already_picked_in_this_call = set(exclude_ids) if exclude_ids else set()

    client_budget = 0.0
    if proposal.get("client_budget"):
        try:
            client_budget = float(proposal.get("client_budget"))
        except (TypeError, ValueError):
            pass
    total_roles = len(resource_reqs_raw)

    for resource in resource_reqs_raw:
        requirement = ResourceRequirement(
            role=resource.get("role", "FullStack Engineer"),
            count=int(resource.get("count", 1)),
            minimum_experience=int(resource.get("minimum_experience", 1)),
            skills=resource.get("skills", []),
        )

        remaining_budget = max(0.0, client_budget - total_developer_cost)

        selected = select_resources(
            employees, requirement, mode=mode, exclude_ids=already_picked_in_this_call,
            timeline_days=timeline_days, remaining_budget=remaining_budget, total_roles=total_roles
        )

        if not selected:
            estimate.unfulfilled_roles.append(resource)
            logger.warning("No candidates found for role '%s'.", requirement.role)
            continue

        already_picked_in_this_call.update(emp["employee_id"] for emp in selected)

        for emp in selected:
            hours_per_day = emp.get("allocated_daily_hours", emp.get("daily_capacity_hours", 8))
            allocated_hours = int((timeline_days / 7) * WORKING_DAYS_PER_WEEK * hours_per_day)

            is_shared = bool(exclude_ids and emp["employee_id"] in exclude_ids)

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
                    match_tier=emp.get("match_tier", 1),
                    shared_with_mvp=is_shared
                )
            )

    estimate.developer_cost = round(total_developer_cost, 2)
    estimate.total_project_cost = estimate.developer_cost
    logger.debug("Total estimated developer cost: $%s", estimate.developer_cost)

    if client_budget > 0 and estimate.total_project_cost > client_budget:
        overage = estimate.total_project_cost - client_budget
        warning_msg = f"Project estimate exceeds the client budget of ${client_budget} by ${overage:.2f}."
        estimate.budget_overrun_warning = warning_msg
        logger.warning(warning_msg)

    return estimate


def _format_timeline_days(days: int) -> str:
    """Convert a raw day count to a human-readable string like '10 Weeks' or '3 Months'."""
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
    return f"{days // 7} Week{'s' if days // 7 > 1 else ''} {days % 7} Days"


def _estimate_to_json(estimate: ProjectEstimate, timeline_days: int, resource_requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
    resources = [
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
            "match_tier": dev.match_tier,
            "shared_with_mvp": dev.shared_with_mvp,
        }
        for dev in estimate.selected_resources
    ]

    result = {
        "timeline_days": timeline_days,
        "timeline_formatted": _format_timeline_days(timeline_days),
        "timeline_weeks": timeline_days // 7,  # Keep for backwards compatibility
        "resource_requirements": resource_requirements,
        "unfulfilled_roles": estimate.unfulfilled_roles,
        "selected_resources": resources,
        "developer_cost": estimate.developer_cost,
        "total_project_cost": estimate.total_project_cost,
        "estimated_cost": estimate.total_project_cost,
    }
    if estimate.budget_overrun_warning:
        result["budget_overrun_warning"] = estimate.budget_overrun_warning
    return result


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
    If `employees` list is not provided, loads active employees from the cached
    employees.csv (see `get_employees_from_db`).

    Returns a JSON structure containing TWO cost options:
      - "mvp": lean MVP scope (fewer roles/headcount, shorter timeline)
      - "full_project": full scope (all roles, higher-skilled matches, extra
        supporting roles, full timeline)
    No fixed company static cost is included in either option anymore.
    """
    logger.info("Starting resource match & cost estimation for proposal '%s'", proposal.get("proposal_id"))

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
        mvp_estimate, mvp_proposal["timeline_days"], mvp_proposal["resource_requirements"]
    )
    full_json = _estimate_to_json(
        full_estimate, full_proposal["timeline_days"], full_proposal["resource_requirements"]
    )

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

    logger.info(
        "Finished resource match. MVP cost=$%s, Full cost=$%s",
        mvp_json["total_project_cost"], full_json["total_project_cost"],
    )

    return {
        "proposal_id": proposal.get("proposal_id", f"PROP-{uuid.uuid4().hex[:6].upper()}"),
        "project_name": proposal.get("project_name", "Untitled AI Project Proposal"),
        "business_domain": proposal.get("business_domain"),
        "project_description": proposal.get("project_description"),
        "preferred_technology": proposal.get("preferred_technology", []),
        "client_budget": client_budget,
        "mvp": mvp_json,
        "full_project": full_json,
    }


def match_resources_with_budget_cap(
    resource_requirements: List[Dict[str, Any]],
    timeline_days: int,
    max_hourly_rate: float,
    employees: Optional[List[Dict[str, Any]]] = None,
) -> Optional[Dict[str, Any]]:
    """
    **Attempt-1 budget negotiation strategy — Developer Swap.**

    Re-runs resource allocation using ONLY employees whose hourly_cost is at or
    below `max_hourly_rate`. Same roles, same counts, same timeline — only the
    developer pool is restricted to cheaper candidates.

    Returns a dict compatible with `_estimate_to_json` output, or None if no
    valid team can be assembled within the rate cap.
    """
    if employees is None:
        employees = get_employees_from_db()

    affordable_pool = [e for e in employees if e.get("hourly_cost", 0) <= max_hourly_rate]
    if not affordable_pool:
        return None

    proposal = {
        "resource_requirements": resource_requirements,
        "timeline_days": timeline_days,
    }

    estimate = allocate_resources(proposal, affordable_pool, mode="cost_efficient")
    if not estimate.selected_resources:
        return None

    result = _estimate_to_json(estimate, timeline_days, resource_requirements)
    result["timeline_formatted"] = _format_timeline_days(timeline_days)
    return result


def match_resources_with_extended_timeline(
    resource_requirements: List[Dict[str, Any]],
    current_timeline_days: int,
    extension_ratio: float = 1.30,
    employees: Optional[List[Dict[str, Any]]] = None,
) -> Optional[Dict[str, Any]]:
    """
    **Attempt-2+ budget negotiation strategy — Timeline Extension.**

    Extends the project timeline by `extension_ratio` (default +30%) and
    re-runs matching against the full employee pool with cost-efficient mode.
    Spreading the work over more days means fewer parallel hours per developer
    per week, which lowers the total cost without changing the team composition
    beyond a normal re-match.

    Returns the same dict shape as `match_resources_with_budget_cap`, or None
    if no team can be assembled.
    """
    if employees is None:
        employees = get_employees_from_db()

    new_timeline_days = max(current_timeline_days + 14, round(current_timeline_days * extension_ratio))

    proposal = {
        "resource_requirements": resource_requirements,
        "timeline_days": new_timeline_days,
    }

    estimate = allocate_resources(proposal, employees, mode="cost_efficient")
    if not estimate.selected_resources:
        return None

    result = _estimate_to_json(estimate, new_timeline_days, resource_requirements)
    result["timeline_formatted"] = _format_timeline_days(new_timeline_days)
    return result


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
    logging.basicConfig(level=logging.INFO)
    import json

    sample_input = {
        "proposal_id": "PROP-DEMO-001",
        "project_name": "AI Proposal Generator MVP",
        "timeline_days": 84,
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
    print(" 1. Testing MVP + Full Resource Match against employees.csv")
    print("========================================================\n")
    try:
        db_result = match_resources(sample_input)
        print("[SUCCESS] Matched successfully using cached CSV candidates:")
        print(json.dumps(db_result, indent=4))
    except Exception as e:
        print(f"[WARNING] Note: match encountered an issue ({e}).")

    print("\n========================================================")
    print(" 2. Testing Resource Match with NO CLIENT BUDGET (client_budget: None)")
    print("========================================================\n")
    sample_no_budget = dict(sample_input)
    sample_no_budget["client_budget"] = None
    try:
        no_budget_result = match_resources(sample_no_budget)
        print("[SUCCESS] Matched successfully without client budget:")
        print(json.dumps(no_budget_result, indent=4))
    except Exception as e:
        print(f"[WARNING] Note: match encountered an issue ({e}).")