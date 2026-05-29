# Free Deployment Guide

This project can run frontend and backend together on Vercel with Google Sheets as durable storage:

```text
Frontend  -> Vercel static Vite build
Backend   -> Vercel Python serverless FastAPI function
Storage   -> Google Sheets Apps Script
Auth/data -> Google Sheets + JWT secret env vars
```

Batch generation is serverless-safe: the browser creates a saved session, then calls a bounded `/process` endpoint that handles one missing iteration per request. Reloading `/generate/{session_id}` reloads stored progress and resumes unfinished iterations. A free Vercel Cron fallback also checks unfinished sessions once per day and processes one missing iteration per session, so abandoned sessions can resume without the browser.

## 1. Prepare Google Sheets Apps Script

1. Copy `scripts/google_apps_script/Code.gs.txt` into the Apps Script editor.
2. Set `SHARED_SECRET` to the same value you will use for `GOOGLE_SHEETS_SHARED_SECRET`.
3. Run `setupSheets` once from Apps Script.
4. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` Web App URL.

Redeploy Apps Script every time `scripts/google_apps_script/Code.gs.txt` changes.

## 2. Deploy frontend + backend to Vercel

The repository includes:

- `vercel.json` for the Vite build, Python dependency install, API rewrite, and SPA fallback.
- `api/app.py` as the Vercel Python entrypoint that exposes the existing FastAPI app.

Import the GitHub repository in Vercel and set these environment variables:

```env
STORAGE_BACKEND=google_sheets
GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
GOOGLE_SHEETS_SHARED_SECRET=the-same-secret-as-apps-script
GOOGLE_SHEETS_TIMEOUT_SECONDS=60
AUTH_SECRET_KEY=change-this-to-a-long-random-secret
AUTH_TOKEN_EXPIRE_MINUTES=10080
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=poolside/laguna-xs.2:free
OPENROUTER_FALLBACK_MODELS=openrouter/free,google/gemma-3-27b-it:free,google/gemma-3-12b-it:free,meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-small-3.1-24b-instruct:free,qwen/qwen3-235b-a22b:free,deepseek/deepseek-chat-v3-0324:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash-lite
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.3-70b-versatile
CEREBRAS_API_KEY=your-cerebras-key
CEREBRAS_MODEL=qwen-3-235b-a22b-instruct-2507
CORS_ORIGINS=https://vareva-auto-gf.vercel.app
```

Do not set `VITE_API_BASE_URL` for the Vercel deployment unless you intentionally host the API elsewhere. The frontend uses same-origin `/api` in production.

After deploy, open:

- `/` for the frontend
- `/api/docs` for FastAPI docs
- `/api/batch/sessions/{session_id}` after creating a session

## Background fallback

`vercel.json` registers a daily cron route:

```text
GET /api/batch/cron/process
```

Vercel sends the cron request with an `Authorization` header. The backend accepts it when the bearer token matches `AUTH_SECRET_KEY`. Each cron run loads up to 3 running sessions from Google Sheets and processes at most one missing iteration per session.

On the free/Hobby setup this is a fallback, not instant background processing. The browser still processes active sessions quickly while the progress page is open. Cron only helps if the tab closes, sleeps, or gets throttled.

## Free-tier limitations and mitigations

### Vercel functions are short-lived

Serverless functions cannot keep daemon threads alive after the request returns.

Mitigations:

- Batch jobs are processed one iteration per `/api/batch/sessions/{session_id}/process` call.
- Progress is persisted in Google Sheets after each iteration.
- Reloading the progress URL resumes only missing iterations.

### Processing slows or pauses when the browser is closed

The free Vercel-only setup does not include a real-time durable queue.

Mitigations:

- Keep the `/generate/{session_id}` page open while processing for fast results.
- If the tab closes, reopen the same URL to continue from stored progress.
- Vercel Cron can resume unfinished sessions later, but the free schedule is intentionally slow.
- Keep batch counts modest.

### Google Sheets Apps Script can lock or timeout

The storage backend uses script locks to prevent concurrent writes.

Mitigations:

- Keep `GOOGLE_SHEETS_TIMEOUT_SECONDS=60`.
- Avoid many simultaneous users on the free setup.
- Retry after a short wait if Apps Script reports a lock timeout.

### Google Sheets is the required source of truth

All users, sessions, schemas, generation configs, and logs are stored through Apps Script. Redeploy the Web App whenever `scripts/google_apps_script/Code.gs.txt` changes.

## Smoke checklist

1. Open Vercel frontend.
2. Register/login.
3. Scan an authorized Google Form.
4. Run review mode with count 1.
5. Reload `/generate/{session_id}` and confirm progress reloads.
6. Edit one answer.
7. Submit all reviewed answers.
8. Confirm row appears in Google Sheets/Form response destination.
9. Run auto mode with count 1.
10. Confirm Google Sheets logs update after each processed iteration.
