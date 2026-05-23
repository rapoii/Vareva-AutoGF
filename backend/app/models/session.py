from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class FormSession(SQLModel, table=True):
    __tablename__ = "sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    form_url: str
    persona_id: Optional[int] = Field(default=None, foreign_key="personas.id")
    status: str = Field(default="pending")
    batch_count: int = Field(default=1)
    success_count: int = Field(default=0)
    fail_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
