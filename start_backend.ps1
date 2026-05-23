Set-Location -Path "C:\Users\rafi\Documents\Coding\gform-tool\v1\backend"
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
