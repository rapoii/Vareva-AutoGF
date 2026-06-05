from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from app.core.storage.google_sheets import GoogleSheetsClient
from app.core.storage.models import StoredLog, StoredSession, StoredUser


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_storage_id(value: Any) -> str:
    return str(value or "")


class AppStorage:
    def __init__(self) -> None:
        self.sheets = GoogleSheetsClient()

    def get_user_by_email(self, email: str) -> StoredUser | None:
        normalized = email.strip().lower()
        data = self.sheets.call_action("get_user_by_email", {"email": normalized})
        user = data.get("user")
        if not isinstance(user, dict):
            return None
        return StoredUser(
            id=_to_storage_id(user.get("id")),
            name=str(user.get("name") or ""),
            email=str(user.get("email") or normalized),
            password_hash=str(user.get("password_hash") or ""),
            created_at=str(user.get("created_at") or ""),
            last_login_at=str(user.get("last_login_at") or ""),
            ai_settings_json=str(user.get("ai_settings_json") or ""),
        )

    def get_user_by_id(self, user_id: str) -> StoredUser | None:
        data = self.sheets.call_action("get_user_by_id", {"user_id": user_id})
        user = data.get("user")
        if not isinstance(user, dict):
            return None
        return StoredUser(
            id=_to_storage_id(user.get("id")),
            name=str(user.get("name") or ""),
            email=str(user.get("email") or ""),
            password_hash=str(user.get("password_hash") or ""),
            created_at=str(user.get("created_at") or ""),
            last_login_at=str(user.get("last_login_at") or ""),
            ai_settings_json=str(user.get("ai_settings_json") or ""),
        )

    def create_user(self, name: str, email: str, password_hash: str) -> StoredUser:
        normalized = email.strip().lower()
        data = self.sheets.call_action("create_user", {
            "name": name.strip(),
            "email": normalized,
            "password_hash": password_hash,
            "created_at": _now_iso(),
        })
        user = data.get("user") if isinstance(data.get("user"), dict) else data
        return StoredUser(
            id=_to_storage_id(user.get("id")),
            name=str(user.get("name") or name.strip()),
            email=str(user.get("email") or normalized),
            password_hash=str(user.get("password_hash") or password_hash),
            created_at=str(user.get("created_at") or ""),
            last_login_at=str(user.get("last_login_at") or ""),
            ai_settings_json=str(user.get("ai_settings_json") or ""),
        )

    def update_user_last_login(self, user_id: str) -> None:
        self.sheets.call_action("update_user_last_login", {"user_id": user_id, "last_login_at": _now_iso()})

    def update_user_profile(self, user_id: str, name: str, email: str) -> StoredUser:
        normalized = email.strip().lower()
        data = self.sheets.call_action("update_user_profile", {
            "user_id": user_id,
            "name": name.strip(),
            "email": normalized,
        })
        user = data.get("user") if isinstance(data.get("user"), dict) else data
        return StoredUser(
            id=_to_storage_id(user.get("id")),
            name=str(user.get("name") or name.strip()),
            email=str(user.get("email") or normalized),
            password_hash=str(user.get("password_hash") or ""),
            created_at=str(user.get("created_at") or ""),
            last_login_at=str(user.get("last_login_at") or ""),
            ai_settings_json=str(user.get("ai_settings_json") or ""),
        )

    def update_user_ai_settings(self, user_id: str, ai_settings_json: str) -> None:
        user = self.get_user_by_id(user_id)
        if not user:
            return

        self.sheets.call_action("update_user_profile", {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "ai_settings_json": ai_settings_json,
        })

    def update_user_password(self, user_id: str, password_hash: str) -> None:
        self.sheets.call_action("update_user_password", {"user_id": user_id, "password_hash": password_hash})

    def load_form_history(self, user_id: str) -> list[dict[str, Any]]:
        data = self.sheets.call_action("get_form_history", {"user_id": user_id})
        rows = data.get("items") or []
        return [row for row in rows if isinstance(row, dict)]

    def delete_form_history(self, user_id: str, form_url: str) -> dict[str, int]:
        data = self.sheets.call_action("delete_form_history", {"user_id": user_id, "form_url": form_url})
        return {key: int(value or 0) for key, value in data.items()}

    def create_session(self, form_url: str, count: int = 1, status: str = "running", user_id: str | None = None, form_title: str = "", mode: str = "auto") -> StoredSession:
        data = self.sheets.call_action("create_session", {
            "created_at": _now_iso(),
            "user_id": user_id,
            "form_url": form_url,
            "form_title": form_title,
            "count": count,
            "success_count": 0,
            "fail_count": 0,
            "mode": mode,
            "status": status,
        })
        raw = data.get("session") if isinstance(data.get("session"), dict) else data
        return StoredSession(
            id=_to_storage_id(raw.get("id")),
            form_url=form_url,
            status=status,
            user_id=user_id,
            form_title=form_title,
            count=count,
            mode=mode,
        )

    def save_form_schema(self, session_id: str, form_url: str, schema_json: str, user_id: str | None = None) -> StoredLog:
        data = self.sheets.call_action("save_form_schema", {
            "session_id": session_id,
            "user_id": user_id,
            "form_url": form_url,
            "schema_json": schema_json,
            "created_at": _now_iso(),
        })
        return StoredLog(id=_to_storage_id(data.get("id")))

    def load_form_schema(self, session_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        data = self.sheets.call_action("get_form_schema", {"session_id": session_id, "user_id": user_id})
        schema = data.get("schema")
        return schema if isinstance(schema, dict) else None

    def save_generation_config(self, session_id: str, config_json: str, user_id: str | None = None) -> StoredLog:
        data = self.sheets.call_action("save_generation_config", {
            "session_id": session_id,
            "user_id": user_id,
            "config_json": config_json,
            "created_at": _now_iso(),
        })
        return StoredLog(id=_to_storage_id(data.get("id")))

    def load_generation_config(self, session_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        data = self.sheets.call_action("get_generation_config", {"session_id": session_id, "user_id": user_id})
        config = data.get("config")
        return config if isinstance(config, dict) else None

    def load_answer_history(self, form_url: str, limit: int = 12, user_id: str | None = None) -> list[dict[str, Any]]:
        data = self.sheets.call_action("get_answer_history", {"form_url": form_url, "limit": limit, "user_id": user_id})
        rows = data.get("history") or []
        return [row for row in rows if isinstance(row, dict)]

    def load_used_persona_names(self, form_url: str, user_id: str | None = None) -> set[str]:
        data = self.sheets.call_action("get_used_persona_names", {"form_url": form_url, "user_id": user_id})
        names = data.get("names") or []
        return {str(name) for name in names if name}

    def append_generated_persona_log(self, session_id: str, form_url: str, persona: Any, user_id: str | None = None) -> StoredLog:
        data = self.sheets.call_action("append_generated_persona_log", {
            "session_id": session_id,
            "user_id": user_id,
            "form_url": form_url,
            "name": persona.name,
            "gender": persona.gender,
            "age": persona.age,
            "occupation": persona.occupation,
            "economic_class": persona.economic_class,
            "persona_json": persona.model_dump_json(),
            "created_at": _now_iso(),
        })
        return StoredLog(id=_to_storage_id(data.get("id")))

    def append_submission_log(self, session_id: str, iteration: int, answers: dict[str, Any], submit_status: str, error_message: str | None = None, form_url: str = "", persona_text: str = "", http_code: int = 0, tokens_used: int = 0, retries: int = 0, provider: str = "", user_id: str | None = None) -> StoredLog:
        data = self.sheets.call_action("append_submission_log", {
            "session_id": session_id,
            "user_id": user_id,
            "form_url": form_url,
            "iteration": iteration,
            "persona_text": persona_text,
            "answers_json": json.dumps(answers, ensure_ascii=False),
            "submit_status": submit_status,
            "http_code": http_code,
            "tokens_used": tokens_used,
            "retries": retries,
            "provider": provider,
            "error_message": error_message,
            "created_at": _now_iso(),
        })
        return StoredLog(id=_to_storage_id(data.get("id")))

    def load_session_detail(self, session_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        data = self.sheets.call_action("get_session_detail", {"session_id": session_id, "user_id": user_id})
        detail = data.get("session")
        return detail if isinstance(detail, dict) else None

    def load_running_sessions(self, limit: int = 5) -> list[dict[str, Any]]:
        data = self.sheets.call_action("get_running_sessions", {"limit": limit})
        sessions = data.get("sessions") or []
        return [session for session in sessions if isinstance(session, dict)]

    def load_session_logs(self, session_id: str, user_id: str | None = None) -> list[dict[str, Any]]:
        data = self.sheets.call_action("get_session_logs", {"session_id": session_id, "user_id": user_id})
        logs = data.get("logs") or []
        return [row for row in logs if isinstance(row, dict)]

    def update_submission_answers(self, session_id: str, iteration: int, answers: dict[str, Any], user_id: str | None = None) -> None:
        self.sheets.call_action("update_submission_answers", {
            "session_id": session_id,
            "user_id": user_id,
            "iteration": iteration,
            "answers_json": json.dumps(answers, ensure_ascii=False),
        })

    def update_submission_result(self, session_id: str, iteration: int, submit_status: str, http_code: int = 0, error_message: str | None = None, user_id: str | None = None) -> None:
        self.sheets.call_action("update_submission_result", {
            "session_id": session_id,
            "user_id": user_id,
            "iteration": iteration,
            "submit_status": submit_status,
            "http_code": http_code,
            "error_message": error_message,
        })

    def update_session_result(self, session_id: str, success_count: int, fail_count: int, status: str = "completed") -> None:
        self.sheets.call_action("update_session_result", {
            "session_id": session_id,
            "success_count": success_count,
            "fail_count": fail_count,
            "status": status,
        })

    def session_exists(self, session_id: str, user_id: str | None = None) -> bool:
        if not session_id:
            return False
        return self.load_session_detail(session_id, user_id=user_id) is not None
