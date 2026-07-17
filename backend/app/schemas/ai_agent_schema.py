from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AgentTextInput(BaseModel):
    text: str = Field(..., description="The unstructured text or transcribed voice input from the user.")
    request_id: Optional[str] = Field(None, description="Optional request ID if continuing an existing chat.") # newly added

class ResourceRequirement(BaseModel):
    role: str = Field(..., description="The role of the resource, e.g., 'Backend Developer'.")
    count: int = Field(..., description="The number of resources needed for this role.")
    skills: List[str] = Field(default_factory=list, description="List of specific skills required, e.g., ['Python', 'FastAPI'].")

class AgentExtractionResponse(BaseModel):
    request_id: Optional[str] = Field(None, description="The unique identifier for the database request if tracked statefully.")
    proposal_id: str = Field(..., description="The unique identifier for the proposal, e.g., 'PROP-001'.")
    project_name: Optional[str] = Field(None, description="The name of the project extracted or generated.")
    business_domain: Optional[str] = Field(None, description="The business domain of the project.")
    project_description: Optional[str] = Field(None, description="The description of the project.")
    preferred_technology: Optional[List[List[str]]] = Field(None, description="List of possible tech stacks, each represented as a list of strings (e.g., [['React', 'FastAPI'], ['Vue', 'Django']]).")
    timeline_weeks: Optional[int] = Field(None, description="The timeline of the project in weeks.")
    client_budget: Optional[float] = Field(None, description="The budget of the client in USD.")
    
    # State flags
    is_gathering_info_complete: bool = Field(False, description="True ONLY when project_name, business_domain, project_description, timeline_weeks, and client_budget are ALL present.")
    tech_stack_confirmed: bool = Field(False, description="True ONLY when the user explicitly agrees to the proposed tech stack.")
    ready_for_match: bool = Field(False, description="True when info is complete AND tech stack is confirmed.")
    ready_for_proposal_generation: bool = Field(False, description="True ONLY when the user explicitly says to generate the proposal after seeing the match estimation.")
    
    follow_up_message: str = Field(..., description="Your conversational response to the user. Must ALWAYS be populated.")
    proposal_data: Optional[Dict[str, Any]] = Field(None, description="The generated proposal data if ready_for_proposal_generation is true.")

class NegotiationInput(BaseModel):
    user_request: str = Field(..., description="The user's negotiation request (e.g. 'lower budget by 20%').")
    current_budget: float = Field(..., description="The current budget.")
    current_timeline: str = Field(..., description="The current timeline (e.g. '12 Weeks').")
    current_tech_stack: List[str] = Field(default_factory=list, description="The current tech stack.")

class NegotiationResponse(BaseModel):
    new_budget: float = Field(..., description="The updated budget after negotiation.")
    new_timeline: str = Field(..., description="The updated timeline after negotiation.")
    new_tech_stack: List[str] = Field(..., description="The updated tech stack after negotiation.")
    response_message: str = Field(..., description="The AI's conversational response explaining the adjustments.")
    success: bool = Field(..., description="Whether the negotiation was successful (e.g. false if budget requested is impossibly low).")
    error_message: Optional[str] = Field(None, description="Warning or error message if success is false.")
