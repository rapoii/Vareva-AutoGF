"""Authentication configuration settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthConfig(BaseSettings):
    auth_secret_key: str = "change-this-secret-before-deploy"
    auth_token_expire_minutes: int = 10080

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
