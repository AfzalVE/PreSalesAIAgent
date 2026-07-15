"""
validator.py
============
Validates the ProposalInput before the LLM pipeline begins.
Raises descriptive errors so the caller knows exactly what is missing.
"""

from __future__ import annotations

import logging
from typing import List

from .schemas import ProposalInput

logger = logging.getLogger(__name__)


class ProposalValidationError(ValueError):
    """Raised when input validation fails, containing a list of issues."""

    def __init__(self, issues: List[str]) -> None:
        self.issues = issues
        super().__init__(f"Proposal input validation failed: {'; '.join(issues)}")


def validate_proposal_input(data: ProposalInput) -> None:
    """
    Run semantic validation on a ProposalInput.

    Pydantic already enforces types / required fields.  This layer adds
    business-rule checks that Pydantic cannot express as type constraints.

    Raises:
        ProposalValidationError: If any rule is violated.
    """
    issues: List[str] = []

    # --- Client ---
    if not data.client.company.strip():
        issues.append("client.company must not be blank")
    if not data.client.contact.strip():
        issues.append("client.contact must not be blank")

    # --- Project ---
    if not data.project.title.strip():
        issues.append("project.title must not be blank")
    if not data.project.description.strip():
        issues.append("project.description must not be blank")

    # --- Features ---
    if not data.features:
        issues.append("At least one feature must be specified")

    # --- Timeline ---
    if data.timeline.duration and not data.timeline.phases:
        issues.append("timeline.phases must contain at least one phase when duration is set")
    total_phase_weeks = sum(p.weeks for p in data.timeline.phases)
    if total_phase_weeks <= 0:
        issues.append("Total phase weeks must be greater than 0")

    # --- Budget ---
    if data.budget.amount <= 0:
        issues.append("budget.amount must be a positive number")
    if not data.budget.currency.strip():
        issues.append("budget.currency must not be blank")

    # --- Team ---
    if not data.team:
        issues.append("At least one team member must be specified")

    if issues:
        logger.warning("Proposal input validation failed: %s", issues)
        raise ProposalValidationError(issues)

    logger.info(
        "Proposal input valid | client=%s | project=%s",
        data.client.company,
        data.project.title,
    )
