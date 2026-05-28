import json
import logging
import random
import threading
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.core.auth import get_current_user
from app.core.parser import analyze_form, parse_form_with_analysis
from app.core.generator import (
    generate_persona_objects, generate_answers,
    generate_persona_objects_with_provider, generate_answers_with_provider,
)
from app.core.quality import closest_answer_similarity, validate_persona_quality
from app.core.storage.google_sheets import GoogleSheetsStorageError
from app.core.storage.models import StoredUser
from app.core.storage.service import AppStorage
from app.core.submitter import submit
from app.db import SessionDep, engine
from app.schemas.batch import BatchReviewAnswerUpdate, BatchRunRequest, BatchRunResponse, BatchSessionStatus, GenerationConfig, IterationResult
from app.schemas.form import FormAnalysis, FormSchema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/batch", tags=["batch"])


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _streaming_response(generator):
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _answers_from_log(raw_answers: object) -> dict[str, str | list[str]]:
    if isinstance(raw_answers, dict):
        return {str(key): value for key, value in raw_answers.items() if isinstance(value, str | list)}
    if not isinstance(raw_answers, str) or not raw_answers:
        return {}
    try:
        parsed = json.loads(raw_answers)
    except json.JSONDecodeError:
        return {}
    if not isinstance(parsed, dict):
        return {}
    return {str(key): value for key, value in parsed.items() if isinstance(value, str | list)}


def _looks_like_name_field(question_text: str) -> bool:
    normalized = question_text.strip().lower()
    return any(keyword in normalized for keyword in ("nama", "name"))


def _configured_name(schema: FormSchema, custom_answers: dict[str, str | list[str]]) -> str | None:
    for field in schema.fields:
        if _looks_like_name_field(field.question_text):
            value = custom_answers.get(field.entry_id)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def _persona_summary(persona, answers: dict[str, object] | None = None, schema: FormSchema | None = None) -> str:
    name = persona.name
    if answers and schema:
        configured_name = _configured_name(schema, answers)
        if configured_name:
            name = configured_name
    return f"{name}, {persona.age} thn, {persona.occupation} ({persona.city})"


def _iteration_from_log(row: dict) -> IterationResult:
    return IterationResult(
        iteration=int(row.get("iteration") or row.get("iteration_number") or 0),
        persona_text=str(row.get("persona_text") or ""),
        answers=_answers_from_log(row.get("answers_json") or row.get("answers_used") or row.get("answers")),
        tokens_used=int(row.get("tokens_used") or 0),
        retries=int(row.get("retries") or 0),
        submit_status=str(row.get("submit_status") or ""),
        http_code=int(row.get("http_code") or 0),
        log_id=str(row.get("id") or row.get("log_id") or "") or None,
        error_message=str(row.get("error_message") or "") or None,
    )


def _fields_by_page(schema: FormSchema) -> dict[int, list[str]]:
    fields_by_page: dict[int, list[str]] = {}
    for field in schema.fields:
        page_idx = getattr(field, "page_index", 0)
        if page_idx not in fields_by_page:
            fields_by_page[page_idx] = []
        fields_by_page[page_idx].append(field.entry_id)
    return fields_by_page


def _normalize_generation_config(config: GenerationConfig | None) -> GenerationConfig:
    if not config:
        return GenerationConfig()
    custom_answers: dict[str, str | list[str]] = {}
    for entry_id, value in config.custom_answers.items():
        if isinstance(value, list):
            cleaned = [item.strip() for item in value if item.strip()]
            if cleaned:
                custom_answers[entry_id] = cleaned
        elif value.strip():
            custom_answers[entry_id] = value.strip()
    return GenerationConfig(
        persona_description=config.persona_description.strip(),
        economic_class=config.economic_class,
        answer_instructions=config.answer_instructions.strip(),
        custom_answers=custom_answers,
    )


def _resolve_form_schema(req: BatchRunRequest, storage: AppStorage, user: StoredUser) -> tuple[FormSchema, FormAnalysis, str]:
    if not req.session_id:
        schema, analysis = parse_form_with_analysis(req.form_url)
        return schema, analysis, "parsed"

    stored_schema = storage.load_form_schema(req.session_id, user_id=user.id)
    if not stored_schema:
        raise HTTPException(status_code=404, detail="Hasil scan form tidak ditemukan. Silakan scan ulang Google Form.")

    stored_url = str(stored_schema.get("form_url") or "").strip()
    if stored_url != req.form_url.strip():
        raise HTTPException(status_code=422, detail="URL berubah dari hasil scan terakhir. Silakan scan ulang Google Form.")

    schema_json = stored_schema.get("schema_json")
    if not isinstance(schema_json, str) or not schema_json:
        raise HTTPException(status_code=422, detail="Schema hasil scan kosong. Silakan scan ulang Google Form.")

    schema = FormSchema.model_validate_json(schema_json)
    return schema, analyze_form(schema), "saved"


def _run_batch_job(session_id: str, req: BatchRunRequest, user_id: str) -> None:
    with Session(engine) as db:
        storage = AppStorage(db)
        success_count = 0
        fail_count = 0
        try:
            stored_schema = storage.load_form_schema(session_id, user_id=user_id)
            if not stored_schema:
                raise RuntimeError("Schema hasil scan tidak ditemukan")
            schema_json = stored_schema.get("schema_json")
            if not isinstance(schema_json, str) or not schema_json:
                raise RuntimeError("Schema hasil scan kosong")

            form_schema = FormSchema.model_validate_json(schema_json)
            form_analysis = analyze_form(form_schema)
            generation_config = _normalize_generation_config(req.generation_config)
            answer_history = storage.load_answer_history(req.form_url, user_id=user_id)
            used_persona_names = storage.load_used_persona_names(req.form_url, user_id=user_id)

            persona_objects, persona_provider = generate_persona_objects_with_provider(
                req.count,
                analysis=form_analysis,
                blocked_names=used_persona_names,
                persona_description=generation_config.persona_description,
                economic_class=generation_config.economic_class,
            )
            quality_issues = []
            for persona in persona_objects:
                result = validate_persona_quality(persona, form_analysis)
                if not result.passed:
                    quality_issues.append(f"{persona.name}: {', '.join(result.issues)}")
            if quality_issues:
                logger.warning("Persona quality warnings for session %s: %s", session_id, quality_issues[:5])
            else:
                logger.info("Persona quality check passed for session %s using %s", session_id, persona_provider)

            fields_by_page = _fields_by_page(form_schema)
            for i, persona in enumerate(persona_objects, start=1):
                persona_text = persona.to_prompt_text()
                try:
                    gen_resp, ans_provider = generate_answers_with_provider(
                        form_schema,
                        persona_text,
                        answer_history,
                        answer_instructions=generation_config.answer_instructions,
                        custom_answers=generation_config.custom_answers,
                    )
                    answer_history.append(gen_resp.answers)
                except Exception as e:
                    fail_count += 1
                    logger.warning("Session %s iterasi %d: generate gagal: %s", session_id, i, e)
                    storage.update_session_result(session_id, success_count, fail_count, status="running")
                    continue

                persona_summary = _persona_summary(persona, gen_resp.answers, form_schema)
                submit_status = "pending_review"
                http_code = 0
                error_message = None
                if not req.skip_submit:
                    delay = random.uniform(2.0, 5.0) if i > 1 else 0.0
                    try:
                        sub = submit(
                            req.form_url,
                            gen_resp.answers,
                            delay=delay,
                            page_count=form_schema.page_count,
                            fields_by_page=fields_by_page if form_schema.page_count > 1 else None,
                        )
                        submit_status = sub["status"]
                        http_code = sub["http_code"]
                        error_message = sub.get("error_message")
                    except Exception as e:
                        submit_status = "failed"
                        error_message = f"Submit error: {e}"
                        logger.warning("Session %s iterasi %d: submit gagal: %s", session_id, i, e)

                if submit_status == "success" or req.skip_submit:
                    if submit_status == "success":
                        storage.append_generated_persona_log(session_id, req.form_url, persona, user_id=user_id)
                    storage.append_submission_log(
                        session_id=session_id,
                        iteration=i,
                        answers=gen_resp.answers,
                        submit_status=submit_status,
                        error_message=error_message,
                        form_url=req.form_url,
                        persona_text=persona_summary,
                        http_code=http_code,
                        tokens_used=gen_resp.tokens_used,
                        retries=gen_resp.retries,
                        provider=ans_provider,
                        user_id=user_id,
                    )
                    if submit_status == "success":
                        success_count += 1
                else:
                    fail_count += 1

                storage.update_session_result(session_id, success_count, fail_count, status="running")

            storage.update_session_result(session_id, success_count, fail_count, status="completed")
        except Exception as e:
            logger.exception("Batch job %s failed: %s", session_id, e)
            storage.update_session_result(session_id, success_count, fail_count or req.count, status="failed")


def _start_batch_thread(session_id: str, req: BatchRunRequest, user_id: str) -> None:
    thread = threading.Thread(
        target=_run_batch_job,
        args=(session_id, req.model_copy(deep=True), user_id),
        name=f"batch-job-{session_id}",
        daemon=True,
    )
    thread.start()


@router.get("/sessions/{session_id}", response_model=BatchSessionStatus)
def get_batch_session(session_id: str, db: SessionDep, user: StoredUser = Depends(get_current_user)):
    storage = AppStorage(db)
    session = storage.load_session_detail(session_id, user_id=user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session generate tidak ditemukan")

    fields = []
    stored_schema = storage.load_form_schema(session_id, user_id=user.id)
    if stored_schema:
        schema_json = stored_schema.get("schema_json")
        if isinstance(schema_json, str) and schema_json:
            try:
                fields = FormSchema.model_validate_json(schema_json).fields
            except ValueError:
                fields = []

    results = [_iteration_from_log(row) for row in storage.load_session_logs(session_id, user_id=user.id)]
    success_count = sum(1 for result in results if result.submit_status == "success")
    fail_count = sum(1 for result in results if result.submit_status and result.submit_status not in {"success", "pending_review"})
    return BatchSessionStatus(
        session_id=str(session.get("session_id") or session.get("id") or session_id),
        form_url=str(session.get("form_url") or ""),
        form_title=str(session.get("form_title") or ""),
        count=int(session.get("count") or session.get("batch_count") or 0),
        success_count=success_count,
        fail_count=fail_count,
        mode=str(session.get("mode") or "auto"),
        status=str(session.get("status") or "running"),
        fields=fields,
        results=results,
    )


def _get_review_iteration(storage: AppStorage, session_id: str, iteration: int, user_id: str) -> tuple[dict[str, object], IterationResult]:
    session = storage.load_session_detail(session_id, user_id=user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    if str(session.get("mode") or "auto") != "review":
        raise HTTPException(status_code=400, detail="Aksi ini hanya bisa dipakai di mode review")

    logs = storage.load_session_logs(session_id, user_id=user_id)
    target = next((row for row in logs if int(row.get("iteration") or 0) == iteration), None)
    if not target:
        raise HTTPException(status_code=404, detail="Iterasi tidak ditemukan")
    result = _iteration_from_log(target)
    if result.submit_status != "pending_review":
        raise HTTPException(status_code=400, detail="Iterasi ini tidak dalam status review")
    return session, result


@router.patch("/sessions/{session_id}/iterations/{iteration}/answers", response_model=IterationResult)
def update_review_answers(session_id: str, iteration: int, req: BatchReviewAnswerUpdate, db: SessionDep, user: StoredUser = Depends(get_current_user)):
    storage = AppStorage(db)
    _session, result = _get_review_iteration(storage, session_id, iteration, user.id)

    try:
        storage.update_submission_answers(session_id, iteration, req.answers, user_id=user.id)
    except GoogleSheetsStorageError as e:
        raise HTTPException(status_code=503, detail=f"Storage Google Sheets sedang sibuk atau timeout: {e}") from e

    return result.model_copy(update={"answers": req.answers})


@router.post("/sessions/{session_id}/submit-reviewed", response_model=BatchSessionStatus)
def submit_reviewed_session(session_id: str, db: SessionDep, user: StoredUser = Depends(get_current_user)):
    storage = AppStorage(db)
    session = storage.load_session_detail(session_id, user_id=user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    if str(session.get("mode") or "auto") != "review":
        raise HTTPException(status_code=400, detail="Submit review hanya bisa dipakai di mode review")

    stored_schema = storage.load_form_schema(session_id, user_id=user.id)
    if not stored_schema:
        raise HTTPException(status_code=404, detail="Schema form tidak ditemukan")
    schema_json = stored_schema.get("schema_json")
    if not isinstance(schema_json, str) or not schema_json:
        raise HTTPException(status_code=422, detail="Schema form kosong")

    form_schema = FormSchema.model_validate_json(schema_json)
    fields_by_page = _fields_by_page(form_schema)
    results = [_iteration_from_log(row) for row in storage.load_session_logs(session_id, user_id=user.id)]
    pending_results = [result for result in results if result.submit_status == "pending_review"]
    if not pending_results:
        raise HTTPException(status_code=400, detail="Tidak ada iterasi review yang perlu disubmit")

    for result in pending_results:
        submit_status = "failed"
        http_code = 0
        error_message = None
        try:
            sub = submit(
                str(session.get("form_url") or ""),
                result.answers,
                page_count=form_schema.page_count,
                fields_by_page=fields_by_page if form_schema.page_count > 1 else None,
            )
            submit_status = str(sub["status"])
            http_code = int(sub["http_code"])
            error_message = sub.get("error_message")
        except Exception as e:
            error_message = f"Submit error: {e}"
        try:
            storage.update_submission_result(
                session_id,
                result.iteration,
                submit_status,
                http_code=http_code,
                error_message=error_message,
                user_id=user.id,
            )
        except GoogleSheetsStorageError as e:
            logger.warning("Gagal update hasil submit review session %s iterasi %d: %s", session_id, result.iteration, e)

    updated_results = [_iteration_from_log(row) for row in storage.load_session_logs(session_id, user_id=user.id)]
    success_count = sum(1 for result in updated_results if result.submit_status == "success")
    fail_count = sum(1 for result in updated_results if result.submit_status and result.submit_status not in {"success", "pending_review"})
    storage.update_session_result(session_id, success_count, fail_count, status="completed")
    return BatchSessionStatus(
        session_id=str(session.get("session_id") or session.get("id") or session_id),
        form_url=str(session.get("form_url") or ""),
        form_title=str(session.get("form_title") or ""),
        count=int(session.get("count") or session.get("batch_count") or 0),
        success_count=success_count,
        fail_count=fail_count,
        mode="review",
        status="completed",
        fields=form_schema.fields,
        results=updated_results,
    )


@router.post("/jobs", response_model=BatchSessionStatus)
def start_batch_job(req: BatchRunRequest, db: SessionDep, user: StoredUser = Depends(get_current_user)):
    storage = AppStorage(db)
    try:
        form_schema, _form_analysis, _schema_source = _resolve_form_schema(req, storage, user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Gagal parse form: {e}")

    try:
        stored_session = storage.create_session(
            form_url=req.form_url,
            count=req.count,
            status="running",
            user_id=user.id,
            form_title=form_schema.title,
            mode="review" if req.skip_submit else "auto",
        )
        storage.save_form_schema(stored_session.id, req.form_url, form_schema.model_dump_json(), user_id=user.id)
    except GoogleSheetsStorageError as e:
        raise HTTPException(status_code=503, detail=f"Storage Google Sheets sedang sibuk atau timeout: {e}") from e
    _start_batch_thread(stored_session.id, req, user.id)

    return BatchSessionStatus(
        session_id=stored_session.id,
        form_url=req.form_url,
        form_title=form_schema.title,
        count=req.count,
        success_count=0,
        fail_count=0,
        mode="review" if req.skip_submit else "auto",
        status="running",
        fields=form_schema.fields,
        results=[],
    )


@router.post("/run")
def batch_run(req: BatchRunRequest, db: SessionDep, request: Request, user: StoredUser = Depends(get_current_user)):
    if "text/event-stream" in request.headers.get("accept", ""):
        logger.info("Batch stream requested through /api/batch/run")
        return batch_run_stream(req, db, user)
    storage = AppStorage(db)
    try:
        form_schema, form_analysis, _schema_source = _resolve_form_schema(req, storage, user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Gagal parse form: {e}")

    generation_config = _normalize_generation_config(req.generation_config)
    answer_history = storage.load_answer_history(req.form_url, user_id=user.id)
    used_persona_names = storage.load_used_persona_names(req.form_url, user_id=user.id)
    logger.info("Loaded %d previous answer sets and %d used persona names for this form", len(answer_history), len(used_persona_names))

    # 2. Create session + save form schema record
    stored_session = storage.create_session(
        form_url=req.form_url,
        count=req.count,
        status="running",
        user_id=user.id,
        form_title=form_schema.title,
        mode="review" if req.skip_submit else "auto",
    )
    storage.save_form_schema(stored_session.id, req.form_url, form_schema.model_dump_json(), user_id=user.id)

    # 3. Generate N personas (structured Persona objects)
    try:
        persona_objects = generate_persona_objects(
            req.count,
            analysis=form_analysis,
            blocked_names=used_persona_names,
            persona_description=generation_config.persona_description,
            economic_class=generation_config.economic_class,
        )
    except Exception as e:
        storage.update_session_result(stored_session.id, 0, req.count, status="failed")
        raise HTTPException(status_code=502, detail=f"Gagal generate persona: {e}")

    # 4. For each persona: generate answers + submit
    results: list[IterationResult] = []
    success_count = 0
    fail_count = 0

    for i, persona in enumerate(persona_objects, start=1):
        persona_text = persona.to_prompt_text()
        iteration_result = IterationResult(
            iteration=i,
            persona_text=_persona_summary(persona),
            answers={},
            tokens_used=0,
            retries=0,
            submit_status="failed",
            http_code=0,
        )

        # Generate answers
        try:
            gen = generate_answers(
                form_schema,
                persona_text,
                answer_history,
                answer_instructions=generation_config.answer_instructions,
                custom_answers=generation_config.custom_answers,
            )
            iteration_result.answers = gen.answers
            iteration_result.persona_text = _persona_summary(persona, gen.answers, form_schema)
            similarity = closest_answer_similarity(gen.answers, answer_history, form_schema)
            if similarity.compared_fields > 0 and similarity.score >= 0.82:
                logger.warning(
                    "Iteration %d answer similarity warning: %.2f (%d/%d fields)",
                    i,
                    similarity.score,
                    similarity.matched_fields,
                    similarity.compared_fields,
                )
            answer_history.append(gen.answers)
            iteration_result.tokens_used = gen.tokens_used
            iteration_result.retries = gen.retries
        except Exception as e:
            logger.warning("Iterasi %d: generate gagal: %s", i, e)
            iteration_result.error_message = f"Generate error: {e}"
            results.append(iteration_result)
            fail_count += 1
            continue

        # Submit (unless skip_submit is true for review mode)
        if not req.skip_submit:
            delay = random.uniform(2.0, 5.0) if i > 1 else 0.0
            
            # Build fields_by_page mapping for multi-page forms
            fields_by_page: dict[int, list[str]] = {}
            for field in form_schema.fields:
                page_idx = getattr(field, 'page_index', 0)
                if page_idx not in fields_by_page:
                    fields_by_page[page_idx] = []
                fields_by_page[page_idx].append(field.entry_id)
            
            try:
                sub = submit(
                    req.form_url, 
                    gen.answers, 
                    delay=delay, 
                    page_count=form_schema.page_count,
                    fields_by_page=fields_by_page if form_schema.page_count > 1 else None
                )
                iteration_result.submit_status = sub["status"]
                iteration_result.http_code = sub["http_code"]
                iteration_result.error_message = sub.get("error_message")
            except Exception as e:
                logger.warning("Iterasi %d: submit gagal: %s", i, e)
                iteration_result.submit_status = "failed"
                iteration_result.error_message = f"Submit error: {e}"
        else:
            # Review mode: mark as pending (not submitted yet)
            iteration_result.submit_status = "pending_review"
            iteration_result.http_code = 0
            iteration_result.error_message = None

        if iteration_result.submit_status == "success":
            storage.append_generated_persona_log(stored_session.id, req.form_url, persona, user_id=user.id)
            log = storage.append_submission_log(
                session_id=stored_session.id,
                iteration=i,
                answers=gen.answers,
                submit_status=iteration_result.submit_status,
                error_message=iteration_result.error_message,
                form_url=req.form_url,
                persona_text=iteration_result.persona_text,
                http_code=iteration_result.http_code,
                tokens_used=iteration_result.tokens_used,
                retries=iteration_result.retries,
                user_id=user.id,
            )
            iteration_result.log_id = log.id
            success_count += 1
        else:
            fail_count += 1

        results.append(iteration_result)

    storage.update_session_result(stored_session.id, success_count, fail_count)

    return BatchRunResponse(
        form_title=form_schema.title,
        session_id=stored_session.id,
        count=req.count,
        results=results,
        success_count=success_count,
        fail_count=fail_count,
    )


@router.post("/run-stream")
@router.post("/run-stream/")
def batch_run_stream(req: BatchRunRequest, db: SessionDep, user: StoredUser = Depends(get_current_user)):
    """
    Server-Sent Events endpoint for real-time batch execution updates.
    Yields JSON events: { phase, message, provider?, ... }
    """
    logger.info("Batch stream requested through /api/batch/run-stream")
    storage = AppStorage(db)

    def event_stream():
        yield _sse("log", {"phase": "init", "message": "Starting backend background job..."})
        try:
            form_schema, _form_analysis, schema_source = _resolve_form_schema(req, storage, user)
            parsed_message = f"Scanned form loaded: {form_schema.title}" if schema_source == "saved" else f"Form parsed: {form_schema.title}"
            yield _sse("log", {"phase": "parse", "message": parsed_message})
        except HTTPException as e:
            yield _sse("error", {"message": str(e.detail)})
            return
        except Exception as e:
            yield _sse("error", {"message": f"Gagal parse form: {e}"})
            return

        stored_session = storage.create_session(
            form_url=req.form_url,
            count=req.count,
            status="running",
            user_id=user.id,
            form_title=form_schema.title,
            mode="review" if req.skip_submit else "auto",
        )
        storage.save_form_schema(stored_session.id, req.form_url, form_schema.model_dump_json(), user_id=user.id)
        _start_batch_thread(stored_session.id, req, user.id)

        yield _sse("session_started", {
            "session_id": stored_session.id,
            "form_url": req.form_url,
            "form_title": form_schema.title,
            "count": req.count,
            "mode": "review" if req.skip_submit else "auto",
            "status": "running",
        })
        yield _sse("log", {"phase": "generate", "message": "Background job berjalan di backend; stream ini hanya memantau progress."})

        emitted_logs: set[str] = set()
        while True:
            session = storage.load_session_detail(stored_session.id, user_id=user.id)
            logs = storage.load_session_logs(stored_session.id, user_id=user.id)
            results = [_iteration_from_log(row) for row in logs]
            for result in results:
                key = result.log_id or f"{result.iteration}:{result.submit_status}"
                if key in emitted_logs:
                    continue
                emitted_logs.add(key)
                yield _sse("iteration_result", result.model_dump())

            status = str((session or {}).get("status") or "running")
            if status in {"completed", "failed"}:
                success_count = sum(1 for result in results if result.submit_status == "success")
                fail_count = sum(1 for result in results if result.submit_status and result.submit_status not in {"success", "pending_review"})
                complete_data = {
                    "form_title": form_schema.title,
                    "session_id": stored_session.id,
                    "count": req.count,
                    "results": [result.model_dump() for result in results],
                    "success_count": success_count,
                    "fail_count": fail_count,
                }
                if status == "failed":
                    yield _sse("error", {"message": "Background job gagal. Cek log backend untuk detail."})
                yield _sse("complete", complete_data)
                return

            time.sleep(2.0)

    return _streaming_response(event_stream())
