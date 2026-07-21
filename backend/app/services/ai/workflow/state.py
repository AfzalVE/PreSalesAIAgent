from typing import TypedDict, Optional, Dict, Any, List

class AgentState(TypedDict, total=False):
    # Input
    user_input: str
    request_id: str
    conversation_history: str
    
    # State flags
    is_gathering_info_complete: bool
    wants_suggestion: bool
    tech_stack_confirmed: bool
    ready_for_match: bool
    ready_for_proposal_generation: bool
    
    # Extracted Requirements (Project Name, Domain, Budget, Timeline, etc)
    requirements: Dict[str, Any]
    
    # Internal state
    _patch: Any
    
    # AI Conversation
    follow_up_message: str
    
    # Technology Stack
    recommended_tech_stack: List[str]
    tech_explanation: str
    
    # Shared Project Decomposition
    business_objective: str
    core_features: List[str]
    deferred_features: List[str]
    
    # Resource Matching & Estimations
    mvp_estimation: Dict[str, Any]
    scalable_estimation: Dict[str, Any]
    
    # Proposal Plans (MVP & Scalable)
    mvp_plan: Dict[str, Any]
    scalable_plan: Dict[str, Any]
    
    # Final Join Comparison
    proposal_comparison: Dict[str, Any]
