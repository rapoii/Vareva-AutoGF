"""Application-wide configuration settings."""
from functools import lru_cache
import os
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.config.ai_providers import AIProviderConfig
from app.config.storage import StorageConfig
from app.config.auth import AuthConfig


def _env_file_setting() -> str | None:
    return None if os.getenv("PYTEST_DISABLE_DOTENV") == "1" else ".env"


class AppConfig(BaseSettings):
    """Root application configuration combining all domain settings.

    This class inherits from BaseSettings to maintain backward compatibility
    while internally delegating to modular config classes.

    Attributes:
        app_name: Application name
        app_version: Application version
        debug: Debug mode flag
    """

    app_name: str = "Vareva AutoGF"
    app_version: str = "1.0.0"
    debug: bool = False
    cors_origins: str = "*"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: Any) -> Any:
        """Accept legacy environment labels that older settings ignored."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "y", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "no", "n", "off", "release", "production", "prod"}:
                return False
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        if not self.cors_origins.strip() or self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # Delegate to modular configs
    @property
    def ai_providers(self) -> AIProviderConfig:
        """Get AI provider configuration."""
        return AIProviderConfig(_env_file=_env_file_setting())

    @property
    def storage(self) -> StorageConfig:
        return StorageConfig(_env_file=_env_file_setting())

    @property
    def auth(self) -> AuthConfig:
        return AuthConfig(_env_file=_env_file_setting())

    @property
    def storage_backend(self) -> str:
        return "google_sheets"

    @property
    def google_sheets_script_url(self) -> str:
        return self.storage.google_sheets_script_url

    @property
    def google_sheets_shared_secret(self) -> str:
        return self.storage.google_sheets_shared_secret

    @property
    def google_sheets_timeout_seconds(self) -> float:
        return self.storage.google_sheets_timeout_seconds

    @property
    def auth_secret_key(self) -> str:
        return self.auth.auth_secret_key

    @property
    def auth_token_expire_minutes(self) -> int:
        return self.auth.auth_token_expire_minutes

    # Backward compatibility properties - AI Providers
    @property
    def gemini_api_key(self) -> str:
        return self.ai_providers.gemini_api_key

    @property
    def gemini_model(self) -> str:
        return self.ai_providers.gemini_model

    @property
    def groq_api_key(self) -> str:
        return self.ai_providers.groq_api_key

    @property
    def groq_model(self) -> str:
        return self.ai_providers.groq_model

    @property
    def cerebras_api_key(self) -> str:
        return self.ai_providers.cerebras_api_key

    @property
    def cerebras_model(self) -> str:
        return self.ai_providers.cerebras_model

    @property
    def openrouter_api_key(self) -> str:
        return self.ai_providers.openrouter_api_key

    @property
    def openrouter_model(self) -> str:
        return self.ai_providers.openrouter_model

    @property
    def openrouter_fallback_model_list(self) -> list[str]:
        return self.ai_providers.openrouter_fallback_model_list

    @property
    def openrouter_base_url(self) -> str:
        return self.ai_providers.openrouter_base_url

    @property
    def llm_max_retries(self) -> int:
        return self.ai_providers.llm_max_retries

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> AppConfig:
    """Get cached application settings.

    Uses LRU cache to avoid re-reading env files on every call.
    """
    return AppConfig(_env_file=_env_file_setting())
