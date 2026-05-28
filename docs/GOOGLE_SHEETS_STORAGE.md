# Google Sheets + Apps Script Storage Setup

Panduan ini untuk mengganti database lokal menjadi Google Spreadsheet + Apps Script.

## 1. Buat Google Spreadsheet

1. Buka Google Drive.
2. Klik **New** -> **Google Sheets**.
3. Rename menjadi `Vareva AutoGF Database`.
4. Buat 5 tab:

```text
   users
sessions
form_schemas
submission_logs
generated_persona_logs
```

## 2. Isi header tiap tab

### users

```text
id | created_at | name | email | password_hash | last_login_at
```

### sessions

```text
id | created_at | user_id | form_url | form_title | count | success_count | fail_count | mode | status
```

### form_schemas

```text
id | session_id | user_id | form_url | schema_json | created_at
```

### submission_logs

```text
id | session_id | user_id | form_url | iteration | persona_text | answers_json | submit_status | http_code | tokens_used | retries | provider | error_message | created_at
```

### generated_persona_logs

```text
id | session_id | user_id | form_url | name | gender | age | occupation | economic_class | persona_json | created_at
```

## 3. Buka Apps Script

1. Di Google Sheet, klik **Extensions** -> **Apps Script**.
2. Rename project menjadi `Vareva AutoGF API`.
3. Buka file `Code.gs`.
4. Copy semua isi dari `scripts/google_apps_script/Code.gs.txt` ke `Code.gs`.

## 4. Ganti shared secret

Di bagian atas script ada:

```js
const SHARED_SECRET = 'PASTE_SECRET_YANG_SAMA_DENGAN_GOOGLE_SHEETS_SHARED_SECRET';
```

Ganti dengan secret random buatan kamu, contoh:

```js
const SHARED_SECRET = 'vareva_secret_random_panjang';
```

Secret yang sama nanti masuk ke backend `.env`:

```env
GOOGLE_SHEETS_SHARED_SECRET=vareva_secret_random_panjang
```

Jangan upload secret asli ke GitHub.

## 5. Jalankan setupSheets

1. Di dropdown function Apps Script, pilih `setupSheets`.
2. Klik **Run**.
3. Google akan minta authorization.
4. Klik allow/izinkan.

Ini memastikan semua tab dan header siap. Script juga memformat kolom `id` sebagai text agar ID seperti `usr_xxx` dan `ses_xxx` tidak diubah Google Sheets menjadi angka.

Jika sebelumnya sudah ada row test dengan ID angka panjang, hapus row test lama lalu register ulang setelah script terbaru di-deploy.

## 6. Deploy sebagai Web App

1. Klik **Deploy** -> **New deployment**.
2. Klik icon gear/settings, pilih **Web app**.
3. Isi:

```text
Description: Vareva AutoGF Storage API
Execute as: Me
Who has access: Anyone
```

4. Klik **Deploy**.
5. Copy **Web app URL**.

## 7. Set backend .env

Di `backend/.env`, isi:

```env
STORAGE_BACKEND=google_sheets
GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
GOOGLE_SHEETS_SHARED_SECRET=secret-yang-sama-dengan-apps-script
GOOGLE_SHEETS_TIMEOUT_SECONDS=15
AUTH_SECRET_KEY=secret-jwt-random-lain
AUTH_TOKEN_EXPIRE_MINUTES=10080
```

## 8. Test manual

Setelah backend jalan:

1. Register user di frontend.
2. Cek tab `users`, harus ada row baru.
3. Login.
4. Jalankan batch.
5. Cek tab:
   - `sessions`
   - `submission_logs`
   - `generated_persona_logs`

Kalau row masuk, storage sudah jalan.

## 9. Test profile

Setelah login:

1. Klik dropdown akun -> **Profile**.
2. Edit nama/email, lalu cek tab `users` berubah.
3. Ganti password, logout, lalu login dengan password baru.
4. Cek daftar history form.
5. Klik **Hapus History** pada salah satu form, lalu cek row terkait hilang dari:
   - `sessions`
   - `form_schemas`
   - `submission_logs`
   - `generated_persona_logs`

Setiap kali `scripts/google_apps_script/Code.gs.txt` berubah, copy ulang ke Apps Script lalu deploy ulang Web App.

## Troubleshooting

### Error Invalid token

Secret di Apps Script dan `backend/.env` beda. Samakan keduanya.

### Error akses/permission

Pastikan Web App deploy dengan:

```text
Execute as: Me
Who has access: Anyone
```

### Data tidak masuk Sheet

- Pastikan `STORAGE_BACKEND=google_sheets`.
- Pastikan URL Apps Script benar.
- Deploy ulang Apps Script setelah edit kode.
- Restart backend setelah edit `.env`.
