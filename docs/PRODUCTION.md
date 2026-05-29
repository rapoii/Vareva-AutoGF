# Production Notes

This guide lists the main changes to review before running Vareva AutoGF outside local development. For the recommended free stack, see [Free Deployment Guide](DEPLOYMENT_FREE.md).

## Deployment Checklist

- Configure provider API keys through platform secrets, not committed files.
- Restrict CORS origins to trusted frontend domains.
- Keep authentication enabled and use a strong `AUTH_SECRET_KEY` from platform secrets.
- The built-in failed-login cooldown is in-memory per backend process; use a shared persistent rate limiter for multi-instance deployments.
- Add broader rate limiting and abuse protection around parse, generate, and submit endpoints.
- Keep Google Sheets Apps Script deployment and sheet permissions locked to trusted maintainers.
- Review logging so generated names, answers, form URLs, and submission payloads are not exposed publicly.
- Confirm Google Forms automation is only used for forms you own, administer, or are authorized to test.

## Recommended Runtime Setup

### Vercel-only free deployment

Use `vercel.json` and `api/app.py` to deploy the Vite frontend and FastAPI backend together on Vercel. Google Sheets + Apps Script is the only persistence layer.

Batch processing is split into short `/api/batch/sessions/{session_id}/process` calls. Each call processes at most one missing iteration and persists progress before returning. A daily Vercel Cron fallback calls `/api/batch/cron/process` to resume unfinished sessions when the browser is no longer active.

### Separate backend deployment

For a traditional backend host, run FastAPI behind a production ASGI server and reverse proxy.

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For real deployments, run through your platform process manager and configure:

- health checks against `GET /`
- HTTPS termination at the proxy/platform layer
- request timeout limits
- structured log collection
- restart policy on failure

### Frontend

Build static assets from `frontend/`:

```powershell
npm run build
```

On Vercel, the frontend uses same-origin `/api` by default. For a separately hosted backend, configure the frontend API base URL according to the deployed backend origin.

## Environment Variables

Minimum required backend settings:

```env
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
CEREBRAS_API_KEY=your_key
OPENROUTER_API_KEY=your_key
GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
GOOGLE_SHEETS_SHARED_SECRET=your_shared_secret
GOOGLE_SHEETS_TIMEOUT_SECONDS=60
LLM_MAX_RETRIES=3
DEBUG=false
```

At least one provider key must be configured. Keep `DEBUG=false` in production.

## Storage

Google Sheets + Apps Script stores users, sessions, schemas, generation configs, submission logs, and generated persona history. Redeploy the Apps Script Web App after changing `scripts/google_apps_script/Code.gs.txt`, and keep the deployed URL in `GOOGLE_SHEETS_SCRIPT_URL` current.

## Security & Privacy

- Never commit `.env`, provider keys, Apps Script secrets, or generated answer exports.
- Treat generated answers and personas as PII-like data.
- Avoid logging full submission payloads unless debugging locally.
- Sanitize client-facing errors; detailed exceptions should stay in server logs.
- Tighten CORS from `*` to explicit frontend origins.
- Consider authentication and per-user authorization before public exposure.

## Reliability

- Keep provider fallback enabled so generation can continue when one provider is unavailable.
- Monitor AI provider quota/rate-limit errors.
- Keep `LLM_MAX_RETRIES` modest because retries spend tokens.
- Use local similarity warnings and compact answer history rather than AI retries for duplicate answers.
- Persist per-form name and answer history through Google Sheets storage.
- Batch processing is reload-safe because each iteration is persisted, but Vercel-only processing requires the browser to stay open or revisit the progress URL. Use a durable queue if jobs must continue after the tab closes.

## Observability

Track at least:

- request count and latency for parse/generate/submit/batch endpoints
- provider selected per generation
- provider failures and fallback counts
- batch success/fail counts
- submit HTTP status codes
- unhandled backend errors

The SSE stream already exposes live phase and provider events to the UI; production logs should preserve equivalent server-side context without leaking full answers.

## Pre-launch Smoke Test

1. Start backend and frontend with production-like environment variables.
2. Parse a form you own.
3. Run review mode with `skip_submit` behavior.
4. Confirm personas match the form context and Indonesian name rules.
5. Confirm answer history avoids obvious repeated combinations for the same form URL.
6. Submit to a test form you control.
7. Export CSV, JSON, and Excel-compatible files.
8. Confirm no secrets, `.env`, Apps Script secrets, or generated logs are included in the published repository.
