import json
import logging
from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models.session import FormSession
from app.models.submission_log import SubmissionLog
from app.core.submitter import submit
from app.schemas.submit import SubmitRequest, SubmitResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/submit", tags=["submit"])


@router.post("/", response_model=SubmitResponse)
def submit_form(req: SubmitRequest, session: SessionDep):
    db_session = session.get(FormSession, req.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail=f"Session {req.session_id} not found")

    logger.info(f"Submit received: {len(req.answers)} answers, page_count={req.page_count}")
    logger.debug(f"Answers: {req.answers}")

    result = submit(req.form_url, req.answers, page_count=req.page_count)

    log = SubmissionLog(
        session_id=req.session_id,
        iteration_number=req.iteration_number,
        answers_used=json.dumps(req.answers),
        submit_status=result["status"],
        error_message=result.get("error_message"),
    )
    session.add(log)

    if result["status"] == "success":
        db_session.success_count += 1
    else:
        db_session.fail_count += 1
    db_session.status = "completed"
    session.add(db_session)
    session.commit()
    session.refresh(log)

    return SubmitResponse(
        status=result["status"],
        http_code=result["http_code"],
        session_id=req.session_id,
        log_id=log.id,
        error_message=result.get("error_message"),
    )
