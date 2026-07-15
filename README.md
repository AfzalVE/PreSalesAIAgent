# AI Proposal Generator Platform

An AI-powered web application that automates software proposal generation by collecting client requirements, estimating project cost and timeline, allocating resources, and generating professional proposals along with Proof of Concept (POC) documents.

---

# Features

## Client Portal

- User Registration & Login
- Email OTP Verification
- Voice-based Requirement Collection
- Text/Form-based Requirement Submission
- AI Chat Assistant
- Proposal Comparison
- Proposal History
- Proposal Approval
- PDF Download

---

## AI Features

- Requirement Extraction
- Technology Recommendation
- Cost Estimation
- Resource Allocation
- MVP Proposal Generation
- Full Proposal Generation
- Proposal Regeneration
- POC Generation

---

## Admin Portal

- Dashboard
- Employee Management
- Client Management
- Proposal Management
- Resource Availability
- Analytics
- System Configuration

---

# Technology Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Query
- React Router

---

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- Pydantic

---

## AI

- OpenAI API
- Prompt Engineering

---

## Database

- PostgreSQL

---

## PDF Generation

- Jinja2
- WeasyPrint / ReportLab

---

# Project Structure

```
AI-Proposal-Generator/

│
├── frontend/
│
├── backend/
│
├── docs/
│
├── README.md
│
└── .gitignore
```

---

# Backend Structure

```
backend/

app/

core/

models/

schemas/

repositories/

services/

api/

utils/

templates/

prompts/

main.py
```

---

# Frontend Structure

```
frontend/

src/

components/

pages/

layouts/

routes/

services/

store/

hooks/

types/

utils/
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/your-org/AI-Proposal-Generator.git
```

---

## Backend

```bash
cd backend

python -m venv venv

source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run server

```bash
uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Environment Variables

Backend

```
DATABASE_URL=

JWT_SECRET=

OPENAI_API_KEY=

SMTP_HOST=

SMTP_PORT=

SMTP_USERNAME=

SMTP_PASSWORD=
```

Frontend

```
VITE_API_URL=
```

---

# Development Workflow

- Create a feature branch from `develop`
- Implement your assigned module
- Commit changes with meaningful messages
- Raise a Pull Request to `develop`
- Merge to `main` after review

---

# Branch Strategy

```
main

develop

feature/auth

feature/users

feature/employees

feature/proposals

feature/cost-estimation

feature/resource-allocation

feature/poc

feature/pdf
```

---

# Team Responsibilities

## Frontend

- Authentication
- Client Dashboard
- Admin Dashboard
- Proposal UI
- AI Chat Interface

## Backend

- Authentication APIs
- Employee APIs
- Proposal APIs
- Cost Estimation
- Resource Allocation
- Proposal Generation
- POC Generation
- PDF Export

---

# Current Status

- Project Initialization
- Database Design
- API Planning
- Module Separation
- Development in Progress

---

# License

This project is developed for internal organizational use.