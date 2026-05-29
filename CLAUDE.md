# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

Vareva AutoGF is a full-stack tool for parsing public Google Forms, generating realistic Indonesian personas and answers with AI, and submitting or reviewing answers through a React UI.

Use this project responsibly. Do not add features that enable unauthorized spam, abuse, credential theft, rate-limit bypassing, or evasion. Keep the tool scoped to forms the user owns, administers, or is authorized to test.

## Stack

- Backend: FastAPI, Pydantic Settings, Google Sheets Apps Script storage
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
- `backend/tests/` — backend tests
- `frontend/src/App.tsx` — main frontend flow/state orchestration
- `frontend/src/components/` — UI steps and reusable components
- `frontend/src/components/ui/` — shadcn-style UI primitives
- `frontend/src/lib/api.ts` — frontend API client and shared response types
- `PRD.md` — product requirements, release scope, and acceptance criteria
- `docs/ENVIRONMENT.md` — environment variable reference
- `docs/GOOGLE_SHEETS_STORAGE.md` — Google Sheets storage setup
- `scripts/google_apps_script/Code.gs.txt` — Apps Script storage backend; redeploy Web App after changes
- `api/app.py` — Vercel Python entrypoint for FastAPI
- `vercel.json` — Vercel frontend/API routing and cron fallback

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

On Windows PowerShell, use the same commands above or the current dev runner if maintained. Do not assume legacy launcher scripts are current unless verified.

## Verification Commands

Run these before reporting backend or frontend changes as complete when relevant:

```bash
cd backend && pytest
cd frontend && npm run lint
cd frontend && npm run build
```

For UI changes, start the backend and frontend, open the Vite app, and manually verify the changed flow in the browser. Type checking and tests are not enough for frontend UX changes.

## Environment Notes

- Never commit `.env`, API keys, tokens, Apps Script secrets, or generated private data.
- Backend settings are loaded from `.env` via Pydantic Settings.
- At least one AI provider key is expected for real generation.
- Storage is Google Sheets Apps Script only; there is no SQLite/local DB fallback.
- Keep the deployed Apps Script in sync with `scripts/google_apps_script/Code.gs.txt`.
- After changing storage actions, redeploy the Apps Script Web App and update `GOOGLE_SHEETS_SCRIPT_URL` if the deployment URL changes.
- Local development requires valid `GOOGLE_SHEETS_SCRIPT_URL` and `GOOGLE_SHEETS_SHARED_SECRET` for storage-backed flows.
- `CORS_ORIGINS` defaults to localhost development origins; set it explicitly to the deployed frontend origin on Vercel/production.
- Real Apps Script E2E tests are opt-in only via `RUN_LIVE_E2E=1`.
- Auth uses bearer tokens signed by `AUTH_SECRET_KEY`.
- Login has an in-memory per-email failed-password cooldown: 5 seconds after the first wrong password, then 10, 15, 20, etc. A successful login resets that email's cooldown back to the first-step behavior.

## Runtime Flow Notes

- Batch generation uses saved sessions plus bounded `/api/batch/sessions/{session_id}/process` calls; do not reintroduce long-running backend threads.
- Reloading `/generate/{session_id}` must fetch stored status and resume only missing iterations, not restart generation or consume provider quota twice.
- The frontend process loop handles fast active-tab processing; Vercel Cron `/api/batch/cron/process` is only a slow fallback for unfinished sessions.
- Review mode (`skip_submit=true`) generates and stores answers as `pending_review`; it must not count those rows as failed submissions.
- Review answers are editable from the progress detail cards before submission. Edits should persist through Google Sheets storage, not only local frontend state.
- The `SUBMIT SEMUA` action in review mode should appear only after all requested review iterations are available, then submit all pending review iterations together.
- Auto mode submits during each `/process` call; review mode waits for explicit user submission.

## Backend Conventions

- Keep route handlers thin; put business logic in `backend/app/core/`.
- Keep request/response contracts in `backend/app/schemas/`.
- Use the existing modular config classes in `backend/app/config/` instead of reading environment variables directly in route/core code.
- Keep `AppStorage` Google Sheets-only; do not add SQLite, SQLModel, or local file/database fallback code.
- Keep Apps Script deletes efficient for large histories by deleting row blocks rather than one row at a time.
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
- Current UI direction is a pastel pixel/neobrutal aesthetic: cream/pink dotted background, dark plum borders/shadows, pink soft/cream/peach card surfaces, readable ink text on pink, solid red destructive actions with white text/icons, and consistent shadow width alignment.
- Loading states should use the shared `LoadingOverlay` modal pattern so the previous/current page remains visible behind the overlay.
- Progress pages should keep cards, empty states, and bottom action buttons visually aligned in width and shadow, including disabled/loading button states.
- Review progress details should show question text above the answer, use compact icon-only edit buttons in the question header, and avoid extra answer labels when the content is already clear.
- Keep TypeScript types explicit for API data that crosses the backend/frontend boundary.
- For auth-sensitive calls, use the existing token helper behavior in `api.ts`.
- Avoid introducing new state management libraries unless explicitly requested.

## Documentation and MCP Usage

- Always use Context7 MCP for up-to-date documentation before answering or implementing anything involving libraries, frameworks, SDKs, APIs, CLI tools, or cloud services.
- Start with `resolve-library-id` using the official library/tool name, then call `query-docs` with the selected Context7 library ID and the full question/task.
- Prefer Context7 over web search for documentation and API syntax, including well-known tools such as FastAPI, React, Vite, Tailwind CSS, Radix UI, Pydantic, pytest, OpenAI-compatible SDKs, and deployment/cloud services.
- Do not rely only on model memory for version-specific syntax, configuration, migrations, or examples.
- Context7 is not required for pure business-logic debugging, local refactors, code review, or project-specific behavior that can be verified from this repository.

## Coding Style

- Prefer small, targeted changes over broad refactors.
- Do not add comments unless the reason is non-obvious.
- Do not create new documentation files unless explicitly requested.
- Do not add unused abstractions, wrappers, compatibility layers, or feature flags.
- Prefer editing existing files over creating new ones.
- Keep Indonesian persona/data behavior natural and gender-aware when touching generation logic.

## Security and Abuse Guardrails

- Do not log secrets, bearer tokens, raw API keys, or `.env` contents.
- Do not weaken auth checks, token validation, or profile isolation.
- Do not hardcode provider keys or Google Sheets shared secrets.
- Treat stored form history, generated personas, answers, submission logs, and Google Sheets rows as sensitive user data.

## Git Notes

- The repository may contain existing uncommitted user changes. Do not overwrite, reset, clean, or discard them unless the user explicitly asks.
- Stage specific files only when committing.
- Do not create commits or pull requests unless explicitly requested.
