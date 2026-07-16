from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.admin.admin_service import get_dashboard_stats_service, get_otp_logs_service

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard-stats", summary="Fetch comprehensive metrics and charts for Resource Operations Studio Dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return get_dashboard_stats_service(db)

@router.get("/otp-logs", summary="Fetch OTP Verification Logs from Database")
async def get_otp_logs(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return get_otp_logs_service(db)
