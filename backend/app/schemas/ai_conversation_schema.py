from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.ai_conversation import (
    MessageType,
    SenderType,
)


class AIConversationBase(BaseModel):
    sender: SenderType
    message: str
    message_type: MessageType


class AIConversationCreate(AIConversationBase):
    request_id: UUID


class AIConversationUpdate(BaseModel):
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AIConversationResponse(AIConversationBase):
    id: UUID
    request_id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)