"""
example_usage.py
================
Standalone script demonstrating how to call the ProposalEngine directly.

Run from the project root (with venv activated):
    python -m app.services.proposal.example_usage

Output files will be written to: outputs/
"""

import asyncio
import json
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Sample input — matches the exact JSON schema expected by the engine
# ---------------------------------------------------------------------------
SAMPLE_INPUT = {
    "client": {
        "company": "ABC Pvt Ltd",
        "contact": "John Smith"
    },
    "project": {
        "title": "AI Agriculture Platform",
        "description": "Crop disease detection platform",
        "industry": "Agriculture",
        "solution_type": "MVP"
    },
    "features": [
        "Authentication",
        "Crop Disease Detection",
        "Weather API",
        "Dashboard"
    ],
    "tech_stack": {
        "frontend": "React",
        "backend": "FastAPI",
        "database": "PostgreSQL",
        "hosting": "AWS"
    },
    "timeline": {
        "duration": "10 weeks",
        "phases": [
            {"name": "Planning",     "weeks": 1},
            {"name": "Development",  "weeks": 7},
            {"name": "Testing",      "weeks": 2}
        ]
    },
    "budget": {
        "currency": "USD",
        "amount": 18000
    },
    "team": [
        {"role": "Backend Developer",  "experience": "5 years"},
        {"role": "Frontend Developer", "experience": "4 years"}
    ],
    "risks": [
        "API dependency",
        "Changing requirements"
    ],
    "assumptions": [
        "Client provides API credentials"
    ]
}


async def main():
    # Import here so the script only needs the venv activated
    from app.services.proposal import ProposalEngine

    print("=" * 60)
    print("  ProposalEngine — Example Run")
    print("=" * 60)

    engine = ProposalEngine()

    print("\n⏳  Generating proposal (this may take 30–60 seconds)...\n")

    result = await engine.run(
        SAMPLE_INPUT,
        output_formats=["html", "pdf", "docx"],
    )

    # ── Save outputs ──────────────────────────────────────────────────
    out_dir = Path("outputs")
    out_dir.mkdir(exist_ok=True)

    pid = result.proposal_id

    # HTML
    html_path = out_dir / f"{pid}.html"
    html_path.write_text(result.html_content, encoding="utf-8")
    print(f"✅  HTML saved  → {html_path}")

    # PDF
    if result.pdf_bytes:
        pdf_path = out_dir / f"{pid}.pdf"
        pdf_path.write_bytes(result.pdf_bytes)
        print(f"✅  PDF saved   → {pdf_path}")
    else:
        print("⚠️   PDF not generated (check WeasyPrint installation)")

    # DOCX
    if result.docx_bytes:
        docx_path = out_dir / f"{pid}.docx"
        docx_path.write_bytes(result.docx_bytes)
        print(f"✅  DOCX saved  → {docx_path}")
    else:
        print("⚠️   DOCX not generated (check python-docx installation)")

    print(f"\n🎉  Done! Proposal ID: {pid}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
