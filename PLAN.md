# Plan - Vercel-only Frontend + Backend Deployment

## Context
User wants both frontend and backend to run on Vercel because Render/Koyeb require a payment card and PythonAnywhere free only exposes WSGI, which does not fit this FastAPI ASGI app well. The current app is React/Vite + FastAPI. It already supports reload-safe `/generate/{session_id}` pages, Google Sheets storage, review-mode editing, and submit-all.

The blocker is not FastAPI itself; it is the current backend execution model. The current `/api/batch/jobs` starts an in-process `threading.Thread` background worker. Vercel serverless functions cannot keep daemon threads alive after the request returns, cannot rely on local SQLite, and are a poor fit for long SSE streams. To deploy both frontend and backend on Vercel, batch processing must become short-lived, idempotent, and driven step-by-step with durable Google Sheets state.

## Recommended Approach
Keep React/Vite and keep the existing FastAPI app, but run FastAPI behind Vercel Python serverless functions. Replace the in-process background batch job with a client-orchestrated, serverless-safe processing loop:

- [x] `POST /api/batch/jobs` creates a durable session and saves schema/config, but does not start a thread.
- [x] Frontend navigates to `/generate/{session_id}` and starts a process loop.
- [x] Each loop calls `POST /api/batch/sessions/{session_id}/process`.
- [x] The backend processes at most one missing iteration per request, persists the result to Google Sheets, updates session counts/status, and returns `BatchSessionStatus`.
- [x] The frontend renders progress from stored state and repeats until `completed`/`failed`.
- [x] If the user reloads `/generate/{session_id}`, the app fetches stored status and resumes processing only missing iterations.

This keeps the reload-safe behavior and avoids Vercel background-thread loss. Google Sheets remains the source of truth in production; SQLite remains local/dev only.

## Critical Files

- [x] `backend/app/routes/batch.py` — remove thread dependency from active flow, add process endpoint, refactor batch loop into single-iteration helper.
- [x] `backend/app/schemas/batch.py` — add request schema for process endpoint if needed (`max_iterations`, default 1).
- [x] `backend/app/core/storage/service.py` — reuse existing session/log/schema helpers; add minimal helpers only if needed for stored generation config or processing status.
- [x] `frontend/src/lib/api.ts` — add `processBatchSession(sessionId, maxIterations?)`; remove active dependence on `batchRunStream`.
- [x] `frontend/src/App.tsx` — replace passive polling-only progress with a guarded process loop that calls `/process` while status is running.
- [x] `frontend/src/components/BatchProgressStep.tsx` — mostly keep existing status-driven UI; adjust copy from “background job” to saved/resumable processing.
- [x] `api/app.py` — expose existing FastAPI `app` to Vercel Python functions.
- [x] `vercel.json` — configure frontend build, Python API routing, and SPA rewrites.
- [x] `docs/DEPLOYMENT_FREE.md`, `README.md`, `docs/PRODUCTION.md` — update deployment docs to Vercel-only.

## Backend Design

### 1. Make `/api/batch/jobs` Vercel-safe

Current behavior starts `_start_batch_thread(...)`. New behavior:

- [x] Resolve form schema via `_resolve_form_schema`.
- [x] Normalize generation config.
- [x] Create storage session with `status="running"` and mode `review`/`auto`.
- [x] Save schema.
- [x] Persist generation config for later `/process` calls.
- [x] Return `BatchSessionStatus` with existing logs.
- [x] Do not start a thread or SSE worker.

### 2. Add bounded process endpoint

Add:

```http
POST /api/batch/sessions/{session_id}/process
```

Initial implementation processes exactly one iteration per call to stay within Vercel limits.

Flow:

- [x] Load session by user and validate ownership.
- [x] Load saved schema and generation config.
- [x] Load existing logs and determine next missing iteration.
- [x] If all iterations exist, update status `completed` and return current status.
- [x] Generate one persona/answer set using existing generator functions and answer history.
- [x] Review mode: append submission log with `submit_status="pending_review"`.
- [x] Auto mode: submit immediately, then append/update logs with success/fail.
- [x] Update session result after the iteration.
- [x] Return fresh `BatchSessionStatus`.

### 3. Keep review editing and submit-all

Keep:

- [x] `PATCH /api/batch/sessions/{session_id}/iterations/{iteration}/answers`
- [x] `POST /api/batch/sessions/{session_id}/submit-reviewed`

- [ ] If submit-all times out on Vercel for larger batches, split it in a later patch into a similar `submit-reviewed/process` endpoint.

## Frontend Design

### 1. API client

Add to `frontend/src/lib/api.ts`:

```ts
processBatchSession(sessionId: string, maxIterations = 1): Promise<BatchSessionStatus>
```

### 2. Progress processing loop

In `frontend/src/App.tsx`:

- [x] Keep `startBatchJob` to create the durable session.
- [x] After navigation to `/generate/{session_id}`, start a guarded processing loop.
- [x] Reuse/extend existing in-flight refs so only one process call runs at a time.
- [x] While status is `running`/`queued`:
  - [x] call `processBatchSession(session_id, 1)`;
  - [x] cache returned status in `sessionStorage`;
  - [x] render progress;
  - [x] wait a small delay before next call;
  - [x] stop on `completed`/`failed`.
- [x] On reload of `/generate/{session_id}`:
  - [x] fetch `getBatchSession`;
  - [x] if session still running and results are incomplete, resume loop.

### 3. Progress UI copy

In `BatchProgressStep`, replace backend-thread wording like “Background job running on backend” with copy such as:

- “Processing saved session...”
- “Progress is saved and reload-safe”
- “Waiting stored results: X/Y”

Keep edit/submit-all UI intact.

## Vercel Deployment Design

Use root `vercel.json` with:

- [x] frontend build from `frontend/`;
- [x] output `frontend/dist`;
- [x] `/api/*` routed to Python FastAPI entrypoint;
- [x] SPA fallback to `index.html` after API rewrite.

Production env vars on Vercel should force:

```env
STORAGE_BACKEND=google_sheets
GOOGLE_SHEETS_SCRIPT_URL=...
GOOGLE_SHEETS_SHARED_SECRET=...
GOOGLE_SHEETS_TIMEOUT_SECONDS=60
AUTH_SECRET_KEY=...
AUTH_TOKEN_EXPIRE_MINUTES=10080
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=...
OPENROUTER_FALLBACK_MODELS=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
CEREBRAS_API_KEY=...
CEREBRAS_MODEL=...
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:5173
```

Frontend can use same-origin `/api` when Vercel routes API and static frontend together.

## Risks and Mitigations

- **Vercel function timeout during AI generation** — process one iteration per call; keep count modest; surface retry errors.
- **Duplicate processing from multiple tabs** — frontend guard prevents most overlap; backend should always compute the next missing iteration from storage before generating.
- **Google Sheets lock/timeout** — keep writes small; return clear 503; frontend can retry next loop.
- **Auto mode long submit** — one iteration per request avoids one huge long-running submit batch.
- **No durable queue** — acceptable for no-card/free deployment; durable queue can be added later if needed.
- **Generation config persistence** — must be explicitly durable because Vercel process memory is not shared across requests.

## Verification

1. Backend checks:
   - [x] `python -m pytest backend/tests/test_batch_jobs.py backend/tests/test_quality.py`
   - [x] Add/adjust tests so `/jobs` creates a session without starting a thread.
   - [ ] Add test for repeated `/process` calls completing a session.

2. Frontend checks:
   - [x] `npm run lint --prefix frontend`
   - [x] `npm run build --prefix frontend`

3. Local smoke:
   - [ ] Scan authorized form.
   - [ ] Start review mode count 2.
   - [ ] Reload `/generate/{session_id}` after first result.
   - [ ] Confirm processing resumes and second result appears.
   - [ ] Edit one answer, submit all, confirm stored result changes.
   - [ ] Run auto mode count 2 and confirm responses arrive.

4. Vercel smoke:
   - [ ] Deploy preview.
   - [ ] Check `/` health or equivalent API health route.
   - [ ] Check frontend root and deep link `/generate/{session_id}`.
   - [ ] Run review count 1 against a test form.
   - [ ] Confirm Google Sheets logs update.

## Out of Scope

- Rewriting the app to Next.js.
- Adding Redis/Upstash/QStash/Inngest/Trigger.dev.
- Replacing Google Sheets storage.
- True background processing after tab close. In Vercel-only/free mode, processing resumes when the frontend is open or reloaded.
