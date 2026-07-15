from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers (Uncomment as modules are created)
# from app.api.v1.auth.auth_router import router as auth_router
# from app.api.v1.users.user_router import router as user_router
# from app.api.v1.employees.employee_router import router as employee_router
# from app.api.v1.proposal_requests.proposal_request_router import router as proposal_request_router
# from app.api.v1.proposals.proposal_router import router as proposal_router
# from app.api.v1.cost_estimation.cost_router import router as cost_router
# from app.api.v1.resource_allocation.resource_router import router as resource_router
# from app.api.v1.poc.poc_router import router as poc_router
# from app.api.v1.pdf.pdf_router import router as pdf_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup events
    """
    print("🚀 AI Proposal Generator API Started")
    yield
    print("🛑 AI Proposal Generator API Stopped")


app = FastAPI(
    title="AI Proposal Generator API",
    version="1.0.0",
    description="Backend API for AI Proposal Generator Platform",
    lifespan=lifespan,
)

# ----------------------------
# CORS
# ----------------------------

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
# app.include_router(employee_router, prefix="/api/v1/employees", tags=["Employees"])
# app.include_router(proposal_request_router, prefix="/api/v1/proposal-requests", tags=["Proposal Requests"])
# app.include_router(cost_router, prefix="/api/v1/cost-estimation", tags=["Cost Estimation"])
# app.include_router(resource_router, prefix="/api/v1/resource-allocation", tags=["Resource Allocation"])
# app.include_router(proposal_router, prefix="/api/v1/proposals", tags=["Proposals"])
# app.include_router(poc_router, prefix="/api/v1/poc", tags=["POC"])
# app.include_router(pdf_router, prefix="/api/v1/pdf", tags=["PDF"])