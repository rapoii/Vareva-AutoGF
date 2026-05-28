from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class GeneratedPersonaLog(SQLModel, table=True):
    __tablename__ = "generated_persona_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="sessions.id")
    form_url: str = Field(index=True)
    name: str = Field(index=True)
    gender: str
    age: int
    occupation: str
    economic_class: str = Field(default="middle")
    persona_json: str = Field(description="JSON string of generated persona object")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
