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


class FakeSheetsStorage:
    def __init__(self):
        self.sessions = {}
        self.schemas = {}
        self.configs = {}
        self.logs = []
        self.next_session = 1
        self.next_log = 1

    def call_action(self, action, payload):
        if action == "create_session":
            session_id = f"ses_{self.next_session}"
            self.next_session += 1
            session = {"id": session_id, **payload}
            self.sessions[session_id] = session
            return {"session": session}
        if action == "save_form_schema":
            self.schemas[payload["session_id"]] = payload
            return {"id": f"sch_{payload['session_id']}"}
        if action == "get_form_schema":
            return {"schema": self.schemas.get(payload["session_id"])}
        if action == "save_generation_config":
            self.configs[payload["session_id"]] = payload
            return {"id": f"cfg_{payload['session_id']}"}
        if action == "get_generation_config":
            return {"config": self.configs.get(payload["session_id"])}
        if action == "get_session_detail":
            session = self.sessions.get(payload["session_id"])
            if session:
                session = {**session, "session_id": session["id"]}
            return {"session": session}
        if action == "get_session_logs":
            session_id = payload["session_id"]
            return {"logs": [row for row in self.logs if row["session_id"] == session_id]}
        if action == "append_submission_log":
            log = {"id": f"log_{self.next_log}", **payload}
            self.next_log += 1
            self.logs.append(log)
            return {"id": log["id"]}
        if action == "update_session_result":
            session = self.sessions.get(payload["session_id"])
            if session:
                session.update({
                    "success_count": payload.get("success_count", 0),
                    "fail_count": payload.get("fail_count", 0),
                    "status": payload.get("status", "completed"),
                })
            return {"updated": bool(session)}
        if action == "get_answer_history":
            return {"history": []}
        if action == "get_used_persona_names":
            return {"names": []}
        if action == "append_generated_persona_log":
            return {"id": "per_1"}
        raise AssertionError(f"Unexpected storage action: {action}")


def install_fake_sheets(monkeypatch):
    fake = FakeSheetsStorage()
    monkeypatch.setattr("app.core.storage.service.GoogleSheetsClient", lambda: fake)
    return fake


def test_start_batch_job_creates_running_session(monkeypatch):
    install_fake_sheets(monkeypatch)
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
    install_fake_sheets(monkeypatch)
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
