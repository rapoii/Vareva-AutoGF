from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class SubmissionLog(SQLModel, table=True):
    __tablename__ = "submission_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="sessions.id")
    iteration_number: int = Field(default=1)
    answers_used: str = Field(description="JSON string of answer map used")
    submit_status: str = Field(default="pending")
    error_message: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
