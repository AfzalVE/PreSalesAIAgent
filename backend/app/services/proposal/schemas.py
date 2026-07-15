"""
schemas.py
==========
Pydantic v2 models for the Proposal Engine input and output.
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------

class ClientInfo(BaseModel):
    company: str = Field(..., description="Client company name")
    contact: str = Field(..., description="Primary contact person")


class ProjectInfo(BaseModel):
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Short project description")
    industry: str = Field(..., description="Target industry")
    solution_type: str = Field(..., description="MVP / Full Product / POC etc.")


class TechStack(BaseModel):
    frontend: Optional[str] = None
    backend: Optional[str] = None
    database: Optional[str] = None
    hosting: Optional[str] = None
    extra: Optional[dict] = None  # catch-all for additional keys


class Phase(BaseModel):
    name: str
    weeks: int


class Timeline(BaseModel):
    duration: str
    phases: List[Phase]


class Budget(BaseModel):
    currency: str = "USD"
    amount: float


class TeamMember(BaseModel):
    role: str
    experience: str


class ProposalInput(BaseModel):
    """
    Full input schema accepted by the Proposal Engine.
    Maps directly to the JSON payload sent by the caller.
    """
    client: ClientInfo
    project: ProjectInfo
    features: List[str] = Field(default_factory=list)
    tech_stack: TechStack
    timeline: Timeline
    budget: Budget
    team: List[TeamMember] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)

    @field_validator("features", "risks", "assumptions", mode="before")
    @classmethod
    def strip_empty_strings(cls, v):
        if isinstance(v, list):
            return [item for item in v if item and str(item).strip()]
        return v


# ---------------------------------------------------------------------------
# Intermediate section schemas (LLM output per section)
# ---------------------------------------------------------------------------

class ExecutiveSummarySection(BaseModel):
    headline: str
    body: str


class SolutionDescriptionSection(BaseModel):
    overview: str
    key_benefits: List[str]
    feature_highlights: List[str]


class TechnicalDetailsSection(BaseModel):
    architecture_overview: str
    stack_rationale: str
    integration_notes: str


class TimelineSection(BaseModel):
    overview: str
    phases: List[dict]  # [{name, weeks, description}]
    milestones: List[str]


class BudgetSection(BaseModel):
    summary: str
    breakdown: List[dict]  # [{item, cost}]
    payment_terms: str


class RisksSection(BaseModel):
    intro: str
    risks: List[dict]  # [{risk, impact, mitigation}]


class DeliverablesSection(BaseModel):
    intro: str
    deliverables: List[str]


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

class ProposalOutput(BaseModel):
    """
    Full assembled proposal returned by the engine.
    Contains both the LLM-generated sections and the original
    input data needed by the renderer / document builder.
    """
    model_config = {"arbitrary_types_allowed": True}

    # ── Identity ─────────────────────────────────────────────────────
    proposal_id: str

    # ── From input (carried through for renderer access) ─────────────
    client: ClientInfo
    project: ProjectInfo
    tech_stack: TechStack
    team: List[TeamMember]
    assumptions: List[str]
    raw_budget: Budget              # original budget with currency + amount

    # ── LLM-generated sections ────────────────────────────────────────
    executive_summary: ExecutiveSummarySection
    solution_description: SolutionDescriptionSection
    technical_details: TechnicalDetailsSection
    timeline: TimelineSection
    budget_section: BudgetSection   # LLM-enriched budget narrative
    risks: RisksSection
    deliverables: DeliverablesSection

    # ── Document outputs (populated after rendering) ──────────────────
    html_content: Optional[str] = None
    pdf_bytes: Optional[bytes] = None
    docx_bytes: Optional[bytes] = None
