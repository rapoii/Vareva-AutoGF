from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class BatchGenerationConfigRecord(SQLModel, table=True):
    __tablename__ = "batch_generation_configs"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="sessions.id")
    config_json: str = Field(description="JSON string of batch generation config")
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
