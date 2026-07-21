import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Numeric
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.proposal import Proposal
    from app.models.ai_conversation import AIConversation


class CommunicationType(str, PyEnum):
    VOICE = "VOICE"
    FORM = "FORM"


class ProposalRequestStatus(str, PyEnum):
    DRAFT = "DRAFT"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"


class ProposalRequest(Base):
    __tablename__ = "proposal_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    project_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    project_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    business_domain: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    preferred_technology: Mapped[list] = mapped_column(
        JSONB,
        default=list,
    )

    budget: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    timeline: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    communication_type: Mapped[CommunicationType] = mapped_column(
        Enum(CommunicationType),
        nullable=False,
    )

    transcript: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    extracted_json: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    workflow_state: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    comparison_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    selected_proposal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("proposals.id", ondelete="SET NULL"),
        nullable=True,
    )

    status: Mapped[ProposalRequestStatus] = mapped_column(
        Enum(ProposalRequestStatus),
        default=ProposalRequestStatus.DRAFT,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    client: Mapped["User"] = relationship(
        "User",
        back_populates="proposal_requests",
    )

    proposals: Mapped[list["Proposal"]] = relationship(
        "Proposal",
        back_populates="proposal_request",
        cascade="all, delete-orphan",
        foreign_keys="[Proposal.request_id]"
    )

    selected_proposal: Mapped[Optional["Proposal"]] = relationship(
        "Proposal",
        foreign_keys=[selected_proposal_id]
    )

    conversations: Mapped[list["AIConversation"]] = relationship(
        "AIConversation",
        back_populates="proposal_request",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<ProposalRequest {self.project_name}>"