# Environment Variables

Create `backend/.env` from `backend/.env.example` if available, or create it manually.

## AI Provider Keys

At least one provider key is required.

```env
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
CEREBRAS_API_KEY=your_key
OPENROUTER_API_KEY=your_key
```

Provider priority order:

1. Gemini
2. Groq
3. Cerebras
4. OpenRouter
5. Static fallback

## Optional Model Settings

Names may vary depending on your config defaults.

```env
GEMINI_MODEL=gemini-2.5-flash-lite
GROQ_MODEL=llama-3.3-70b-versatile
CEREBRAS_MODEL=llama-3.3-70b
OPENROUTER_MODEL=poolside/laguna-xs.2:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_FALLBACK_MODELS=openrouter/free,google/gemma-3-27b-it:free,google/gemma-3-12b-it:free,meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-small-3.1-24b-instruct:free,qwen/qwen3-235b-a22b:free,deepseek/deepseek-chat-v3-0324:free
```

## Storage

Default local SQLite storage:

```env
DATABASE_URL=sqlite:///gform.db
STORAGE_BACKEND=sqlite
```

Google Sheets + Apps Script storage:

```env
STORAGE_BACKEND=google_sheets
GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
GOOGLE_SHEETS_SHARED_SECRET=secret-yang-sama-dengan-apps-script
GOOGLE_SHEETS_TIMEOUT_SECONDS=15
```

See [GOOGLE_SHEETS_STORAGE.md](GOOGLE_SHEETS_STORAGE.md) for the spreadsheet tabs, Apps Script setup, deployment steps, and manual profile/history checks.

## Auth

```env
AUTH_SECRET_KEY=secret-jwt-random-panjang
AUTH_TOKEN_EXPIRE_MINUTES=10080
```

`AUTH_SECRET_KEY` signs frontend bearer tokens. Keep it secret and rotate it if exposed.

## Runtime Settings

```env
LLM_MAX_RETRIES=3
DEBUG=false
```

`LLM_MAX_RETRIES` controls retries for invalid JSON or invalid form answers. The app does not retry AI calls solely because answers are similar; similarity is checked locally as a warning to save tokens.

## Security Notes

- Never commit `.env`.
- Rotate keys if they are accidentally exposed.
- Use platform secrets for deployment.
- Keep local `gform.db` out of Git because it can contain generated answers and submission logs.
