import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.database import get_db
from app.core.config import settings
from app.models.employee import Employee
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/employee/login")

class EmployeeProfileUpdate(BaseModel):
    designation: str | None = None
    department: str | None = None
    skill_names: str | None = None
    experience_years: int | None = None

def get_current_employee(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        emp_id: str = payload.get("sub")
        role: str = payload.get("role")
        if emp_id is None or role != "employee":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    try:
        e_uuid = uuid.UUID(emp_id)
    except ValueError:
        raise credentials_exception

    employee = db.query(Employee).filter(Employee.id == e_uuid).first()
    if employee is None:
        raise credentials_exception
    return employee

@router.get("/")
def get_profile(current_employee: Employee = Depends(get_current_employee)):
    return {
        "id": str(current_employee.id),
        "employee_code": current_employee.employee_code,
        "full_name": current_employee.full_name,
        "designation": current_employee.designation,
        "department": current_employee.department,
        "experience_years": current_employee.experience_years,
        "skill_names": current_employee.skill_names,
        "hourly_cost": current_employee.hourly_cost,
    }

@router.put("/")
def update_profile(
    update_data: EmployeeProfileUpdate, 
    current_employee: Employee = Depends(get_current_employee), 
    db: Session = Depends(get_db)
):
    if update_data.designation is not None:
        current_employee.designation = update_data.designation
    if update_data.department is not None:
        current_employee.department = update_data.department
    if update_data.skill_names is not None:
        current_employee.skill_names = update_data.skill_names
    if update_data.experience_years is not None:
        current_employee.experience_years = update_data.experience_years

    db.commit()
    db.refresh(current_employee)
    
    return {
        "message": "Profile updated successfully",
        "profile": {
            "id": str(current_employee.id),
            "full_name": current_employee.full_name,
            "designation": current_employee.designation,
            "skill_names": current_employee.skill_names
        }
    }
