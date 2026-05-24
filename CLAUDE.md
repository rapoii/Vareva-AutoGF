# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

Vareva AutoGF is a full-stack tool for parsing public Google Forms, generating realistic Indonesian personas and answers with AI, and submitting or reviewing answers through a React UI.

Use this project responsibly. Do not add features that enable unauthorized spam, abuse, credential theft, rate-limit bypassing, or evasion. Keep the tool scoped to forms the user owns, administers, or is authorized to test.

## Stack

- Backend: FastAPI, SQLModel, Pydantic Settings, SQLite
- AI providers: OpenAI-compatible SDK/providers with fallback chain
- Frontend: React 19, Vite, TypeScript
- Styling: Tailwind CSS 4, Radix UI, shadcn-style primitives
- Tests: pytest, pytest-asyncio

## Important Paths

- `backend/app/main.py` — FastAPI app setup, middleware, router registration
- `backend/app/routes/` — API route modules
- `backend/app/core/` — parsing, generation, submission, auth, storage logic
- `backend/app/config/` — modular environment/settings classes
- `backend/app/schemas/` — request/response Pydantic schemas
- `backend/app/models/` — SQLModel database models
- `backend/tests/` — backend tests
- `frontend/src/App.tsx` — main frontend flow/state orchestration
- `frontend/src/components/` — UI steps and reusable components
- `frontend/src/components/ui/` — shadcn-style UI primitives
- `frontend/src/lib/api.ts` — frontend API client and shared response types
- `docs/ENVIRONMENT.md` — environment variable reference
- `docs/GOOGLE_SHEETS_STORAGE.md` — Google Sheets storage setup

## Setup Commands

Backend:

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

On Windows PowerShell, the repository also has `start_backend.ps1` for launching the backend.

## Verification Commands

Run these before reporting backend or frontend changes as complete when relevant:

```bash
cd backend && pytest
cd frontend && npm run lint
cd frontend && npm run build
```

For UI changes, start the backend and frontend, open the Vite app, and manually verify the changed flow in the browser. Type checking and tests are not enough for frontend UX changes.

## Environment Notes

- Never commit `.env`, API keys, local SQLite databases, tokens, or generated private data.
- Backend settings are loaded from `.env` via Pydantic Settings.
- At least one AI provider key is expected for real generation.
- Storage can be local SQLite or Google Sheets Apps Script depending on `STORAGE_BACKEND`.
- Auth uses bearer tokens signed by `AUTH_SECRET_KEY`.

## Backend Conventions

- Keep route handlers thin; put business logic in `backend/app/core/`.
- Keep request/response contracts in `backend/app/schemas/`.
- Use the existing modular config classes in `backend/app/config/` instead of reading environment variables directly in route/core code.
- Preserve the existing provider fallback behavior unless the task explicitly changes it.
- Validate external inputs at API boundaries with Pydantic schemas.
- Do not add broad fallback behavior or compatibility shims unless required by the current task.
- Do not silently swallow provider, parsing, storage, or submission errors; return useful API errors or log events consistent with existing patterns.
- Be careful with Google Forms payload handling, especially multi-page forms and `Other` / `Yang lain:` options.

## Frontend Conventions

- Keep API calls and shared API types in `frontend/src/lib/api.ts`.
- Keep step-specific UI inside `frontend/src/components/*Step.tsx`.
- Reuse existing UI primitives in `frontend/src/components/ui/` before adding new primitives.
- Preserve the current neobrutalist/pixel-art visual style unless asked to redesign it.
- Current UI direction is Valleycos-inspired pastel pixel/neobrutal: cream/pink dotted background, dark plum borders/shadows, pink soft/cream/peach card surfaces, readable ink text on pink, solid red destructive actions, and consistent shadow width alignment.
- Keep TypeScript types explicit for API data that crosses the backend/frontend boundary.
- For auth-sensitive calls, use the existing token helper behavior in `api.ts`.
- Avoid introducing new state management libraries unless explicitly requested.

## Coding Style

- Prefer small, targeted changes over broad refactors.
- Do not add comments unless the reason is non-obvious.
- Do not create new documentation files unless explicitly requested.
- Do not add unused abstractions, wrappers, compatibility layers, or feature flags.
- Prefer editing existing files over creating new ones.
- Keep Indonesian persona/data behavior natural and gender-aware when touching generation logic.

## Security and Abuse Guardrails

- Do not implement mass-targeting, evasion, anti-detection, CAPTCHA bypass, or unauthorized automation features.
- Do not log secrets, bearer tokens, raw API keys, or `.env` contents.
- Do not weaken auth checks, token validation, or profile isolation.
- Do not hardcode provider keys or Google Sheets shared secrets.
- Treat stored form history, generated personas, answers, and submission logs as sensitive user data.

## Git Notes

- The repository may contain existing uncommitted user changes. Do not overwrite, reset, clean, or discard them unless the user explicitly asks.
- Stage specific files only when committing.
- Do not create commits or pull requests unless explicitly requested.
