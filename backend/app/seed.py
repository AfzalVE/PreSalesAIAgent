import uuid
import random
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import SessionLocal, engine, Base
from app.models.enums import UserRole, UserStatus, OTPPurpose
from app.models.user import User
from app.models.email_otp import EmailOTP
from app.models.employee import Employee, EmploymentStatus, SkillLevel
from app.models.proposal_request import ProposalRequest, CommunicationType, ProposalRequestStatus
from app.models.proposal import Proposal, ProposalType, ProposalStatus
from app.models.resource_allocation import ResourceAllocation
from app.models.final_proposal import FinalProposal
from app.models.poc_document import POCDocument
from app.models.ai_conversation import AIConversation, SenderType, MessageType

# Password hashing helper
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_hashed_password(password: str) -> str:
    return pwd_context.hash(password)

def clean_database(db: Session):
    print("🧹 Cleaning existing data in correct dependency order...")
    # Order: AIConversation -> POCDocument -> FinalProposal -> ResourceAllocation -> Proposal -> ProposalRequest -> EmailOTP -> User -> Employee
    db.query(AIConversation).delete()
    db.query(POCDocument).delete()
    db.query(FinalProposal).delete()
    db.query(ResourceAllocation).delete()
    db.query(Proposal).delete()
    db.query(ProposalRequest).delete()
    db.query(EmailOTP).delete()
    db.query(User).delete()
    db.query(Employee).delete()
    db.commit()
    print("✅ Database cleaned.")

def seed_data():
    # Make sure all tables are created
    print("🔨 Ensuring all tables exist...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        clean_database(db)
        
        print("🌱 Seeding data...")

        # 1. Seed 3 Users
        print("👤 Seeding 3 Users...")
        password_hash = get_hashed_password("Password123!")
        
        client_user = User(
            id=uuid.uuid4(),
            full_name="Alice Johnson",
            email="client@acme.com",
            password_hash=password_hash,
            role=UserRole.CLIENT,
            company_name="Acme Corp",
            phone="+15550199",
            status=UserStatus.ACTIVE,
            is_verification_required=False,
            is_verified=True
        )
        
        admin_user = User(
            id=uuid.uuid4(),
            full_name="Bob Smith",
            email="admin@presales.com",
            password_hash=password_hash,
            role=UserRole.ADMIN,
            company_name="PreSales AI",
            phone="+15550188",
            status=UserStatus.ACTIVE,
            is_verification_required=False,
            is_verified=True
        )
        
        manager_user = User(
            id=uuid.uuid4(),
            full_name="Charlie Brown",
            email="manager@presales.com",
            password_hash=password_hash,
            role=UserRole.MANAGER,
            company_name="PreSales AI",
            phone="+15550177",
            status=UserStatus.ACTIVE,
            is_verification_required=False,
            is_verified=True
        )
        
        db.add_all([client_user, admin_user, manager_user])
        db.flush() # Populate IDs

        # 2. Seed 3 Email OTP records
        print("🔑 Seeding 3 Email OTP records...")
        otp_client = EmailOTP(
            id=uuid.uuid4(),
            user_id=client_user.id,
            email=client_user.email,
            otp="123456",
            purpose=OTPPurpose.LOGIN,
            is_verified=True,
            expires_at=datetime.utcnow() - timedelta(minutes=5),
            verified_at=datetime.utcnow() - timedelta(minutes=5),
            attempts=1
        )
        otp_admin = EmailOTP(
            id=uuid.uuid4(),
            user_id=admin_user.id,
            email=admin_user.email,
            otp="654321",
            purpose=OTPPurpose.REGISTRATION,
            is_verified=True,
            expires_at=datetime.utcnow() - timedelta(hours=1),
            verified_at=datetime.utcnow() - timedelta(minutes=59),
            attempts=1
        )
        otp_manager = EmailOTP(
            id=uuid.uuid4(),
            user_id=manager_user.id,
            email=manager_user.email,
            otp="987654",
            purpose=OTPPurpose.PASSWORD_RESET,
            is_verified=False,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            attempts=0
        )
        db.add_all([otp_client, otp_admin, otp_manager])

        # 3. Seed 5 Employees
        print("👷 Seeding 5 Employees...")
        employee_1 = Employee(
            id=uuid.uuid4(),
            employee_code="EMP-001",
            full_name="John Doe",
            designation="Senior Backend Engineer",
            department="Engineering",
            experience_years=8,
            hourly_cost=75.00,
            daily_capacity_hours=8,
            allocated_hours=0,
            available_hours=8,
            bench_status=False,
            global_bench=False,
            employment_status=EmploymentStatus.ACTIVE,
            skill_names="Python, FastAPI, PostgreSQL, AWS, Docker",
            skill_level=SkillLevel.EXPERT,
            years_experience=8
        )
        employee_2 = Employee(
            id=uuid.uuid4(),
            employee_code="EMP-002",
            full_name="Jane Miller",
            designation="Senior Frontend Engineer",
            department="Engineering",
            experience_years=6,
            hourly_cost=70.00,
            daily_capacity_hours=8,
            allocated_hours=0,
            available_hours=8,
            bench_status=False,
            global_bench=False,
            employment_status=EmploymentStatus.ACTIVE,
            skill_names="React, TypeScript, Next.js, Tailwind CSS, HTML5/CSS3",
            skill_level=SkillLevel.EXPERT,
            years_experience=6
        )
        employee_3 = Employee(
            id=uuid.uuid4(),
            employee_code="EMP-003",
            full_name="Dave Wilson",
            designation="Solutions Architect",
            department="Consulting",
            experience_years=12,
            hourly_cost=120.00,
            daily_capacity_hours=8,
            allocated_hours=0,
            available_hours=8,
            bench_status=True,
            global_bench=True,
            employment_status=EmploymentStatus.ACTIVE,
            skill_names="AWS, Kubernetes, System Design, Microservices, Security",
            skill_level=SkillLevel.EXPERT,
            years_experience=12
        )
        employee_4 = Employee(
            id=uuid.uuid4(),
            employee_code="EMP-004",
            full_name="Sarah Connor",
            designation="QA Automation Engineer",
            department="Quality Assurance",
            experience_years=4,
            hourly_cost=50.00,
            daily_capacity_hours=8,
            allocated_hours=0,
            available_hours=8,
            bench_status=True,
            global_bench=True,
            employment_status=EmploymentStatus.ACTIVE,
            skill_names="Selenium, PyTest, Playwright, CI/CD, Postman",
            skill_level=SkillLevel.INTERMEDIATE,
            years_experience=4
        )
        employee_5 = Employee(
            id=uuid.uuid4(),
            employee_code="EMP-005",
            full_name="James Bond",
            designation="DevOps & Security Specialist",
            department="Engineering",
            experience_years=5,
            hourly_cost=90.00,
            daily_capacity_hours=8,
            allocated_hours=0,
            available_hours=8,
            bench_status=True,
            global_bench=True,
            employment_status=EmploymentStatus.ACTIVE,
            skill_names="Terraform, Docker, CI/CD GitHub Actions, Penetration Testing, OAuth",
            skill_level=SkillLevel.INTERMEDIATE,
            years_experience=5
        )
        db.add_all([employee_1, employee_2, employee_3, employee_4, employee_5])
        db.flush()

        # 4. Seed 3 Proposal Requests
        print("📝 Seeding 3 Proposal Requests...")
        req_1 = ProposalRequest(
            id=uuid.uuid4(),
            client_id=client_user.id,
            project_name="E-Commerce Replatforming",
            project_description="We need to migrate our legacy monolithic PHP e-commerce website to a modern, scalable microservices-based API platform. It must handle higher holiday traffic spikes and provide a modern React-based checkout experience.",
            business_domain="Retail & E-Commerce",
            preferred_technology=["FastAPI", "React", "PostgreSQL", "Docker"],
            budget=150000.00,
            timeline="6 months",
            communication_type=CommunicationType.FORM,
            extracted_json={
                "core_requirements": ["Product Catalog API", "Shopping Cart", "React Checkout Checkout Flow", "Payment Gateway Integration"],
                "non_functional_requirements": ["High scalability", "Response time under 200ms"],
                "target_audience": "Global Retail Consumers"
            },
            status=ProposalRequestStatus.COMPLETED
        )

        req_2 = ProposalRequest(
            id=uuid.uuid4(),
            client_id=client_user.id,
            project_name="AI Customer Support Agent",
            project_description="An AI chatbot system that integrates with our Zendesk ticketing. It should answer customer inquiries instantly using retrieval-augmented generation on our knowledge base, escalating to humans if needed.",
            business_domain="Customer Service & AI",
            preferred_technology=["Python", "OpenAI API", "Qdrant", "Node.js"],
            budget=80000.00,
            timeline="3 months",
            communication_type=CommunicationType.VOICE,
            transcript="Hello, we are looking to build a customer support chatbot that uses GPT models to answer tickets from Zendesk automatically. Budget is around 80k. We need it done in about 3 months.",
            extracted_json={
                "core_requirements": ["Zendesk Integration", "RAG Pipeline", "Agent Dashboard", "Analytics UI"],
                "non_functional_requirements": ["Data privacy compliant", "99.9% uptime"],
                "target_audience": "Internal Support Agents & End Users"
            },
            status=ProposalRequestStatus.COMPLETED
        )

        req_3 = ProposalRequest(
            id=uuid.uuid4(),
            client_id=client_user.id,
            project_name="Enterprise Resource Planner (ERP) Lite",
            project_description="A simplified cloud-based ERP tool for tracking inventory, purchase orders, and supplier relationships with real-time analytics dashboards.",
            business_domain="Operations & Enterprise Systems",
            preferred_technology=["Django", "Vue.js", "MySQL", "AWS"],
            budget=120000.00,
            timeline="5 months",
            communication_type=CommunicationType.FORM,
            extracted_json={
                "core_requirements": ["Inventory Tracking", "Supplier Management", "PO Generation", "Dashboard Analytics"],
                "non_functional_requirements": ["Mobile-friendly layout", "Role-based access control"],
                "target_audience": "Warehouse Managers & Operations Directors"
            },
            status=ProposalRequestStatus.COMPLETED
        )
        db.add_all([req_1, req_2, req_3])
        db.flush()

        # 5. Seed 6 Proposals (MVP + FULL for each of the 3 requests)
        print("📄 Seeding 6 Proposals...")
        
        # Request 1 Proposals (MVP + FULL)
        prop_1_mvp = Proposal(
            id=uuid.uuid4(),
            request_id=req_1.id,
            proposal_type=ProposalType.MVP,
            tech_stack={"backend": "FastAPI", "frontend": "React", "db": "PostgreSQL"},
            estimated_cost=45000.00,
            estimated_duration="2 months",
            selected_resources={"developers": 2, "qa": 1},
            scope="Deliver core Product Catalog API and basic checkout flow with Stripe integration. Minimal admin panel.",
            assumptions="Client provides existing product database dump and Stripe credentials.",
            risks="Third-party payment API delays could push delivery schedule back.",
            status=ProposalStatus.GENERATED
        )
        prop_1_full = Proposal(
            id=uuid.uuid4(),
            request_id=req_1.id,
            proposal_type=ProposalType.FULL,
            tech_stack={"backend": "FastAPI", "frontend": "React", "db": "PostgreSQL", "cloud": "AWS ECS"},
            estimated_cost=140000.00,
            estimated_duration="6 months",
            selected_resources={"developers": 3, "architect": 1, "qa": 1},
            scope="Complete redesign and migration including inventory system, microservices, advanced product search, loyalty program, and multi-tenant reseller dashboard.",
            assumptions="Migration source DB is accessible and documented. Active cooperation from client legacy IT team.",
            risks="Data migration from legacy system might contain inconsistencies.",
            status=ProposalStatus.APPROVED
        )

        # Request 2 Proposals (MVP + FULL)
        prop_2_mvp = Proposal(
            id=uuid.uuid4(),
            request_id=req_2.id,
            proposal_type=ProposalType.MVP,
            tech_stack={"backend": "Python", "llm": "OpenAI GPT-4o", "db": "Qdrant"},
            estimated_cost=25000.00,
            estimated_duration="1 month",
            selected_resources={"developers": 1, "architect": 1},
            scope="Build a basic chatbot widget UI and a Python backend endpoint connecting to OpenAI API utilizing fixed PDF manuals.",
            assumptions="Knowledge base documents are clean and well-structured.",
            risks="Hallucinations from the model if source documents are contradictory.",
            status=ProposalStatus.GENERATED
        )
        prop_2_full = Proposal(
            id=uuid.uuid4(),
            request_id=req_2.id,
            proposal_type=ProposalType.FULL,
            tech_stack={"backend": "FastAPI", "frontend": "React", "llm": "OpenAI GPT-4o", "vector_db": "Qdrant", "queue": "Celery & Redis"},
            estimated_cost=75000.00,
            estimated_duration="3 months",
            selected_resources={"developers": 2, "architect": 1, "qa": 1},
            scope="Full Zendesk bidirectional ticketing sync, live human escalation agent chat dashboard, multi-lingual support, and dynamic analytics reports.",
            assumptions="Zendesk Enterprise API access keys are provided on day one.",
            risks="Rate limiting from Zendesk or OpenAI APIs under high concurrent usage.",
            status=ProposalStatus.APPROVED
        )

        # Request 3 Proposals (MVP + FULL)
        prop_3_mvp = Proposal(
            id=uuid.uuid4(),
            request_id=req_3.id,
            proposal_type=ProposalType.MVP,
            tech_stack={"backend": "Django", "frontend": "Vue.js", "db": "MySQL"},
            estimated_cost=35000.00,
            estimated_duration="1.5 months",
            selected_resources={"developers": 2},
            scope="Basic inventory lists, supplier contact book, and manual purchase order creation interface.",
            assumptions="Users will manually upload inventory CSV files initially.",
            risks="Manual entries could cause reconciliation errors.",
            status=ProposalStatus.GENERATED
        )
        prop_3_full = Proposal(
            id=uuid.uuid4(),
            request_id=req_3.id,
            proposal_type=ProposalType.FULL,
            tech_stack={"backend": "Django", "frontend": "Vue.js", "db": "MySQL", "monitoring": "Sentry"},
            estimated_cost=115000.00,
            estimated_duration="5 months",
            selected_resources={"developers": 3, "architect": 1, "qa": 1},
            scope="Automated purchase orders with smart triggers, barcode scanning integrations, detailed analytics dashboard, and export features to QuickBooks.",
            assumptions="QuickBooks API matches standard REST definitions.",
            risks="QuickBooks API deprecations or auth token refresh flows breaking.",
            status=ProposalStatus.APPROVED
        )

        db.add_all([prop_1_mvp, prop_1_full, prop_2_mvp, prop_2_full, prop_3_mvp, prop_3_full])
        db.flush()

        # 6. Seed 15 Resource Allocations
        print("🔗 Seeding 15 Resource Allocations...")
        
        # Prop 1 MVP Allocations (3 allocations)
        allocs = [
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_1_mvp.id, employee_id=employee_1.id,
                role="Lead Backend Engineer", allocated_hours=160, duration_weeks=8, estimated_cost=12000.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_1_mvp.id, employee_id=employee_2.id,
                role="Frontend Developer", allocated_hours=160, duration_weeks=8, estimated_cost=11200.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_1_mvp.id, employee_id=employee_4.id,
                role="QA Tester", allocated_hours=60, duration_weeks=8, estimated_cost=3000.00
            ),
            
            # Prop 1 FULL Allocations (3 allocations)
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_1_full.id, employee_id=employee_1.id,
                role="Lead Backend Architect", allocated_hours=480, duration_weeks=24, estimated_cost=36000.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_1_full.id, employee_id=employee_2.id,
                role="Senior Frontend Architect", allocated_hours=400, duration_weeks=24, estimated_cost=28000.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_1_full.id, employee_id=employee_3.id,
                role="Solutions Architect", allocated_hours=120, duration_weeks=24, estimated_cost=14400.00
            ),
            
            # Prop 2 MVP Allocations (2 allocations)
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_2_mvp.id, employee_id=employee_1.id,
                role="AI Integration Developer", allocated_hours=80, duration_weeks=4, estimated_cost=6000.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_2_mvp.id, employee_id=employee_3.id,
                role="Solutions Architect", allocated_hours=40, duration_weeks=4, estimated_cost=4800.00
            ),
            
            # Prop 2 FULL Allocations (3 allocations)
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_2_full.id, employee_id=employee_1.id,
                role="Lead AI Developer", allocated_hours=240, duration_weeks=12, estimated_cost=18000.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_2_full.id, employee_id=employee_2.id,
                role="UI Developer", allocated_hours=180, duration_weeks=12, estimated_cost=12600.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_2_full.id, employee_id=employee_5.id,
                role="DevSecOps Engineer", allocated_hours=80, duration_weeks=12, estimated_cost=7200.00
            ),
            
            # Prop 3 MVP Allocations (2 allocations)
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_3_mvp.id, employee_id=employee_1.id,
                role="Backend Developer", allocated_hours=120, duration_weeks=6, estimated_cost=9000.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_3_mvp.id, employee_id=employee_2.id,
                role="Frontend Developer", allocated_hours=120, duration_weeks=6, estimated_cost=8400.00
            ),
            
            # Prop 3 FULL Allocations (2 allocations)
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_3_full.id, employee_id=employee_3.id,
                role="Chief Architect", allocated_hours=160, duration_weeks=20, estimated_cost=19200.00
            ),
            ResourceAllocation(
                id=uuid.uuid4(), proposal_id=prop_3_full.id, employee_id=employee_5.id,
                role="DevOps Infrastructure", allocated_hours=140, duration_weeks=20, estimated_cost=12600.00
            )
        ]
        db.add_all(allocs)
        db.flush()

        # Update employee allocation numbers based on these allocations
        # John Doe (employee_1) is allocated to MVP1 (160), FULL1 (480), MVP2 (80), FULL2 (240), MVP3 (120) = 1080 hours
        employee_1.allocated_hours = 1080
        employee_1.available_hours = max(0, employee_1.daily_capacity_hours * 250 - employee_1.allocated_hours) # assuming 250 work days
        
        # Jane Miller (employee_2) is allocated to MVP1 (160), FULL1 (400), FULL2 (180), MVP3 (120) = 860 hours
        employee_2.allocated_hours = 860
        employee_2.available_hours = max(0, employee_2.daily_capacity_hours * 250 - employee_2.allocated_hours)
        
        # Dave Wilson (employee_3) is allocated to FULL1 (120), MVP2 (40), FULL3 (160) = 320 hours
        employee_3.allocated_hours = 320
        employee_3.available_hours = max(0, employee_3.daily_capacity_hours * 250 - employee_3.allocated_hours)
        
        # Sarah Connor (employee_4) is allocated to MVP1 (60) = 60 hours
        employee_4.allocated_hours = 60
        employee_4.available_hours = max(0, employee_4.daily_capacity_hours * 250 - employee_4.allocated_hours)
        
        # James Bond (employee_5) is allocated to FULL2 (80), FULL3 (140) = 220 hours
        employee_5.allocated_hours = 220
        employee_5.available_hours = max(0, employee_5.daily_capacity_hours * 250 - employee_5.allocated_hours)

        # 7. Seed 3 Final Proposals (representing approved proposals)
        print("🏆 Seeding 3 Final Proposals...")
        final_prop_1 = FinalProposal(
            id=uuid.uuid4(),
            proposal_id=prop_1_full.id,
            final_cost=138000.00, # with slight discount applied during final stages
            final_timeline="5.5 months",
            final_scope="Complete microservices migration, React customer flow, loyalty program, Reseller backend, and multi-cloud setup.",
            pdf_url="https://s3.amazonaws.com/presales-proposals/Acme_Replatforming_Final_v1.pdf",
            poc_url="https://github.com/acme-corp/replatform-poc"
        )
        final_prop_2 = FinalProposal(
            id=uuid.uuid4(),
            proposal_id=prop_2_full.id,
            final_cost=75000.00,
            final_timeline="3 months",
            final_scope="Zendesk ticketing chatbot agent integration, live agent handoff UI, custom RAG pipeline, and administrator controls.",
            pdf_url="https://s3.amazonaws.com/presales-proposals/Zendesk_AI_Agent_Final_v1.pdf",
            poc_url="https://github.com/acme-corp/zendesk-ai-poc"
        )
        final_prop_3 = FinalProposal(
            id=uuid.uuid4(),
            proposal_id=prop_3_full.id,
            final_cost=110000.00,
            final_timeline="5 months",
            final_scope="Cloud-hosted ERP tool with inventory barcode scanners, custom notifications dashboard, and automated QuickBooks API sync.",
            pdf_url="https://s3.amazonaws.com/presales-proposals/ERP_Lite_Final_v1.pdf",
            poc_url="https://github.com/acme-corp/erp-lite-poc"
        )
        db.add_all([final_prop_1, final_prop_2, final_prop_3])
        db.flush()

        # 8. Seed 3 POC Documents
        print("🔧 Seeding 3 POC Documents...")
        poc_1 = POCDocument(
            id=uuid.uuid4(),
            proposal_id=prop_1_full.id,
            is_mvp=False,
            architecture="Microservices topology: FastAPI Backend serving JSON APIs, React Client served via CDN. AWS RDS Postgres database with Redis caching layer.",
            modules={
                "Auth Module": "JWT token verification, role-based access control.",
                "Catalog Module": "GraphQL API for high-performance product tree querying.",
                "Order Module": "Transactional state machine handling checkouts, Stripe webhook receivers, and email invoices."
            },
            api_list={
                "POST /api/v1/auth/login": "Authenticate user, returns access token",
                "GET /api/v1/catalog/products": "Paginated product listings",
                "POST /api/v1/checkout/charge": "Initiates payment session"
            },
            database_design={
                "users": "id, email, password_hash, role",
                "products": "id, sku, price, stock_qty, metadata",
                "orders": "id, client_id, total, status, invoice_url"
            },
            deployment_plan="Containerize each service with Docker. Deploy to AWS ECS with Fargate launch type, auto-scaling triggered by CPU utilization > 70%."
        )

        poc_2 = POCDocument(
            id=uuid.uuid4(),
            proposal_id=prop_2_full.id,
            is_mvp=True,
            architecture="Serverless chatbot. Client sends websocket events to FastAPI server, backend calls LangChain RAG agent querying Qdrant, returns response.",
            modules={
                "Ingestion Service": "Upload and parse PDF knowledge docs into chunks and upsert vectors.",
                "Chat Widget": "React based embeddable chat drawer.",
                "Zendesk Listener": "Webhook listener matching tickets to chatbot sessions."
            },
            api_list={
                "POST /api/v1/chatbot/query": "Single turn Q&A REST endpoint",
                "GET /api/v1/chatbot/ws": "Websocket connection for real-time conversation"
            },
            database_design={
                "documents": "id, filename, file_hash, uploaded_at",
                "chat_sessions": "id, client_id, start_time, duration",
                "chat_messages": "id, session_id, sender_type, text_content"
            },
            deployment_plan="FastAPI hosted on GCP Cloud Run. Vector db hosted on Qdrant Cloud. Frontend widget hosted on Vercel."
        )

        poc_3 = POCDocument(
            id=uuid.uuid4(),
            proposal_id=prop_3_full.id,
            is_mvp=False,
            architecture="Monolithic Django application. Server-side templates rendered using Vue components. MySQL database server.",
            modules={
                "Inventory Manager": "Performs stock tracking and updates supplier catalogs.",
                "Accounting Broker": "Queues transactions to QuickBooks via Celery tasks."
            },
            api_list={
                "POST /api/v1/inventory/items": "Add new inventory item",
                "GET /api/v1/inventory/alerts": "Lists low stock alarms"
            },
            database_design={
                "inventory_items": "id, description, supplier_id, min_stock, qty",
                "suppliers": "id, company_name, support_email, phone"
            },
            deployment_plan="Deploy on single AWS EC2 instance with MySQL RDS instance. Scheduled daily snapshots for backups."
        )
        db.add_all([poc_1, poc_2, poc_3])
        db.flush()

        # 9. Seed 12 AI Conversation messages (associated with proposal requests)
        print("💬 Seeding AI Conversation messages...")
        
        # Conversation for Request 1 (4 messages)
        convs = [
            AIConversation(
                id=uuid.uuid4(), request_id=req_1.id, sender=SenderType.CLIENT,
                message="Hi, we want to migrate our legacy web shop. We use PHP 7.4 with custom SQL and it keeps crashing under peak load. Can we build it in Python?",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(hours=5)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_1.id, sender=SenderType.AI,
                message="Hello Alice! Migrating to a modern Python stack is an excellent path. I recommend FastAPI for your backend due to its outstanding concurrency support. What database do you currently use and what is your average SKU count?",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(hours=4, minutes=50)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_1.id, sender=SenderType.CLIENT,
                message="We use MySQL right now. We have about 50,000 SKUs and experience up to 5,000 active concurrent shoppers during sales events. Do you support React for the checkout app?",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(hours=4, minutes=40)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_1.id, sender=SenderType.AI,
                message="Yes, absolutely. A React frontend paired with a FastAPI backend on a PostgreSQL database will easily handle 5,000 concurrent sessions when structured correctly. I will draft a comprehensive MVP and Full proposal for you.",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(hours=4, minutes=30)
            ),
            
            # Conversation for Request 2 (4 messages)
            AIConversation(
                id=uuid.uuid4(), request_id=req_2.id, sender=SenderType.CLIENT,
                message="We are looking to implement a support chatbot. It needs to look at our support guides and tickets, then answer clients automatically. Can we build this in 3 months?",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=2, hours=3)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_2.id, sender=SenderType.AI,
                message="Hi! Yes, 3 months is a very realistic timeline for an AI Customer Support Agent. We can deploy a production-ready system utilizing OpenAI's models and a vector database for Retrieval-Augmented Generation (RAG). Do you use Zendesk or Salesforce for ticketing?",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=2, hours=2, minutes=50)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_2.id, sender=SenderType.CLIENT,
                message="We use Zendesk, and we want to ensure the agent transfers to a human whenever it feels stuck or the customer asks for a live representative.",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=2, hours=2, minutes=40)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_2.id, sender=SenderType.AI,
                message="Understood. The live handoff feature will be integrated directly via the Zendesk API. I will prepare both an MVP proposal focusing on core PDF knowledge lookup, and a Full proposal encompassing full ticketing sync and human escalation features.",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=2, hours=2, minutes=30)
            ),
            
            # Conversation for Request 3 (4 messages)
            AIConversation(
                id=uuid.uuid4(), request_id=req_3.id, sender=SenderType.CLIENT,
                message="Hi! We want to track inventory and suppliers. We need a basic web dashboard.",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=1, hours=1)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_3.id, sender=SenderType.AI,
                message="Hello! An ERP Lite system will work perfectly. I suggest a Django-based backend for strong admin capability and Vue.js for a responsive dashboard. What is your estimated budget?",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=1, hours=0, minutes=50)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_3.id, sender=SenderType.CLIENT,
                message="Budget is around $120,000. It must be accessible on smartphones for our warehouse staff.",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=1, hours=0, minutes=40)
            ),
            AIConversation(
                id=uuid.uuid4(), request_id=req_3.id, sender=SenderType.AI,
                message="Excellent, we will ensure mobile responsive CSS layout configurations. I am generating the proposals now.",
                message_type=MessageType.TEXT, timestamp=datetime.utcnow() - timedelta(days=1, hours=0, minutes=30)
            )
        ]
        db.add_all(convs)
        
        # Commit all transitions
        db.commit()
        print("🎉 Database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
