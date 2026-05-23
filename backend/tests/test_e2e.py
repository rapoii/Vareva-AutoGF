"""
End-to-end integration test: parse → generate → submit (one full cycle).

Requirements before running:
  1. Copy .env.example to .env and set one provider key.
  2. Set TEST_FORM_URL below to a real public Google Form you own/control.
     The form must accept anonymous submissions.

Run:
  cd backend
  pytest tests/test_e2e.py -v -s
"""

import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import create_db_and_tables

TEST_FORM_URL = os.getenv(
    "TEST_FORM_URL",
    "https://docs.google.com/forms/d/e/1FAIpQLSfd64Tm68slaZlI4y3B8yfBd592umQnYsTuVsDDWRjChKXn_w/viewform",
)

TEST_PERSONA = (
    "Name: Budi Santoso\n"
    "Age: 28\n"
    "Profession: Software Engineer\n"
    "Tone: casual and friendly\n"
    "Preferences: prefers concise answers, neutral opinions on controversial topics"
)

AI_PROVIDER_CONFIGURED = any(
    os.getenv(key)
    for key in [
        "GEMINI_API_KEY",
        "GROQ_API_KEY",
        "CEREBRAS_API_KEY",
        "OPENROUTER_API_KEY",
    ]
)


@pytest.fixture(scope="module")
def client():
    create_db_and_tables()
    with TestClient(app) as c:
        yield c


def test_health_check(client: TestClient):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.skipif(
    not TEST_FORM_URL.startswith("https://docs.google.com/forms") or not AI_PROVIDER_CONFIGURED,
    reason="Set TEST_FORM_URL and one AI provider API key to run the live e2e test",
)
def test_full_cycle_parse_generate_submit(client: TestClient):
    # Step 1: Parse
    parse_resp = client.post("/api/parse/", json={"url": TEST_FORM_URL})
    assert parse_resp.status_code == 200, f"Parse failed: {parse_resp.text}"

    parse_data = parse_resp.json()
    schema = parse_data["schema_"]
    session_id = parse_data["session_id"]

    assert schema["fields"], "No fields found in parsed form"
    print(f"\n[PARSE] Found {len(schema['fields'])} fields, session_id={session_id}")

    # Step 2: Generate answers
    gen_resp = client.post(
        "/api/generate/",
        json={"form_schema": schema, "persona_text": TEST_PERSONA},
    )
    assert gen_resp.status_code == 200, f"Generate failed: {gen_resp.text}"

    gen_data = gen_resp.json()
    answers = gen_data["answers"]
    assert answers, "No answers generated"
    print(f"[GENERATE] Generated {len(answers)} answers, tokens={gen_data['tokens_used']}, retries={gen_data['retries']}")

    # Step 3: Submit
    submit_resp = client.post(
        "/api/submit/",
        json={
            "form_url": TEST_FORM_URL,
            "answers": answers,
            "session_id": session_id,
            "iteration_number": 1,
        },
    )
    assert submit_resp.status_code == 200, f"Submit route failed: {submit_resp.text}"

    submit_data = submit_resp.json()
    print(f"[SUBMIT] status={submit_data['status']}, http_code={submit_data['http_code']}, log_id={submit_data['log_id']}")

    assert submit_data["http_code"] == 200, (
        f"Google returned non-200: {submit_data['http_code']} — {submit_data.get('error_message')}"
    )
    assert submit_data["status"] == "success"
    assert submit_data["log_id"] is not None
