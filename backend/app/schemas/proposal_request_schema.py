from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.proposal_request import (
    CommunicationType,
    ProposalRequestStatus,
)


class ProposalRequestBase(BaseModel):
    project_name: str
    project_description: str
    business_domain: str
    preferred_technology: list = []
    budget: float
    timeline: str
    communication_type: CommunicationType
    transcript: str | None = None
    extracted_json: dict


class ProposalRequestCreate(ProposalRequestBase):
    client_id: UUID


class ProposalRequestUpdate(BaseModel):
    project_name: str | None = None
    project_description: str | None = None
    business_domain: str | None = None
    preferred_technology: list | None = None
    budget: float | None = None
    timeline: str | None = None
    transcript: str | None = None
    extracted_json: dict | None = None
    status: ProposalRequestStatus | None = None

    model_config = ConfigDict(from_attributes=True)


class ProposalRequestResponse(ProposalRequestBase):
    id: UUID
    client_id: UUID
    status: ProposalRequestStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)