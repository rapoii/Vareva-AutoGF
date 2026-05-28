from fastapi.testclient import TestClient

from app.core.auth import create_access_token
from app.core.storage.models import StoredUser
from app.main import app
from app.schemas.form import FormSchema


TEST_USER = StoredUser(id="test-user", name="Test User", email="test@example.com", password_hash="")
TEST_TOKEN = create_access_token(TEST_USER)
AUTH_HEADERS = {"Authorization": f"Bearer {TEST_TOKEN}"}
FORM_URL = "https://docs.google.com/forms/d/e/test/viewform"
FORM_SCHEMA = FormSchema.model_validate({
    "form_id": "test-form",
    "title": "Test Form",
    "fields": [
        {
            "entry_id": "entry.name",
            "question_text": "Nama",
            "question_type": "SHORT_ANSWER",
            "required": True,
            "options": [],
            "page_index": 0,
        }
    ],
    "page_count": 1,
})


def test_start_batch_job_creates_running_session(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        "app.routes.parse.parse_form",
        lambda url: FORM_SCHEMA,
    )
    parse_resp = client.post("/api/parse/", json={"url": FORM_URL}, headers=AUTH_HEADERS)
    assert parse_resp.status_code == 200
    session_id = parse_resp.json()["session_id"]

    response = client.post(
        "/api/batch/jobs",
        json={
            "form_url": FORM_URL,
            "count": 2,
            "skip_submit": False,
            "session_id": session_id,
            "generation_config": {
                "persona_description": "",
                "economic_class": "middle",
                "answer_instructions": "",
                "custom_answers": {"entry.name": "Rafi"},
            },
        },
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["session_id"]
    assert data["form_url"] == FORM_URL
    assert data["form_title"] == "Test Form"
    assert data["count"] == 2
    assert data["success_count"] == 0
    assert data["fail_count"] == 0
    assert data["mode"] == "auto"
    assert data["status"] == "running"
    assert data["results"] == []


def test_run_stream_starts_background_job_and_completes_from_storage(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        "app.routes.parse.parse_form",
        lambda url: FORM_SCHEMA,
    )

    parse_resp = client.post("/api/parse/", json={"url": FORM_URL}, headers=AUTH_HEADERS)
    assert parse_resp.status_code == 200
    session_id = parse_resp.json()["session_id"]

    def fake_process_one_iteration(storage, started_session_id, user_id):
        storage.append_submission_log(
            session_id=started_session_id,
            iteration=1,
            answers={"entry.name": "Rafi"},
            submit_status="success",
            form_url=FORM_URL,
            persona_text="Rafi, 25 thn, Mahasiswa (Jakarta)",
            http_code=200,
            tokens_used=10,
            retries=0,
            provider="test",
            user_id=user_id,
        )
        storage.update_session_result(started_session_id, 1, 0, status="completed")
        return __import__("app.routes.batch", fromlist=["_status_from_storage"])._status_from_storage(storage, started_session_id, user_id)

    monkeypatch.setattr("app.routes.batch._process_one_iteration", fake_process_one_iteration)

    with client.stream(
        "POST",
        "/api/batch/run-stream",
        json={
            "form_url": FORM_URL,
            "count": 1,
            "skip_submit": False,
            "session_id": session_id,
        },
        headers=AUTH_HEADERS,
    ) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert "event: session_started" in body
    assert "event: iteration_result" in body
    assert "event: complete" in body
    assert '"success_count": 1' in body
    assert '"status":"success"' not in body
