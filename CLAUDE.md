# Vareva AutoGF — AI Assistant Guide

## Project Overview

Vareva AutoGF adalah aplikasi untuk mengisi Google Forms otomatis dengan AI-generated personas Indonesia yang realistis. Backend Python FastAPI + Frontend React TypeScript.

## Tech Stack

### Backend (`backend/`)
- **Framework**: FastAPI, SQLModel, Pydantic
- **Config**: Modular `app/config/` split by domain + legacy `app/config.py` shim
- **Schemas**: Custom `CustomModel` with datetime serialization
- **Database**: SQLite (`gform.db`) via SQLModel
- **HTTP Client**: `httpx[http2]` untuk fetch Google Forms
- **AI SDK**: OpenAI SDK with multiple OpenAI-compatible providers
- **Python**: 3.12+
- **Port**: 8000
- **Tests**: pytest + pytest-asyncio

### Frontend (`frontend/`)
- **Framework**: React 19 + Vite + TypeScript
- **React 19 Features**: Actions (`useTransition`), ref as prop, no `forwardRef` by default
- **Custom Hooks**: `useApiAction` with optimistic updates
- **Styling**: Tailwind CSS v4 with custom `@theme` design tokens
- **Design System**: Neobrutalism + Pixel Art aesthetic
- **UI Components**: shadcn-style primitives + Radix UI
- **Icons**: Lucide React + custom SVG pixel art (`PixelDecor`)
- **Fonts**: Press Start 2P, VT323, Space Grotesk
- **Port**: 5173 strict dev port, proxy to backend 8000
- **Animations**: GPU-friendly (`transform` and `opacity` only)

## Architecture

```text
React Frontend -> FastAPI Backend -> Google Forms
                         |
                         v
                    SQLite / SQLModel
```

## Frontend Design System

### Design Tokens (`frontend/src/index.css`)
- Colors: `--color-brutal-yellow`, `--color-brutal-pink`, `--color-brutal-lime`, `--color-brutal-blue`, `--color-brutal-violet`, `--color-brutal-red`
- Typography: `--font-display`, `--font-mono`, `--font-body`
- Borders: `--border-brutal`, `--border-brutal-2`, `--border-brutal-4`
- Shadows: `--shadow-brutal`, `--shadow-brutal-sm`
- Animations: `--animate-fade-in`, `--animate-bob`, `--animate-pop`, `--animate-pixel-blink`, `--animate-glitch`, `--animate-spin-step`, `--animate-slide-right`

### UI Primitives
| Component | Key Features |
|---|---|
| `Button` | Hard shadows, press animation, uppercase bold, color variants |
| `Card` | Hard borders, tone variants, thick headers |
| `Input` | Brutalist border, monospace font, strong focus style |
| `Textarea` | Consistent with input, vertical resize |
| `Badge` | Hard border, uppercase bold, tonal colors |
| `Label` | Tiny uppercase tracked text |

### Step Components
| Component | Role |
|---|---|
| `BatchSetupStep` | URL/count/mode input |
| `LoadingStep` | Pixel robot spinner, phase blocks, scrollable terminal log, provider badge |
| `ReviewSubmitStep` | Editable per-persona answers, warnings, animated submit progress |
| `BatchResultStep` | Result stats, iteration details, CSV/JSON/Excel export |

Unused legacy components may exist from earlier architecture (`ParseStep`, `GenerateStep`, `StepIndicator`). Do not revive them unless explicitly needed.

## Multi-Provider AI Chain

Priority order:

1. Gemini
2. Groq
3. Cerebras
4. OpenRouter
5. Static fallback

Use provider fallback visibility in logs/SSE. Do not log API keys.

## Key Backend Components

### Parser (`backend/app/core/parser.py`)
- Parses Google Forms from `FB_PUBLIC_LOAD_DATA_`.
- Extracts fields, options, required flags, page breaks, and metadata.
- Detects `Other` / `Yang lain:` options.
- Supports multi-page forms.
- Infers form context and target audience for persona generation.

### Generator (`backend/app/core/generator.py`)
- Uses `AIProvider` chain and `_make_providers()`.
- Generates realistic Indonesian personas.
- Assigns backend-controlled Indonesian names before persona prompting.
- Builds compact prompts from persona, form schema, and answer history.
- Validates answers against form options.
- Retries only for invalid JSON or invalid form answers.
- Do not retry AI solely because answers are similar; use local similarity warnings instead.

### Quality Checker (`backend/app/core/quality.py`)
- `closest_answer_similarity()` compares generated answers against per-form history.
- Ignores identity fields like name, age, gender, and occupation when computing uniqueness.
- Handles exact options, checkbox overlap, and text similarity.
- Similarity check is local-only and warning-level.
- `validate_persona_quality()` flags non-whitelisted occupations, unrealistic ages, and gender/name warnings.

### Submitter (`backend/app/core/submitter.py`)
- Builds Google Forms `x-www-form-urlencoded` payloads.
- Handles `Yang lain:` by converting to `__other_option__` + `.other_option_response`.
- Supports single-page and multi-page forms.
- Resolves short links like `forms.gle` before submission.

### Indonesian Names (`backend/app/data/indonesian_names.py`)
- Gender-matched Indonesian name generation via `get_random_names()`.
- Weighted toward common/natural Indonesian names while keeping variety.
- Supports `blocked_names` to avoid reusing names for the same form/link.
- Guards against awkward gender/name pairings such as `Fitri Irawan`, `Andi Ghina Lestari`, and `Rizky Lestari`.

## Database Schema

```sql
personas                — saved custom persona profiles
sessions                — batch submission sessions
form_schemas            — cached parsed form schema per session
submission_logs         — answers and submit status per iteration
generated_persona_logs  — generated persona/name history per form_url
```

Models are in `backend/app/models/` and exported from `backend/app/models/__init__.py`.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health check |
| `/api/parse/` | POST | Parse Google Form URL into schema |
| `/api/generate/` | POST | Generate personas and answers |
| `/api/submit/` | POST | Submit single form payload |
| `/api/batch/run` | POST | Batch parse → generate → submit JSON pipeline |
| `/api/batch/run-stream` | POST | Dedicated SSE pipeline for live logs |
| `/api/personas/` | POST/GET | Create/list personas |
| `/api/personas/{id}` | GET/PATCH/DELETE | Persona CRUD |

## Special Handling: Other / Yang lain

Google Forms handle Other options with a special payload:

```json
{
  "entry.123": "Yang lain:",
  "entry.123.other_option_response": "Wiraswasta"
}
```

Submitter converts:
- `entry.123` -> `__other_option__`
- `entry.123.other_option_response` -> custom text

Validation skips keys ending with `.other_option_response`.

## Quality & History Flow

For batch generation, backend keeps history per `form_url`:

1. Parse form and infer context via `parse_form_with_analysis()`.
2. Load recent sessions for the same `form_url`.
3. Load previous answer sets from `submission_logs`.
4. Load previously used persona names from `generated_persona_logs`.
5. Generate personas with blocked names.
6. Run persona quality checks and emit warnings only.
7. Generate answers with compact prior answer history in the prompt.
8. Run local-only answer similarity check after generation for observability.
9. Append new answers to in-memory history so later personas in the same batch avoid earlier answers.
10. Persist generated persona logs and submission logs.

## Frontend Flow

State machine in `frontend/src/App.tsx`:

```text
setup -> loading -> review -> result
setup -> loading -> result
```

Review mode lets users edit generated answers before submitting. Auto mode submits directly.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
CEREBRAS_API_KEY=your_key
OPENROUTER_API_KEY=your_key
DATABASE_URL=sqlite:///gform.db
LLM_MAX_RETRIES=3
DEBUG=false
```

At least one provider key is required.

## Running Dev

Recommended:

```powershell
.\dev.ps1
```

Manual backend:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Manual frontend:

```powershell
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Vite uses strict port 5173. If it tries 5174, stop the old frontend process instead of changing ports.

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `__other_option__ not valid` | Old AI answer format | Use `Yang lain:` and let submitter convert |
| Blank submissions | page count/token mismatch | Preserve `page_count` and multi-page tokens |
| 500 on `forms.gle` | Short URL not resolved | Resolve in submitter before building payload |
| Gemini rate limit | Provider quota exceeded | Fallback chain should continue |
| Loading stuck | stale backend/frontend or route mismatch | Restart via `dev.ps1` and use `/api/batch/run-stream` |
| Provider log missing | frontend hitting JSON endpoint | Use dedicated SSE stream endpoint |
| Vite opens 5174 | old server uses 5173 | Stop old frontend process |
| SQLModel Mypy false positives | SQLModel fields inferred as Python values | Prefer `col()`, two-step queries, or `sqlalchemy.text()` for simple ordering |
| Auto Mode blocks shell command | Claude Code permission/classifier issue | Run manually or adjust local permissions |

## Testing

```powershell
# Run all backend tests
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests"

# Focused tests
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests\test_quality.py" "backend\tests\test_indonesian_names.py"

# Compile changed Python files
& "backend\.venv\Scripts\python.exe" -m py_compile "backend\app\core\generator.py" "backend\app\routes\batch.py" "backend\app\data\indonesian_names.py"
```

Frontend:

```powershell
Set-Location frontend
npm run build
npm run lint
```

## Coding Guidelines

### Backend
- Type hints are required.
- Keep persona/answer quality logic in `backend/app/core/quality.py`.
- Keep prompts compact: summarize schema/history/persona context instead of sending verbose repeated text.
- Preserve per-form history behavior: load by `form_url`, avoid blocked names, and append accepted answers to in-memory history during the same run.
- Do not add AI retries for similarity; use local similarity warnings to save tokens.
- Validate external inputs at route/schema boundaries.
- Never log API keys or raw PII unless explicitly needed and protected.

### Frontend
- Use functional components and hooks.
- Tailwind v4 class names must be static; avoid dynamic class interpolation.
- Prefer canonical Tailwind v4 arbitrary syntax, e.g. `bg-(--color-bg)` and `text-ink-soft`.
- Keep responsive layout mobile-first with 12-column desktop grids.
- Only animate `transform` and `opacity` where possible.
- For UI changes, test in the browser before calling the work complete.

### AI Prompts
- Be specific, compact, and include validation rules.
- Code identifiers in English; generated content can use Indonesian context.

## When Making Changes

1. Parser changes: test multi-page forms and Other option.
2. Generator changes: validate output format, fallback chain, compact prompt token usage, local similarity warnings, and persona quality warnings.
3. Submitter changes: test short URLs, multi-page forms, and Other option.
4. Batch/SSE changes: test `/api/batch/run-stream`, provider events, anti-buffering headers, and per-form history persistence.
5. Frontend changes: check responsive behavior, loading states, error UI, and GPU animations.
6. Export/review changes: test CSV/JSON/Excel downloads and warning highlights.
7. Design system changes: verify static Tailwind classes work.

## Security Notes

- API keys live in `.env`, never commit real secrets.
- Form URLs are user-provided and must be validated.
- Avoid public logs containing PII-like generated names/answers.
- Tighten CORS before production.
- Use this app only for owned forms, internal QA, demos, or authorized testing.
