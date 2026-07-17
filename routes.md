# Project Routes Documentation

This document lists all active routing configurations across the frontend (React Router) and backend (FastAPI) applications.

---

## 1. Backend API Routes (FastAPI)

All API routes are served from the backend (configured in [main.py](backend/main.py)).

### Root & Health Endpoints
* **`GET /`** — Health check greeting status ([main.py:L86-92](backend/main.py#L86-L92))
* **`GET /health`** — Simple status check endpoint ([main.py:L94-98](backend/main.py#L94-L98))
* **`GET /static/*`** — Mounts a static folder for proposal artifacts ([main.py:L118](backend/main.py#L118))

### Router Modules (`/api/v1`)

| Path Prefix | HTTP Method | Route / Endpoint | Description / Summary | File Reference |
| :--- | :--- | :--- | :--- | :--- |
| **`/api/v1/auth`** | `POST` | `/admin-login` | Verify password, email OTP, return pending token | [auth_router.py:L21](backend/app/api/v1/auth/auth_router.py#L21) |
| | `POST` | `/user-login` | Verify password, email OTP, return pending token for clients | [auth_router.py:L29](backend/app/api/v1/auth/auth_router.py#L29) |
| | `POST` | `/verify-otp` | Verify OTP against pending token & return access token | [auth_router.py:L41](backend/app/api/v1/auth/auth_router.py#L41) |
| | `GET` | `/check-email` | Check if a user exists with the given email & verification status | [auth_router.py:L49](backend/app/api/v1/auth/auth_router.py#L49) |
| **`/api/v1/users`** | `GET` | `` (empty) | List all registered client/admin users for Users Catalog | [user_router.py:L23](backend/app/api/v1/users/user_router.py#L23) |
| | `PUT` | `/{email}/toggle-status` | Toggle user active status | [user_router.py:L48](backend/app/api/v1/users/user_router.py#L48) |
| | `PUT` | `/{email}/verify` | Verify user workspace manually | [user_router.py:L64](backend/app/api/v1/users/user_router.py#L64) |
| **`/api/v1/employees`** | `GET` | `` (empty) | List all employees with staffing details | [employee_router.py:L26](backend/app/api/v1/employees/employee_router.py#L26) |
| | `PUT` | `/{employee_id}` | Update employee bench status and allocation | [employee_router.py:L79](backend/app/api/v1/employees/employee_router.py#L79) |
| **`/api/v1/proposal-requests`**| `GET` | `` (empty) | List all proposal requests with details | [proposal_request_router.py:L21](backend/app/api/v1/proposal_requests/proposal_request_router.py#L21) |
| | `GET` | `/{request_id}` | Get proposal request by ID | [proposal_request_router.py:L71](backend/app/api/v1/proposal_requests/proposal_request_router.py#L71) |
| | `POST` | `` (empty) | Create a new proposal request | [proposal_request_router.py:L119](backend/app/api/v1/proposal_requests/proposal_request_router.py#L119) |
| | `DELETE` | `/{request_id}` | Delete proposal request by ID | [proposal_request_router.py:L180](backend/app/api/v1/proposal_requests/proposal_request_router.py#L180) |
| | `GET` | `/{request_id}/conversations` | Get chat history for a proposal request | [proposal_request_router.py:L195](backend/app/api/v1/proposal_requests/proposal_request_router.py#L195) |
| **`/api/v1/resource-allocation`**| `POST` | `/match` | Run Resource Matching & Cost Estimation | [resource_router.py:L32](backend/app/api/v1/resource_allocation/resource_router.py#L32) |
| | `POST` | `/match/db/{proposal_request_id}`| Run Resource Matching from Database Request ID | [resource_router.py:L101](backend/app/api/v1/resource_allocation/resource_router.py#L101) |
| **`/api/v1/proposals`** | `GET` | `` (empty) | List all proposals for Proposals Console | [proposal_router.py:L36](backend/app/api/v1/proposals/proposal_router.py#L36) |
| | `GET` | `/all` | List all proposals for Proposals Console | [proposal_router.py:L37](backend/app/api/v1/proposals/proposal_router.py#L37) |
| | `GET` | `/{proposal_id}`| Get a single proposal by ID with full details | [proposal_router.py:L45](backend/app/api/v1/proposals/proposal_router.py#L45) |
| | `GET` | `/{proposal_id}/export`| Export a proposal as a document | [proposal_router.py:L52](backend/app/api/v1/proposals/proposal_router.py#L52) |
| | `POST` | `/generate-demo` | Generate MVP and Full Proposals | [proposal_router.py:L82](backend/app/api/v1/proposals/proposal_router.py#L82) |
| | `POST` | `/{proposal_id}/select`| Approve and finalize a proposal | [proposal_router.py:L121](backend/app/api/v1/proposals/proposal_router.py#L121) |
| | `GET` | `/{proposal_id}/download`| Download the finalized proposal document | [proposal_router.py:L219](backend/app/api/v1/proposals/proposal_router.py#L219) |
| **`/api/v1/ai-agent`** | `POST` | `/extract-requirements`| Extract requirements from RFP/prompt using AI agent | [ai_agent_router.py:L16](backend/app/api/v1/ai_agent/ai_agent_router.py#L16) |
| | `POST` | `/negotiate` | Negotiate proposal scope, timeline, and resources | [ai_agent_router.py:L28](backend/app/api/v1/ai_agent/ai_agent_router.py#L28) |
| **`/api/v1/admin`** | `GET` | `/dashboard-stats` | Fetch comprehensive metrics for dashboard | [admin_router.py:L17](backend/app/api/v1/admin/admin_router.py#L17) |
| | `GET` | `/otp-logs` | Fetch OTP verification logs | [admin_router.py:L21](backend/app/api/v1/admin/admin_router.py#L21) |

---

## 2. Frontend Application Routes (React Router)

These routes are defined in the Client Single Page Application ([App.jsx](frontend/src/App.jsx)).

| Frontend Path | Element/Component | Access Control / Guards | File Reference |
| :--- | :--- | :--- | :--- |
| **`/`** | `<Landing />` | Public | [App.jsx:L80-87](frontend/src/App.jsx#L80-L87) |
| **`/onboarding`** | `<Onboarding />` | Public (Client flow step 1) | [App.jsx:L91](frontend/src/App.jsx#L91) |
| **`/summary`** | `<RequirementsSummary />` | Public (Client flow step 2) | [App.jsx:L93](frontend/src/App.jsx#L93) |
| **`/compare`** | `<ProposalComparisonPage />` | Public | [App.jsx:L95](frontend/src/App.jsx#L95) |
| **`/proposal-preview`** | `<ProposalPreviewPage />` | Public | [App.jsx:L97-100](frontend/src/App.jsx#L97-L100) |
| **`/broker`** | `<Negotiation />` | Public (Client AI negotiation broker) | [App.jsx:L102](frontend/src/App.jsx#L102) |
| **`/sign`** | `<FinalApproval />` | Public (Final Approval sign stage) | [App.jsx:L104](frontend/src/App.jsx#L104) |
| **`/client-portal`** | `<ClientPortal />` | Public | [App.jsx:L106](frontend/src/App.jsx#L106) |
| **`/super-admin-login`** | `<SuperAdminLogin />` | Public | [App.jsx:L110](frontend/src/App.jsx#L110) |
| **`/super-admin-dashboard`**| `<SuperAdminDashboard />` | Protected by `<AdminPortalRoute>` | [App.jsx:L115-122](frontend/src/App.jsx#L115-L122) |
| **`/admin-signup`** | `<AdminSignup />` | Public | [App.jsx:L126-129](frontend/src/App.jsx#L126-L129) |
| **`/edit-user`** | `<EditUser />` | Public | [App.jsx:L133-136](frontend/src/App.jsx#L133-L136) |
| **`/super-admin`** | Redirect to `/super-admin-dashboard` | Redirect | [App.jsx:L138-141](frontend/src/App.jsx#L138-L141) |
| **`/admin/login`** | `<AdminLogin />` | Auto-redirects if already logged in | [App.jsx:L144-164](frontend/src/App.jsx#L144-L164) |
| **`/admin/sign-up`** | `<AdminSignup />` | Auto-redirects if already logged in | [App.jsx:L166-187](frontend/src/App.jsx#L166-L187) |
| **`/admin/*`** | `<AdminPortal />` | Protected by `<AdminPortalRoute>` | [App.jsx:L191-202](frontend/src/App.jsx#L191-L202) |
| **`*`** (404 fallback) | Redirect to `/` | Redirect | [App.jsx:L206-209](frontend/src/App.jsx#L206-L209) |

### Inner Tab Sub-routing in Admin Portal (`/admin/*`)
Within the [AdminPortal.jsx](frontend/src/pages/AdminPortal.jsx#L51) component, sub-paths map to key dashboard tabs:
* **`/admin/dashboard`** — Resource Operations Dashboard stats & charts
* **`/admin/proposal-console`** — List of active client proposals
* **`/admin/bench-management`** — Staffing and bench allocation management
* **`/admin/users-catalog`** — Client workspace directory & status controls
* **`/admin/otp`** — OTP verification logs viewer
* **`/admin` / `/admin/`** — Automatically redirects to `/admin/dashboard`
