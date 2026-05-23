# Development Guide

## Requirements

- Windows 11 or equivalent development environment
- Python 3.12+
- Node.js 22+
- npm
- At least one supported AI provider API key

## One-command Development

From repository root:

```powershell
.\dev.ps1
```

This opens backend and frontend in separate PowerShell windows:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

The frontend uses strict port `5173`. If the port is already occupied, stop the old frontend process instead of letting Vite switch to another port.

## Manual Development

Backend:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

## Backend Tests

Run all tests:

```powershell
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests"
```

Run focused tests:

```powershell
& "backend\.venv\Scripts\python.exe" -m pytest "backend\tests\test_quality.py" "backend\tests\test_indonesian_names.py"
```

Compile changed Python files:

```powershell
& "backend\.venv\Scripts\python.exe" -m py_compile "backend\app\core\generator.py" "backend\app\routes\batch.py" "backend\app\data\indonesian_names.py"
```

## Frontend Checks

```powershell
Set-Location frontend
npm run build
npm run lint
```

## Common Development Issues

### Vite opens port 5174

Cause: old Vite server still uses `5173`.

Fix: stop the old terminal/process and restart `dev.ps1`.

### Loading stuck at initializing

Likely causes:

- stale backend/frontend instance
- frontend is not using `/api/batch/run-stream`
- backend route mismatch

Fix:

- stop old terminals
- restart via `dev.ps1`
- verify frontend is at `127.0.0.1:5173`
- verify backend is at `127.0.0.1:8000`

### Provider logs do not appear

The frontend must call the SSE endpoint and backend must emit provider events. Use `/api/batch/run-stream` for live logs.

### SQLModel Mypy false positives

SQLModel fields can be inferred as plain Python types. Prefer:

- `col(Model.field)` for SQL expressions
- two-step queries instead of complex joins if needed
- `sqlalchemy.text()` for simple order clauses when Mypy misreads `.desc()`

### Claude Code Auto Mode blocks shell commands

This is a Claude Code permission/classifier issue, not a project issue. Run the command manually or adjust local permissions.

## Coding Guidelines

- Keep prompt changes compact and measurable.
- Do not add AI retries for similarity; use local similarity warning instead.
- Keep name/persona quality checks in backend, not only in prompts.
- Use static Tailwind classes where possible.
- Use GPU-friendly animations: `transform` and `opacity`.
