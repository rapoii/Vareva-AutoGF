# Product Requirements Document: Vareva AutoGF

## 1. Summary

Vareva AutoGF is a web app for authorized Google Forms automation. Users can scan a public Google Form, generate realistic Indonesian personas and answers with AI, then either auto-submit generated responses or review/edit answers before submitting them.

The product is designed for owned forms, internal QA, research/demo workflows, and authorized testing. It must not be extended toward spam, credential theft, CAPTCHA bypass, rate-limit evasion, or unauthorized mass submission.

## 2. Goals

- Parse public Google Forms into a usable schema with field types, options, required flags, and page metadata.
- Generate natural Indonesian personas and context-aware answers with provider fallback.
- Support two generation modes:
  - Auto mode: generate and submit each iteration during saved processing.
  - Review mode: generate stored `pending_review` answers, let the user edit them, then submit all pending reviews together.
- Keep progress reload-safe through Google Sheets Apps Script storage.
- Provide an approachable React UI with scan readiness, configuration, progress, review, and history flows.
- Deploy on a free/serverless-friendly stack using Vercel + Google Sheets Apps Script.

## 3. Non-goals

- No local database, SQLite, SQLModel, or file-backed fallback storage.
- No long-running backend threads or daemon workers for batch jobs.
- No CAPTCHA bypass, rate-limit bypass, stealth automation, or unauthorized submission features.
- No multi-tenant admin dashboard beyond per-user auth/history flows.
- No guarantee that abandoned free-tier sessions finish instantly; Vercel Cron is a slow fallback.

## 4. Target Users

- Form owners who need test submissions for validation.
- Internal QA users testing Google Forms workflows.
- Demo operators showcasing Indonesian persona-based data generation.
- Authorized researchers or administrators testing forms they control.

## 5. Core User Stories

### Authentication

- As a user, I can register and log in so that my form history and generated data are scoped to my account.
- As a user, I can update my profile or password.
- As a user, failed login attempts should slow repeated password guessing for the same email.

### Form scanning

- As a user, I can paste a Google Forms URL and scan it before generation.
- As a user, if I change the URL after scanning, generation should be disabled until the scan matches the current URL again.
- As a user, I can inspect parsed questions and configure optional generation behavior.

### Generation configuration

- As a user, I can set persona description, economic class, and answer instructions.
- As a user, I can set custom per-question answers.
- As a user, I can use `Yang lain:` / Other answers and expect stale custom Other text to be cleared when I deselect Other.

### Batch generation

- As a user, I can choose a count from 1 to 50.
- As a user, I can choose Auto Submit or Review Dulu mode.
- As a user, I can reload `/generate/{session_id}` and resume only missing iterations.
- As a user, I can see progress, status, counts, system logs, and saved iteration details.

### Review mode

- As a user, generated review answers should be stored as `pending_review` and not counted as failed submissions.
- As a user, I can edit stored review answers and persist edits through Google Sheets storage.
- As a user, `SUBMIT SEMUA` appears only when all requested review iterations are available.
- As a user, I can submit all pending review iterations together and see success/failure details.

### Auto mode

- As a user, auto mode submits during each bounded `/process` call.
- As a user, submitted iterations are logged with status, HTTP code, tokens, retries, provider, and persona summary.

### History and storage

- As a user, I can view my form history.
- As a user, I can delete form history and related rows for my account.
- As a user, another user must not access or submit against my sessions.

## 6. Functional Requirements

### Backend

- FastAPI routes must validate external inputs through Pydantic schemas.
- Auth-sensitive endpoints must depend on the current authenticated user.
- `/api/submit/` must reject unknown or cross-user `session_id` values.
- Batch sessions must be stored in Google Sheets and scoped by `user_id`.
- `/api/batch/jobs` creates saved sessions and stores schema/config.
- `/api/batch/sessions/{session_id}/process` processes bounded missing iterations and persists each result.
- `/api/batch/run` remains compatibility-only but must persist `pending_review`, failed, and success iteration logs.
- Review answer edits must update stored `answers_json`.
- Apps Script storage actions must preserve rows for users, sessions, form schemas, generation configs, submission logs, and generated persona logs.

### Frontend

- The generate CTA must be disabled unless the current URL has a matching ready scan.
- Mobile and desktop generate CTA conditions must match.
- Scan configuration must clear Other text when `Yang lain:` is deselected.
- Review details must show question text above answer text and support compact edit buttons.
- Loading states should use the shared `LoadingOverlay` pattern.
- API calls and shared response types should stay in `frontend/src/lib/api.ts`.

### Deployment

- Vercel should build `frontend/` and route `/api/*` to `api/app.py`.
- Production must set `CORS_ORIGINS` to the deployed frontend origin.
- Production must use platform secrets for API keys, Apps Script secret, and `AUTH_SECRET_KEY`.
- Apps Script must be redeployed whenever `scripts/google_apps_script/Code.gs.txt` changes.

## 7. Non-functional Requirements

- **Security:** no committed secrets, no weakened auth, no profile/session isolation leaks.
- **Privacy:** generated personas, answers, form URLs, submission logs, and sheet rows are sensitive.
- **Reliability:** each batch iteration persists progress before the UI reports it as stored.
- **Serverless safety:** no long-running backend thread is required for batch completion.
- **Usability:** the UI should remain clear on mobile and avoid enabled buttons that silently do nothing.
- **Maintainability:** route handlers stay thin; business logic belongs in `backend/app/core/`.
- **Responsible use:** features must remain scoped to authorized forms.

## 8. Acceptance Criteria

A release is acceptable when:

- `python -m pytest` passes.
- `npm --prefix frontend run lint` passes.
- `npm --prefix frontend run build` passes.
- FastAPI app imports successfully from `api/app.py` / `backend/app/main.py`.
- Frontend runtime dependency audit reports no known runtime vulnerabilities.
- Python dependency audit reports no known vulnerabilities.
- Manual smoke verifies:
  - login works,
  - scan readiness gates generation,
  - URL changes disable generation until scan is current,
  - review mode can generate count 1,
  - review answers can be edited and submitted,
  - `Yang lain:` custom text clears on deselect,
  - fake `/api/submit/` sessions return 404,
  - legacy `/api/batch/run` review results persist as `pending_review`.
- Production env contains valid values for:
  - `GOOGLE_SHEETS_SCRIPT_URL`,
  - `GOOGLE_SHEETS_SHARED_SECRET`,
  - `AUTH_SECRET_KEY`,
  - at least one AI provider key,
  - `CORS_ORIGINS` set to the deployed frontend domain.

## 9. Release Notes for Current Scope

- Fixed user-scoped session validation for `/api/submit/`.
- Fixed legacy batch review persistence for `pending_review` and failed generation rows.
- Fixed mobile generate CTA readiness gating.
- Fixed stale `Yang lain:` custom answer state.
- Hardened default CORS origins away from wildcard.
- Updated deployment and environment documentation for production CORS.

## 10. Open Operational Notes

- Free Vercel Cron is a fallback, not a real-time worker queue.
- Google Sheets Apps Script can lock or timeout under concurrent write pressure.
- Public production deployments should add broader rate limiting/abuse protection around parse, generate, and submit endpoints.
- Keep usage limited to forms the operator owns, administers, or is authorized to test.
