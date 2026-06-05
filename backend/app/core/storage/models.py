from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class StoredUser:
    id: str
    name: str
    email: str
    password_hash: str
    created_at: str = ""
    last_login_at: str = ""
    ai_settings_json: str = ""


@dataclass(frozen=True)
class StoredSession:
    id: str
    form_url: str
    status: str = "running"
    user_id: str | None = None
    form_title: str = ""
    count: int = 0
    success_count: int = 0
    fail_count: int = 0
    mode: str = "auto"


@dataclass(frozen=True)
class StoredLog:
    id: str


JsonDict = dict[str, Any]
