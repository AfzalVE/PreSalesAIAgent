import uuid
from typing import Any, Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.employee import Employee, EmploymentStatus, SkillLevel


def create_employee_service(payload: Any, db: Session) -> Dict[str, Any]:
    existing = db.query(Employee).filter(Employee.employee_code == payload.employee_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists")
        
    try:
        emp_status = EmploymentStatus[payload.employment_status.upper()]
    except KeyError:
        emp_status = EmploymentStatus.ACTIVE
        
    try:
        s_level = SkillLevel[payload.skill_level.upper()]
    except KeyError:
        s_level = SkillLevel.INTERMEDIATE

    new_emp = Employee(
        id=uuid.uuid4(),
        employee_code=payload.employee_code,
        full_name=payload.full_name,
        designation=payload.designation,
        department=payload.department,
        experience_years=payload.experience_years,
        hourly_cost=payload.hourly_cost,
        daily_capacity_hours=payload.daily_capacity_hours,
        allocated_hours=payload.allocated_hours,
        available_hours=payload.available_hours,
        bench_status=payload.bench_status,
        global_bench=payload.global_bench,
        employment_status=emp_status,
        skill_names=payload.skill_names,
        skill_level=s_level,
        years_experience=payload.years_experience,
        password=payload.password or "Employee123!",
        pdf_path=payload.pdf_path
    )
    
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return {"status": "success", "message": "Employee created successfully", "id": str(new_emp.id)}
