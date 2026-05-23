from fastapi import APIRouter, HTTPException

from app.core.generator import generate_answers
from app.schemas.form import FormSchema
from app.schemas.answer import GenerateRequest, GenerateResponse

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.post("/", response_model=GenerateResponse)
def generate_form_answers(req: GenerateRequest):
    try:
        schema = FormSchema.model_validate(req.form_schema)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid form schema: {e}")

    if not req.persona_text.strip():
        raise HTTPException(status_code=422, detail="persona_text cannot be empty")

    try:
        result = generate_answers(schema, req.persona_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    return result
