import uuid
import os
import shutil
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee, EmploymentStatus, SkillLevel
from app.models.user import User
from app.models.client_employee_chat import ClientEmployeeChat

from app.core.dependencies import get_current_active_admin
from app.services.employees import create_employee_service

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
    password: Optional[str] = None
    pdfPath: Optional[str] = None

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
            "avatar": avatar_url,
            "password": emp.password or "Employee123!",
            "pdfPath": emp.pdf_path
        })
    return result

class EmployeeCreatePayload(BaseModel):
    employee_code: str
    full_name: str
    designation: str
    department: str
    experience_years: int
    hourly_cost: float
    daily_capacity_hours: int = 8
    allocated_hours: int = 0
    available_hours: int = 8
    bench_status: bool = False
    global_bench: bool = False
    employment_status: str = "ACTIVE"
    skill_names: str
    skill_level: str = "INTERMEDIATE"
    years_experience: int = 0
    password: Optional[str] = None
    pdf_path: Optional[str] = None

@router.post("", summary="Create a new employee")
async def create_employee(
    payload: EmployeeCreatePayload,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    return create_employee_service(payload, db)

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
    if payload.password is not None:
        emp.password = payload.password
    if payload.pdfPath is not None:
        emp.pdf_path = payload.pdfPath
    if payload.currentAllocation is not None:
        total_hours = emp.allocated_hours + emp.available_hours
        if total_hours <= 0:
            total_hours = 2000
        emp.allocated_hours = int((payload.currentAllocation / 100.0) * total_hours)
        emp.available_hours = max(0, total_hours - emp.allocated_hours)

    db.commit()
    db.refresh(emp)
    return {"status": "success", "message": "Employee updated successfully"}

@router.post("/{employee_id}/upload-pdf", summary="Upload employee PDF resume/details")
async def upload_employee_pdf(
    employee_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        emp_uuid = uuid.UUID(employee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")

    emp = db.query(Employee).filter(Employee.id == emp_uuid).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Define upload directory
    upload_dir = os.path.join("app", "static", "employees")
    os.makedirs(upload_dir, exist_ok=True)

    # Secure filename creation using employee code/id
    safe_filename = f"{emp.employee_code or str(emp.id)}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Store reference path in database
    db_relative_path = f"/static/employees/{safe_filename}"
    emp.pdf_path = db_relative_path
    db.commit()
    db.refresh(emp)

    return {
        "status": "success",
        "message": "PDF uploaded successfully",
        "pdfPath": db_relative_path
    }

@router.get("/chats", summary="Get all client-employee chat threads")
async def get_client_employee_chats(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    # Retrieve all client-employee chats
    chats = db.query(ClientEmployeeChat).order_by(ClientEmployeeChat.timestamp.asc()).all()
    
    # We can group them by (client_id, employee_id)
    grouped = {}
    for chat in chats:
        key = (chat.client_id, chat.employee_id)
        if key not in grouped:
            # Fetch client name
            client = db.query(User).filter(User.id == chat.client_id).first()
            client_name = client.full_name if client else "Unknown Client"
            company_name = client.company_name if client else "Acme Corp"
            
            # Fetch employee
            emp = db.query(Employee).filter(Employee.id == chat.employee_id).first()
            emp_name = emp.full_name if emp else chat.employee_name
            emp_role = emp.designation if emp else "Specialist"
            
            grouped[key] = {
                "clientId": str(chat.client_id),
                "clientName": client_name,
                "companyName": company_name,
                "employeeId": str(chat.employee_id),
                "employeeName": emp_name,
                "employeeRole": emp_role,
                "messages": []
            }
        
        # Determine time representation
        time_str = chat.timestamp.strftime("%I:%M %p") if chat.timestamp else "Just now"
        
        grouped[key]["messages"].append({
            "sender": chat.sender.lower(),  # "client" or "employee"
            "text": chat.message,
            "time": time_str
        })
        
    return list(grouped.values())

class ChatCreatePayload(BaseModel):
    employeeId: str
    clientId: str
    sender: str
    message: str

@router.post("/chats", summary="Send a client-employee chat message")
async def send_client_employee_chat(
    payload: ChatCreatePayload,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        emp_uuid = uuid.UUID(payload.employeeId)
        client_uuid = uuid.UUID(payload.clientId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
        
    emp = db.query(Employee).filter(Employee.id == emp_uuid).first()
    emp_name = emp.full_name if emp else "Unknown Employee"
    
    new_chat = ClientEmployeeChat(
        id=uuid.uuid4(),
        employee_id=emp_uuid,
        employee_name=emp_name,
        client_id=client_uuid,
        sender=payload.sender,
        message=payload.message
    )
    
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return {"status": "success", "message": "Message sent successfully"}
