from typing import Dict, Any, List
from app.schemas.ai_agent_schema import RequirementPatch, ProjectDecomposition, ProposalPlan

def merge_requirements(existing: Dict[str, Any], patch: RequirementPatch) -> Dict[str, Any]:
    """Merges newly extracted requirements with the existing state."""
    merged = existing.copy()
    patch_dict = patch.model_dump(exclude_none=True)
    
    for k, v in patch_dict.items():
        if v is not None:
            if isinstance(v, list) and not v and merged.get(k):
                continue
            if isinstance(v, str) and not v.strip() and merged.get(k):
                continue
            merged[k] = v
            
    return merged

def is_info_complete(requirements: Dict[str, Any]) -> bool:
    """Checks if the minimum required information is present."""
    required_keys = ["project_name", "business_domain", "project_description", "client_budget", "timeline_weeks", "preferred_technology"]
    for k in required_keys:
        val = requirements.get(k)
        if not val:
            return False
        if isinstance(val, list) and not val:
            return False
    return True

def validate_proposal(plan: ProposalPlan, estimation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates a proposal plan against the matched estimation data.
    Ensures timeline phases add up, etc.
    For now, simply merges them.
    """
    # In a full implementation, we would validate that timeline phases match estimated_duration_weeks
    return {
        "plan": plan.model_dump(),
        "estimation": estimation
    }
