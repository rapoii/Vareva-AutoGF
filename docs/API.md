# API Reference

Base URL in development:

```text
http://127.0.0.1:8000
```

## Health Check

```http
GET /
```

Returns basic application health.

## Parse Form

```http
POST /api/parse/
Content-Type: application/json
```

Request:

```json
{
  "url": "https://docs.google.com/forms/d/e/.../viewform"
}
```

Response includes:

- `form_id`
- `title`
- `description`
- `fields`
- `page_count`

## Generate Answers

```http
POST /api/generate/
Content-Type: application/json
```

Request:

```json
{
  "form_url": "https://docs.google.com/forms/d/e/.../viewform",
  "count": 2
}
```

Response includes generated persona/answer data. For batch usage, prefer `/api/batch/jobs` and poll `/api/batch/sessions/{session_id}`.

## Submit Form

```http
POST /api/submit/
Content-Type: application/json
```

Request shape depends on the parsed form schema and answer map.

The submitter supports:

- Regular text fields
- Multiple choice
- Dropdown
- Checkboxes
- Linear scale
- Multi-page form tokens
- `Yang lain:` / Other option payloads

## Batch Background Job

```http
POST /api/batch/jobs
Content-Type: application/json
```

Request:

```json
{
  "form_url": "https://docs.google.com/forms/d/e/.../viewform",
  "count": 3,
  "skip_submit": false,
  "session_id": "ses_from_scan_optional",
  "generation_config": {
    "persona_description": "Mahasiswa aktif di kota besar",
    "economic_class": "middle",
    "answer_instructions": "Jawaban santai dan realistis",
    "custom_answers": {}
  }
}
```

`skip_submit: false` runs auto mode. `skip_submit: true` stores generated answers as `pending_review` for user review.

Response is a `BatchSessionStatus` snapshot with `session_id`, `fields`, `results`, counts, mode, and status. The frontend should navigate to `/generate/{session_id}` and poll the session endpoint.

## Batch Session Status

```http
GET /api/batch/sessions/{session_id}
```

Returns stored progress for reload-safe progress pages. `pending_review` results are not counted as failures.

## Update Review Answers

```http
PATCH /api/batch/sessions/{session_id}/iterations/{iteration}/answers
Content-Type: application/json
```

Request:

```json
{
  "answers": {
    "entry.123": "Updated answer",
    "entry.456": ["Option A", "Option B"]
  }
}
```

Only available for review sessions while the iteration is still `pending_review`.

## Submit Reviewed Session

```http
POST /api/batch/sessions/{session_id}/submit-reviewed
```

Submits all pending review iterations together and returns the updated `BatchSessionStatus`.

## Legacy Batch Run

```http
POST /api/batch/run
Content-Type: application/json
```

Kept for compatibility. New frontend flows should prefer `/api/batch/jobs`.

## Batch Run Stream

```http
POST /api/batch/run-stream
Accept: text/event-stream
Content-Type: application/json
```

Request:

```json
{
  "form_url": "https://docs.google.com/forms/d/e/.../viewform",
  "count": 3,
  "skip_submit": true
}
```

### SSE Event Types

#### `log`

```text
event: log
data: {"phase":"generate","message":"Generating 3 personas..."}
```

Phases:

- `init`
- `parse`
- `generate`
- `submit`

#### `provider`

```text
event: provider
data: {"phase":"submit","provider":"Gemini","iteration":1}
```

#### `iteration_result`

```text
event: iteration_result
data: {"iteration":1,"submit_status":"success"}
```

#### `complete`

```text
event: complete
data: {"session_id":1,"success_count":3,"fail_count":0}
```

#### `error`

```text
event: error
data: {"message":"Gagal parse form: ..."}
```

## Persona CRUD

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/personas/` | Create persona |
| `GET` | `/api/personas/` | List personas |
| `GET` | `/api/personas/{id}` | Get persona |
| `PATCH` | `/api/personas/{id}` | Update persona |
| `DELETE` | `/api/personas/{id}` | Delete persona |

## Error Handling

Common error cases:

| Status | Meaning |
|---|---|
| `422` | Invalid form URL or parse failure |
| `502` | AI generation failed across providers |
| `500` | Unexpected backend error |

Client-facing errors are sanitized. Detailed context is logged server-side.
