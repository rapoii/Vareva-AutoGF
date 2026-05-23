"""Legacy config module - delegates to modular config for backward compatibility.

This module is kept for backward compatibility. New code should import from
app.config directly for modular configuration.
"""
from app.config import AppConfig, get_settings

# Re-export for backward compatibility
Settings = AppConfig

__all__ = ["Settings", "get_settings"]
