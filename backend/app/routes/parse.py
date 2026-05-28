from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.parser import parse_form
from app.core.storage.google_sheets import GoogleSheetsStorageError
from app.core.storage.models import StoredUser
from app.core.storage.service import AppStorage
from app.db import SessionDep
from app.schemas.form import ParseRequest, ParseResponse

router = APIRouter(prefix="/api/parse", tags=["parse"])


@router.post("/", response_model=ParseResponse)
def parse_google_form(req: ParseRequest, session: SessionDep, user: StoredUser = Depends(get_current_user)):
    try:
        schema = parse_form(req.url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    storage = AppStorage(session)
    try:
        stored_session = storage.create_session(
            form_url=req.url,
            count=1,
            status="parsed",
            user_id=user.id,
            form_title=schema.title,
            mode="review",
        )
        storage.save_form_schema(stored_session.id, req.url, schema.model_dump_json(), user_id=user.id)
    except GoogleSheetsStorageError as e:
        raise HTTPException(status_code=503, detail=f"Storage Google Sheets tidak bisa diakses: {e}") from e

    return ParseResponse(schema_=schema, session_id=stored_session.id)
