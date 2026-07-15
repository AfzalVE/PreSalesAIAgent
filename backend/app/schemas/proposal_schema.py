from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.proposal import (
    ProposalStatus,
    ProposalType,
)


class ProposalBase(BaseModel):
    proposal_type: ProposalType
    tech_stack: dict
    estimated_cost: float
    estimated_duration: str
    selected_resources: dict
    scope: str
    assumptions: str | None = None
    risks: str | None = None
    generated_by_ai: bool = True
    version: int = 1
    status: ProposalStatus = ProposalStatus.GENERATED
    timeline_phases: list | None = None


class ProposalCreate(ProposalBase):
    request_id: UUID


class ProposalUpdate(BaseModel):
    tech_stack: dict | None = None
    estimated_cost: float | None = None
    estimated_duration: str | None = None
    selected_resources: dict | None = None
    scope: str | None = None
    assumptions: str | None = None
    risks: str | None = None
    generated_by_ai: bool | None = None
    version: int | None = None
    status: ProposalStatus | None = None
    timeline_phases: list | None = None

    model_config = ConfigDict(from_attributes=True)


class ProposalResponse(ProposalBase):
    id: UUID
    request_id: UUID
    status: ProposalStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProposalSelection(BaseModel):
    proposal_id: UUID