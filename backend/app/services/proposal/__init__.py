"""
Proposal Engine Package
========================
A complete LLM-powered proposal generation pipeline.

Flow:
    Receive JSON → Validate Input → Generate Sections (via LLM)
    → Assemble Proposal → Render HTML → Generate DOCX/PDF
"""

from .engine import ProposalEngine
from .schemas import ProposalInput, ProposalOutput

__all__ = ["ProposalEngine", "ProposalInput", "ProposalOutput"]
