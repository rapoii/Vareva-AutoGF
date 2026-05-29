# Vareva AutoGF

<p align="center">
  <strong>AI-powered Google Forms automation with realistic Indonesian personas, review mode, live provider logs, and exportable batch results.</strong>
</p>

<p align="center">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.136-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Google Sheets" src="https://img.shields.io/badge/Google%20Sheets-Apps%20Script-34A853?style=for-the-badge&logo=googlesheets&logoColor=white" />
</p>

---

## Overview

Vareva AutoGF is a full-stack tool for parsing public Google Forms, generating realistic Indonesian personas and answers with AI, then either submitting automatically through reload-safe saved processing or letting the user review, edit, and submit all generated answers manually.

It is designed around three goals:

- **Realistic Indonesian data** — gender-aware local names, natural occupations, cities, habits, and persona context.
- **Low-token AI generation** — compact prompts, per-form answer history, local validation, and local-only similarity warnings.
- **Operator-friendly workflow** — reload-safe progress pages, saved batch processing, provider fallback visibility, editable review UX, CSV/JSON/Excel export, and responsive neobrutalist UI.

> Use responsibly. Only submit to forms you own, administer, or are authorized to test.

## Key Features

### AI generation

- Multi-provider AI fallback chain: Gemini → Groq → Cerebras → OpenRouter → static fallback.
- Context-aware persona generation from parsed form topic and target audience.
- Compact prompts to reduce token usage without removing features.
- Form option validation and retry for invalid JSON/invalid answer options.
- Per-form answer history included before generation to reduce duplicate answer combinations.
- Local-only answer similarity warning after generation, with no extra AI call.

### Indonesian persona quality

- Large curated Indonesian name bank.
- Gender-matched name generation.
- Weighted common names for more natural output.
- Per-form blocked names to avoid reusing generated names on the same form/link.
- Guards against awkward gender/name pairings like `Fitri Irawan`, `Andi Ghina Lestari`, and `Rizky Lestari`.
- Occupation whitelist to avoid overly specific occupations like `Freelancer Digital Marketing`.

### Google Forms support

- Parse Google Forms from `FB_PUBLIC_LOAD_DATA_`.
- Extract fields, options, required flags, page breaks, and form metadata.
- Handle multi-page forms.
- Handle `Other` / `Yang lain:` option through Google Forms' special payload format.
- Resolve short `forms.gle` URLs before submission.

### Frontend UX

- Neobrutalism + pixel-art interface.
- Auto mode: generate and submit through saved, serverless-safe processing.
- Review mode: generate answers, inspect/edit stored answers, then submit all pending review iterations together.
- Reload-safe `/generate/{session_id}` progress page backed by stored session state.
- Scrollable system log and client-driven progress processing.
- Shared modal loading overlays for scan, auth, generate, submit, and history states.
- Account profile page, separate form history page, and per-form history deletion.
- Review warnings for suspicious answers.
- Batch result export to CSV, JSON, and Excel-compatible `.xls`.

## Screens / UX Highlights

- Setup screen with form URL, persona count, mode selection, and scan configuration.
- Reload-safe progress screen with system logs, session stats, saved iteration cards, and editable review details.
- Review mode submit flow with loading, success, and failure modals.
- Profile and History pages for account settings and stored form activity.
- Result screen with success rate, per-persona details, terminal log, and exports.

Add screenshots to a `docs/assets/` folder if you want GitHub visitors to see the UI immediately.

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | FastAPI, Pydantic Settings, Google Sheets Apps Script storage |
| AI SDK | OpenAI SDK with multiple OpenAI-compatible providers |
| HTTP | httpx with HTTP/2 |
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, shadcn-style primitives |
| Icons | Lucide React + custom SVG pixel art |
| Tests | pytest + pytest-asyncio |

## Quick Start

### 1. Clone

```powershell
git clone https://github.com/rapoii/Vareva-AutoGF.git
Set-Location Vareva-AutoGF
```

### 2. Backend setup

```powershell
Set-Location backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and add at least one provider key. The full template is in `backend/.env.example`:

```env
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=poolside/laguna-xs.2:free
OPENROUTER_FALLBACK_MODELS=openrouter/free,google/gemma-3-27b-it:free,google/gemma-3-12b-it:free,meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-small-3.1-24b-instruct:free,qwen/qwen3-235b-a22b:free,deepseek/deepseek-chat-v3-0324:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
GOOGLE_SHEETS_SCRIPT_URL=your-apps-script-web-app-url
GOOGLE_SHEETS_SHARED_SECRET=your-shared-secret
GOOGLE_SHEETS_TIMEOUT_SECONDS=15
AUTH_SECRET_KEY=change-this-secret-before-deploy
AUTH_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LLM_MAX_RETRIES=3

GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash-lite

GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile

CEREBRAS_API_KEY=your-cerebras-api-key-here
CEREBRAS_MODEL=qwen-3-235b-a22b-instruct-2507
```

For storage setup, follow [docs/GOOGLE_SHEETS_STORAGE.md](docs/GOOGLE_SHEETS_STORAGE.md). Google Sheets + Apps Script is the only supported persistence layer.

### 3. Frontend setup

```powershell
Set-Location ..\frontend
npm install
```

### 4. Run development server

From the repository root:

```powershell
.\dev.ps1
```

This opens:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`
- API docs: `http://127.0.0.1:8000/docs`

The backend dev server reloads on Python, `.env`, TOML, and JSON changes. The frontend runs with Vite hot reload on a fixed local port.

Manual mode:

```powershell
# Terminal 1
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

## How It Works

```mermaid
flowchart LR
  A[User enters Google Form URL] --> B[Backend parses form]
  B --> C[Infer form context and audience]
  C --> D[Load per-form answer/name history]
  D --> E[Generate personas with blocked names]
  E --> F[Generate answers with compact history prompt]
  F --> G[Validate JSON and form options]
  G --> H[Local similarity warning]
  H --> I{Mode}
  I -->|Review| J[Store pending review answers]
  I -->|Auto| K[Submit to Google Forms during saved process call]
  J --> M[User edits stored answers]
  M --> N[Submit all reviewed iterations]
  K --> L[Save logs and show/export results]
  N --> L
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/parse/` | Parse Google Form URL into schema |
| `POST` | `/api/generate/` | Generate personas and answers |
| `POST` | `/api/submit/` | Submit a single answer payload for an existing user-owned session |
| `POST` | `/api/batch/jobs` | Create reload-safe saved batch session |
| `GET` | `/api/batch/sessions/{session_id}` | Read stored batch progress/session results |
| `POST` | `/api/batch/sessions/{session_id}/process` | Process one missing batch iteration |
| `GET` | `/api/batch/cron/process` | Vercel Cron fallback to resume unfinished sessions |
| `PATCH` | `/api/batch/sessions/{session_id}/iterations/{iteration}/answers` | Persist review answer edits |
| `POST` | `/api/batch/sessions/{session_id}/submit-reviewed` | Submit all pending review iterations |
| `POST` | `/api/batch/run` | Legacy batch parse → generate → submit |
| `POST` | `/api/batch/run-stream` | Compatibility SSE monitor for batch jobs |
| `POST` | `/api/personas/` | Create persona profile |
| `GET` | `/api/personas/` | List persona profiles |
| `GET` | `/api/personas/{id}` | Read persona profile |
| `PATCH` | `/api/personas/{id}` | Update persona profile |
| `DELETE` | `/api/personas/{id}` | Delete persona profile |

See [docs/API.md](docs/API.md) for request examples and SSE events.

## Testing

Run all backend tests:

```powershell
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests"
```

Run focused batch and quality tests:

```powershell
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests\test_batch_jobs.py" "backend\tests\test_quality.py"
```

Frontend checks:

```powershell
Set-Location frontend
npm run lint
npm run build
```

## Project Structure

```text
v2/
├── api/                  # Vercel Python entrypoint
├── backend/
│   ├── app/
│   │   ├── core/          # parser, generator, submitter, quality checks
│   │   ├── data/          # Indonesian name bank
│   │   ├── routes/        # FastAPI routes
│   │   └── schemas/       # Pydantic schemas
│   ├── tests/             # pytest suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # step UI, pixel art, primitives
│   │   ├── hooks/         # React action helpers
│   │   └── lib/           # API client, export helpers, review quality
├── docs/                  # project documentation
├── CLAUDE.md              # AI assistant project guide
├── PLAN.md                # implementation plan/history
├── PRD.md                 # product requirements document
├── dev.ps1                # one-command dev runner
└── README.md
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Environment Variables](docs/ENVIRONMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Product Requirements](PRD.md)
- [Production Notes](docs/PRODUCTION.md)
- [Free Deployment Guide](docs/DEPLOYMENT_FREE.md)

## Production Notes

Before deploying:

- Set `CORS_ORIGINS` to the deployed frontend domain, for example `https://vareva-auto-gf.vercel.app`.
- Configure provider API keys through platform secrets.
- Do not log PII unless explicitly needed and protected.
- Keep Google Sheets Apps Script deployment current with [scripts/google_apps_script/Code.gs.txt](scripts/google_apps_script/Code.gs.txt).
- Auth is built in with bearer tokens and an in-memory failed-login cooldown; use a shared persistent rate limiter if running multiple backend instances.
- Add broader rate limiting and abuse protection around parse, generate, and submit endpoints.
- Review Google Forms usage policy and only automate authorized forms.

## Security & Privacy

- `.env`, local databases, and virtual environments are ignored by Git.
- Form URLs are user-provided and validated at backend boundaries.
- Names and answers may be PII-like data; avoid exposing logs publicly.
- This tool should be used for owned forms, internal QA, demos, or authorized testing.

## License

Add a license before publishing if you want others to use or contribute to the project.
