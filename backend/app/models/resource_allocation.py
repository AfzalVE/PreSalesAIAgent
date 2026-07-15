import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Numeric
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.proposal import Proposal


class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    proposal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("proposals.id", ondelete="CASCADE"),
        nullable=False,
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    allocated_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    duration_weeks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    estimated_cost: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    proposal: Mapped["Proposal"] = relationship(
        "Proposal",
        back_populates="resource_allocations",
    )

    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="resource_allocations",
    )

    def __repr__(self):
        return f"<ResourceAllocation {self.id}>"