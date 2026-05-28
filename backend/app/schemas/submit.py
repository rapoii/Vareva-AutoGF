from app.schemas.base import CustomModel


class SubmitRequest(CustomModel):
    form_url: str
    answers: dict[str, str | list[str]]
    session_id: str
    iteration_number: int = 1
    page_count: int = 1  # Number of pages in the form (for correct pageHistory)


class SubmitResponse(CustomModel):
    status: str
    http_code: int
    session_id: str
    log_id: str | None = None
    error_message: str | None = None
