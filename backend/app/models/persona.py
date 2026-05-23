from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Persona(SQLModel, table=True):
    __tablename__ = "personas"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    tone: Optional[str] = None
    system_prompt: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
