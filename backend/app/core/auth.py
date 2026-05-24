from datetime import datetime, timedelta, timezone
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


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


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
    user = storage.get_user_by_email(email)
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")
    return user
