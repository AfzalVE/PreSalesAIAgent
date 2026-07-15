from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ResourceAllocationBase(BaseModel):
    role: str
    allocated_hours: int
    duration_weeks: int
    estimated_cost: float


class ResourceAllocationCreate(ResourceAllocationBase):
    proposal_id: UUID
    employee_id: UUID


class ResourceAllocationUpdate(BaseModel):
    role: str | None = None
    allocated_hours: int | None = None
    duration_weeks: int | None = None
    estimated_cost: float | None = None

    model_config = ConfigDict(from_attributes=True)


class ResourceAllocationResponse(ResourceAllocationBase):
    id: UUID
    proposal_id: UUID
    employee_id: UUID

    model_config = ConfigDict(from_attributes=True)