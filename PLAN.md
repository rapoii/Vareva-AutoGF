# Plan: Remove SQLite/SQLModel and Use Google Sheets Only

## Context

User wants the project to stop supporting SQLite entirely and use Google Sheets + Apps Script as the only persistence layer. The current backend is mixed: `AppStorage` already has Google Sheets branches, but also contains SQLite fallbacks; `main.py` creates SQLModel tables at startup; several routes receive `SessionDep`; SQLModel model files and `sqlmodel` dependency remain; tests/docs still assume local SQLite is available. The intended outcome is a simpler Vercel-oriented backend where missing Google Sheets configuration fails fast instead of silently falling back to local SQLite.

## Implementation plan

1. Make Google Sheets mandatory
   - [x] Update `backend/app/config/storage.py` so storage is Google Sheets-only.
   - [x] Remove SQLite defaults such as `STORAGE_BACKEND=sqlite` and `DATABASE_URL` from examples/docs.
   - [x] Keep clear errors for missing `GOOGLE_SHEETS_SCRIPT_URL` or `GOOGLE_SHEETS_SHARED_SECRET`.

2. Remove DB startup and route DB dependencies
   - [x] Update `backend/app/main.py` to remove SQLModel table creation/lifespan.
   - [x] Update `backend/app/routes/parse.py`, `backend/app/routes/submit.py`, and `backend/app/routes/batch.py` to stop accepting `SessionDep`.
   - [x] Replace `AppStorage(db)` with `AppStorage()`.

3. Simplify `AppStorage`
   - [x] In `backend/app/core/storage/service.py`, remove all SQLite imports and fallback branches.
   - [x] Keep only existing Google Sheets actions for auth, sessions, schemas, generation configs, logs, review updates, history, and cron running-session lookup.
   - [x] Remove `_to_sqlite_id` and any SQLModel table usage.

4. Remove SQLModel-only code
   - [x] Delete or detach SQLModel table files under `backend/app/models/` once imports are gone.
   - [x] Remove `sqlmodel` from `backend/requirements.txt`.
   - [x] Remove `backend/app/db.py` and `backend/app/config/database.py` if no imports remain.

5. Remove Persona API from active app
   - [x] `backend/app/routes/personas.py` is SQLModel CRUD-only and not used by the current frontend flow.
   - [x] Unregister it from `backend/app/main.py` and remove associated SQLModel persona model/schema only if no references remain.
   - [x] Do not build a new Google Sheets persona profile feature unless requested later.

6. Update tests
   - [x] Remove SQLite setup such as `create_db_and_tables()` from tests.
   - [x] Update route tests to monkeypatch `GoogleSheetsClient.call_action` or `AppStorage` methods instead of relying on SQLite.
   - [x] Keep real Apps Script tests manual/opt-in only.

7. Update docs
   - [x] Update `README.md`, `docs/ENVIRONMENT.md`, `docs/DEVELOPMENT.md`, `docs/PRODUCTION.md`, `docs/ARCHITECTURE.md`, and `CLAUDE.md` to describe Google Sheets-only persistence.
   - [x] Keep `docs/GOOGLE_SHEETS_STORAGE.md` and `docs/DEPLOYMENT_FREE.md` as the primary storage/deploy setup path.

## Verification

- [x] Run focused backend tests after replacing SQLite-backed tests with mocks.
- [x] Run frontend lint/build if API types or docs examples affect frontend.
- [x] Manual smoke with Google Sheets env configured:
  - [x] register/login
  - [x] scan form
  - [x] create review session
  - [x] process iterations
  - [x] edit review answer
  - [x] submit reviewed answers
  - [x] delete history
  - [x] confirm Google Sheets rows update for submitted review session

## Smoke findings

- [x] Review generate/edit/submit path works against live Google Sheets.
- [x] Google Sheets session/log rows update after submit.
- [x] Delete history timeout/partial-delete bug investigated.
- [x] Apps Script delete optimized to delete matching rows in blocks instead of one row at a time.
- [x] Redeploy Apps Script and re-test delete history against live sheet.

## Risks and decisions

- Persona API will be removed from the active app rather than ported to Google Sheets because it is currently SQLModel-only and not used by the active frontend.
- Local development will require Google Sheets Apps Script env instead of local SQLite.
- Apps Script must be redeployed whenever storage actions change.
