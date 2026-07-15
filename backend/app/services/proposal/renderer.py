"""
renderer.py
===========
Converts the fully assembled ProposalOutput into a rich HTML document
using Jinja2 templating.

The HTML is self-contained (inline CSS) so it renders consistently in
WeasyPrint for PDF generation.
"""

from __future__ import annotations

import base64
import logging
import os
from pathlib import Path
from typing import Optional

from jinja2 import Environment, DictLoader

from .schemas import ProposalOutput

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Logo helper
# ---------------------------------------------------------------------------

# Place your company logo file here (PNG or JPG):
#   backend/app/services/proposal/assets/company_logo.png
#
# The renderer will automatically embed it as a base64 data URI.
# If no logo is found, the company name is shown as styled text.

LOGO_PATH = Path(__file__).parent / "assets" / "company_logo.png"


def _get_logo_data_uri() -> Optional[str]:
    """Return a base64 data URI for the company logo, or None if not found."""
    if LOGO_PATH.exists():
        mime = "image/png" if LOGO_PATH.suffix.lower() == ".png" else "image/jpeg"
        data = LOGO_PATH.read_bytes()
        b64 = base64.b64encode(data).decode("utf-8")
        logger.info("Logo embedded from %s", LOGO_PATH)
        return f"data:{mime};base64,{b64}"
    logger.info("No logo found at %s — using text fallback", LOGO_PATH)
    return None


# ---------------------------------------------------------------------------
# Jinja2 template (self-contained HTML + CSS)
# ---------------------------------------------------------------------------

PROPOSAL_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ proposal.project.title }} — Proposal</title>
  <style>
    /* ===== BASE ===== */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap');

    :root {
      --primary:      #1A2E6F;
      --primary-dark: #0F1C48;
      --accent:       #3D7BFF;
      --accent-light: #EBF1FF;
      --gold:         #F5A623;
      --text-dark:    #1A1F36;
      --text-mid:     #4A5568;
      --text-light:   #718096;
      --border:       #E2E8F0;
      --bg-light:     #F7F9FC;
      --white:        #FFFFFF;
      --success:      #2ECC71;
      --warning:      #F39C12;
      --danger:       #E74C3C;
      --page-margin:  48px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      font-size: 10.5pt;
      color: var(--text-dark);
      background: var(--white);
      line-height: 1.7;
    }

    /* ===== PAGE STRUCTURE ===== */
    .page { max-width: 900px; margin: 0 auto; }

    /* ===== COVER PAGE ===== */
    .cover {
      background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 55%, var(--accent) 100%);
      color: var(--white);
      min-height: 100vh;
      padding: var(--page-margin);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .cover::before {
      content: "";
      position: absolute;
      top: -120px; right: -120px;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .cover::after {
      content: "";
      position: absolute;
      bottom: -80px; left: -80px;
      width: 350px; height: 350px;
      border-radius: 50%;
      background: rgba(61,123,255,0.15);
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative; z-index: 2;
    }

    .logo-wrap img  { max-height: 56px; max-width: 200px; object-fit: contain; }
    .logo-wrap .logo-text {
      font-family: 'Poppins', sans-serif;
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--white);
    }

    .cover-badge {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 32px;
      padding: 6px 18px;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.85);
      backdrop-filter: blur(6px);
    }

    .cover-center {
      position: relative; z-index: 2;
      text-align: center;
      padding: 60px 0 40px;
    }

    .cover-tag {
      display: inline-block;
      background: var(--gold);
      color: var(--primary-dark);
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-radius: 4px;
      padding: 4px 14px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-family: 'Poppins', sans-serif;
      font-size: 36pt;
      font-weight: 800;
      line-height: 1.15;
      color: var(--white);
      margin-bottom: 16px;
      text-shadow: 0 2px 16px rgba(0,0,0,0.18);
    }

    .cover-subtitle {
      font-size: 13pt;
      color: rgba(255,255,255,0.75);
      margin-bottom: 36px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      max-width: 620px;
      margin: 0 auto;
    }

    .cover-meta-card {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 16px 12px;
      backdrop-filter: blur(8px);
    }

    .cover-meta-label {
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      margin-bottom: 4px;
    }

    .cover-meta-value {
      font-size: 11pt;
      font-weight: 600;
      color: var(--white);
    }

    .cover-footer {
      position: relative; z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 20px;
    }

    .cover-footer-left small { color: rgba(255,255,255,0.5); font-size: 8.5pt; }
    .cover-footer-left strong { display: block; color: var(--white); font-size: 10pt; }

    .cover-footer-right {
      text-align: right;
    }
    .cover-footer-right small { color: rgba(255,255,255,0.5); font-size: 8.5pt; }
    .cover-footer-right strong { display: block; color: var(--white); font-size: 10pt; }

    /* ===== TOC PAGE ===== */
    .toc-page {
      padding: var(--page-margin);
      page-break-after: always;
    }

    .toc-title {
      font-family: 'Poppins', sans-serif;
      font-size: 22pt;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .toc-divider {
      height: 3px;
      width: 60px;
      background: linear-gradient(90deg, var(--accent), var(--gold));
      border-radius: 3px;
      margin-bottom: 32px;
    }

    .toc-list { list-style: none; }
    .toc-list li {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .toc-num {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent-light);
      color: var(--accent);
      font-size: 9pt;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .toc-text { color: var(--text-dark); font-weight: 500; font-size: 11pt; flex: 1; }
    .toc-dots { flex: 1; border-bottom: 2px dotted var(--border); margin: 0 8px; }
    .toc-page-num { color: var(--text-light); font-size: 9.5pt; font-weight: 600; }

    /* ===== CONTENT SECTIONS ===== */
    .content-section {
      padding: var(--page-margin);
      page-break-inside: avoid;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
    }

    .section-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--accent), var(--primary));
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
    }

    .section-heading {
      font-family: 'Poppins', sans-serif;
      font-size: 18pt;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.2;
    }

    .section-subheading {
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: var(--accent);
    }

    /* ===== EXECUTIVE SUMMARY ===== */
    .headline-card {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 24px;
      color: var(--white);
    }

    .headline-card .headline-label {
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
      margin-bottom: 8px;
    }

    .headline-card .headline-text {
      font-family: 'Poppins', sans-serif;
      font-size: 15pt;
      font-weight: 700;
      color: var(--white);
      line-height: 1.35;
    }

    .body-text { color: var(--text-mid); margin-bottom: 14px; }
    .body-text:last-child { margin-bottom: 0; }

    /* ===== BENEFITS GRID ===== */
    .benefits-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 20px 0;
    }

    .benefit-card {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 10px;
      padding: 14px 16px;
    }

    .benefit-card p { color: var(--text-mid); font-size: 9.5pt; margin: 0; }

    /* ===== FEATURE PILLS ===== */
    .features-list { list-style: none; margin: 16px 0; }
    .features-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      color: var(--text-mid);
      font-size: 10pt;
    }
    .features-list li:last-child { border-bottom: none; }
    .feat-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
      margin-top: 6px;
    }

    /* ===== TECH STACK ===== */
    .stack-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin: 20px 0;
    }

    .stack-card {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
    }

    .stack-card-label {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .stack-card-value {
      font-size: 13pt;
      font-weight: 700;
      color: var(--primary);
    }

    /* ===== TIMELINE ===== */
    .timeline-bar {
      display: flex;
      margin: 24px 0;
      border-radius: 10px;
      overflow: hidden;
      height: 44px;
    }

    .phase-bar-item {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      font-weight: 700;
      color: var(--white);
      text-align: center;
      letter-spacing: 0.5px;
      padding: 0 6px;
    }

    .timeline-phases { list-style: none; margin-top: 24px; }
    .timeline-phase-item {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      align-items: flex-start;
    }

    .phase-badge {
      background: var(--primary);
      color: var(--white);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 8pt;
      font-weight: 700;
      white-space: nowrap;
      min-width: 80px;
      text-align: center;
    }

    .phase-content h4 {
      font-size: 11pt;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 4px;
    }
    .phase-content p { color: var(--text-mid); font-size: 9.5pt; }

    .milestones-list { list-style: none; margin-top: 24px; }
    .milestone-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .milestone-item:last-child { border-bottom: none; }
    .milestone-icon { color: var(--success); font-size: 13pt; flex-shrink: 0; margin-top: 1px; }
    .milestone-text { color: var(--text-mid); font-size: 9.5pt; }

    /* ===== BUDGET ===== */
    .budget-summary-card {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 14px;
      padding: 28px;
      color: var(--white);
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .budget-total-label {
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
      margin-bottom: 8px;
    }

    .budget-total-amount {
      font-family: 'Poppins', sans-serif;
      font-size: 32pt;
      font-weight: 800;
      color: var(--gold);
      line-height: 1;
    }

    .budget-currency {
      font-size: 16pt;
      vertical-align: super;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      margin-right: 4px;
    }

    .budget-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .budget-table th {
      background: var(--primary);
      color: var(--white);
      font-size: 8.5pt;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 12px 16px;
      text-align: left;
    }
    .budget-table th:last-child { text-align: right; }

    .budget-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-mid);
      font-size: 10pt;
    }
    .budget-table td:last-child {
      text-align: right;
      font-weight: 600;
      color: var(--text-dark);
    }

    .budget-table tr:nth-child(even) td { background: var(--bg-light); }

    .budget-table tfoot td {
      background: var(--accent-light);
      border-bottom: none;
      font-weight: 700;
      color: var(--primary);
      font-size: 11pt;
    }

    .payment-box {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-left: 4px solid var(--gold);
      border-radius: 10px;
      padding: 16px 20px;
      margin-top: 20px;
      color: var(--text-mid);
    }
    .payment-box strong { color: var(--text-dark); font-weight: 600; display: block; margin-bottom: 4px; }

    /* ===== RISKS ===== */
    .risk-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 14px;
      border-left: 5px solid var(--warning);
    }

    .risk-card.high { border-left-color: var(--danger); }
    .risk-card.medium { border-left-color: var(--warning); }
    .risk-card.low { border-left-color: var(--success); }

    .risk-title {
      font-size: 11pt;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 6px;
    }

    .risk-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 8px;
    }

    .risk-label {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--text-light);
      margin-bottom: 3px;
    }

    .risk-value { color: var(--text-mid); font-size: 9.5pt; }

    /* ===== DELIVERABLES ===== */
    .deliverables-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 20px 0;
    }

    .deliverable-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
    }

    .deliverable-check {
      width: 22px; height: 22px;
      border-radius: 50%;
      background: var(--success);
      color: var(--white);
      display: flex; align-items: center; justify-content: center;
      font-size: 10pt;
      font-weight: 700;
      flex-shrink: 0;
    }

    .deliverable-text { color: var(--text-dark); font-size: 9.5pt; font-weight: 500; }

    /* ===== TEAM SECTION ===== */
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }

    .team-card {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
    }

    .team-avatar {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--primary));
      margin: 0 auto 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20pt;
      color: var(--white);
    }

    .team-role {
      font-size: 9.5pt;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .team-exp {
      font-size: 8.5pt;
      color: var(--text-light);
    }

    /* ===== CLOSING / SIGNATURE PAGE ===== */
    .closing-page {
      background: linear-gradient(145deg, var(--primary-dark), var(--primary));
      color: var(--white);
      padding: var(--page-margin);
      min-height: 50vh;
      border-radius: 0;
      page-break-before: always;
      text-align: center;
    }

    .closing-title {
      font-family: 'Poppins', sans-serif;
      font-size: 24pt;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .closing-sub {
      font-size: 12pt;
      color: rgba(255,255,255,0.7);
      max-width: 500px;
      margin: 0 auto 40px;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      max-width: 600px;
      margin: 0 auto;
    }

    .sig-box {
      border-top: 2px solid rgba(255,255,255,0.3);
      padding-top: 12px;
      text-align: left;
    }

    .sig-label {
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      margin-bottom: 4px;
    }

    .sig-name {
      font-size: 12pt;
      font-weight: 700;
      color: var(--white);
      margin-bottom: 2px;
    }

    .sig-company { font-size: 10pt; color: rgba(255,255,255,0.6); }

    /* ===== DIVIDERS ===== */
    .section-divider {
      height: 1px;
      background: var(--border);
      margin: 32px 0;
    }

    .gradient-divider {
      height: 3px;
      background: linear-gradient(90deg, var(--accent), var(--gold), transparent);
      border-radius: 3px;
      margin: 28px 0;
    }

    /* ===== PRINT / PDF ===== */
    @media print {
      body { font-size: 10pt; }
      .cover { min-height: 100vh; page-break-after: always; }
      .content-section { page-break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ================================================================
       COVER PAGE
       ================================================================ -->
  <div class="cover">
    <div class="cover-header">
      <div class="logo-wrap">
        {% if logo_uri %}
          <img src="{{ logo_uri }}" alt="Company Logo">
        {% else %}
          <span class="logo-text">YourCompany</span>
        {% endif %}
      </div>
      <div class="cover-badge">{{ proposal.project.solution_type }} Proposal</div>
    </div>

    <div class="cover-center">
      <div class="cover-tag">{{ proposal.project.industry }}</div>
      <div class="cover-title">{{ proposal.project.title }}</div>
      <div class="cover-subtitle">{{ proposal.project.description }}</div>

      <div class="cover-meta-grid">
        <div class="cover-meta-card">
          <div class="cover-meta-label">Prepared For</div>
          <div class="cover-meta-value">{{ proposal.client.company }}</div>
        </div>
        <div class="cover-meta-card">
          <div class="cover-meta-label">Investment</div>
          <div class="cover-meta-value">{{ proposal.raw_budget.currency }} {{ "{:,.0f}".format(proposal.raw_budget.amount) }}</div>
        </div>
        <div class="cover-meta-card">
          <div class="cover-meta-label">Duration</div>
          <div class="cover-meta-value">{{ proposal.timeline.duration }}</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="cover-footer-left">
        <small>Prepared For</small>
        <strong>{{ proposal.client.contact }}, {{ proposal.client.company }}</strong>
      </div>
      <div class="cover-footer-right">
        <small>Proposal Reference</small>
        <strong>{{ proposal_id }}</strong>
      </div>
    </div>
  </div>

  <!-- ================================================================
       TABLE OF CONTENTS
       ================================================================ -->
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-divider"></div>
    <ul class="toc-list">
      {% for section in toc %}
      <li>
        <div class="toc-num">{{ loop.index }}</div>
        <span class="toc-text">{{ section.name }}</span>
        <span class="toc-dots"></span>
        <span class="toc-page-num">{{ section.page }}</span>
      </li>
      {% endfor %}
    </ul>
  </div>

  <!-- ================================================================
       01. EXECUTIVE SUMMARY
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">📋</div>
      <div>
        <div class="section-subheading">Section 01</div>
        <div class="section-heading">Executive Summary</div>
      </div>
    </div>

    <div class="headline-card">
      <div class="headline-label">Our Value Proposition</div>
      <div class="headline-text">{{ sections.executive_summary.headline }}</div>
    </div>

    {% for para in sections.executive_summary.body.split('\n\n') %}
      {% if para.strip() %}
        <p class="body-text">{{ para.strip() }}</p>
      {% endif %}
    {% endfor %}
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       02. PROPOSED SOLUTION
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">💡</div>
      <div>
        <div class="section-subheading">Section 02</div>
        <div class="section-heading">Proposed Solution</div>
      </div>
    </div>

    {% for para in sections.solution_description.overview.split('\n\n') %}
      {% if para.strip() %}
        <p class="body-text">{{ para.strip() }}</p>
      {% endif %}
    {% endfor %}

    <div class="gradient-divider"></div>

    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:16px;">Key Business Benefits</strong>
    <div class="benefits-grid">
      {% for benefit in sections.solution_description.key_benefits %}
      <div class="benefit-card">
        <p>{{ benefit }}</p>
      </div>
      {% endfor %}
    </div>

    <div class="gradient-divider"></div>

    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:12px;">Feature Highlights</strong>
    <ul class="features-list">
      {% for feat in sections.solution_description.feature_highlights %}
      <li>
        <div class="feat-dot"></div>
        <span>{{ feat }}</span>
      </li>
      {% endfor %}
    </ul>
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       03. TECHNICAL DETAILS
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">🏗️</div>
      <div>
        <div class="section-subheading">Section 03</div>
        <div class="section-heading">Technical Architecture</div>
      </div>
    </div>

    <!-- Stack Cards -->
    <div class="stack-grid">
      {% if proposal.tech_stack.frontend %}
      <div class="stack-card">
        <div class="stack-card-label">Frontend</div>
        <div class="stack-card-value">{{ proposal.tech_stack.frontend }}</div>
      </div>
      {% endif %}
      {% if proposal.tech_stack.backend %}
      <div class="stack-card">
        <div class="stack-card-label">Backend</div>
        <div class="stack-card-value">{{ proposal.tech_stack.backend }}</div>
      </div>
      {% endif %}
      {% if proposal.tech_stack.database %}
      <div class="stack-card">
        <div class="stack-card-label">Database</div>
        <div class="stack-card-value">{{ proposal.tech_stack.database }}</div>
      </div>
      {% endif %}
      {% if proposal.tech_stack.hosting %}
      <div class="stack-card">
        <div class="stack-card-label">Hosting / Cloud</div>
        <div class="stack-card-value">{{ proposal.tech_stack.hosting }}</div>
      </div>
      {% endif %}
    </div>

    <div class="gradient-divider"></div>

    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:12px;">Architecture Overview</strong>
    {% for para in sections.technical_details.architecture_overview.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}

    <div class="gradient-divider"></div>

    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:12px;">Technology Selection Rationale</strong>
    {% for para in sections.technical_details.stack_rationale.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}

    <div class="gradient-divider"></div>

    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:12px;">Integration & Security Notes</strong>
    {% for para in sections.technical_details.integration_notes.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       04. PROJECT TIMELINE
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">📅</div>
      <div>
        <div class="section-subheading">Section 04</div>
        <div class="section-heading">Project Timeline</div>
      </div>
    </div>

    {% for para in sections.timeline.overview.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}

    <!-- Visual Phase Bar -->
    {% set total_weeks = sections.timeline.phases | sum(attribute='weeks') %}
    <div class="timeline-bar" style="margin: 24px 0;">
      {% set colors = ['#1A2E6F','#3D7BFF','#2ECC71','#F5A623','#E74C3C','#9B59B6'] %}
      {% for phase in sections.timeline.phases %}
        {% set pct = ((phase.weeks / total_weeks) * 100) | round(1) %}
        <div class="phase-bar-item" style="width:{{ pct }}%; background:{{ colors[loop.index0 % colors|length] }};">
          {{ phase.name }}<br>{{ phase.weeks }}W
        </div>
      {% endfor %}
    </div>

    <!-- Phase Details -->
    <ul class="timeline-phases">
      {% for phase in sections.timeline.phases %}
      <li class="timeline-phase-item">
        <div class="phase-badge">Week {{ loop.index }}<br>{{ phase.weeks }}W</div>
        <div class="phase-content">
          <h4>{{ phase.name }}</h4>
          <p>{{ phase.get('description', '') }}</p>
        </div>
      </li>
      {% endfor %}
    </ul>

    <div class="gradient-divider"></div>

    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:12px;">Key Milestones</strong>
    <ul class="milestones-list">
      {% for milestone in sections.timeline.milestones %}
      <li class="milestone-item">
        <span class="milestone-icon">✓</span>
        <span class="milestone-text">{{ milestone }}</span>
      </li>
      {% endfor %}
    </ul>
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       05. INVESTMENT & BUDGET
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">💰</div>
      <div>
        <div class="section-subheading">Section 05</div>
        <div class="section-heading">Investment & Budget</div>
      </div>
    </div>

    <div class="budget-summary-card">
      <div>
        <div class="budget-total-label">Total Project Investment</div>
        <div class="budget-total-amount">
          <span class="budget-currency">{{ proposal.raw_budget.currency }}</span>{{ "{:,.0f}".format(proposal.raw_budget.amount) }}
        </div>
      </div>
      <div style="text-align:right; color: rgba(255,255,255,0.7);">
        <div style="font-size:9pt; margin-bottom:4px;">Duration</div>
        <div style="font-size:14pt; font-weight:700; color:var(--white);">{{ proposal.timeline.duration }}</div>
      </div>
    </div>

    {% for para in sections.budget_section.summary.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}

    <table class="budget-table" style="margin-top:20px;">
      <thead>
        <tr>
          <th>Line Item</th>
          <th style="text-align:right;">Cost ({{ proposal.raw_budget.currency }})</th>
        </tr>
      </thead>
      <tbody>
        {% for row in sections.budget_section.breakdown %}
        <tr>
          <td>{{ row.item }}</td>
          <td>{{ "{:,.0f}".format(row.cost) }}</td>
        </tr>
        {% endfor %}
      </tbody>
      <tfoot>
        <tr>
          <td><strong>Total Investment</strong></td>
          <td><strong>{{ "{:,.0f}".format(proposal.raw_budget.amount) }}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="payment-box">
      <strong>💳 Payment Terms</strong>
      {{ sections.budget_section.payment_terms }}
    </div>
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       06. RISKS & MITIGATION
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">⚠️</div>
      <div>
        <div class="section-subheading">Section 06</div>
        <div class="section-heading">Risks & Mitigation</div>
      </div>
    </div>

    {% for para in sections.risks.intro.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}

    <div style="margin-top: 24px;">
      {% for risk in sections.risks.risks %}
      <div class="risk-card">
        <div class="risk-title">{{ risk.risk }}</div>
        <div class="risk-row">
          <div>
            <div class="risk-label">Potential Impact</div>
            <div class="risk-value">{{ risk.impact }}</div>
          </div>
          <div>
            <div class="risk-label">Mitigation Strategy</div>
            <div class="risk-value">{{ risk.mitigation }}</div>
          </div>
        </div>
      </div>
      {% endfor %}
    </div>
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       07. DELIVERABLES
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">📦</div>
      <div>
        <div class="section-subheading">Section 07</div>
        <div class="section-heading">Project Deliverables</div>
      </div>
    </div>

    {% for para in sections.deliverables.intro.split('\n\n') %}
      {% if para.strip() %}<p class="body-text">{{ para.strip() }}</p>{% endif %}
    {% endfor %}

    <div class="deliverables-grid" style="margin-top:24px;">
      {% for d in sections.deliverables.deliverables %}
      <div class="deliverable-item">
        <div class="deliverable-check">✓</div>
        <span class="deliverable-text">{{ d }}</span>
      </div>
      {% endfor %}
    </div>
  </div>

  <div class="gradient-divider" style="margin: 0 48px;"></div>

  <!-- ================================================================
       08. OUR TEAM
       ================================================================ -->
  <div class="content-section">
    <div class="section-header">
      <div class="section-icon">👥</div>
      <div>
        <div class="section-subheading">Section 08</div>
        <div class="section-heading">Proposed Team</div>
      </div>
    </div>

    <p class="body-text">
      Our carefully selected team brings deep domain expertise and a proven track record
      of delivering complex software projects on time and within budget. Each member is
      fully dedicated to {{ proposal.client.company }}'s success.
    </p>

    <div class="team-grid">
      {% set avatars = ['🧑‍💻','👩‍💻','🧑‍🎨','👩‍🎨','🧑‍🔬','👩‍🔬','🧑‍💼','👩‍💼'] %}
      {% for member in proposal.team %}
      <div class="team-card">
        <div class="team-avatar">{{ avatars[loop.index0 % avatars|length] }}</div>
        <div class="team-role">{{ member.role }}</div>
        <div class="team-exp">{{ member.experience }} Experience</div>
      </div>
      {% endfor %}
    </div>

    {% if proposal.assumptions %}
    <div class="gradient-divider"></div>
    <strong style="color:var(--primary); font-size:11pt; display:block; margin-bottom:12px;">Project Assumptions</strong>
    <ul class="features-list">
      {% for assumption in proposal.assumptions %}
      <li>
        <div class="feat-dot" style="background:var(--gold);"></div>
        <span>{{ assumption }}</span>
      </li>
      {% endfor %}
    </ul>
    {% endif %}
  </div>

  <!-- ================================================================
       CLOSING PAGE
       ================================================================ -->
  <div class="closing-page">
    <div style="margin-bottom:48px; padding-top:40px;">
      {% if logo_uri %}
        <img src="{{ logo_uri }}" alt="Company Logo" style="max-height:52px; margin-bottom:32px; opacity:0.9;">
      {% endif %}
      <div class="closing-title">Ready to Build Together?</div>
      <div class="closing-sub">
        We are excited about the opportunity to partner with {{ proposal.client.company }}
        and deliver a world-class {{ proposal.project.title }}.
        Let's schedule a call to discuss next steps.
      </div>
    </div>

    <div class="signature-grid">
      <div class="sig-box">
        <div class="sig-label">Client Authorisation</div>
        <div class="sig-name">{{ proposal.client.contact }}</div>
        <div class="sig-company">{{ proposal.client.company }}</div>
        <div style="margin-top:30px; border-top:1px solid rgba(255,255,255,0.25); padding-top:8px; color:rgba(255,255,255,0.4); font-size:8pt;">Signature / Date</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Prepared By</div>
        <div class="sig-name">Pre-Sales Team</div>
        <div class="sig-company">YourCompany</div>
        <div style="margin-top:30px; border-top:1px solid rgba(255,255,255,0.25); padding-top:8px; color:rgba(255,255,255,0.4); font-size:8pt;">Signature / Date</div>
      </div>
    </div>

    <div style="margin-top:60px; color:rgba(255,255,255,0.3); font-size:8pt;">
      Proposal Reference: {{ proposal_id }} &nbsp;|&nbsp;
      Confidential – Prepared exclusively for {{ proposal.client.company }}
    </div>
  </div>

</div>
</body>
</html>
"""

# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

_env = Environment(loader=DictLoader({"proposal.html": PROPOSAL_HTML_TEMPLATE}))
_env.filters["sum"] = lambda iterable, attribute=None: (
    sum(getattr(i, attribute, i.get(attribute, 0)) if attribute else i for i in iterable)
    if attribute else sum(iterable)
)


def render_html(output: ProposalOutput, proposal_id: str) -> str:
    """
    Render a ProposalOutput into a complete, self-contained HTML document.

    Args:
        output:      The fully assembled ProposalOutput from the engine.
        proposal_id: Unique identifier string (e.g. "PROP-2024-001").

    Returns:
        A UTF-8 HTML string ready for display or PDF conversion.
    """
    logo_uri = _get_logo_data_uri()

    toc = [
        {"name": "Executive Summary",        "page": 3},
        {"name": "Proposed Solution",         "page": 4},
        {"name": "Technical Architecture",    "page": 5},
        {"name": "Project Timeline",          "page": 6},
        {"name": "Investment & Budget",       "page": 7},
        {"name": "Risks & Mitigation",        "page": 8},
        {"name": "Project Deliverables",      "page": 9},
        {"name": "Proposed Team",             "page": 10},
    ]

    template = _env.get_template("proposal.html")
    html = template.render(
        proposal=output,
        proposal_id=proposal_id,
        logo_uri=logo_uri,
        sections=output,     # convenient alias so template uses sections.* for LLM content
        toc=toc,
    )

    logger.info("HTML rendered | proposal_id=%s | size=%d bytes", proposal_id, len(html))
    return html
