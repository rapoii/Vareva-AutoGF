import json
from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models.session import FormSession
from app.models.form_schema import FormSchemaRecord
from app.core.parser import parse_form
from app.schemas.form import ParseRequest, ParseResponse

router = APIRouter(prefix="/api/parse", tags=["parse"])


@router.post("/", response_model=ParseResponse)
def parse_google_form(req: ParseRequest, session: SessionDep):
    try:
        schema = parse_form(req.url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    db_session = FormSession(form_url=req.url, status="parsed")
    session.add(db_session)
    session.commit()
    session.refresh(db_session)

    schema_record = FormSchemaRecord(
        session_id=db_session.id,
        schema_data=json.dumps(schema.model_dump()),
    )
    session.add(schema_record)
    session.commit()

    return ParseResponse(schema_=schema, session_id=db_session.id)
