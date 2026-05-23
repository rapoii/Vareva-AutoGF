"""AI Provider configuration settings."""
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AIProviderConfig(BaseSettings):
    """AI provider-specific settings with multi-provider retry chain.

    Priority order: Gemini → Groq → Cerebras → OpenRouter

    Attributes:
        gemini_api_key: Google Gemini API key (primary)
        gemini_model: Gemini model identifier
        groq_api_key: Groq API key (retry provider 1)
        groq_model: Groq model identifier
        cerebras_api_key: Cerebras API key (retry provider 2)
        cerebras_model: Cerebras model identifier
        openrouter_api_key: OpenRouter API key (retry provider 3)
        openrouter_model: OpenRouter model identifier
        openrouter_fallback_models: Comma-separated OpenRouter fallback model IDs
        openrouter_base_url: OpenRouter API base URL
        llm_max_retries: Maximum retry attempts for LLM calls
    """

    # Gemini (Primary)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"

    # Groq (Fallback 1)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Cerebras (Fallback 2)
    cerebras_api_key: str = ""
    cerebras_model: str = "llama-3.3-70b"

    # OpenRouter (Fallback 3)
    openrouter_api_key: str = ""
    openrouter_model: str = "poolside/laguna-xs.2:free"
    openrouter_fallback_models: str = "openrouter/free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # General LLM settings
    llm_max_retries: int = 3

    @field_validator("openrouter_fallback_models", mode="before")
    @classmethod
    def normalize_fallback_models(cls, value: Any) -> str:
        if isinstance(value, list):
            return ",".join(str(item) for item in value)
        return "" if value is None else str(value)

    @property
    def openrouter_fallback_model_list(self) -> list[str]:
        """Return OpenRouter fallback models, excluding duplicates and primary."""
        models: list[str] = []
        seen = {self.openrouter_model.casefold()}
        for item in self.openrouter_fallback_models.split(","):
            model = item.strip()
            key = model.casefold()
            if model and key not in seen:
                seen.add(key)
                models.append(model)
        return models

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
