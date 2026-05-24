from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings


class GoogleSheetsStorageError(RuntimeError):
    pass


class GoogleSheetsClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.script_url = settings.google_sheets_script_url.strip()
        self.shared_secret = settings.google_sheets_shared_secret
        self.timeout = settings.google_sheets_timeout_seconds

    def call_action(self, action: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.script_url:
            raise GoogleSheetsStorageError("GOOGLE_SHEETS_SCRIPT_URL belum diatur")
        if not self.shared_secret:
            raise GoogleSheetsStorageError("GOOGLE_SHEETS_SHARED_SECRET belum diatur")

        body = {
            "token": self.shared_secret,
            "action": action,
            "payload": payload or {},
        }

        try:
            response = httpx.post(self.script_url, json=body, timeout=self.timeout, follow_redirects=True)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            raise GoogleSheetsStorageError(f"Google Sheets request gagal: {exc}") from exc
        except ValueError as exc:
            raise GoogleSheetsStorageError("Google Sheets response bukan JSON valid") from exc

        if not isinstance(data, dict):
            raise GoogleSheetsStorageError("Google Sheets response tidak valid")
        if not data.get("ok"):
            raise GoogleSheetsStorageError(str(data.get("error") or "Google Sheets action gagal"))

        result = data.get("data") or {}
        return result if isinstance(result, dict) else {"value": result}
