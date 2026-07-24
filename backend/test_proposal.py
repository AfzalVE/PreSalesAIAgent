import asyncio
from app.core.database import SessionLocal
from app.models.proposal import Proposal
from app.models.proposal_request import ProposalRequest

db = SessionLocal()
reqs = db.query(ProposalRequest).all()
for r in reqs:
    print(f"Request: {r.project_name}, full timeline: {r.timeline}")
    for p in r.proposals:
        print(f"  Proposal: {p.proposal_type}, estimated_duration: {p.estimated_duration}")
db.close()
