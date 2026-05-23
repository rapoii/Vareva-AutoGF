"""Base pydantic models with custom serialization."""
from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, field_serializer
from fastapi.encoders import jsonable_encoder


class CustomModel(BaseModel):
    """Custom base model with standardized datetime serialization.

    Features:
    - Serializes all datetime fields to ISO 8601 format with explicit timezone
    - Provides serializable_dict() for JSON-safe dict output
    - Configured with populate_by_name for flexible field aliasing
    """

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
        validate_assignment=True,
    )

    @field_serializer("*", when_used="json", check_fields=False)
    def _serialize_datetimes(self, value: Any) -> Any:
        """Serialize datetime fields to standard ISO format with timezone."""
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.strftime("%Y-%m-%dT%H:%M:%S%z")
        return value

    def serializable_dict(self, **kwargs) -> dict:
        """Return a dict which contains only serializable fields.

        Uses FastAPI's jsonable_encoder for robust JSON serialization.
        """
        default_dict = self.model_dump(**kwargs)
        return jsonable_encoder(default_dict)


class APIResponse(CustomModel):
    """Base API response model with success/error handling."""

    success: bool = True
    message: Optional[str] = None
    error_code: Optional[str] = None
