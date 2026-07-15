from typing import List, Optional
from pydantic import BaseModel, Field

class AgentTextInput(BaseModel):
    text: str = Field(..., description="The unstructured text or transcribed voice input from the user.")

class ResourceRequirement(BaseModel):
    role: str = Field(..., description="The role of the resource, e.g., 'Backend Developer'.")
    count: int = Field(..., description="The number of resources needed for this role.")
    skills: List[str] = Field(default_factory=list, description="List of specific skills required, e.g., ['Python', 'FastAPI'].")

class AgentExtractionResponse(BaseModel):
    proposal_id: str = Field(..., description="The unique identifier for the proposal, e.g., 'PROP-001'.")
    project_name: str = Field(..., description="The name of the project extracted or generated.")
    timeline_weeks: Optional[int] = Field(None, description="The timeline of the project in weeks. If not provided by the user, leave it null for downstream calculation.")
    client_budget: Optional[float] = Field(None, description="The budget of the client in USD. If not provided, leave it null for downstream calculation.")
    resource_requirements: Optional[List[ResourceRequirement]] = Field(None, description="The list of resources required for the project. If not provided, leave it null for downstream calculation.")
    follow_up_message: Optional[str] = Field(None, description="A message to ask the user follow-up questions if budget, timeline, or resources were missing and had to be suggested. Leave null if everything was provided.")
