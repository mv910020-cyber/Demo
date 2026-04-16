# AI Agent Instructions for Product Demo Platform

This workspace contains two main projects:

- **backend/**: FastAPI + SQLAlchemy backend for product demo scheduling, reminders, and analytics
- **booking-platform-main/**: Next.js frontend for demo booking, dashboard, and status tracking

## General Conventions
- **Backend**: Use FastAPI, SQLAlchemy, Alembic for migrations, Pydantic for schemas, JWT for auth
- **Frontend**: Use Next.js (App Router), React, TypeScript, API calls via `src/lib/api.ts`
- **API contracts**: See [DATABASE_SCHEMA_AND_API_CONTRACTS.md](booking-platform-main/DATABASE_SCHEMA_AND_API_CONTRACTS.md) for all frontend-backend data models and endpoints
- **Environment**: `.env.example` files in both projects; copy to `.env` and fill in secrets

## Build & Run Commands

### Backend
- Install: `pip install -r requirements.txt` (in `backend/`)
- Migrate DB: `alembic upgrade head` (in `backend/`)
- Run dev server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (in `backend/`)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend
- Install: `npm install` (in `booking-platform-main/`)
- Run dev server: `npm run dev` (in `booking-platform-main/`)
- Main entry: `src/app/page.tsx`

## Key Files & Docs
- [backend/README.md](backend/README.md): Backend setup, modules, and API docs
- [booking-platform-main/README.md](booking-platform-main/README.md): Frontend setup, dev instructions
- [DATABASE_SCHEMA_AND_API_CONTRACTS.md](booking-platform-main/DATABASE_SCHEMA_AND_API_CONTRACTS.md): All API endpoints and data models
- [AGENTS.md](booking-platform-main/AGENTS.md): Next.js-specific agent warnings
- [CLAUDE.md](booking-platform-main/CLAUDE.md): Points to AGENTS.md

## Project Structure
- **Backend**: `app/` (APIs, models, schemas, services), `alembic/` (migrations), `tests/`
- **Frontend**: `src/app/` (pages), `src/lib/api.ts` (API client/types), `src/components/`

## Special Notes
- **Next.js version**: See [AGENTS.md](booking-platform-main/AGENTS.md) for breaking changes and agent warnings
- **Frontend-backend integration**: All API calls use `/api/v1` prefix on backend
- **Reminder worker**: Backend runs a background reminder dispatcher if enabled in config

---
For more details, see the linked documentation files above. If you are an AI agent, always check for breaking changes in AGENTS.md before generating Next.js code.
