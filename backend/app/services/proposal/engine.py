"""
engine.py
=========
ProposalEngine — the central orchestrator of the proposal generation pipeline.

Pipeline:
    1.  Receive JSON  →  parse into ProposalInput
    2.  Validate Input
    3.  Generate Executive Summary       (LLM)
    4.  Generate Solution Description    (LLM)
    5.  Generate Technical Details       (LLM)
    6.  Generate Timeline Section        (LLM)
    7.  Generate Budget Section          (LLM)
    8.  Generate Risks Section           (LLM)
    9.  Generate Deliverables Section    (LLM)
    10. Assemble ProposalOutput
    11. Render HTML
    12. Generate PDF / DOCX

Usage example::

    from app.services.proposal import ProposalEngine

    engine = ProposalEngine()
    result = await engine.run(json_data, output_formats=["html", "pdf", "docx"])
    # result.html_content  → HTML string
    # result.pdf_bytes     → bytes
    # result.docx_bytes    → bytes
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from .document_builder import generate_docx, generate_pdf
from .generators import (
    generate_budget_section,
    generate_deliverables_section,
    generate_executive_summary,
    generate_risks_section,
    generate_solution_description,
    generate_technical_details,
    generate_timeline_section,
)
from .renderer import render_html
from .schemas import ProposalInput, ProposalOutput
from .validator import validate_proposal_input

logger = logging.getLogger(__name__)

OutputFormat = Literal["html", "pdf", "docx"]


class ProposalEngine:
    """
    Orchestrates the full proposal generation pipeline.

    All LLM sections are generated concurrently where possible to minimise
    total latency, then assembled into a single ProposalOutput.

    Args:
        proposal_id_prefix: Prefix for auto-generated proposal IDs.
                            Defaults to "PROP".
    """

    def __init__(self, proposal_id_prefix: str = "PROP") -> None:
        self._prefix = proposal_id_prefix

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def run(
        self,
        raw_input: Dict[str, Any],
        *,
        output_formats: List[OutputFormat] = ("html", "pdf", "docx"),
        proposal_id: Optional[str] = None,
    ) -> ProposalOutput:
        """
        Execute the full pipeline and return a ProposalOutput.

        Args:
            raw_input:       The raw JSON dict received from the API caller.
            output_formats:  Which document formats to produce.
                             Options: "html", "pdf", "docx".
                             Defaults to all three.
            proposal_id:     Optional explicit proposal ID.
                             Auto-generated if not provided.

        Returns:
            A ProposalOutput with html_content / pdf_bytes / docx_bytes
            populated according to *output_formats*.

        Raises:
            ProposalValidationError: For invalid input.
            ValueError:              If the LLM returns unusable data.
            Exception:               Any unhandled errors bubble up.
        """
        pid = proposal_id or self._generate_id()
        logger.info("=== ProposalEngine START | proposal_id=%s ===", pid)

        # ── STEP 1: Parse ──────────────────────────────────────────────
        logger.info("[1/12] Parsing input JSON...")
        data = self._parse_input(raw_input)

        # ── STEP 2: Validate ───────────────────────────────────────────
        logger.info("[2/12] Validating input...")
        validate_proposal_input(data)

        # ── STEPS 3-9: Generate all sections (parallelised) ────────────
        logger.info("[3-9/12] Generating proposal sections (concurrent LLM calls)...")
        (
            exec_summary,
            solution_desc,
            tech_details,
            timeline_sec,
            budget_sec,
            risks_sec,
            deliverables_sec,
        ) = await self._generate_all_sections(data)

        # ── STEP 10: Assemble ──────────────────────────────────────────
        logger.info("[10/12] Assembling ProposalOutput...")
        output = ProposalOutput(
            proposal_id=pid,
            # ─ Input fields (carried through for rendering) ─────────────────────────
            client=data.client,
            project=data.project,
            tech_stack=data.tech_stack,
            team=data.team,
            assumptions=data.assumptions,
            raw_budget=data.budget,
            # ─ LLM-generated sections ────────────────────────────────────
            executive_summary=exec_summary,
            solution_description=solution_desc,
            technical_details=tech_details,
            timeline=timeline_sec,
            budget_section=budget_sec,
            risks=risks_sec,
            deliverables=deliverables_sec,
        )

        # ── STEP 11: Render HTML ───────────────────────────────────────
        if "html" in output_formats or "pdf" in output_formats:
            logger.info("[11/12] Rendering HTML...")
            html = render_html(output, pid)
            output.html_content = html
        else:
            html = None

        # ── STEP 12: Generate documents ────────────────────────────────
        logger.info("[12/12] Generating documents: %s", output_formats)
        await self._generate_documents(output, html, output_formats)

        logger.info("=== ProposalEngine COMPLETE | proposal_id=%s ===", pid)
        return output

    async def run_from_model(
        self,
        proposal_input: ProposalInput,
        *,
        output_formats: List[OutputFormat] = ("html", "pdf", "docx"),
        proposal_id: Optional[str] = None,
    ) -> ProposalOutput:
        """
        Same as run() but accepts an already-parsed ProposalInput model.
        Useful when validation was done upstream.
        """
        return await self.run(
            proposal_input.model_dump(),
            output_formats=output_formats,
            proposal_id=proposal_id,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _generate_id(self) -> str:
        now = datetime.utcnow()
        uid = uuid.uuid4().hex[:6].upper()
        return f"{self._prefix}-{now.year}-{now.month:02d}-{uid}"

    @staticmethod
    def _parse_input(raw: Dict[str, Any]) -> ProposalInput:
        """Parse raw dict into a typed ProposalInput, raising clear errors."""
        try:
            return ProposalInput(**raw)
        except Exception as exc:
            logger.error("Input parsing failed: %s", exc)
            raise ValueError(f"Invalid proposal input structure: {exc}") from exc

    @staticmethod
    async def _generate_all_sections(data: ProposalInput):
        """
        Run all seven LLM generator calls concurrently.
        Returns results in a deterministic order regardless of completion order.
        """
        tasks = [
            generate_executive_summary(data),
            generate_solution_description(data),
            generate_technical_details(data),
            generate_timeline_section(data),
            generate_budget_section(data),
            generate_risks_section(data),
            generate_deliverables_section(data),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return results

    @staticmethod
    async def _generate_documents(
        output: ProposalOutput,
        html: Optional[str],
        formats: List[OutputFormat],
    ) -> None:
        """Generate PDF and/or DOCX documents and attach to output."""
        loop = asyncio.get_event_loop()

        if "pdf" in formats and html:
            try:
                pdf_bytes = await loop.run_in_executor(None, generate_pdf, html)
                output.pdf_bytes = pdf_bytes
                logger.info("PDF attached | size=%d bytes", len(pdf_bytes))
            except Exception as exc:
                logger.error("PDF generation failed (non-fatal): %s", exc)
                # Non-fatal — HTML is still available

        if "docx" in formats:
            try:
                docx_bytes = await loop.run_in_executor(
                    None, generate_docx, output, output.proposal_id
                )
                output.docx_bytes = docx_bytes
                logger.info("DOCX attached | size=%d bytes", len(docx_bytes))
            except Exception as exc:
                logger.error("DOCX generation failed (non-fatal): %s", exc)
