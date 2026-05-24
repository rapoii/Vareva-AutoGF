from pydantic import EmailStr, Field

from app.schemas.base import CustomModel


class AuthUser(CustomModel):
    id: str
    name: str
    email: str


class RegisterRequest(CustomModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(CustomModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(CustomModel):
    token: str
    user: AuthUser


class MeResponse(CustomModel):
    user: AuthUser


class UpdateProfileRequest(CustomModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr


class ChangePasswordRequest(CustomModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class ProfileHistoryItem(CustomModel):
    form_url: str
    form_title: str = ""
    session_count: int = 0
    submission_count: int = 0
    persona_count: int = 0
    last_activity_at: str = ""


class ProfileHistoryResponse(CustomModel):
    items: list[ProfileHistoryItem]


class DeleteFormHistoryRequest(CustomModel):
    form_url: str = Field(min_length=1, max_length=2048)


class DeleteFormHistoryResponse(CustomModel):
    deleted_sessions: int = 0
    deleted_form_schemas: int = 0
    deleted_submission_logs: int = 0
    deleted_generated_persona_logs: int = 0
