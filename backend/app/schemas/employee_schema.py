from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.employee import (
    EmploymentStatus,
    SkillLevel,
)


class EmployeeBase(BaseModel):
    employee_code: str
    full_name: str
    designation: str
    department: str
    experience_years: int
    hourly_cost: float
    daily_capacity_hours: int
    allocated_hours: int
    available_hours: int
    bench_status: bool
    global_bench: bool
    employment_status: EmploymentStatus
    skill_names: str
    skill_level: SkillLevel
    years_experience: int


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    designation: str | None = None
    department: str | None = None
    experience_years: int | None = None
    hourly_cost: float | None = None
    daily_capacity_hours: int | None = None
    allocated_hours: int | None = None
    available_hours: int | None = None
    bench_status: bool | None = None
    global_bench: bool | None = None
    employment_status: EmploymentStatus | None = None
    skill_names: str | None = None
    skill_level: SkillLevel | None = None
    years_experience: int | None = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeResponse(EmployeeBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)