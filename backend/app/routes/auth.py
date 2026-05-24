from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import authenticate_user, create_access_token, get_current_user, hash_password, verify_password
from app.core.storage.service import AppStorage
from app.schemas.auth import (
    AuthResponse,
    AuthUser,
    ChangePasswordRequest,
    DeleteFormHistoryRequest,
    DeleteFormHistoryResponse,
    LoginRequest,
    MeResponse,
    ProfileHistoryResponse,
    RegisterRequest,
    UpdateProfileRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _safe_user(user) -> AuthUser:
    return AuthUser(id=user.id, name=user.name, email=user.email)


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    storage = AppStorage()
    email = req.email.strip().lower()
    if storage.get_user_by_email(email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email sudah terdaftar")

    user = storage.create_user(
        name=req.name.strip(),
        email=email,
        password_hash=hash_password(req.password),
    )
    token = create_access_token(user)
    return AuthResponse(token=token, user=_safe_user(user))


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    storage = AppStorage()
    user = authenticate_user(storage, req.email.strip().lower(), req.password)
    storage.update_user_last_login(user.id)
    token = create_access_token(user)
    return AuthResponse(token=token, user=_safe_user(user))


@router.get("/me", response_model=MeResponse)
def me(user = Depends(get_current_user)):
    return MeResponse(user=_safe_user(user))


@router.patch("/profile", response_model=AuthResponse)
def update_profile(req: UpdateProfileRequest, user = Depends(get_current_user)):
    storage = AppStorage()
    email = req.email.strip().lower()
    existing = storage.get_user_by_email(email)
    if existing and existing.id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email sudah dipakai akun lain")

    updated_user = storage.update_user_profile(user.id, req.name.strip(), email)
    token = create_access_token(updated_user)
    return AuthResponse(token=token, user=_safe_user(updated_user))


@router.post("/change-password", response_model=MeResponse)
def change_password(req: ChangePasswordRequest, user = Depends(get_current_user)):
    storage = AppStorage()
    current_user = storage.get_user_by_email(user.email)
    if current_user is None or not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password saat ini salah")
    storage.update_user_password(user.id, hash_password(req.new_password))
    return MeResponse(user=_safe_user(user))


@router.get("/history", response_model=ProfileHistoryResponse)
def get_history(user = Depends(get_current_user)):
    storage = AppStorage()
    return ProfileHistoryResponse(items=storage.load_form_history(user.id))


@router.post("/history/delete", response_model=DeleteFormHistoryResponse)
def delete_history(req: DeleteFormHistoryRequest, user = Depends(get_current_user)):
    storage = AppStorage()
    deleted = storage.delete_form_history(user.id, req.form_url.strip())
    return DeleteFormHistoryResponse(**deleted)
