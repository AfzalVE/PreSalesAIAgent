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

The schemas used for negotiation are `NegotiationInput` and `NegotiationResponse`.
- `NegotiationInput` includes the user's request and current budget, timeline, and tech stack.
- `NegotiationResponse` provides the adjusted `new_budget`, `new_timeline`, `new_tech_stack`, along with a conversational `response_message` and `success` boolean.

## 4. Resource Matching & Cost Estimation Engine (Employee Module)
- **Location:** `backend/app/services/resource/matching.py`
- **Core Functions:**
  - `match_resources(proposal: Dict[str, Any], employees: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]`
  - `match_resources_from_db_request(proposal_request_id: str) -> Dict[str, Any]`
  - `get_employees_from_db(db: Optional[Session] = None) -> List[Dict[str, Any]]`
- **Purpose:** Connects directly with PostgreSQL (`Employee` model, `employment_status == ACTIVE`), filters candidates based on exact/substring job roles and `minimum_experience`, and allocates resources over the project timeline.

### Candidate Ranking & Priority Sorting
Candidates are ranked using a strict 6-level tuple sort:
1. **Bench Status (`bench_status == True` first)**
2. **Global Bench (`global_bench == True` first)**
3. **Highest Available Hours (`available_hours` descending)**
4. **Lowest Allocated Hours (`allocated_hours` ascending)**
5. **Highest Experience (`experience` descending)**
6. **Lowest Hourly Rate (`hourly_cost` ascending)**

### Cost Calculation & Fixed Company Overhead
- **Developer Cost (`developer_cost`)**: `sum(allocated_hours * hourly_cost)` where `allocated_hours = timeline_weeks * 5 days * daily_capacity_hours`.
- **Company Overhead (`company_static_cost`)**: Fixed at **$100.0** (`FIXED_COMPANY_STATIC_COST = 100.0`) unless overridden.
- **Total Project Cost (`total_project_cost`)**: `developer_cost + company_static_cost`.

### Nullable AI Input & Dual Budget Handling (`match_resources`)
The engine seamlessly processes incoming payloads where `timeline_weeks`, `client_budget`, or `resource_requirements` are `null`:
- **When `timeline_weeks` / `resource_requirements` are `null`**: Defaults to 12 weeks (`DEFAULT_TIMELINE_WEEKS`) and assigns a standard full-stack team (`Backend Engineer`, `Frontend Engineer`).
- **When `client_budget` IS Provided (e.g., `$85,000`)**: Compares total project cost against budget and enriches output with `is_within_budget` (bool) and `budget_variance_usd`.
- **When `client_budget` IS `null` (No Budget Given)**: Computes the full `developer_cost` + $100 overhead, sets `client_budget: null`, defaults `is_within_budget: true` (as there is no budget limit), and embeds `estimated_cost` (`= total_project_cost`) into the output JSON so downstream Proposal/PDF generation gets the exact price immediately.

## 5. AI Negotiation Workflow (Agent Module)
- **Endpoint:** `POST /api/v1/ai-agent/negotiate`
- **LLM Provider:** Groq (`llama3-70b-8192`) using standard OpenAI SDK (`base_url="https://api.groq.com/openai/v1"`).
- **Purpose:** Handles client negotiation requests (e.g., lower budget, faster timeline, changed tech stack). It uses structured JSON output to intelligently adjust parameters, returning structured adjustments (`new_budget`, `new_timeline`, `new_tech_stack`) alongside a conversational response and success indicator. Unrealistic requests will trigger `success: false` and return an `error_message`.
