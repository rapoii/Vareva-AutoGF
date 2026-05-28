from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlmodel import SQLModel, Session, col, select

from app.config import get_settings
from app.core.storage.google_sheets import GoogleSheetsClient
from app.core.storage.models import StoredLog, StoredSession, StoredUser
from app.models.batch_generation_config import BatchGenerationConfigRecord
from app.models.form_schema import FormSchemaRecord
from app.models.generated_persona_log import GeneratedPersonaLog
from app.models.session import FormSession
from app.models.submission_log import SubmissionLog


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_storage_id(value: Any) -> str:
    return str(value or "")


def _to_sqlite_id(value: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


class AppStorage:
    def __init__(self, db: Session | None = None) -> None:
        self.db = db
        self.settings = get_settings()
        self.use_google_sheets = self.settings.storage_backend.strip().lower() == "google_sheets"
        self.sheets = GoogleSheetsClient() if self.use_google_sheets else None

    def get_user_by_email(self, email: str) -> StoredUser | None:
        normalized = email.strip().lower()
        if self.use_google_sheets:
            data = self.sheets.call_action("get_user_by_email", {"email": normalized})  # type: ignore[union-attr]
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
            )
        return None

    def create_user(self, name: str, email: str, password_hash: str) -> StoredUser:
        normalized = email.strip().lower()
        if self.use_google_sheets:
            data = self.sheets.call_action("create_user", {  # type: ignore[union-attr]
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
            )
        raise RuntimeError("SQLite auth storage belum dikonfigurasi")

    def update_user_last_login(self, user_id: str) -> None:
        if self.use_google_sheets:
            self.sheets.call_action("update_user_last_login", {"user_id": user_id, "last_login_at": _now_iso()})  # type: ignore[union-attr]

    def update_user_profile(self, user_id: str, name: str, email: str) -> StoredUser:
        normalized = email.strip().lower()
        if self.use_google_sheets:
            data = self.sheets.call_action("update_user_profile", {  # type: ignore[union-attr]
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
            )
        raise RuntimeError("SQLite auth storage belum dikonfigurasi")

    def update_user_password(self, user_id: str, password_hash: str) -> None:
        if self.use_google_sheets:
            self.sheets.call_action("update_user_password", {"user_id": user_id, "password_hash": password_hash})  # type: ignore[union-attr]
            return
        raise RuntimeError("SQLite auth storage belum dikonfigurasi")

    def load_form_history(self, user_id: str) -> list[dict[str, Any]]:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_form_history", {"user_id": user_id})  # type: ignore[union-attr]
            rows = data.get("items") or []
            return [row for row in rows if isinstance(row, dict)]
        return []

    def delete_form_history(self, user_id: str, form_url: str) -> dict[str, int]:
        if self.use_google_sheets:
            data = self.sheets.call_action("delete_form_history", {"user_id": user_id, "form_url": form_url})  # type: ignore[union-attr]
            return {key: int(value or 0) for key, value in data.items()}
        return {}

    def create_session(self, form_url: str, count: int = 1, status: str = "running", user_id: str | None = None, form_title: str = "", mode: str = "auto") -> StoredSession:
        if self.use_google_sheets:
            data = self.sheets.call_action("create_session", {  # type: ignore[union-attr]
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

        if self.db is None:
            raise RuntimeError("SQLite session membutuhkan database session")
        db_session = FormSession(form_url=form_url, batch_count=count, status=status)
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        return StoredSession(id=str(db_session.id or 0), form_url=form_url, status=status, count=count)

    def save_form_schema(self, session_id: str, form_url: str, schema_json: str, user_id: str | None = None) -> StoredLog:
        if self.use_google_sheets:
            data = self.sheets.call_action("save_form_schema", {  # type: ignore[union-attr]
                "session_id": session_id,
                "user_id": user_id,
                "form_url": form_url,
                "schema_json": schema_json,
                "created_at": _now_iso(),
            })
            return StoredLog(id=_to_storage_id(data.get("id")))

        if self.db is None:
            raise RuntimeError("SQLite schema storage membutuhkan database session")
        record = FormSchemaRecord(session_id=session_id, schema_data=schema_json)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return StoredLog(id=str(record.id or 0))

    def load_form_schema(self, session_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_form_schema", {"session_id": session_id, "user_id": user_id})  # type: ignore[union-attr]
            schema = data.get("schema")
            return schema if isinstance(schema, dict) else None

        if self.db is None:
            return None
        record = self.db.exec(
            select(FormSchemaRecord).where(FormSchemaRecord.session_id == _to_sqlite_id(session_id))
        ).first()
        if not record:
            return None
        db_session = self.db.get(FormSession, _to_sqlite_id(session_id))
        if not db_session:
            return None
        return {
            "session_id": str(record.session_id),
            "user_id": user_id or "",
            "form_url": db_session.form_url,
            "schema_json": record.schema_data,
        }

    def save_generation_config(self, session_id: str, config_json: str, user_id: str | None = None) -> StoredLog:
        if self.use_google_sheets:
            data = self.sheets.call_action("save_generation_config", {  # type: ignore[union-attr]
                "session_id": session_id,
                "user_id": user_id,
                "config_json": config_json,
                "created_at": _now_iso(),
            })
            return StoredLog(id=_to_storage_id(data.get("id")))

        if self.db is None:
            raise RuntimeError("SQLite generation config storage membutuhkan database session")
        SQLModel.metadata.create_all(self.db.get_bind(), tables=[BatchGenerationConfigRecord.__table__])
        record = BatchGenerationConfigRecord(session_id=_to_sqlite_id(session_id), config_json=config_json)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return StoredLog(id=str(record.id or 0))

    def load_generation_config(self, session_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_generation_config", {"session_id": session_id, "user_id": user_id})  # type: ignore[union-attr]
            config = data.get("config")
            return config if isinstance(config, dict) else None

        if self.db is None:
            return None
        SQLModel.metadata.create_all(self.db.get_bind(), tables=[BatchGenerationConfigRecord.__table__])
        record = self.db.exec(
            select(BatchGenerationConfigRecord).where(BatchGenerationConfigRecord.session_id == _to_sqlite_id(session_id))
        ).first()
        if not record:
            return None
        return {
            "session_id": session_id,
            "user_id": user_id or "",
            "config_json": record.config_json,
        }

    def load_answer_history(self, form_url: str, limit: int = 12, user_id: str | None = None) -> list[dict[str, Any]]:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_answer_history", {"form_url": form_url, "limit": limit, "user_id": user_id})  # type: ignore[union-attr]
            rows = data.get("history") or []
            return [row for row in rows if isinstance(row, dict)]

        if self.db is None:
            return []
        session_ids = self.db.exec(
            select(FormSession.id)
            .where(col(FormSession.form_url) == form_url)
            .order_by(text("created_at DESC"))
            .limit(limit)
        ).all()
        if not session_ids:
            return []
        rows = self.db.exec(
            select(SubmissionLog.answers_used)
            .where(col(SubmissionLog.session_id).in_(session_ids))
            .order_by(text("submitted_at DESC"))
            .limit(limit)
        ).all()
        history: list[dict[str, Any]] = []
        for raw_answers in rows:
            try:
                parsed = json.loads(raw_answers)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                history.append(parsed)
        return history

    def load_used_persona_names(self, form_url: str, user_id: str | None = None) -> set[str]:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_used_persona_names", {"form_url": form_url, "user_id": user_id})  # type: ignore[union-attr]
            names = data.get("names") or []
            return {str(name) for name in names if name}

        if self.db is None:
            return set()
        rows = self.db.exec(select(GeneratedPersonaLog.name).where(GeneratedPersonaLog.form_url == form_url)).all()
        return {name for name in rows if name}

    def append_generated_persona_log(self, session_id: str, form_url: str, persona: Any, user_id: str | None = None) -> StoredLog:
        if self.use_google_sheets:
            data = self.sheets.call_action("append_generated_persona_log", {  # type: ignore[union-attr]
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

        if self.db is None:
            raise RuntimeError("SQLite persona storage membutuhkan database session")
        record = GeneratedPersonaLog(
            session_id=session_id,
            form_url=form_url,
            name=persona.name,
            gender=persona.gender,
            age=persona.age,
            occupation=persona.occupation,
            economic_class=persona.economic_class,
            persona_json=persona.model_dump_json(),
        )
        self.db.add(record)
        return StoredLog(id=str(record.id or 0))

    def append_submission_log(self, session_id: str, iteration: int, answers: dict[str, Any], submit_status: str, error_message: str | None = None, form_url: str = "", persona_text: str = "", http_code: int = 0, tokens_used: int = 0, retries: int = 0, provider: str = "", user_id: str | None = None) -> StoredLog:
        if self.use_google_sheets:
            data = self.sheets.call_action("append_submission_log", {  # type: ignore[union-attr]
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

        if self.db is None:
            raise RuntimeError("SQLite submission storage membutuhkan database session")
        log = SubmissionLog(
            session_id=session_id,
            iteration_number=iteration,
            answers_used=json.dumps(answers),
            submit_status=submit_status,
            error_message=error_message,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return StoredLog(id=str(log.id or 0))

    def load_session_detail(self, session_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_session_detail", {"session_id": session_id, "user_id": user_id})  # type: ignore[union-attr]
            detail = data.get("session")
            return detail if isinstance(detail, dict) else None

        if self.db is None:
            return None
        db_session = self.db.get(FormSession, _to_sqlite_id(session_id))
        if not db_session:
            return None
        return {
            "session_id": str(db_session.id or ""),
            "form_url": db_session.form_url,
            "form_title": "",
            "count": db_session.batch_count,
            "success_count": db_session.success_count,
            "fail_count": db_session.fail_count,
            "mode": "auto",
            "status": db_session.status,
        }

    def load_running_sessions(self, limit: int = 5) -> list[dict[str, Any]]:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_running_sessions", {"limit": limit})  # type: ignore[union-attr]
            sessions = data.get("sessions") or []
            return [session for session in sessions if isinstance(session, dict)]

        if self.db is None:
            return []
        rows = self.db.exec(
            select(FormSession)
            .where(col(FormSession.status).in_(["queued", "running"]))
            .order_by(FormSession.created_at)
            .limit(limit)
        ).all()
        return [
            {
                "session_id": str(row.id or ""),
                "user_id": "",
                "form_url": row.form_url,
                "form_title": "",
                "count": row.batch_count,
                "success_count": row.success_count,
                "fail_count": row.fail_count,
                "mode": "auto",
                "status": row.status,
            }
            for row in rows
        ]

    def load_session_logs(self, session_id: str, user_id: str | None = None) -> list[dict[str, Any]]:
        if self.use_google_sheets:
            data = self.sheets.call_action("get_session_logs", {"session_id": session_id, "user_id": user_id})  # type: ignore[union-attr]
            logs = data.get("logs") or []
            return [row for row in logs if isinstance(row, dict)]

        if self.db is None:
            return []
        rows = self.db.exec(
            select(SubmissionLog)
            .where(SubmissionLog.session_id == _to_sqlite_id(session_id))
            .order_by(SubmissionLog.iteration_number)
        ).all()
        logs: list[dict[str, Any]] = []
        for row in rows:
            logs.append({
                "id": str(row.id or ""),
                "iteration": row.iteration_number,
                "persona_text": "",
                "answers_json": row.answers_used,
                "submit_status": row.submit_status,
                "http_code": 0,
                "tokens_used": 0,
                "retries": 0,
                "error_message": row.error_message,
            })
        return logs

    def update_submission_answers(self, session_id: str, iteration: int, answers: dict[str, Any], user_id: str | None = None) -> None:
        if self.use_google_sheets:
            self.sheets.call_action("update_submission_answers", {  # type: ignore[union-attr]
                "session_id": session_id,
                "user_id": user_id,
                "iteration": iteration,
                "answers_json": json.dumps(answers, ensure_ascii=False),
            })
            return

        if self.db is None:
            return
        row = self.db.exec(
            select(SubmissionLog)
            .where(SubmissionLog.session_id == _to_sqlite_id(session_id))
            .where(SubmissionLog.iteration_number == iteration)
        ).first()
        if row:
            row.answers_used = json.dumps(answers, ensure_ascii=False)
            self.db.add(row)
            self.db.commit()

    def update_submission_result(self, session_id: str, iteration: int, submit_status: str, http_code: int = 0, error_message: str | None = None, user_id: str | None = None) -> None:
        if self.use_google_sheets:
            self.sheets.call_action("update_submission_result", {  # type: ignore[union-attr]
                "session_id": session_id,
                "user_id": user_id,
                "iteration": iteration,
                "submit_status": submit_status,
                "http_code": http_code,
                "error_message": error_message,
            })
            return

        if self.db is None:
            return
        row = self.db.exec(
            select(SubmissionLog)
            .where(SubmissionLog.session_id == _to_sqlite_id(session_id))
            .where(SubmissionLog.iteration_number == iteration)
        ).first()
        if row:
            row.submit_status = submit_status
            row.error_message = error_message
            self.db.add(row)
            self.db.commit()

    def update_session_result(self, session_id: str, success_count: int, fail_count: int, status: str = "completed") -> None:
        if self.use_google_sheets:
            self.sheets.call_action("update_session_result", {  # type: ignore[union-attr]
                "session_id": session_id,
                "success_count": success_count,
                "fail_count": fail_count,
                "status": status,
            })
            return

        if self.db is None:
            return
        db_session = self.db.get(FormSession, _to_sqlite_id(session_id))
        if db_session:
            db_session.success_count = success_count
            db_session.fail_count = fail_count
            db_session.status = status
            self.db.add(db_session)
            self.db.commit()

    def session_exists(self, session_id: str) -> bool:
        if self.use_google_sheets:
            return True
        if self.db is None:
            return False
        return self.db.get(FormSession, _to_sqlite_id(session_id)) is not None
