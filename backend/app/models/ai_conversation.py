import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.proposal_request import ProposalRequest


class SenderType(str, PyEnum):
    CLIENT = "CLIENT"
    AI = "AI"


class MessageType(str, PyEnum):
    TEXT = "TEXT"
    VOICE = "VOICE"


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("proposal_requests.id", ondelete="CASCADE"),
        nullable=False,
    )

    sender: Mapped[SenderType] = mapped_column(
        Enum(SenderType),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    message_type: Mapped[MessageType] = mapped_column(
        Enum(MessageType),
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    proposal_request: Mapped["ProposalRequest"] = relationship(
        "ProposalRequest",
        back_populates="conversations",
    )

    def __repr__(self):
        return f"<AIConversation {self.id}>"