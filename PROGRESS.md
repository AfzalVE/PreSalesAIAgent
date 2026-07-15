# Progress Update - 15 July 2026

## nahidve

1. **Custom Blueprint Stack**: Configured technical architecture diagrams and scope layers to dynamically map to the client's onboarding tech stack and business domain.
2. **Resource Match & Admin Overrides**: Enabled "Expert Match" highlights for staffing allocations, client custom resource request buttons, and administrator staffing dropdown overrides.
3. **Intake Shortcuts & Chart.js**: Integrated a "Skip to AI Chat" option for technical clients and replaced placeholder graphs with dynamic `chart.js` Canvas charts.

## AI Assistant (Backend)

1. **AI Requirement Extraction Endpoint**: Created a `POST /api/v1/ai-agent/extract-requirements` endpoint in FastAPI that uses Groq's LLM (`llama3-70b-8192`) via JSON mode to parse unstructured user text into structured project details.
2. **Employee Module Handoff**: Configured the extraction schema to make `timeline_weeks`, `client_budget`, and `resource_requirements` optional (null). This ensures that if the client doesn't specify these, the AI won't hallucinate them, allowing the Employee Module to accurately calculate costs downstream.
3. **Conversational Follow-ups**: Enabled the agent to populate a `follow_up_message` asking the client for budget/timeline details if they were missing.

## Resource & Cost Module (Backend)

1. **Production Resource Matching Engine (`matching.py`)**: Built `backend/app/services/resource/matching.py` with direct PostgreSQL integration (`Employee` model, `ACTIVE` status filtering).
2. **6-Level Priority Ranking**: Implemented deterministic candidate selection sorted by `bench_status`, `global_bench`, `available_hours`, `allocated_hours`, `experience`, and `hourly_cost`.
3. **Fixed Overhead & Nullable Intake Handling**: Added automatic calculation of developer hours across project timelines plus fixed **$100 company static cost** (`FIXED_COMPANY_STATIC_COST = 100.0`). Handles nullable inputs (`timeline_weeks`, `resource_requirements`, `client_budget`) from AI extraction cleanly.
4. **Dual Budget Output & Downstream Handoff**: Configured `match_resources()` to calculate exact total costs regardless of whether `client_budget` is provided or `null`, enriching the JSON payload with `estimated_cost`, `total_project_cost`, `is_within_budget`, and `budget_variance_usd` ready for downstream `Proposal` generation.

