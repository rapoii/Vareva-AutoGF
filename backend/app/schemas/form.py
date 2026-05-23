from enum import Enum
from typing import Optional
from app.schemas.base import CustomModel


class QuestionType(str, Enum):
    SHORT_ANSWER = "SHORT_ANSWER"
    PARAGRAPH = "PARAGRAPH"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    CHECKBOXES = "CHECKBOXES"
    DROPDOWN = "DROPDOWN"
    LINEAR_SCALE = "LINEAR_SCALE"
    GRID = "GRID"
    OTHER = "OTHER"


class FormField(CustomModel):
    entry_id: str
    question_text: str
    question_type: QuestionType
    required: bool = False
    options: list[str] = []
    scale_low: Optional[int] = None
    scale_high: Optional[int] = None
    scale_low_label: Optional[str] = None
    scale_high_label: Optional[str] = None
    page_index: int = 0  # Which page this field belongs to (0-indexed)


class FormSchema(CustomModel):
    form_id: str
    title: str
    description: Optional[str] = None
    fields: list[FormField]
    page_count: int = 1


class FormAnalysis(CustomModel):
    topic_summary: str
    is_multi_page: bool
    page_count: int
    question_types: list[str]
    requires_personal_info: bool
    context_for_persona: str
    target_audience_hint: str = ""  # Inferred ideal demographics for realistic personas


class ParseRequest(CustomModel):
    url: str


class ParseResponse(CustomModel):
    schema_: FormSchema
    session_id: int
