import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee, EmploymentStatus, SkillLevel

from app.core.dependencies import get_current_active_admin

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class EmployeeUpdatePayload(BaseModel):
    availability: Optional[str] = None
    currentAllocation: Optional[int] = None
    availableHours: Optional[int] = None
    skills: Optional[List[str]] = None
    benchStatus: Optional[bool] = None

@router.get("", summary="List all employees with staffing details")
async def get_all_employees(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    employees = db.query(Employee).order_by(Employee.employee_code).all()
    result = []
    
    # Deterministic nice avatar mapping based on employee code or id
    avatars = {
        "EMP-001": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "EMP-002": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        "EMP-003": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        "EMP-004": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "EMP-005": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
    }

    for emp in employees:
        total_cap = emp.daily_capacity_hours * 250 if emp.daily_capacity_hours else 2000
        # Calculate clean allocation percentage
        if emp.allocated_hours + emp.available_hours > 0:
            alloc_pct = int((emp.allocated_hours / (emp.allocated_hours + emp.available_hours)) * 100)
        else:
            alloc_pct = min(100, int((emp.allocated_hours / total_cap) * 100)) if total_cap > 0 else 0

        skills_list = [s.strip() for s in emp.skill_names.split(",") if s.strip()]
        
        # Determine availability text
        if emp.bench_status or alloc_pct <= 0:
            availability_str = "Available"
        elif alloc_pct >= 80:
            availability_str = "Busy"
        else:
            availability_str = "Allocated"

        avatar_url = avatars.get(emp.employee_code, f"https://ui-avatars.com/api/?name={emp.full_name.replace(' ', '+')}&background=0D8ABC&color=fff")

        result.append({
            "id": str(emp.id),
            "code": emp.employee_code,
            "name": emp.full_name,
            "role": emp.designation,
            "department": emp.department,
            "hourlyCost": float(emp.hourly_cost),
            "experience": f"{emp.experience_years} Years",
            "experienceYears": emp.experience_years,
            "skills": skills_list,
            "availability": availability_str,
            "benchStatus": emp.bench_status,
            "currentAllocation": alloc_pct,
            "availableHours": emp.available_hours,
            "allocatedHours": emp.allocated_hours,
            "avatar": avatar_url
        })
    return result

@router.put("/{employee_id}", summary="Update employee bench status and allocation")
async def update_employee(
    employee_id: str,
    payload: EmployeeUpdatePayload,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")

    emp = db.query(Employee).filter(Employee.id == emp_uuid).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if payload.benchStatus is not None:
        emp.bench_status = payload.benchStatus
    if payload.availableHours is not None:
        emp.available_hours = payload.availableHours
    if payload.skills is not None:
        emp.skill_names = ", ".join(payload.skills)
    if payload.currentAllocation is not None:
        total_hours = emp.allocated_hours + emp.available_hours
        if total_hours <= 0:
            total_hours = 2000
        emp.allocated_hours = int((payload.currentAllocation / 100.0) * total_hours)
        emp.available_hours = max(0, total_hours - emp.allocated_hours)

    db.commit()
    db.refresh(emp)
    return {"status": "success", "message": "Employee updated successfully"}
