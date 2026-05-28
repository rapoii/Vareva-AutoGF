# Free Deployment Guide

This project can run on a mostly-free stack:

```text
Frontend  -> Vercel
Backend   -> Render Web Service
Storage   -> Google Sheets Apps Script
Auth/data -> Google Sheets + JWT secret env vars
```

## 1. Prepare Google Sheets Apps Script

1. Copy `scripts/google_apps_script/Code.gs.txt` into the Apps Script editor.
2. Set `SHARED_SECRET` to the same value you will use for `GOOGLE_SHEETS_SHARED_SECRET`.
3. Run `setupSheets` once from Apps Script.
4. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` Web App URL.

Redeploy Apps Script every time `scripts/google_apps_script/Code.gs.txt` changes.

## 2. Deploy backend to Render

The repository includes `render.yaml` for a Render Blueprint.

Required secret env vars to fill in Render:

```env
AUTH_SECRET_KEY=change-this-to-a-long-random-secret
GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
GOOGLE_SHEETS_SHARED_SECRET=the-same-secret-as-apps-script
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
CEREBRAS_API_KEY=your-cerebras-key
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
```

Render settings from `render.yaml`:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/`
- Plan: `free`

After deploy, open the backend URL and confirm it returns:

```json
{"status":"ok"}
```

## 3. Deploy frontend to Vercel

The repository includes `vercel.json` for the Vite frontend.

Set this Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Then import the GitHub repository in Vercel and deploy.

## Free-tier limitations and mitigations

### Render free services can sleep

First request after idle can be slow.

Mitigations:

- The frontend shows loading overlays while requests are running.
- Keep backend health check path `/` working.
- For important demos, open the backend health URL once before using the app.

### In-process background jobs are not durable

The current background job survives browser reloads, but not backend restarts/sleeps/deploys.

Mitigations:

- Keep batch counts modest on the free tier.
- Avoid redeploying while a batch is running.
- Use review mode for safer manual control.
- For production-grade durability, move jobs to Redis/Celery/RQ or another durable queue.

### Google Sheets Apps Script can lock or timeout

The storage backend uses script locks to prevent concurrent writes.

Mitigations:

- Keep `GOOGLE_SHEETS_TIMEOUT_SECONDS=60`.
- Avoid many simultaneous users on the free setup.
- Retry after a short wait if Apps Script reports a lock timeout.

### SQLite should not be the production source of truth on free hosting

Render free filesystem can be ephemeral. Use Google Sheets storage for this free setup.

Mitigation:

```env
STORAGE_BACKEND=google_sheets
```

## Smoke checklist

1. Open backend health URL.
2. Open Vercel frontend.
3. Register/login.
4. Scan an authorized Google Form.
5. Run review mode with count 1.
6. Edit one answer.
7. Submit all reviewed answers.
8. Confirm row appears in Google Sheets/Form response destination.
9. Run auto mode with count 1.
10. Confirm `/generate/{session_id}` reload does not restart generation.
