import json
import uuid
from typing import Dict, List, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.client_employee_chat import ClientEmployeeChat
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

import csv
import os
from app.models.employee import Employee
from app.models.user import User

def sync_employee_from_csv(e_uuid: uuid.UUID, db: Session) -> Employee:
    # Check if already in DB
    emp = db.query(Employee).filter(Employee.id == e_uuid).first()
    if emp:
        return emp

    # Read CSV
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "resource", "employees.csv"))
    if not os.path.exists(csv_path):
        logger.error(f"CSV file not found at: {csv_path}")
        return None

    try:
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if uuid.UUID(row["id"].strip()) == e_uuid:
                    db_emp = Employee(
                        id=uuid.UUID(row["id"].strip()),
                        employee_code=row["employee_code"].strip(),
                        full_name=row["full_name"].strip(),
                        designation=row["designation"].strip(),
                        department=row["department"].strip(),
                        experience_years=int(row["experience_years"].strip()) if row.get("experience_years") else 0,
                        hourly_cost=float(row["hourly_cost"].strip()) if row.get("hourly_cost") else 0.0,
                        daily_capacity_hours=int(row["daily_capacity_hours"].strip()) if row.get("daily_capacity_hours") else 8,
                        allocated_hours=int(row["allocated_hours"].strip()) if row.get("allocated_hours") else 0,
                        available_hours=int(row["available_hours"].strip()) if row.get("available_hours") else 8,
                        bench_status=row["bench_status"].strip().lower() == "true",
                        global_bench=row["global_bench"].strip().lower() == "true",
                        skill_names=row["skill_names"].strip(),
                        years_experience=int(row["years_experience"].strip()) if row.get("years_experience") else 0,
                    )
                    db.add(db_emp)
                    db.commit()
                    db.refresh(db_emp)
                    return db_emp
    except Exception as ex:
        logger.error(f"Error syncing employee from CSV: {ex}")
        db.rollback()
    
    return None

class ConnectionManager:
    def __init__(self):
        # Maps user_id (string) to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

@router.get("/history/{client_id}/{employee_id}")
async def get_chat_history(client_id: str, employee_id: str, db: Session = Depends(get_db)):
    """
    Fetch chat history between a client and an employee.
    """
    try:
        c_id_str = client_id.replace("client_", "") if client_id.startswith("client_") else client_id
        c_uuid = uuid.UUID(c_id_str)
        e_uuid = uuid.UUID(employee_id)
    except ValueError:
        # Fallback for dummy IDs if they aren't valid UUIDs
        return []

    # Map dummy/missing employee to the first real employee in CSV
    db_employee = sync_employee_from_csv(e_uuid, db)
    if not db_employee:
        try:
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "resource", "employees.csv"))
            if os.path.exists(csv_path):
                with open(csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    first_row = next(reader, None)
                    if first_row:
                        fallback_uuid = uuid.UUID(first_row["id"].strip())
                        db_employee = sync_employee_from_csv(fallback_uuid, db)
        except Exception as csv_err:
            logger.error(f"Error loading fallback from CSV: {csv_err}")
    if db_employee:
        e_uuid = db_employee.id

    # Map dummy/missing client to the first real user
    db_client = db.query(User).filter(User.id == c_uuid).first()
    if not db_client:
        db_client = db.query(User).first()
        if db_client:
            c_uuid = db_client.id

    chats = db.query(ClientEmployeeChat).filter(
        (ClientEmployeeChat.client_id == c_uuid) & 
        (ClientEmployeeChat.employee_id == e_uuid)
    ).order_by(ClientEmployeeChat.timestamp.asc()).all()
    
    return [
        {
            "id": str(c.id),
            "sender": "client" if c.sender == "CLIENT" else "employee",
            "text": c.message,
            "time": c.timestamp.strftime("%I:%M %p")
        } for c in chats
    ]

@router.get("/conversations/{client_id}")
async def get_client_conversations(client_id: str, db: Session = Depends(get_db)):
    """
    Fetch a unique list of developers a client has chatted with.
    """
    try:
        c_id_str = client_id.replace("client_", "") if client_id.startswith("client_") else client_id
        c_uuid = uuid.UUID(c_id_str)
    except ValueError:
        return []

    # Map dummy/missing client to the first real user (matching our fallback logic)
    db_client = db.query(User).filter(User.id == c_uuid).first()
    if not db_client:
        db_client = db.query(User).first()
        if db_client:
            c_uuid = db_client.id
        else:
            return []

    # Get all chats for this client, ordered by newest first
    chats = db.query(ClientEmployeeChat).filter(
        ClientEmployeeChat.client_id == c_uuid
    ).order_by(ClientEmployeeChat.timestamp.desc()).all()

    # Group by employee to get the latest message per employee
    conversations = {}
    for chat in chats:
        emp_id = str(chat.employee_id)
        if emp_id not in conversations:
            conversations[emp_id] = {
                "employee_id": emp_id,
                "employee_name": chat.employee_name or "Developer",
                "last_message": chat.message,
                "last_message_time": chat.timestamp.strftime("%b %d, %I:%M %p"),
                "timestamp": chat.timestamp
            }

    # Return as a list sorted by most recent conversation
    convo_list = list(conversations.values())
    convo_list.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Remove raw timestamp object before sending JSON
    for c in convo_list:
        del c["timestamp"]
        
    return convo_list

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for real-time chat, calls, and video.
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type")
            target_id = data.get("target_id")
            content = data.get("content")

            if not target_id:
                continue

            # Forward the message to the target user if they are online
            payload = {
                "type": msg_type,
                "sender_id": user_id,
                "content": content
            }
            
            # Save to database
            if msg_type in ("chat", "save_call_log"):
                try:
                    is_client = user_id.startswith("client_")
                    c_id_raw = user_id if is_client else target_id
                    e_id_raw = target_id if is_client else user_id

                    c_id_str = c_id_raw.replace("client_", "") if c_id_raw.startswith("client_") else c_id_raw
                    e_id_str = e_id_raw

                    try:
                        c_uuid = uuid.UUID(c_id_str)
                    except ValueError:
                        c_uuid = uuid.UUID('00000000-0000-0000-0000-000000000001')
                    
                    try:
                        e_uuid = uuid.UUID(e_id_str)
                    except ValueError:
                        e_uuid = uuid.UUID('00000000-0000-0000-0000-000000000002')

                    # Foreign Key Bypass: Ensure employee exists in DB from CSV
                    db_employee = sync_employee_from_csv(e_uuid, db)
                    if not db_employee:
                        # Grab first employee in CSV as fallback
                        try:
                            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "resource", "employees.csv"))
                            if os.path.exists(csv_path):
                                with open(csv_path, mode="r", encoding="utf-8") as f:
                                    reader = csv.DictReader(f)
                                    first_row = next(reader, None)
                                    if first_row:
                                        fallback_uuid = uuid.UUID(first_row["id"].strip())
                                        db_employee = sync_employee_from_csv(fallback_uuid, db)
                        except Exception as csv_err:
                            logger.error(f"Error loading fallback from CSV: {csv_err}")
                    if db_employee:
                        e_uuid = db_employee.id

                    # Foreign Key Bypass: Ensure client_id exists
                    db_client = db.query(User).filter(User.id == c_uuid).first()
                    if not db_client:
                        db_client = db.query(User).first()
                        if db_client:
                            c_uuid = db_client.id

                    db_chat = ClientEmployeeChat(
                        employee_id=e_uuid,
                        employee_name=db_employee.full_name if db_employee else "Developer", 
                        client_id=c_uuid,
                        sender="CLIENT" if is_client else "EMPLOYEE",
                        message=content
                    )
                    db.add(db_chat)
                    db.commit()
                except Exception as e:
                    logger.error(f"Error saving chat to DB: {e}")
                    db.rollback()

            # Send to target
            await manager.send_personal_message(payload, target_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
