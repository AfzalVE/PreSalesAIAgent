import json
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings
from app.schemas.ai_agent_schema import (
    RequirementPatch, MissingInfoQuestion, TechRecommendation, 
    ConfirmationIntent, ProjectDecomposition, ProposalPlan, ProposalComparison, AutoSuggestPlan
)
from app.services.ai.deterministic_services import merge_requirements, is_info_complete
from app.services.ai.workflow.state import AgentState

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, api_key=settings.OPENAI_API_KEY)

def extract_requirements_node(state: AgentState) -> Dict[str, Any]:
    """Extracts a requirement patch from the user's latest input."""
    structured_llm = llm.with_structured_output(RequirementPatch)
    prompt = f"""
    Extract project requirements from the client's message.
    IMPORTANT: If the client explicitly asks for suggestions, guesses, or states they have no idea about budget, timeline, or tech stack, you MUST set `wants_suggestion` to true.
    
    Conversation History:
    {state.get('conversation_history', '')}
    
    Current Extracted State:
    {json.dumps(state.get('requirements', {}), indent=2)}
    
    Client Message: {state['user_input']}
    """
    patch = structured_llm.invoke(prompt)
    print(f"DEBUG LLM RAW EXTRACT OUTPUT: {patch.model_dump()}")
    return {"_patch": patch}  # Internal key to pass to merge node

def merge_requirements_node(state: AgentState) -> Dict[str, Any]:
    """Merges extracted patch into the main requirements state deterministically."""
    patch = state.get("_patch")
    if not patch:
        return {}
    merged = merge_requirements(state.get("requirements", {}), patch)
    
    info_complete = is_info_complete(merged)
    wants_sug = getattr(patch, 'wants_suggestion', False)
    
    out = {
        "requirements": merged, 
        "is_gathering_info_complete": info_complete,
        "wants_suggestion": wants_sug,
        "follow_up_message": ""
    }
    print("DEBUG MERGED:", out)
    return out

def ask_missing_info_node(state: AgentState) -> Dict[str, Any]:
    """Generates a conversational question if requirements are missing."""
    structured_llm = llm.with_structured_output(MissingInfoQuestion)
    reqs = state.get('requirements', {})
    required_keys = ["project_name", "business_domain", "project_description", "client_budget", "timeline_weeks", "preferred_technology"]
    missing = [k for k in required_keys if not reqs.get(k) or (isinstance(reqs.get(k), list) and len(reqs.get(k)) == 0)]
    
    prompt = f"""
    We are missing the following specific information for the project: {', '.join(missing)}.
    Current State: {json.dumps(reqs)}
    
    Ask a conversational follow up question to the client to gather ONLY this missing information.
    Do not ask for information we already have. Tell them they can also ask us to suggest these if they aren't sure.
    """
    res = structured_llm.invoke(prompt)
    return {"follow_up_message": res.question}

def generate_suggestion_node(state: AgentState) -> Dict[str, Any]:
    """Generates suggestions for timeline, tech stack, and team strength if the user asks."""
    structured_llm = llm.with_structured_output(AutoSuggestPlan)
    prompt = f"""
    The user wants us to suggest the best technical approach, timeline, and required team for their project.
    Project Requirements: {json.dumps(state.get('requirements', {}))}
    
    Suggest:
    1. A reasonable timeline in weeks.
    2. A preferred technology stack (List of strings).
    3. The base resource requirements (roles and counts) needed to build this. (e.g. Backend Engineer: 1, Frontend Engineer: 1)
    """
    res = structured_llm.invoke(prompt)
    
    # Merge into requirements
    merged = state.get("requirements", {}).copy()
    merged["timeline_weeks"] = res.timeline_weeks
    merged["preferred_technology"] = res.preferred_technology
    merged["resource_requirements"] = [r.model_dump() for r in res.resource_requirements]
    
    return {
        "requirements": merged,
        "is_gathering_info_complete": True,
        "ready_for_match": True,
        "wants_suggestion": False, # Reset it
        "follow_up_message": "" # Router will append to it
    }

def recommend_tech_node(state: AgentState) -> Dict[str, Any]:
    """Recommends a technology stack if one is not finalized."""
    structured_llm = llm.with_structured_output(TechRecommendation)
    prompt = f"""
    Recommend a technology stack based on these requirements:
    {json.dumps(state.get('requirements', {}))}
    """
    res = structured_llm.invoke(prompt)
    return {
        "recommended_tech_stack": res.recommended_stack,
        "follow_up_message": f"{res.explanation}\n\n{res.question}"
    }

def classify_tech_confirmation_node(state: AgentState) -> Dict[str, Any]:
    """Classifies the user's response to the tech stack recommendation."""
    structured_llm = llm.with_structured_output(ConfirmationIntent)
    prompt = f"""
    The user was presented with this tech stack: {state.get('recommended_tech_stack')}
    User message: {state.get('user_input')}
    
    Classify their response.
    """
    res = structured_llm.invoke(prompt)
    if res.intent == "CONFIRMED":
        return {"tech_stack_confirmed": True, "ready_for_match": True, "follow_up_message": "Tech stack confirmed. Let me prepare the estimation."}
    elif res.intent == "MODIFICATION_REQUESTED":
        return {"tech_stack_confirmed": False, "follow_up_message": f"Understood. You want changes: {res.modification_details}. Let me update the stack."}
    else:
        return {"tech_stack_confirmed": False, "follow_up_message": res.clarification_question}

def decompose_project_node(state: AgentState) -> Dict[str, Any]:
    """Creates a shared project decomposition."""
    structured_llm = llm.with_structured_output(ProjectDecomposition)
    prompt = f"""
    Decompose the project into core features, deferred features, and integrations.
    Requirements: {json.dumps(state.get('requirements', {}))}
    Tech Stack: {state.get('recommended_tech_stack', [])}
    """
    res = structured_llm.invoke(prompt)
    return {
        "business_objective": res.business_objective,
        "core_features": res.core_features,
        "deferred_features": res.deferred_features
    }

def mvp_plan_node(state: AgentState) -> Dict[str, Any]:
    """Plans the MVP proposal."""
    structured_llm = llm.with_structured_output(ProposalPlan)
    prompt = f"Plan MVP proposal. Focus on core features only: {state.get('core_features')}"
    res = structured_llm.invoke(prompt)
    return {"mvp_plan": res.model_dump()}

def scalable_plan_node(state: AgentState) -> Dict[str, Any]:
    """Plans the Scalable proposal."""
    structured_llm = llm.with_structured_output(ProposalPlan)
    prompt = f"Plan Full Scalable proposal. Include deferred features: {state.get('deferred_features')} and core features: {state.get('core_features')}"
    res = structured_llm.invoke(prompt)
    return {"scalable_plan": res.model_dump()}

# Deterministic Matching Nodes (to be hooked up to DB cost estimation)
def mvp_estimation_node(state: AgentState) -> Dict[str, Any]:
    # Call real estimation service here
    return {"mvp_estimation": {"estimated_cost": 50000, "timeline_weeks": 8}}

def scalable_estimation_node(state: AgentState) -> Dict[str, Any]:
    # Call real estimation service here
    return {"scalable_estimation": {"estimated_cost": 150000, "timeline_weeks": 24}}

def generate_comparison_node(state: AgentState) -> Dict[str, Any]:
    """Generates a comparison between MVP and Scalable."""
    structured_llm = llm.with_structured_output(ProposalComparison)
    prompt = f"Compare MVP Plan and Scalable Plan."
    res = structured_llm.invoke(prompt)
    
    return {
        "proposal_comparison": res.model_dump(),
        "ready_for_proposal_generation": True,
        "follow_up_message": res.summary
    }
