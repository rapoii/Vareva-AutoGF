"""Database configuration settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseConfig(BaseSettings):
    """Database-specific settings.

    Attributes:
        database_url: SQLite database connection string
    """

    database_url: str = "sqlite:///./gform.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Allow other env vars without validation errors
    )
