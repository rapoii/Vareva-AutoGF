from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.core.storage.models import StoredUser
from app.core.storage.service import AppStorage

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)
_login_attempt_lock = Lock()
_login_attempts: dict[str, dict[str, float | int]] = {}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _login_cooldown_seconds(failure_count: int) -> int:
    return max(1, failure_count) * 5


def _check_login_cooldown(email: str) -> None:
    now = datetime.now(timezone.utc).timestamp()
    with _login_attempt_lock:
        state = _login_attempts.get(email)
        if not state:
            return
        locked_until = float(state.get("locked_until") or 0)
        if locked_until > now:
            retry_after = max(1, int(locked_until - now + 0.999))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Terlalu banyak percobaan gagal. Coba lagi dalam {retry_after} detik.",
                headers={"Retry-After": str(retry_after)},
            )


def _record_failed_login(email: str) -> int:
    now = datetime.now(timezone.utc).timestamp()
    with _login_attempt_lock:
        state = _login_attempts.get(email) or {"failures": 0, "locked_until": 0}
        failures = int(state.get("failures") or 0) + 1
        cooldown_seconds = _login_cooldown_seconds(failures)
        _login_attempts[email] = {
            "failures": failures,
            "locked_until": now + cooldown_seconds,
        }
        return cooldown_seconds


def _reset_failed_login(email: str) -> None:
    with _login_attempt_lock:
        _login_attempts.pop(email, None)


def create_access_token(user: StoredUser) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.auth_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.auth_secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.auth_secret_key, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid") from exc
    if not payload.get("sub") or not payload.get("email"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")
    return payload


def user_from_payload(payload: dict[str, Any]) -> StoredUser:
    return StoredUser(
        id=str(payload["sub"]),
        name=str(payload.get("name") or ""),
        email=str(payload["email"]),
        password_hash="",
    )


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> StoredUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login diperlukan")
    payload = decode_access_token(credentials.credentials)
    return user_from_payload(payload)


def get_optional_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> StoredUser | None:
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    return user_from_payload(payload)


def authenticate_user(storage: AppStorage, email: str, password: str) -> StoredUser:
    normalized_email = email.strip().lower()
    _check_login_cooldown(normalized_email)
    user = storage.get_user_by_email(normalized_email)
    if user is None or not verify_password(password, user.password_hash):
        cooldown_seconds = _record_failed_login(normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Email atau password salah. Coba lagi dalam {cooldown_seconds} detik.",
            headers={"Retry-After": str(cooldown_seconds)},
        )
    _reset_failed_login(normalized_email)
    return user
