import os
import csv
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.employee import Employee
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class EmployeeLoginReq(BaseModel):
    employee_code: str
    password: str

class EmployeeSignupReq(BaseModel):
    full_name: str
    password: str
    designation: str = "Developer"
    department: str = "Engineering"
    skill_names: str = "JavaScript, React"

def get_employee_from_csv(employee_code: str):
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "resource", "employees.csv"))
    if not os.path.exists(csv_path):
        return None
    try:
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["employee_code"].strip().lower() == employee_code.lower():
                    return row
    except Exception as e:
        logger.error(f"Error reading employee CSV: {e}")
    return None

@router.post("/login")
def login_employee(req: EmployeeLoginReq, db: Session = Depends(get_db)):
    # 1. Check if employee is in DB
    db_emp = db.query(Employee).filter(Employee.employee_code == req.employee_code).first()
    
    # 2. If not in DB, check CSV
    if not db_emp:
        csv_emp = get_employee_from_csv(req.employee_code)
        if csv_emp:
            # Sync to DB
            db_emp = Employee(
                id=uuid.UUID(csv_emp["id"].strip()),
                employee_code=csv_emp["employee_code"].strip(),
                full_name=csv_emp["full_name"].strip(),
                designation=csv_emp["designation"].strip(),
                department=csv_emp["department"].strip(),
                experience_years=int(csv_emp["experience_years"].strip()) if csv_emp.get("experience_years") else 0,
                hourly_cost=float(csv_emp["hourly_cost"].strip()) if csv_emp.get("hourly_cost") else 0.0,
                skill_names=csv_emp["skill_names"].strip(),
                password=get_password_hash(csv_emp["password"].strip()) if csv_emp.get("password") else get_password_hash("Password@123")
            )
            db.add(db_emp)
            db.commit()
            db.refresh(db_emp)
        else:
            raise HTTPException(status_code=401, detail="Invalid employee code or password")

    # 3. Verify password
    # If the db_emp was synced from chat_router previously, it might not have a password set!
    if not db_emp.password:
        csv_emp = get_employee_from_csv(req.employee_code)
        default_pwd = csv_emp["password"].strip() if csv_emp and csv_emp.get("password") else "Password@123"
        if req.password == default_pwd:
            db_emp.password = get_password_hash(req.password)
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="Invalid employee code or password")
    elif not verify_password(req.password, db_emp.password):
        raise HTTPException(status_code=401, detail="Invalid employee code or password")

    # 4. Generate Token
    access_token = create_access_token(data={"sub": str(db_emp.id), "role": "employee"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "employee",
        "full_name": db_emp.full_name,
        "employee_code": db_emp.employee_code,
        "employee_id": str(db_emp.id)
    }

@router.post("/signup")
def signup_employee(req: EmployeeSignupReq, db: Session = Depends(get_db)):
    # Generate a unique employee code
    import random
    new_code = f"EMP{random.randint(2000, 9999)}"
    
    db_emp = Employee(
        id=uuid.uuid4(),
        employee_code=new_code,
        full_name=req.full_name,
        designation=req.designation,
        department=req.department,
        experience_years=1,
        hourly_cost=30.0,
        skill_names=req.skill_names,
        password=get_password_hash(req.password)
    )
    
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)

    access_token = create_access_token(data={"sub": str(db_emp.id), "role": "employee"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "employee",
        "full_name": db_emp.full_name,
        "employee_code": db_emp.employee_code,
        "employee_id": str(db_emp.id)
    }
