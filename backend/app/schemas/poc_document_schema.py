from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class POCDocumentBase(BaseModel):
    is_mvp: bool
    architecture: str
    modules: dict
    api_list: dict
    database_design: dict
    deployment_plan: str


class POCDocumentCreate(POCDocumentBase):
    proposal_id: UUID


class POCDocumentUpdate(BaseModel):
    is_mvp: bool | None = None
    architecture: str | None = None
    modules: dict | None = None
    api_list: dict | None = None
    database_design: dict | None = None
    deployment_plan: str | None = None

    model_config = ConfigDict(from_attributes=True)


class POCDocumentResponse(POCDocumentBase):
    id: UUID
    proposal_id: UUID
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)