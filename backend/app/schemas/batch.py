from pydantic import Field
from app.schemas.base import CustomModel


class BatchRunRequest(CustomModel):
    form_url: str
    count: int = Field(ge=1, le=50)
    skip_submit: bool = False  # If true, only generate answers without submitting to Google Form


class IterationResult(CustomModel):
    iteration: int
    persona_text: str
    answers: dict[str, str | list[str]]
    tokens_used: int
    retries: int = 0
    submit_status: str
    http_code: int
    log_id: str | None = None
    error_message: str | None = None


class BatchRunResponse(CustomModel):
    form_title: str
    session_id: str
    count: int
    results: list[IterationResult]
    success_count: int
    fail_count: int
