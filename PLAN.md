# Plan - Vareva AutoGF (Backend-First)

Membangun backend core Vareva AutoGF (FastAPI + Python) yang bisa parse Google Form, generate jawaban via LLM, dan submit otomatis — lengkap dengan integration test dan Swagger UI sebelum frontend React dikerjakan.

> Task type: `greenfield` · Size: `l` · Pendekatan: **backend-first**, frontend menyusul di Phase 3+

---

## 1. Goal

Backend FastAPI berjalan lokal, tiga endpoint utama (`/parse`, `/generate`, `/submit`) fungsional, satu integration test end-to-end (parse → generate → submit) lulus dengan HTTP 200 dari Google, dan Swagger UI (`/docs`) bisa dipakai untuk manual trigger.

---

## 2. Constraints & Inputs

- **Stack (fixed):** Python 3.11+, FastAPI, SQLite (via SQLAlchemy), BeautifulSoup4, Requests, Pydantic v2, OpenAI SDK
- **LLM Provider:** OpenAI (GPT-4o / GPT-4o-mini) untuk v1; arsitektur abstrak agar mudah tambah Gemini/Anthropic
- **Anti-bot:** random delay 2–10 s, rotasi User-Agent
- **Auth:** tidak wajib untuk v1 (self-hosted single-user)
- **Out of scope phase ini:** React frontend, form login Google, file upload, scheduling/cron

---

## 3. Definition of Done (Phase 1 & 2)

- [ ] Repo terstruktur, `requirements.txt` / `pyproject.toml` lengkap
- [ ] `uvicorn` jalan di `localhost:8000`, Swagger UI accessible di `/docs`
- [ ] `POST /parse` mengembalikan form schema JSON dari URL Google Form publik
- [ ] `POST /generate` mengembalikan jawaban JSON tervalidasi (key = `entry.XXXXXX`)
- [ ] `POST /submit` mengirim POST ke Google Form dan mengembalikan status
- [ ] Satu pytest integration test `test_e2e.py` lulus: parse → generate → submit → HTTP 200
- [ ] SQLite ter-init dengan 4 tabel (personas, sessions, form_schemas, submission_logs)
- [ ] `README.md` menjelaskan cara setup dan run

---

## 4. Approach

**Walking-skeleton first** — buat endpoint stub yang konek ujung-ke-ujung dulu, baru isi logika tiap modul satu per satu. Pisahkan tiga core module (`parser`, `generator`, `submitter`) dari layer FastAPI routing agar mudah di-test dan di-swap.

```
gform-tool/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── routes/            # router per domain
│   │   │   ├── parse.py
│   │   │   ├── generate.py
│   │   │   └── submit.py
│   │   ├── core/              # business logic (pure functions, no FastAPI dep)
│   │   │   ├── parser.py      # BeautifulSoup extractor
│   │   │   ├── generator.py   # LLM prompt builder + caller
│   │   │   └── submitter.py   # HTTP POST ke Google Form
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── db.py              # DB init + session factory
│   │   └── config.py          # env vars (API key, dll)
│   ├── tests/
│   │   └── test_e2e.py
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## 5. Phases

### Phase 0 — Scaffolding (aktif)
Setup repo, dependensi, DB, dan server bisa jalan.

### Phase 1 — Core Modules Backend
Implementasi parser, generator, submitter sebagai pure Python modules.

### Phase 2 — API Layer + Integration Test
Sambungkan core modules ke FastAPI routes; tulis test e2e.

### Phase 3 — Frontend React *(re-plan saat masuk phase ini)*
UI minimal: input URL + persona, preview jawaban, trigger submit, lihat log.

### Phase 4 — Harden
Error handling lengkap, batch mode, persona manager, retry logic, anti-bot headers.

---

## 6. Steps (Phase 0 + 1 + 2 — saat ini aktif)

### Phase 0 - Scaffolding

- [ ] **0.1. Init repo structure dan virtual environment**
  - Intent: fondasi project yang bersih sebelum kode apapun ditulis
  - Touchpoints: `backend/`, `requirements.txt`, `.env.example`, `.gitignore`
  - Verification: `uvicorn app.main:app --reload` jalan tanpa error, `/` atau `/docs` accessible

- [ ] **0.2. Setup SQLite + SQLAlchemy + migrasi tabel awal**
  - Intent: DB ter-init otomatis saat startup dengan 4 tabel sesuai PRD schema
  - Touchpoints: `app/db.py`, `app/models/`, `app/main.py` (startup event)
  - Verification: file `gform.db` terbentuk, 4 tabel ada saat dicek via SQLite browser atau `sqlite3` CLI

- [ ] **0.3. Setup config management (env vars)**
  - Intent: API key dan config sensitif tidak hardcoded
  - Touchpoints: `app/config.py`, `.env.example`
  - Verification: `OPENAI_API_KEY` terbaca via `pydantic-settings` atau `python-dotenv`

### Phase 1 - Core Modules

- [ ] **1.1. Implementasi Form Parser (`core/parser.py`)**
  - Intent: ekstrak semua pertanyaan + `entry.XXXXXX` ID dari HTML Google Form publik
  - Touchpoints: `app/core/parser.py`, `BeautifulSoup4`, `requests`
  - Detail: parse `FB_PUBLIC_LOAD_DATA_` JSON yang di-embed di `<script>` tag Google Form (lebih reliable dari HTML scraping murni)
  - Verification: jalankan `parser.parse_form(url)` di Python REPL dengan URL form publik → kembalikan list pertanyaan dengan `entry_id`, `question_text`, `question_type`, `options`
  - Depends on: 0.1

- [ ] **1.2. Definisikan Pydantic schemas untuk form schema dan answers**
  - Intent: kontrak data yang ketat antar modul; validasi output LLM
  - Touchpoints: `app/schemas/form.py`, `app/schemas/answer.py`
  - Detail: `FormField` (entry_id, question_text, type, options), `FormSchema` (fields list), `AnswerMap` (dict `entry.XXXXXX` → value)
  - Verification: Pydantic model dapat di-instantiate dan divalidasi tanpa error

- [ ] **1.3. Implementasi AI Generator (`core/generator.py`)**
  - Intent: susun prompt dari form schema + persona → panggil OpenAI → parse + validasi JSON output
  - Touchpoints: `app/core/generator.py`, `openai` SDK, Pydantic `AnswerMap`
  - Detail: gunakan `response_format={"type": "json_object"}` atau structured output; validasi setiap jawaban MC/dropdown adalah exact match salah satu opsi; retry loop max 3x
  - Verification: `generator.generate_answers(form_schema, persona_text)` mengembalikan `AnswerMap` yang valid (semua key valid `entry.XXXXXX`, nilai MC match opsi)
  - Depends on: 1.2

- [ ] **1.4. Implementasi Form Submitter (`core/submitter.py`)**
  - Intent: kirim payload ke `formResponse` endpoint Google Form via HTTP POST
  - Touchpoints: `app/core/submitter.py`, `requests`
  - Detail: POST ke `https://docs.google.com/forms/d/{form_id}/formResponse`, sertakan `User-Agent` header, handle redirect (Google biasanya 200 redirect ke confirmation page)
  - Verification: `submitter.submit(form_url, answer_map)` mengembalikan `{"status": "success", "http_code": 200}` saat dites ke form dummy
  - Depends on: 1.2

### Phase 2 - API Layer + Integration Test

- [ ] **2.1. Implementasi route `POST /api/parse`**
  - Intent: expose parser sebagai API endpoint
  - Touchpoints: `app/routes/parse.py`, `app/core/parser.py`, `app/models/` (simpan ke `form_schemas`)
  - Verification: `curl -X POST /api/parse -d '{"url": "..."}' ` mengembalikan form schema JSON; terlihat di Swagger UI
  - Depends on: 1.1

- [ ] **2.2. Implementasi route `POST /api/generate`**
  - Intent: expose generator sebagai API endpoint
  - Touchpoints: `app/routes/generate.py`, `app/core/generator.py`
  - Verification: `POST /api/generate` dengan `form_schema` + `persona` mengembalikan `AnswerMap` JSON
  - Depends on: 1.3

- [ ] **2.3. Implementasi route `POST /api/submit`**
  - Intent: expose submitter sebagai API endpoint; catat log ke DB
  - Touchpoints: `app/routes/submit.py`, `app/core/submitter.py`, `app/models/submission_logs`
  - Verification: `POST /api/submit` mengirim ke Google Form, mengembalikan status, log tersimpan di DB
  - Depends on: 1.4

- [ ] **2.4. Implementasi route CRUD `POST/GET /api/personas`**
  - Intent: user bisa simpan dan pilih persona sebelum generate
  - Touchpoints: `app/routes/personas.py`, `app/models/personas`
  - Verification: bisa create persona baru, list personas, GET by ID via Swagger UI
  - Depends on: 0.2

- [ ] **2.5. Tulis integration test `tests/test_e2e.py`**
  - Intent: satu test yang membuktikan siklus penuh bekerja tanpa intervensi manual
  - Touchpoints: `tests/test_e2e.py`, `pytest`, `httpx` (TestClient FastAPI)
  - Detail: gunakan Google Form publik dummy (buat sendiri atau pakai URL form test); test flow: parse → generate → submit → assert HTTP 200 & log tersimpan di DB
  - Verification: `pytest tests/test_e2e.py -v` lulus semua assertion
  - Depends on: 2.1, 2.2, 2.3

- [ ] **2.6. Tulis README setup & run**
  - Intent: onboarding jelas untuk diri sendiri dan kolaborator
  - Touchpoints: `README.md`
  - Verification: ikuti README dari nol di environment baru → server jalan dan test lulus

---

## 7. Verification Plan

| Check | Command / Method |
|---|---|
| Server bisa jalan | `uvicorn app.main:app --reload` → buka `localhost:8000/docs` |
| DB terbentuk | `sqlite3 gform.db ".tables"` → tampilkan 4 tabel |
| Parse bekerja | Swagger UI → `POST /api/parse` dengan URL form publik |
| Generate bekerja | Swagger UI → `POST /api/generate` |
| Submit bekerja | Swagger UI → `POST /api/submit` |
| E2E test lulus | `pytest tests/test_e2e.py -v` → semua PASSED |

---

## 8. Risks & Unknowns

| Risk | Likelihood | Mitigation |
|---|---|---|
| Google ubah struktur `FB_PUBLIC_LOAD_DATA_` JSON | Tinggi | Isolasi parser sebagai modul terpisah; simpan HTML fixture untuk regression test |
| OpenAI hallucinate `entry_id` yang tidak ada | Sedang | Validasi Pydantic ketat + retry loop 3x; test dengan form yang punya banyak MC |
| Google return non-200 tapi submission tetap masuk | Sedang | Log raw HTTP response; cek confirmation page redirect |
| `requests` timeout saat scrape form besar | Rendah | Set explicit timeout (10s), retry 1x |
| Pydantic v2 breaking changes vs contoh online (v1) | Sedang | Query context7 docs sebelum implementasi model |

---

## 9. Out of Scope (fase ini)

- React frontend (Phase 3)
- Batch submission mode (Phase 4)
- Persona manager UI (Phase 3)
- Human-in-the-loop review UI (Phase 3)
- Playwright fallback parser (Phase 4)
- Form dengan Google Sign-In
- File upload questions
- Scheduling / cron

---

> **Catatan:** Plan ini hidup — revisi saat ada temuan baru (terutama saat masuk Phase 3 frontend).
