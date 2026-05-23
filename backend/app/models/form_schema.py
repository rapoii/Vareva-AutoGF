from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class FormSchemaRecord(SQLModel, table=True):
    __tablename__ = "form_schemas"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="sessions.id")
    schema_data: str = Field(description="JSON string of parsed form schema")
    parsed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
