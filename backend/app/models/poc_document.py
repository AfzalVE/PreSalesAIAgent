import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.proposal import Proposal


class POCDocument(Base):
    __tablename__ = "poc_documents"

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

    is_mvp: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    architecture: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    modules: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    api_list: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    database_design: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    deployment_plan: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    proposal: Mapped["Proposal"] = relationship(
        "Proposal",
        back_populates="poc_document",
    )

    def __repr__(self):
        return f"<POCDocument {self.id}>"