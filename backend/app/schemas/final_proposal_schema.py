from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FinalProposalBase(BaseModel):
    final_cost: float
    final_timeline: str
    final_scope: str
    pdf_url: str | None = None
    poc_url: str | None = None


class FinalProposalCreate(FinalProposalBase):
    proposal_id: UUID


class FinalProposalUpdate(BaseModel):
    final_cost: float | None = None
    final_timeline: str | None = None
    final_scope: str | None = None
    pdf_url: str | None = None
    poc_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class FinalProposalResponse(FinalProposalBase):
    id: UUID
    proposal_id: UUID
    approval_date: datetime

    model_config = ConfigDict(from_attributes=True)