import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import Numeric
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.resource_allocation import ResourceAllocation


class EmploymentStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    LEAVE = "LEAVE"


class SkillLevel(str, PyEnum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    EXPERT = "EXPERT"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    employee_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    designation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    department: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    hourly_cost: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    daily_capacity_hours: Mapped[int] = mapped_column(
        Integer,
        default=8,
    )

    allocated_hours: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    available_hours: Mapped[int] = mapped_column(
        Integer,
        default=8,
    )

    bench_status: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    global_bench: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    employment_status: Mapped[EmploymentStatus] = mapped_column(
        Enum(EmploymentStatus),
        default=EmploymentStatus.ACTIVE,
    )

    skill_names: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    skill_level: Mapped[SkillLevel] = mapped_column(
        Enum(SkillLevel),
        default=SkillLevel.INTERMEDIATE,
    )

    years_experience: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    resource_allocations: Mapped[list["ResourceAllocation"]] = relationship(
        "ResourceAllocation",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Employee {self.full_name}>"