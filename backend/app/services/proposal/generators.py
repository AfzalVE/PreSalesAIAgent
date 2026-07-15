"""
generators.py
=============
One async function per proposal section.  Each function calls the LLM,
parses a typed response, and returns the matching Pydantic schema.

Pipeline order:
    1. Executive Summary
    2. Solution Description
    3. Technical Details
    4. Timeline Section
    5. Budget Section
    6. Risks Section
    7. Deliverables Section
"""

from __future__ import annotations

import json
import logging
from typing import List

from .llm_client import call_llm_json
from .schemas import (
    ProposalInput,
    ExecutiveSummarySection,
    SolutionDescriptionSection,
    TechnicalDetailsSection,
    TimelineSection,
    BudgetSection,
    RisksSection,
    DeliverablesSection,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared context builder
# ---------------------------------------------------------------------------

def _build_context(data: ProposalInput) -> str:
    """Serialize the proposal input as a compact JSON context string for LLM prompts."""
    return json.dumps(data.model_dump(), indent=2)


# ---------------------------------------------------------------------------
# 1. Executive Summary
# ---------------------------------------------------------------------------

async def generate_executive_summary(data: ProposalInput) -> ExecutiveSummarySection:
    """
    Generate a compelling executive summary.
    Output: { headline, body }
    """
    logger.info("Generating executive summary...")

    system_prompt = """
You are a senior pre-sales consultant and proposal writer at a top-tier software consultancy.
Your task is to write a compelling EXECUTIVE SUMMARY for a software project proposal.

Guidelines:
- The 'headline' must be a single punchy sentence (max 20 words) that captures the project's core value proposition.
- The 'body' must be 3–4 professional paragraphs covering:
    1. Understanding of the client's business challenge.
    2. The proposed solution and its strategic fit.
    3. Expected business outcomes and ROI.
    4. A confident closing statement about partnership and commitment.
- Use a professional, confident, client-facing tone.
- Avoid generic filler. Be specific to the project details provided.
- Do NOT use bullet points inside the body — write in flowing prose.
"""

    user_prompt = f"""
Here is the project information:

{_build_context(data)}

Write the executive summary now.
"""
    return await call_llm_json(system_prompt, user_prompt, ExecutiveSummarySection, temperature=0.5)


# ---------------------------------------------------------------------------
# 2. Solution Description
# ---------------------------------------------------------------------------

async def generate_solution_description(data: ProposalInput) -> SolutionDescriptionSection:
    """
    Generate solution overview, key benefits, and feature highlights.
    Output: { overview, key_benefits: [...], feature_highlights: [...] }
    """
    logger.info("Generating solution description...")

    feature_list = "\n".join(f"  - {f}" for f in data.features)

    system_prompt = """
You are a solutions architect and pre-sales expert.
Your task is to describe the proposed software solution for a client proposal.

Guidelines:
- 'overview': 2 paragraphs explaining WHAT the solution is and HOW it addresses the client's needs.
- 'key_benefits': Exactly 5 strategic business benefits (each 1–2 sentences, impact-focused).
- 'feature_highlights': One sentence per feature listed in the project, written in client-friendly language (not technical jargon). Keep the exact count matching the features provided.
- Write from the client's perspective — what do THEY gain?
"""

    user_prompt = f"""
Project context:
{_build_context(data)}

Features to highlight:
{feature_list}

Write the solution description now.
"""
    return await call_llm_json(system_prompt, user_prompt, SolutionDescriptionSection, temperature=0.4)


# ---------------------------------------------------------------------------
# 3. Technical Details
# ---------------------------------------------------------------------------

async def generate_technical_details(data: ProposalInput) -> TechnicalDetailsSection:
    """
    Generate architecture overview, tech stack rationale, and integration notes.
    Output: { architecture_overview, stack_rationale, integration_notes }
    """
    logger.info("Generating technical details...")

    stack = data.tech_stack.model_dump(exclude_none=True)

    system_prompt = """
You are a principal software architect writing the technical section of a client proposal.

Guidelines:
- 'architecture_overview': 2 paragraphs describing the high-level system architecture, components, 
  data flow, and how the chosen stack fits together. Be precise and professional.
- 'stack_rationale': 1 paragraph per major technology layer (frontend, backend, database, hosting) 
  explaining WHY it was chosen — performance, scalability, cost, ecosystem, team expertise.
- 'integration_notes': 1–2 paragraphs covering third-party integrations, APIs, security 
  considerations, and deployment strategy.
- Write for a technically-aware but non-specialist audience (e.g., CTO / product director).
"""

    user_prompt = f"""
Project context:
{_build_context(data)}

Technology stack:
{json.dumps(stack, indent=2)}

Write the technical details section now.
"""
    return await call_llm_json(system_prompt, user_prompt, TechnicalDetailsSection, temperature=0.3)


# ---------------------------------------------------------------------------
# 4. Timeline Section
# ---------------------------------------------------------------------------

async def generate_timeline_section(data: ProposalInput) -> TimelineSection:
    """
    Generate timeline overview, enriched phase descriptions, and key milestones.
    Output: { overview, phases: [{name, weeks, description}], milestones: [...] }
    """
    logger.info("Generating timeline section...")

    phases_raw = [{"name": p.name, "weeks": p.weeks} for p in data.timeline.phases]

    system_prompt = """
You are a project manager writing the timeline section of a software proposal.

Guidelines:
- 'overview': 1 paragraph summarizing the delivery approach and total duration.
- 'phases': For EACH phase provided, add a 'description' field (2–3 sentences explaining 
  what happens in that phase, deliverables, and team activities). 
  Keep the 'name' and 'weeks' fields exactly as given — only ADD the 'description'.
- 'milestones': A list of 5–7 specific, dated milestones (e.g., "End of Week 1: Signed-off requirements document").
  Base them on the phases provided.
- Be realistic and specific — avoid vague language like "work will be done".
"""

    user_prompt = f"""
Project context:
{_build_context(data)}

Phases (enrich these with descriptions):
{json.dumps(phases_raw, indent=2)}

Write the timeline section now.
"""
    return await call_llm_json(system_prompt, user_prompt, TimelineSection, temperature=0.3)


# ---------------------------------------------------------------------------
# 5. Budget Section
# ---------------------------------------------------------------------------

async def generate_budget_section(data: ProposalInput) -> BudgetSection:
    """
    Generate budget summary, line-item breakdown, and payment terms.
    Output: { summary, breakdown: [{item, cost}], payment_terms }
    """
    logger.info("Generating budget section...")

    system_prompt = """
You are a commercial director writing the investment / budget section of a software proposal.

Guidelines:
- 'summary': 1–2 paragraphs framing the investment positively — value delivered vs. cost.
  Mention the total amount and currency naturally in the text.
- 'breakdown': A realistic cost breakdown into 6–8 line items that sum exactly to the total budget.
  Each item has 'item' (string) and 'cost' (number, no currency symbol).
  Typical items: Discovery & Planning, UI/UX Design, Backend Development, Frontend Development,
  QA & Testing, DevOps & Infrastructure, Project Management, Contingency (5–10%).
  Make the numbers realistic and proportional to the project scope.
- 'payment_terms': 2–3 sentences describing a milestone-based payment schedule 
  (e.g., 30% upfront, 40% mid-project, 30% on delivery).
- Do NOT invent a different total — breakdown must sum to the given amount.
"""

    user_prompt = f"""
Project context:
{_build_context(data)}

Total budget: {data.budget.amount} {data.budget.currency}
Team: {json.dumps([t.model_dump() for t in data.team], indent=2)}

Write the budget section now.
"""
    return await call_llm_json(system_prompt, user_prompt, BudgetSection, temperature=0.2)


# ---------------------------------------------------------------------------
# 6. Risks Section
# ---------------------------------------------------------------------------

async def generate_risks_section(data: ProposalInput) -> RisksSection:
    """
    Generate risk analysis with impact and mitigation strategies.
    Output: { intro, risks: [{risk, impact, mitigation}] }
    """
    logger.info("Generating risks section...")

    risk_list = "\n".join(f"  - {r}" for r in data.risks)
    assumptions_list = "\n".join(f"  - {a}" for a in data.assumptions)

    system_prompt = """
You are a risk management expert writing the risk section of a software proposal.

Guidelines:
- 'intro': 1 paragraph explaining the risk management approach and philosophy.
- 'risks': For EACH risk listed, provide:
    - 'risk': The risk name/title (short, clear).
    - 'impact': 1–2 sentences describing potential business/technical impact.
    - 'mitigation': 2–3 concrete mitigation strategies as a single string.
  Additionally, add 2–3 standard software project risks (integration failure, scope creep, 
  key-person dependency) not already covered by the provided list.
- Be honest but reassuring — show the client you have thought this through.
"""

    user_prompt = f"""
Project context:
{_build_context(data)}

Client-identified risks:
{risk_list}

Project assumptions:
{assumptions_list}

Write the risks section now.
"""
    return await call_llm_json(system_prompt, user_prompt, RisksSection, temperature=0.3)


# ---------------------------------------------------------------------------
# 7. Deliverables Section
# ---------------------------------------------------------------------------

async def generate_deliverables_section(data: ProposalInput) -> DeliverablesSection:
    """
    Generate a concrete list of project deliverables.
    Output: { intro, deliverables: [...] }
    """
    logger.info("Generating deliverables section...")

    system_prompt = """
You are a project delivery manager writing the deliverables section of a software proposal.

Guidelines:
- 'intro': 1 paragraph explaining how deliverables are structured and how handover works.
- 'deliverables': A list of 10–14 specific, tangible deliverables that the client will receive.
  Each deliverable should be a clear, action-oriented noun phrase.
  Examples: "Fully functional React web application", 
            "REST API documentation (Swagger/OpenAPI)",
            "Deployed production environment on AWS",
            "Source code repository with README",
            "User acceptance testing (UAT) report",
            "Post-launch support guide (30 days)".
  Base deliverables on the features, tech stack, and phases provided.
- Make deliverables SPECIFIC to this project — avoid generic boilerplate.
"""

    user_prompt = f"""
Project context:
{_build_context(data)}

Write the deliverables section now.
"""
    return await call_llm_json(system_prompt, user_prompt, DeliverablesSection, temperature=0.35)
