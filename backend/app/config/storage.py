"""External storage configuration settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class StorageConfig(BaseSettings):
    storage_backend: str = "sqlite"
    google_sheets_script_url: str = ""
    google_sheets_shared_secret: str = ""
    google_sheets_timeout_seconds: float = 15.0

    @property
    def use_google_sheets(self) -> bool:
        return self.storage_backend.strip().lower() == "google_sheets"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
