from typing import Literal

from pydantic import Field
from app.schemas.base import CustomModel
from app.schemas.form import FormField


class GenerationConfig(CustomModel):
    persona_description: str = ""
    economic_class: Literal["", "lower", "middle", "upper"] = ""
    answer_instructions: str = ""
    custom_answers: dict[str, str | list[str]] = Field(default_factory=dict)


class BatchRunRequest(CustomModel):
    form_url: str
    count: int = Field(ge=1, le=50)
    skip_submit: bool = False  # If true, only generate answers without submitting to Google Form
    session_id: str | None = None
    generation_config: GenerationConfig | None = None


class BatchProcessRequest(CustomModel):
    max_iterations: int = Field(default=1, ge=1, le=1)


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


class BatchReviewAnswerUpdate(CustomModel):
    answers: dict[str, str | list[str]]


class BatchSessionStatus(CustomModel):
    session_id: str
    form_url: str
    form_title: str = ""
    count: int = 0
    success_count: int = 0
    fail_count: int = 0
    mode: str = "auto"
    status: str = "running"
    fields: list[FormField] = Field(default_factory=list)
    results: list[IterationResult] = Field(default_factory=list)
