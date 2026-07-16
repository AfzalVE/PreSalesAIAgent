from typing import List, Optional
from pydantic import BaseModel, Field

class AgentTextInput(BaseModel):
    text: str = Field(..., description="The unstructured text or transcribed voice input from the user.")
    request_id: Optional[str] = Field(None, description="Optional request ID if continuing an existing chat.") # newly added

class ResourceRequirement(BaseModel):
    role: str = Field(..., description="The role of the resource, e.g., 'Backend Developer'.")
    count: int = Field(..., description="The number of resources needed for this role.")
    skills: List[str] = Field(default_factory=list, description="List of specific skills required, e.g., ['Python', 'FastAPI'].")

class AgentExtractionResponse(BaseModel):
    request_id: Optional[str] = Field(None, description="The unique identifier for the database request if tracked statefully.") # newly added
    proposal_id: str = Field(..., description="The unique identifier for the proposal, e.g., 'PROP-001'.")
    project_name: str = Field(..., description="The name of the project extracted or generated.")
    timeline_weeks: Optional[int] = Field(None, description="The timeline of the project in weeks. If not provided by the user, leave it null for downstream calculation.")
    client_budget: Optional[float] = Field(None, description="The budget of the client in USD. If not provided, leave it null for downstream calculation.")
    resource_requirements: Optional[List[ResourceRequirement]] = Field(None, description="The list of resources required for the project. If not provided, leave it null for downstream calculation.")
    follow_up_message: Optional[str] = Field(None, description="A message to ask the user follow-up questions if budget, timeline, or resources were missing and had to be suggested. Leave null if everything was provided.")

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
