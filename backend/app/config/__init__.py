"""Modular configuration settings for the application.

This package provides split, domain-specific configuration classes
following FastAPI best practices.
"""
from app.config.ai_providers import AIProviderConfig
from app.config.storage import StorageConfig
from app.config.auth import AuthConfig
from app.config.app import AppConfig, get_settings

__all__ = ["AIProviderConfig", "StorageConfig", "AuthConfig", "AppConfig", "get_settings"]
