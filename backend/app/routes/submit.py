import logging
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.storage.models import StoredUser
from app.core.storage.service import AppStorage
from app.core.submitter import submit
from app.schemas.submit import SubmitRequest, SubmitResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/submit", tags=["submit"])


@router.post("/", response_model=SubmitResponse)
def submit_form(req: SubmitRequest, user: StoredUser = Depends(get_current_user)):
    storage = AppStorage()
    if not storage.session_exists(req.session_id):
        raise HTTPException(status_code=404, detail=f"Session {req.session_id} not found")

    logger.info(f"Submit received: {len(req.answers)} answers, page_count={req.page_count}")
    logger.debug(f"Answers: {req.answers}")

    result = submit(req.form_url, req.answers, page_count=req.page_count)
    log_id = None
    if result["status"] == "success":
        log = storage.append_submission_log(
            session_id=req.session_id,
            iteration=req.iteration_number,
            answers=req.answers,
            submit_status=result["status"],
            error_message=result.get("error_message"),
            form_url=req.form_url,
            http_code=result["http_code"],
            user_id=user.id,
        )
        log_id = log.id
    storage.update_session_result(
        req.session_id,
        success_count=1 if result["status"] == "success" else 0,
        fail_count=0 if result["status"] == "success" else 1,
    )

    return SubmitResponse(
        status=result["status"],
        http_code=result["http_code"],
        session_id=req.session_id,
        log_id=log_id,
        error_message=result.get("error_message"),
    )
