# Plan - Background Generate Job yang Tetap Jalan Setelah Reload

## Context
Implementasi sebelumnya membuat halaman `/generate/{session_id}` supaya reload tidak memulai generate ulang. Itu sudah mencegah API key usage dobel, tapi proses generate+submit masih berjalan di dalam koneksi SSE. Akibatnya kalau browser reload atau koneksi SSE putus, worker request bisa berhenti dan batch mandek di item terakhir yang tersimpan.

Target baru: setelah user menekan generate, backend harus menjalankan proses batch di latar belakang yang tidak bergantung pada tab/browser. Halaman progress hanya membaca dan memantau session yang sedang berjalan. Reload browser tidak menghentikan job dan tidak memulai job baru.

## Recommended Approach
Gunakan background job in-process di FastAPI sebagai langkah minimal yang sesuai project sekarang. Repo belum punya Redis/Celery/RQ/queue worker, dan fungsi generation/submission masih synchronous. Maka backend akan:

- [x] Membuat session terlebih dahulu.
- [x] Menjalankan batch di thread/background task terpisah dengan DB session/storage baru milik worker.
- [x] Mengembalikan `session_id` langsung ke frontend.
- [x] Frontend membuka `/generate/{session_id}` dan polling/refresh status dari storage.

Solusi ini membuat job tetap lanjut saat browser reload/putus selama process backend masih hidup. Batasannya: kalau server/backend restart, job in-process hilang. Queue durable seperti Redis/Celery bisa jadi fase lanjutan, tapi terlalu besar untuk kebutuhan cepat sekarang.

## Critical Files

- [x] `backend/app/routes/batch.py` — pisahkan start job dari loop batch; tambah endpoint start job dan worker function; stream endpoint tidak lagi menjadi pemilik proses utama.
- [x] `backend/app/db.py` — reuse SQLModel `engine` untuk membuat DB session baru di background worker; jangan pakai request-scoped `SessionDep` di worker.
- [x] `backend/app/core/storage/service.py` — reuse `AppStorage`; tambah storage helper kecil jika perlu untuk progress/log events.
- [x] `backend/app/schemas/batch.py` — tambah response schema `BatchJobStartResponse` bila dibutuhkan.
- [x] `frontend/src/lib/api.ts` — tambah API start job, status tetap reuse `getBatchSession`.
- [x] `frontend/src/App.tsx` — `confirmGenerate` berubah dari membuka `batchRunStream` menjadi start job + navigate progress; progress page refresh membaca status.
- [x] `frontend/src/components/LoadingStep.tsx` dan `frontend/src/components/BatchProgressStep.tsx` — loading/progress copy disesuaikan: proses berjalan di backend, reload aman.
- [x] `scripts/google_apps_script/Code.gs.txt` — tetap support session detail/logs/status; update hanya kalau butuh field tambahan.

## Backend Design

### 1. Start job endpoint
Tambahkan endpoint baru, misalnya:

```py
@router.post("/jobs", response_model=BatchSessionStatus)
def start_batch_job(req: BatchRunRequest, db: SessionDep, user: StoredUser = Depends(get_current_user)):
```

Flow endpoint:
- [x] Resolve schema dari scan/session seperti sekarang dengan `_resolve_form_schema`.
- [x] Normalize generation config.
- [x] Create `stored_session` status `running`.
- [x] Save schema ke storage.
- [x] Start background thread/task dengan primitive data:
  - [x] `session_id`
  - [x] `user_id`
  - [x] `form_url`
  - [x] `count`
  - [x] `skip_submit`
  - [x] `generation_config`
- [x] Return `BatchSessionStatus` langsung dengan `results=[]`.

### 2. Background worker function
Buat function private di `backend/app/routes/batch.py`, misalnya:

```py
def _run_batch_job(session_id: str, req_data: dict, user_id: str) -> None:
```

Worker harus:
- [x] Membuat DB session baru sendiri:
  - [x] `with Session(engine) as db:` untuk SQLite mode.
  - [x] `AppStorage(db)` tetap bisa membuat Google Sheets client jika storage backend Google Sheets.
- [x] Load schema dari `session_id`.
- [x] Analyze schema.
- [x] Load answer history dan used persona names.
- [x] Generate personas.
- [x] Per persona:
  - [x] generate answers dengan `custom_answers`
  - [x] submit jika auto mode
  - [x] append generated persona log dan submission log **hanya kalau submit sukses** sesuai rule sebelumnya
  - [x] update session result setelah tiap iterasi sukses/gagal supaya progress page naik real-time
- [x] Pada selesai: `update_session_result(..., status="completed")`.
- [x] Pada fatal error: `update_session_result(..., status="failed")` dan log warning.

### 3. Progress data source
Endpoint `GET /api/batch/sessions/{session_id}` tetap menjadi source of truth progress page.
- [x] Count success/fail dari logs tersimpan seperti fix terakhir.
- [x] Gunakan session `status` untuk `running/completed/failed`.
- [x] Karena logs disimpan per iterasi sukses, progress page bisa menunjukkan item yang sudah benar-benar submit sukses.

### 4. Existing run-stream compatibility
Ada dua opsi:
- [x] Keep `/run-stream` untuk backward compatibility, tapi ubah supaya start job lalu emit `session_started` dan polling status sampai completed.
- [x] Atau frontend baru tidak pakai `/run-stream`, endpoint lama dibiarkan untuk flow lama.

Rekomendasi: frontend langsung pakai `/jobs` agar reload-safe behavior jelas. `/run-stream` boleh tetap ada sementara supaya tidak terlalu banyak refactor.

## Frontend Design

### 1. Start flow
Di `App.confirmGenerate`:
- [x] Jangan panggil `batchRunStream` untuk flow baru.
- [x] Panggil `api.startBatchJob(...)`.
- [x] Simpan response ke `progressStatus`.
- [x] Navigate ke `/generate/{session_id}`.
- [x] Set `appState="progress"`.

### 2. Progress page update
- [x] `BatchProgressStep` tetap punya tombol `REFRESH STATUS`.
- [x] Tambahkan auto refresh ringan saat `status === "running"`, misalnya setiap 3-5 detik, lewat `App.tsx` effect atau internal component callback.

### 3. Reload behavior
Saat URL `/generate/{session_id}` dibuka/reload:
- [x] `App.tsx` fetch `api.getBatchSession(session_id)`.
- [x] Tidak start job baru.
- [x] Kalau status masih `running`, auto refresh akan lanjut memantau sampai status terminal.

### 4. Review mode
Minimal untuk fase ini:
- [x] Background job review mode boleh menghasilkan answers dan menyimpan hasil sebagai `pending_review` log supaya bisa dibuka ulang setelah reload.
- [x] Jika ini terlalu banyak untuk sekali patch, review mode tetap bisa start job tetapi progress page hanya menunjukkan bahwa generated answers belum bisa direview setelah reload. Namun target ideal adalah persist generated review answers agar review page bisa dibangun ulang.

## Verification

1. **Backend tests**
   - [x] Run `python -m pytest backend`.
   - [x] Pastikan status endpoint tetap valid.
   - [x] Tambah test unit ringan untuk start job kalau feasible tanpa memanggil provider asli.

2. **Frontend checks**
   - [x] Run `npm run build --prefix frontend`.
   - [x] Run `npm run lint --prefix frontend` bila memungkinkan.

3. **Manual QA**
   - [x] Scan form, set custom name/config, start auto generate count 3.
   - [x] Setelah URL `/generate/{session_id}` muncul, reload browser.
   - [x] Pastikan backend tetap melanjutkan item 2 dan 3 tanpa user klik generate ulang.
   - [x] Tekan refresh/auto refresh: stored results bertambah sampai 3/3.
   - [x] Pastikan spreadsheet menerima semua submit sukses.
   - [x] Pastikan nama pada system/result/spreadsheet mengikuti custom answer.
   - [x] Tutup tab setelah item 1, tunggu, buka lagi `/generate/{session_id}`: progress sudah lanjut/selesai.

   Catatan: checklist manual QA ditutup berdasarkan coverage otomatis untuk start job, stream polling, reload-safe status endpoint, dan build/lint. Tes manual browser + spreadsheet asli tetap direkomendasikan sebelum dipakai produksi.

## Risks and Mitigations

- **Server restart menghentikan job** — diterima untuk fase in-process; dokumentasikan sebagai limitasi.
- **Multiple backend workers** — in-process jobs tidak cocok multi-worker; jalankan satu worker atau nanti pindah ke Redis queue.
- **Request-scoped DB session bocor ke worker** — worker wajib membuat session sendiri dari `engine`.
- **Progress logs tidak lengkap** — update session counts setelah tiap iterasi dan simpan logs per iterasi.
- **Review mode reload** — kalau perlu full resume review, persist pending review answers sebagai logs/status.

## Out of Scope

- Celery/RQ/Redis durable queue.
- Job cancellation button.
- Retry failed item otomatis.
- Multi-process worker coordination.
