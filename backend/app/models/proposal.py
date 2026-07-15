import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
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
    from app.models.proposal_request import ProposalRequest
    from app.models.resource_allocation import ResourceAllocation
    from app.models.final_proposal import FinalProposal
    from app.models.poc_document import POCDocument


class ProposalType(str, PyEnum):
    MVP = "MVP"
    FULL = "FULL"


class ProposalStatus(str, PyEnum):
    GENERATED = "GENERATED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Proposal(Base):
    __tablename__ = "proposals"

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

    proposal_type: Mapped[ProposalType] = mapped_column(
        Enum(ProposalType),
        nullable=False,
    )

    tech_stack: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    estimated_cost: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    estimated_duration: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    selected_resources: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    scope: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    assumptions: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    risks: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    generated_by_ai: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    status: Mapped[ProposalStatus] = mapped_column(
        Enum(ProposalStatus),
        default=ProposalStatus.GENERATED,
    )

    timeline_phases: Mapped[list] = mapped_column(
        JSONB,
        nullable=True,
    )


    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    proposal_request: Mapped["ProposalRequest"] = relationship(
        "ProposalRequest",
        back_populates="proposals",
    )

    resource_allocations: Mapped[list["ResourceAllocation"]] = relationship(
        "ResourceAllocation",
        back_populates="proposal",
        cascade="all, delete-orphan",
    )

    final_proposal: Mapped["FinalProposal"] = relationship(
        "FinalProposal",
        back_populates="proposal",
        uselist=False,
    )

    poc_document: Mapped["POCDocument"] = relationship(
        "POCDocument",
        back_populates="proposal",
        uselist=False,
    )

    def __repr__(self):
        return f"<Proposal {self.id}>"