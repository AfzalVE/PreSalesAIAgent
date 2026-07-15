import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Numeric
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.proposal import Proposal


class FinalProposal(Base):
    __tablename__ = "final_proposals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    proposal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("proposals.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    final_cost: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    final_timeline: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    final_scope: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    approval_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    pdf_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    poc_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    proposal: Mapped["Proposal"] = relationship(
        "Proposal",
        back_populates="final_proposal",
    )

    def __repr__(self):
        return f"<FinalProposal {self.id}>"