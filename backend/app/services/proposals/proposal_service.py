import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models.proposal import Proposal
from app.models.proposal_request import ProposalRequest
from app.models.employee import Employee, EmploymentStatus


def _format_proposal_dict(prop: Proposal, active_employees: List[Employee]) -> Dict[str, Any]:
    """
    Helper function to format a Proposal model instance into the rich dictionary structure
    required by the Admin Portal and Proposal Details frontend modal.
    """
    p_name = prop.proposal_request.project_name if prop.proposal_request else "Custom AI Solution"
    c_name = prop.proposal_request.client.company_name if (prop.proposal_request and prop.proposal_request.client) else "Acme Corp"
    
    # Industry from business domain or fallback
    industry_str = "Technology & Services"
    if prop.proposal_request and prop.proposal_request.business_domain:
        industry_str = prop.proposal_request.business_domain
    elif prop.proposal_request and prop.proposal_request.client and getattr(prop.proposal_request.client, 'industry', None):
        industry_str = prop.proposal_request.client.industry

    status_str = prop.status.value if hasattr(prop.status, 'value') else str(prop.status)
    type_str = prop.proposal_type.value if hasattr(prop.proposal_type, 'value') else str(prop.proposal_type)

    # Build scope/features list
    features_list = []
    if prop.scope:
        scope_clean = prop.scope.strip()
        if len(scope_clean) > 200:
            scope_clean = scope_clean[:200] + "..."
        features_list.append(f"Core Scope: {scope_clean}")
    if prop.assumptions:
        assump_clean = prop.assumptions.strip()
        if len(assump_clean) > 150:
            assump_clean = assump_clean[:150] + "..."
        features_list.append(f"Key Assumptions: {assump_clean}")
    if prop.risks:
        risks_clean = prop.risks.strip()
        if len(risks_clean) > 150:
            risks_clean = risks_clean[:150] + "..."
        features_list.append(f"Risk Mitigation: {risks_clean}")

    if not features_list or len(features_list) < 2:
        features_list.extend([
            "Cloud-native architecture with multi-region high availability",
            "Automated AI pre-sales document generation & parsing engine",
            "Role-based access control and comprehensive enterprise security auditing",
            "Automated resource allocation matching and scheduling"
        ])

    # Build tech stack list
    tech_stack_list = []
    if isinstance(prop.tech_stack, dict):
        for k, v in prop.tech_stack.items():
            if isinstance(v, str):
                parts = [p.strip() for p in v.split(",") if p.strip()]
                tech_stack_list.extend(parts)
            elif isinstance(v, list):
                tech_stack_list.extend([str(item) for item in v])
    elif isinstance(prop.tech_stack, list):
        tech_stack_list = [str(item) for item in prop.tech_stack]

    if prop.proposal_request and isinstance(prop.proposal_request.preferred_technology, list):
        for pt in prop.proposal_request.preferred_technology:
            if pt and str(pt) not in tech_stack_list:
                tech_stack_list.append(str(pt))

    # Remove duplicates preserving order
    unique_tech = []
    for t in tech_stack_list:
        if t not in unique_tech:
            unique_tech.append(t)
    if not unique_tech:
        unique_tech = ["Python", "FastAPI", "React", "PostgreSQL", "AWS", "Docker"]

    # Build assigned team list based on tech stack matching or selected resources
    team_list = []
    if isinstance(prop.selected_resources, dict) and "team" in prop.selected_resources:
        for m in prop.selected_resources["team"]:
            if isinstance(m, dict) and "name" in m:
                team_list.append({"name": m.get("name", "John Doe"), "role": m.get("role", "Senior Engineer")})
    elif isinstance(prop.selected_resources, list):
        for m in prop.selected_resources:
            if isinstance(m, dict) and "name" in m:
                team_list.append({"name": m["name"], "role": m.get("role", "Senior Engineer")})

    if not team_list and active_employees:
        # Match staff skills with tech stack
        for emp in active_employees:
            emp_skills = [s.strip().lower() for s in (emp.skill_names or "").split(",")]
            if any(ut.lower() in emp_skills for ut in unique_tech):
                team_list.append({"name": emp.full_name, "role": emp.designation})
            if len(team_list) >= 4:
                break
        
        # If no direct skill matches, assign top 3 active staff
        if not team_list:
            for emp in active_employees[:3]:
                team_list.append({"name": emp.full_name, "role": emp.designation})

    # Build version logs
    ver_num = getattr(prop, "version", 1) or 1
    date_str = prop.created_at.strftime("%b %d, %Y") if prop.created_at else "Today"
    versions_list = [
        {
            "version": f"v{ver_num}.0",
            "desc": f"AI generated {type_str} baseline proposal & resource estimation",
            "date": date_str
        }
    ]
    if status_str.upper() in ["APPROVED", "COMPLETED", "NEGOTIATING"]:
        versions_list.append({
            "version": f"v{ver_num}.1",
            "desc": f"Proposal status updated to {status_str.capitalize()}",
            "date": date_str
        })

    return {
        "id": str(prop.id),
        "projectName": f"{p_name} ({type_str})",
        "clientName": c_name,
        "industry": industry_str,
        "budget": float(prop.estimated_cost or 0),
        "timeline": prop.estimated_duration or "12 Weeks",
        "status": status_str.capitalize() if status_str else "Generated",
        "proposalType": type_str,
        "features": features_list,
        "techStack": unique_tech,
        "team": team_list,
        "versions": versions_list
    }


def get_all_proposals_service(db: Session) -> List[Dict[str, Any]]:
    """
    Retrieves all proposals with eager-loaded relationships and formats them
    with complete details for frontend table and details modal rendering.
    """
    proposals = db.query(Proposal).options(
        joinedload(Proposal.proposal_request).joinedload(ProposalRequest.client)
    ).order_by(Proposal.created_at.desc()).all()

    active_employees = db.query(Employee).filter(Employee.employment_status == EmploymentStatus.ACTIVE).all()

    result = []
    for prop in proposals:
        result.append(_format_proposal_dict(prop, active_employees))
    return result


def get_proposal_by_id_service(db: Session, proposal_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves and formats a single proposal by ID.
    """
    try:
        pid = uuid.UUID(proposal_id)
    except ValueError:
        return None

    prop = db.query(Proposal).options(
        joinedload(Proposal.proposal_request).joinedload(ProposalRequest.client)
    ).filter(Proposal.id == pid).first()

    if not prop:
        return None

    active_employees = db.query(Employee).filter(Employee.employment_status == EmploymentStatus.ACTIVE).all()
    return _format_proposal_dict(prop, active_employees)
