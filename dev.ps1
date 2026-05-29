$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $backend ".venv\Scripts\python.exe"))) {
  throw "Backend virtual environment not found at backend\.venv"
}

$backendReloadArgs = @(
  "--reload",
  "--reload-dir", "'$backend'",
  "--reload-include", "*.py",
  "--reload-include", ".env",
  "--reload-include", ".env.*",
  "--reload-include", "*.toml",
  "--reload-include", "*.json"
) -join " "

$backendCmd = "Set-Location '$backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app $backendReloadArgs --host 127.0.0.1 --port 8000"
$frontendCmd = "Set-Location '$frontend'; npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

$backendProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru
$frontendProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendCmd -PassThru

Write-Host "Backend auto-reload:  http://127.0.0.1:8000"
Write-Host "Frontend hot reload:  http://127.0.0.1:5173"
Write-Host "Started processes: backend=$($backendProcess.Id), frontend=$($frontendProcess.Id)"
