# AI Proposal Generator - Knowledge Base & Handoff Document

This document serves as a central knowledge base for all teams working on the PreSalesAIAgent repository. It details recent architectural decisions, workflows, and how different modules interact.

## 1. AI Requirement Extraction Workflow (Agent Module)
- **Endpoint:** `POST /api/v1/ai-agent/extract-requirements`
- **LLM Provider:** Groq (`llama3-70b-8192`) using standard OpenAI SDK (`base_url="https://api.groq.com/openai/v1"`).
- **Environment:** Requires `GROQ_API_KEY` in the `.env` file.
- **Purpose:** Takes unstructured client input (text/transcribed voice) and converts it into a structured JSON payload representing project requirements.

## 2. Cross-Team Handoffs: Agent -> Employee Module -> Proposal Generator
To ensure accurate budgeting and timeline estimations, the AI Agent does **not** hallucinate missing financial or resource data.

**The Workflow:**
1. **Client Intake (AI Agent):** The AI extracts `project_name` and `proposal_id`. If the client specifies a budget, timeline, or resource list, it captures them. If they are missing or "not decided", they are left strictly as `null`.
2. **Follow-ups:** The AI generates a `follow_up_message` to ask the client for missing numbers. If the client doesn't have them, the fields remain `null`.
3. **Calculation (Employee Module):** If the JSON payload arrives at the Employee Module with `null` budget/timeline/resources, the Employee Module is responsible for determining the cost depending on how many employees are needed and their respective costs. If a budget *is* provided, the Employee Module selects resources accordingly to fit the budget.
4. **Finalization (Proposal Generator):** Once all data is updated and populated by the Employee Module, the finalized JSON is handed off to the Proposal Generator team to create the actual document/PDF.

## 3. Schema Structure (Pydantic)
The core schema for handoffs is `AgentExtractionResponse` (see `backend/app/schemas/ai_agent_schema.py`):
- `proposal_id` (str)
- `project_name` (str)
- `timeline_weeks` (int | null) - Nullable for Employee Module calculation.
- `client_budget` (float | null) - Nullable for Employee Module calculation.
- `resource_requirements` (list | null) - Nullable for Employee Module calculation.
- `follow_up_message` (str | null)

**Note for Frontend Team:** Please check the `follow_up_message` in the JSON response. If it is not null, display it to the user so they can answer the AI's questions regarding missing budget/timeline.
