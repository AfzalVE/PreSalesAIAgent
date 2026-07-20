from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
import app.models  # Ensures all models are registered

# Routers (Uncomment as modules are created)
from app.api.v1.auth.auth_router import router as auth_router
from app.api.v1.users.user_router import router as user_router
from app.api.v1.employees.employee_router import router as employee_router
from app.api.v1.proposal_requests.proposal_request_router import router as proposal_request_router
from fastapi.staticfiles import StaticFiles
from app.api.v1.resource_allocation.resource_router import router as resource_router
from app.api.v1.proposals.proposal_router import router as proposal_router
from app.api.v1.ai_agent.ai_agent_router import router as ai_agent_router
from app.api.v1.admin.admin_router import router as admin_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup events
    """
    print("[DB] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Run manual migration for timeline_phases and employee columns
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE proposals ADD COLUMN IF NOT EXISTS timeline_phases JSONB"))
            conn.execute(text("ALTER TABLE employees ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(500)"))
            conn.execute(text("ALTER TABLE employees ADD COLUMN IF NOT EXISTS password VARCHAR(100)"))
            conn.commit()
            print("[DB] Database migration: tables verified/created.")
    except Exception as e:
        print(f"[DB] Migration failed: {e}")

    
    print("[DB] Seeding database...")
    from app.seed import seed_data
    try:
        seed_data()
    except Exception as e:
        print(f"[DB] Seeding failed: {e}")
        
    print("[API] AI Proposal Generator API Started")
    yield
    print("[API] AI Proposal Generator API Stopped")



app = FastAPI(
    title="AI Proposal Generator API",
    version="1.0.0",
    description="Backend API for AI Proposal Generator Platform",
#     lifespan=lifespan,
 )

# ----------------------------
# CORS
# ----------------------------

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Root
# ----------------------------


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "AI Proposal Generator Backend Running",
        "version": "1.0.0",
        "status": "healthy",
    }

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy"
    }


# ----------------------------
# Register Routers
# ----------------------------

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(employee_router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(proposal_request_router, prefix="/api/v1/proposal-requests", tags=["Proposal Requests"])
# app.include_router(cost_router, prefix="/api/v1/cost-estimation", tags=["Cost Estimation"])
app.include_router(resource_router, prefix="/api/v1/resource-allocation", tags=["Resource Allocation"])
app.include_router(proposal_router, prefix="/api/v1/proposals", tags=["Proposals"])
app.include_router(ai_agent_router, prefix="/api/v1/ai-agent", tags=["AI Agent"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin Studio"])

# Mount static folder for proposals
import os
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
