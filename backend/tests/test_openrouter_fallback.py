from app.config import get_settings
from app.core import generator
from app.core.generator import _completion_extra_kwargs


def test_openrouter_fallback_models_are_parsed_and_deduped(monkeypatch):
    monkeypatch.setenv("PYTEST_DISABLE_DOTENV", "1")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("CEREBRAS_API_KEY", raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "poolside/laguna-xs.2:free")
    monkeypatch.setenv(
        "OPENROUTER_FALLBACK_MODELS",
        " openrouter/free, poolside/laguna-xs.2:free, google/gemma-3-27b-it:free ",
    )
    get_settings.cache_clear()

    providers = generator._make_providers()

    assert len(providers) == 1
    provider = providers[0]
    assert provider.name == "OpenRouter"
    assert provider.model == "poolside/laguna-xs.2:free"
    assert provider.fallback_models == ("openrouter/free", "google/gemma-3-27b-it:free")
    assert _completion_extra_kwargs(provider) == {
        "extra_body": {"models": ["openrouter/free", "google/gemma-3-27b-it:free"]}
    }

    get_settings.cache_clear()


def test_non_openrouter_provider_has_no_extra_body(monkeypatch):
    monkeypatch.setenv("PYTEST_DISABLE_DOTENV", "1")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("CEREBRAS_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    get_settings.cache_clear()

    providers = generator._make_providers()

    assert providers[0].name == "Gemini"
    assert providers[0].fallback_models == ()
    assert _completion_extra_kwargs(providers[0]) == {}

    get_settings.cache_clear()
