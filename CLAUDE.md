# Vareva AutoGF — AI Assistant Guide

## Project Overview

Vareva AutoGF adalah aplikasi untuk mengisi Google Forms otomatis dengan AI-generated personas Indonesia yang realistis. Backend Python FastAPI + Frontend React TypeScript.

## Tech Stack

### Backend (`backend/`)
<<<<<<< HEAD
<<<<<<< HEAD
- **Framework**: FastAPI 0.136.1, SQLModel 0.0.38, Pydantic
- **Config**: Modular `app/config/` (split BaseSettings per domain) + legacy `app/config.py` shim
- **Schemas**: Custom `CustomModel` with datetime serialization
- **Database**: SQLite (gform.db) via SQLModel
- **HTTP Client**: httpx[http2] 0.28.1 untuk fetch Google Forms
- **AI SDK**: OpenAI SDK 2.37.0 (multi-provider support)
- **Python**: 3.12+
- **Port**: 8000
- **Test**: pytest + pytest-asyncio

### Frontend (`frontend/`)
- **Framework**: React 19.2 + Vite 8 + TypeScript 6
- **React 19 Features**: Actions (useTransition), ref as prop (no forwardRef)
- **Custom Hooks**: `useApiAction` with optimistic updates
- **Styling**: Tailwind CSS v4.3 with custom `@theme` design tokens
- **Design System**: Neobrutalism + Pixel Art aesthetic
- **UI Components**: shadcn/ui (brutalist-styled primitives) + Radix UI
- **Icons**: Lucide React + custom SVG pixel art (PixelDecor)
- **Fonts**: Press Start 2P (display), VT323 (mono), Space Grotesk (body)
- **Port**: 5173 (dev, Vite default), proxy ke localhost:8000
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
- **Framework**: FastAPI 0.115, SQLModel, Pydantic
- **Config**: Modular `app/config/` (split BaseSettings per domain)
- **Schemas**: Custom `CustomModel` with datetime serialization
- **Database**: SQLite (gform.db)
- **HTTP Client**: httpx[http2] untuk fetch Google Forms
- **AI SDK**: OpenAI SDK (multi-provider support)
- **Python**: 3.12+
- **Port**: 8000

### Frontend (`frontend/`)
- **Framework**: React 19 + Vite + TypeScript
- **React 19 Features**: Actions (useTransition), ref as prop (no forwardRef)
- **Custom Hooks**: `useApiAction` with optimistic updates
- **Styling**: Tailwind CSS v4 with custom `@theme` design tokens
- **Design System**: Neobrutalism + Pixel Art aesthetic
- **UI Components**: shadcn/ui (brutalist-styled primitives)
- **Icons**: Lucide React + custom SVG pixel art (PixelDecor)
- **Fonts**: Press Start 2P (display), VT323 (mono), Space Grotesk (body)
- **Port**: 5176 (dev), proxy ke localhost:8000
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
- **Animations**: GPU-accelerated (transform/opacity only), 240fps+ capable

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   React     │────▶│  FastAPI     │────▶│  Google Forms   │
│  Frontend   │     │   Backend    │     │  (Parse/Submit) │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   SQLite     │
                    │   (gform.db) │
                    └──────────────┘
```

## Frontend Design System (Neobrutalism + Pixel)

### Design Tokens (`index.css`)
- **Colors**: `--color-brutal-yellow`, `--color-brutal-pink`, `--color-brutal-lime`, `--color-brutal-blue`, `--color-brutal-violet`, `--color-brutal-red`
- **Typography**: `--font-display` (Press Start 2P), `--font-mono` (VT323), `--font-body` (Space Grotesk)
- **Borders**: `--border-brutal` (3px solid black), `--border-brutal-2` (2px), `--border-brutal-4` (4px)
- **Shadows**: `--shadow-brutal` (4px 4px 0 black), `--shadow-brutal-sm` (2px 2px)
- **Animations**: `--animate-fade-in`, `--animate-bob`, `--animate-pop`, `--animate-pixel-blink`, `--animate-glitch`

### UI Primitives (Brutalist Styled)
| Component | Key Features |
|-----------|--------------|
| `Button` | Hard shadows, press animation, uppercase bold, color variants |
| `Card` | Hard 3px borders, tone variants (yellow/pink/lime/blue), thick headers |
| `Input` | 3px border, monospace font, yellow focus shadow |
| `Textarea` | Consistent with input, vertical resize |
| `Badge` | Hard 2px border, uppercase bold, tonal colors |
| `Label` | Tiny uppercase tracked text |

### PixelDecor Components (`components/PixelDecor.tsx`)
<<<<<<< HEAD
<<<<<<< HEAD
Pure SVG pixel art icons (no external assets, 8x8 grid based):
=======
Pure SVG pixel art icons (no external assets):
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
Pure SVG pixel art icons (no external assets):
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
- `PixelRobot` — Animated mascot
- `PixelStar`, `PixelHeart`, `PixelCheck`, `PixelCross` — Status icons
- `PixelBolt`, `PixelSparkle`, `PixelCube`, `PixelArrow` — Decorations

### Step Components Layout
All step components use **12-column grid** with:
- **Mobile**: Single column, sticky bottom CTA
- **Desktop**: 8-col main + 4-col sidebar (info/stats/tips)

| Component | Layout Features |
|-----------|-----------------|
<<<<<<< HEAD
<<<<<<< HEAD
| `BatchSetupStep` | Form input cards, mode toggle pills, AI provider stack |
| `LoadingStep` | Pixel robot spinner, phase progress blocks, terminal log |
| `BatchResultStep` | Chunky stat blocks, expandable iteration cards, success/fail badges, CSV/JSON/Excel export |
| `ReviewSubmitStep` | Persona selector pills, editable answer cards, field counter, answer quality warnings |

### Unused Components (legacy, not imported in App.tsx)
- `ParseStep.tsx` — Standalone parse step (from earlier architecture)
- `GenerateStep.tsx` — Standalone generate step (from earlier architecture)
- `StepIndicator.tsx` — Classic step indicator
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
| `BatchSetupStep` | Hero intro, chunky cards, mode toggle pills, AI provider stack |
| `LoadingStep` | Pixel robot spinner, phase progress blocks, terminal log |
| `BatchResultStep` | Chunky stat blocks, expandable iteration cards, success/fail badges |
| `ReviewSubmitStep` | Persona selector pills, editable answer cards, field counter |
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95

### Animation Guidelines
- **Only GPU properties**: `transform`, `opacity`
- **No layout thrashing**: Avoid animating `width`, `height`, `margin`, `top/left`
- **Smooth 240fps+**: Use `translate3d()` for hardware acceleration
- **Static class names**: Tailwind v4 JIT requires static classes (no dynamic `className` interpolation)

## Multi-Provider AI Chain (Priority Order)

1. **Gemini** (gemini-2.5-flash-lite) — 1500 req/day
2. **Groq** (llama-3.3-70b-versatile) — fallback 1
<<<<<<< HEAD
<<<<<<< HEAD
3. **Cerebras** (llama-3.3-70b) — fallback 2
4. **OpenRouter** (poolside/laguna-xs.2:free) — fallback 3, with server-side model fallback via `extra_body.models`
=======
3. **Cerebras** (qwen-3-235b-a22b-instruct-2507) — fallback 2
4. **OpenRouter** (poolside/laguna-xs.2:free) — fallback 3
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
3. **Cerebras** (qwen-3-235b-a22b-instruct-2507) — fallback 2
4. **OpenRouter** (poolside/laguna-xs.2:free) — fallback 3
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
5. **Static fallback** — always last resort

## Key Backend Components

### 1. Parser (`app/core/parser.py`)
<<<<<<< HEAD
<<<<<<< HEAD
- Parse Google Form dari `FB_PUBLIC_LOAD_DATA_` JavaScript variable (regex + json.loads)
=======
- Parse Google Form dari `FB_PUBLIC_LOAD_DATA_` JavaScript variable
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
- Parse Google Form dari `FB_PUBLIC_LOAD_DATA_` JavaScript variable
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
- Extract: fields, options, page breaks, form metadata
- Detect "Other" option (flag=1 + empty string) → label "Yang lain:"
- Support multi-page forms (page breaks type 8)

### 2. Generator (`app/core/generator.py`)
<<<<<<< HEAD
<<<<<<< HEAD
- `AIProvider` dataclass + `_make_providers()` for provider chain
- Generate personas Indonesia realistis (nama, umur, gender, kota, pekerjaan, hobi)
- Build compact prompts dari FormSchema untuk menekan token usage tanpa menghapus fitur
- Compress persona text, form schema, and answer history before sending to AI
- Validate answers against form options
- Uses per-form answer history before generation to avoid repeating answer combinations
- Retries only for invalid JSON or invalid form answers, not for answer similarity
- Retry logic dengan fallback providers

### 2b. Quality Checker (`app/core/quality.py`)
- `closest_answer_similarity()` compares generated answers against prior answers for the same form
- Ignores identity fields like name/age/gender/occupation when computing answer uniqueness
- Handles exact options, checkbox overlap, and text similarity
- Similarity check is local-only and warning-level; it never triggers another AI call
- `validate_persona_quality()` flags non-whitelisted occupations, unrealistic ages, and gender-confusing names
- Persona quality issues are currently warning-level, not blocking/regenerating by default

=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
- Generate personas Indonesia realistis (nama, umur, gender, kota, pekerjaan, hobi)
- Build prompts dari FormSchema untuk AI
- Validate answers against form options
- Retry logic dengan fallback providers

<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
### 3. Submitter (`app/core/submitter.py`)
- Build payload x-www-form-urlencoded
- Handle "Other" option: convert "Yang lain:" → `__other_option__` + `.other_option_response`
- Multi-page submission dengan token tracking (fbzx, partial)
- Resolve short URLs (forms.gle → docs.google.com)

### 4. Indonesian Names (`app/data/indonesian_names.py`)
<<<<<<< HEAD
<<<<<<< HEAD
- Real name bank: 300+ male names, 300+ female names, 200+ neutral surnames
- Gender-matched name generation via `get_random_names()`
- Weighted toward common/natural Indonesian names, while regional names remain possible but rarer
- Supports `blocked_names` so the same form/link avoids reusing previously generated names
- Female names use a stricter feminine-safe last-name pool to avoid awkward pairings like `Fitri Irawan`
- Male names filter feminine-looking last-name parts so combinations like `Rizky Lestari` are avoided

## Database Schema (SQLite via SQLModel)

```sql
personas                — saved user persona profiles (name, description, tone, system_prompt)
sessions                — batch submission sessions (form_url, persona_id FK, status, counts)
form_schemas            — cached parsed form structures (session_id FK, schema_data JSON)
submission_logs         — submission attempt logs (session_id FK, iteration, answers JSON, status)
generated_persona_logs  — generated persona history per form_url for avoiding reused names/personas
```

Models defined in `app/models/` with exports from `__init__.py`:
- `Persona`, `FormSession`, `FormSchemaRecord`, `SubmissionLog`, `GeneratedPersonaLog`

=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
- Real name bank: 250+ male names, 200+ female names, 50+ surnames
- Gender-matched name generation

## Database Schema (SQLite)

```sql
personas — AI-generated persona profiles
sessions — batch submission sessions
form_schemas — cached parsed form structures
submission_logs — submission attempt logs
```

<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
<<<<<<< HEAD
<<<<<<< HEAD
| `/` | GET | Health check |
| `/api/parse/` | POST | Parse Google Form URL → schema |
| `/api/generate/` | POST | Generate personas + answers |
| `/api/submit/` | POST | Submit single form |
| `/api/batch/run` | POST | Parse + Generate + Submit pipeline; streams if `Accept: text/event-stream` |
| `/api/batch/run-stream` | POST | Dedicated Server-Sent Events endpoint for live batch logs |
| `/api/personas/` | POST/GET | Create / List personas |
| `/api/personas/{id}` | GET/PATCH/DELETE | CRUD persona |
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
| `/api/parse` | POST | Parse Google Form URL → schema |
| `/api/generate` | POST | Generate personas + answers |
| `/api/submit` | POST | Submit single form |
| `/api/batch/run` | POST | Parse + Generate + Submit pipeline |
| `/api/personas` | CRUD | Manage saved personas |
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95

## Special Handling: "Other" / "Yang lain" Option

Google Forms handle "Other" dengan format khusus:

**Parser detects:**
- Option dengan `flag=1` dan text kosong
- Label: "Yang lain:"

**AI generates:**
```json
{
  "entry.123": "Yang lain:",
  "entry.123.other_option_response": "Wiraswasta"
}
```

**Submitter converts:**
- `entry.123` = `__other_option__`
- `entry.123.other_option_response` = custom text

**Validation skips:**
- Keys ending with `.other_option_response`

<<<<<<< HEAD
<<<<<<< HEAD
## Quality & History Flow

For batch generation, backend now keeps quality/history context per `form_url`:

1. Parse form and infer target audience via `parse_form_with_analysis()`.
2. Load recent session IDs for the same `form_url`, then load previous answer sets from `submission_logs`.
3. Load previously used persona names from `generated_persona_logs` by `form_url`.
4. Generate personas with blocked names so repeated form/link avoids reused names.
5. Run persona quality checks; warnings are emitted to logs but do not block by default.
6. Generate answers with compact prior answer history in the prompt.
7. Run local-only answer similarity check after generation for warning/observability; never retry AI for similarity.
8. Append each new answer set to in-memory history so later personas in the same batch avoid earlier personas.
9. Persist generated persona logs and submission logs.

## Frontend Flow

App state machine in `App.tsx` (useState based):

1. **BatchSetupStep** → Input URL, jumlah persona, mode (langsung/review)
2. **LoadingStep** → Parse form → Generate personas/answers with scrollable live SSE logs/provider updates
3. **ReviewSubmitStep** (review mode) → Edit answers per persona, see quality warnings, animated submit progress → Submit
4. **BatchResultStep** (direct mode) → Show submit results, export CSV/JSON/Excel

```
setup → loading → review (if reviewMode) → submit from review
setup → loading → result (if autoMode)
```
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
## Frontend Flow

1. **BatchSetupStep** → Input URL, jumlah persona, mode (langsung/review)
2. **LoadingStep** → Parse form → Generate personas/answers
3. **ReviewSubmitStep** (review mode) → Edit answers per persona → Submit
4. **BatchResultStep** (direct mode) → Show submit results
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95

## Environment Variables

Create `backend/.env`:
```env
# AI Providers (at least one required)
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
CEREBRAS_API_KEY=your_key
OPENROUTER_API_KEY=your_key

# Optional
DATABASE_URL=sqlite:///gform.db
LLM_MAX_RETRIES=3
<<<<<<< HEAD
<<<<<<< HEAD
DEBUG=false
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
```

## Running Dev

<<<<<<< HEAD
<<<<<<< HEAD
### Recommended: one-command dev runner

```powershell
# From repo root
.\dev.ps1
```

This opens backend and frontend in separate PowerShell windows:
- Backend auto-reload: `http://127.0.0.1:8000`
- Frontend hot reload: `http://127.0.0.1:5173`

### Manual mode

```powershell
# Terminal 1 — Backend
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Vite uses strict port `5173`; if the port is already used, stop the old frontend process instead of letting Vite switch to `5174`.

=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
```bash
# Terminal 1 — Backend
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "__other_option__ not valid" | AI generate format lama | Prompt updated, use "Yang lain:" value |
| Blank submissions | page_count mismatch | Always pass correct page_count |
| 500 on forms.gle | Short URL not resolved | Resolve di submitter sebelum build URL |
| Gemini rate limit | Quota exceeded | Auto fallback ke Groq/Cerebras/OpenRouter |
<<<<<<< HEAD
<<<<<<< HEAD
| Loading stuck at initializing/generate | stale frontend/backend process or SSE route mismatch | Stop old dev servers, run `./dev.ps1`, use `/api/batch/run-stream` |
| AI provider log not showing | frontend hitting JSON endpoint or stale Vite port | Use strict port `5173` and dedicated SSE stream endpoint |
| Vite opens `5174` | `5173` already occupied by old frontend | Stop old process; config uses `strictPort` to expose this early |
| Duplicate initializing log | frontend and backend both emitted same initial message | Keep initial frontend logs empty; backend owns first SSE log |
| SQLModel Mypy false positives | SQLModel fields inferred as Python values instead of SQL expressions | Prefer `col()`, two-step queries, and SQLAlchemy `text()` ordering when needed |
| Auto Mode blocks shell command | Claude Code classifier/proxy issue, not project code | Run command manually or add broader local permission allow rules |
| `debug_ai.py` broken | Imports removed `_make_client` | Use `_make_providers()` instead |

## Testing

```powershell
# Run all backend tests from repo root
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests"

# Run quality/name focused tests
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests\test_quality.py" "backend\tests\test_indonesian_names.py"

# Test parse
curl -X POST http://127.0.0.1:8000/api/parse/ `
  -H "Content-Type: application/json" `
  -d '{"url": "https://docs.google.com/forms/d/e/.../viewform"}'

# Test generate
curl -X POST http://127.0.0.1:8000/api/generate/ `
  -H "Content-Type: application/json" `
  -d '{"form_url": "...", "count": 2}'
```

### Test Files
| File | Coverage |
|------|----------|
| `tests/test_e2e.py` | Health check + full parse→generate→submit cycle |
| `tests/test_indonesian_names.py` | Name bank size, dedup, gender, blocked names, feminine/masculine pairing guards, edge cases |
| `tests/test_quality.py` | Answer similarity checks + persona quality validation |
| `tests/test_openrouter_fallback.py` | Fallback model parsing, dedup, extra_body |

## Project Structure

```
v2/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry point + health check
│   │   ├── db.py                   # SQLite engine, SessionDep, create_db_and_tables
│   │   ├── config.py               # Legacy shim → re-exports AppConfig/get_settings
│   │   ├── config/
│   │   │   ├── __init__.py         # Exports: DatabaseConfig, AIProviderConfig, AppConfig, get_settings
│   │   │   ├── ai_providers.py     # AIProviderConfig: All AI provider API keys & models
│   │   │   ├── app.py              # AppConfig: App metadata + delegates to domain configs
│   │   │   └── database.py         # DatabaseConfig: DATABASE_URL
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── parser.py           # Google Form parsing (regex + json.loads)
│   │   │   ├── generator.py        # AI answer generation (AIProvider chain)
│   │   │   ├── quality.py          # Answer similarity + persona quality checks
│   │   │   └── submitter.py        # Form submission (single/multi-page)
│   │   ├── models/
│   │   │   ├── __init__.py         # Exports: Persona, FormSession, FormSchemaRecord, SubmissionLog, GeneratedPersonaLog
│   │   │   ├── persona.py          # Persona SQLModel table
│   │   │   ├── session.py          # FormSession SQLModel table
│   │   │   ├── form_schema.py      # FormSchemaRecord SQLModel table
│   │   │   ├── generated_persona_log.py # Per-form generated persona/name history
│   │   │   └── submission_log.py   # SubmissionLog SQLModel table
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── parse.py            # POST /api/parse/
│   │   │   ├── generate.py         # POST /api/generate/
│   │   │   ├── submit.py           # POST /api/submit/
│   │   │   ├── personas.py         # CRUD /api/personas/
│   │   │   └── batch.py            # POST /api/batch/run + /run-stream SSE
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # CustomModel, APIResponse
│   │   │   ├── form.py             # FormField, FormSchema, FormAnalysis, QuestionType
│   │   │   ├── answer.py           # Persona, AnswerMap, GenerateRequest/Response
│   │   │   ├── persona.py          # PersonaCreate/Update/Read
│   │   │   ├── submit.py           # SubmitRequest/Response
│   │   │   └── batch.py            # BatchRunRequest (count 1-50), IterationResult, BatchRunResponse
│   │   └── data/
│   │       ├── __init__.py
│   │       └── indonesian_names.py # Name bank (300+ male, 300+ female, 200+ neutral)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_e2e.py
│   │   ├── test_indonesian_names.py
│   │   ├── test_quality.py
│   │   └── test_openrouter_fallback.py
│   ├── requirements.txt
│   ├── pytest.ini                  # testpaths=tests, asyncio_mode=auto
│   ├── gform.db                    # SQLite database
│   ├── debug_ai.py                 # Debug script (⚠️ broken import)
│   ├── debug_multipage.py          # Debug script for multi-page forms
│   └── .env                        # Environment variables (not committed)
├── frontend/
│   ├── index.html                  # Font preloads, viewport meta, lang=id
│   ├── vite.config.ts              # Proxy /api → localhost:8000, @ alias
│   ├── package.json                # React 19, Vite 8, Tailwind 4
│   ├── eslint.config.js
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── main.tsx                # React DOM root
│   │   ├── App.tsx                 # Root app: state machine (setup→loading→review→result)
│   │   ├── App.css
│   │   ├── index.css               # Neobrutalism design system + animations
│   │   ├── components/
│   │   │   ├── PixelDecor.tsx      # SVG pixel art icons (8x8 grid)
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95

## Testing Commands

```bash
# Test parse
curl -X POST http://localhost:8000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.google.com/forms/d/e/.../viewform"}'

# Test generate
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"form_url": "...", "count": 2}'
```

## Project Structure

```
v1/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── parser.py           # Google Form parsing
│   │   │   ├── generator.py        # AI answer generation
│   │   │   ├── submitter.py        # Form submission
│   │   │   └── batch.py            # Batch orchestration
│   │   ├── api/
│   │   │   └── routes/             # FastAPI endpoints
│   │   ├── schemas/                # Pydantic models
│   │   └── data/
│   │       └── indonesian_names.py
│   └── .env                        # Environment variables
├── frontend/
│   ├── index.html                  # Font preloads, viewport meta
│   ├── src/
│   │   ├── index.css               # Neobrutalism design system + animations
│   │   ├── components/
│   │   │   ├── PixelDecor.tsx      # SVG pixel art icons
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
│   │   │   ├── BatchSetupStep.tsx  # Setup form (mobile/desktop layouts)
│   │   │   ├── LoadingStep.tsx     # Pixel robot loader + phases
│   │   │   ├── BatchResultStep.tsx # Chunky stats + iteration cards
│   │   │   ├── ReviewSubmitStep.tsx# Review + edit + submit
<<<<<<< HEAD
<<<<<<< HEAD
│   │   │   ├── ParseStep.tsx       # (⚠️ unused, legacy)
│   │   │   ├── GenerateStep.tsx    # (⚠️ unused, legacy)
│   │   │   ├── StepIndicator.tsx   # (⚠️ unused, legacy)
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
│   │   │   └── ui/                 # Brutalist-styled primitives
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── badge.tsx
│   │   │       └── label.tsx
<<<<<<< HEAD
<<<<<<< HEAD
│   │   ├── hooks/
│   │   │   ├── index.ts            # Re-exports hooks
│   │   │   └── useApiAction.ts     # useApiAction, useOptimisticValue, useBatchActions
│   │   ├── lib/
│   │   │   ├── api.ts              # API client + types + React 19 action wrappers + SSE client
│   │   │   ├── export.ts           # Batch result CSV/JSON/Excel download helpers
│   │   │   ├── reviewQuality.ts    # Review-page answer warning heuristics
│   │   │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   │   └── assets/
│   │       ├── hero.png
│   │       ├── react.svg
│   │       └── vite.svg
│   └── tsconfig*.json
├── CLAUDE.md                       # This file
├── PLAN.md                         # Completed implementation plan for quality/history/export improvements
├── README.md
├── dev.ps1                         # Starts backend reload + frontend hot reload
├── start_backend.ps1               # (⚠️ points to v1 path, needs update)
└── .gitignore
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
│   │   ├── App.tsx                 # Main app with header/footer
│   │   └── lib/api.ts              # API client
│   └── package.json
├── CLAUDE.md                       # This file
└── PLAN.md                         # Project roadmap
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
```

## Backend Architecture

### Modular Configuration (`app/config/`)
Following FastAPI best practices, configuration is split by domain:

```
app/config/
├── __init__.py        # Exports: DatabaseConfig, AIProviderConfig, AppConfig, get_settings
├── database.py        # DatabaseConfig: DATABASE_URL
├── ai_providers.py    # AIProviderConfig: All AI provider API keys & models
└── app.py             # AppConfig: App metadata + delegates to domain configs
```

<<<<<<< HEAD
<<<<<<< HEAD
**Note:** `app/config.py` (flat file) coexists as a legacy backward-compat shim that re-exports `AppConfig` as `Settings`.

=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
**Benefits:**
- Domain-specific settings isolated per module
- Easy to add new config domains
- Cached settings with `@lru_cache` for performance

### Custom Base Model (`app/schemas/base.py`)

All Pydantic schemas extend `CustomModel` which provides:
- Standardized datetime serialization (ISO 8601 with timezone)
- `serializable_dict()` method for JSON-safe output
- Configured with `populate_by_name=True` for flexible aliasing

```python
class PersonaRead(CustomModel):
    id: int
    name: str
    created_at: datetime  # Auto-serialized to "2024-01-15T10:30:00+0000"
```

<<<<<<< HEAD
<<<<<<< HEAD
### Database Layer (`app/db.py`)
- `get_engine()` — creates SQLite engine from settings
- `create_db_and_tables()` — auto-creates tables on app startup (lifespan)
- `SessionDep` — FastAPI `Annotated[Session, Depends(get_session)]` for route injection

=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
## Frontend React 19 Features

### Actions Pattern (`src/hooks/useApiAction.ts`)

React 19 async actions with `useTransition` for non-blocking UI:

```tsx
const { state, execute, isPending } = useApiAction(parseFormAction)

// Execute without blocking UI
startTransition(() => execute(url))
```

<<<<<<< HEAD
<<<<<<< HEAD
**Note:** Hooks are defined and exported, but `App.tsx` currently calls `api.*` directly rather than through hooks.

=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
### Custom Hooks

- `useApiAction<T>`: Async actions with pending/error states
- `useOptimisticValue<T>`: Optimistic UI updates with rollback
- `useBatchActions<T, Item>`: Batch operations with per-item tracking

### ref as Prop (No forwardRef)

React 19 allows passing refs directly as props:

```tsx
// Before (React 18)
const Button = forwardRef<HTMLButtonElement, Props>((props, ref) => ...)

// After (React 19)
function Button({ ref, ...props }: Props & { ref?: Ref<HTMLButtonElement> }) {
  return <button ref={ref} {...props} />
}
```

### SubmitButton with useFormStatus

Automatically reads parent form status (future React 19 enhancement):

```tsx
<form action={submitAction}>
  <SubmitButton>Submit</SubmitButton>  {/* Auto-disabled during submit */}
</form>
```

## Coding Guidelines

### Backend
- Type hints wajib, docstrings untuk public functions
- Error handling dengan context logging
<<<<<<< HEAD
<<<<<<< HEAD
- Keep persona/answer quality logic in `app/core/quality.py` so prompts and hard checks stay consistent
- Keep AI prompts compact: summarize schema/history/persona context instead of sending verbose repeated text
- For production token efficiency, do not retry AI only because answers are similar; use local similarity warnings instead
- For batch changes, preserve per-form history behavior: load by `form_url`, avoid blocked names, and append accepted answers to in-memory history during the same run
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95

### Frontend
- **Components**: Functional components, hooks for state
- **Tailwind v4**: Use `@theme` for custom tokens, static class names only (JIT limitation)
- **Design System**: 
  - Hard borders: `border-brutal`, `border-brutal-2`, `border-brutal-4`
  - Hard shadows: `shadow-brutal`, `shadow-brutal-sm`
  - GPU animations: `gpu` class + animation CSS variables
  - Color lookup objects for dynamic classes (e.g., `STACK_PROVIDERS`, `MODE_BG`)
- **Responsive**: Mobile-first, 12-col grid (`lg:grid-cols-12`), sticky CTA on mobile
- **Performance**: Only animate `transform`/`opacity`, use `gpu` class for hardware acceleration

### AI Prompts
- Specific, with examples, validation rules included

### Naming
- Indonesian context (persona, jawaban), code in English

## When Making Changes

1. **Parser changes** → Test dengan form multi-page + Other option
<<<<<<< HEAD
<<<<<<< HEAD
2. **Generator changes** → Validate output format, check fallback chain, compact prompt token usage, local similarity warnings, and persona quality warnings
3. **Submitter changes** → Test dengan short URL, multi-page, Other option
4. **Batch/SSE changes** → Test `/api/batch/run-stream`, provider events, anti-buffering headers, and per-form history persistence
5. **Frontend changes** → Check responsive (mobile + desktop), loading states, error UI, GPU animations
6. **Export/review changes** → Test CSV/JSON/Excel downloads and warning highlights in review mode
7. **Design system changes** → Verify static class names work with Tailwind JIT, test all color variants
=======
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
2. **Generator changes** → Validate output format, check fallback chain
3. **Submitter changes** → Test dengan short URL, multi-page, Other option
4. **Frontend changes** → Check responsive (mobile + desktop), loading states, error UI, GPU animations
5. **Design system changes** → Verify static class names work with Tailwind JIT, test all color variants
<<<<<<< HEAD
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95

## Security Notes

- API keys di `.env`, never commit
- Form URLs user-provided, always validate
- No PII logging (names, answers) kecuali debug level
- Rate limiting handled by providers, fallback protects
<<<<<<< HEAD
<<<<<<< HEAD
- CORS allow_origins=["*"] — tighten for production
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
=======
>>>>>>> 0eed56a69d541164b5ef83a6b3a412f1277eac95
