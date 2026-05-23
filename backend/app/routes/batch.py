import json
import logging
import random
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import text

from app.db import SessionDep
from app.core.parser import parse_form_with_analysis
from app.core.generator import (
    generate_persona_objects, generate_answers,
    generate_persona_objects_with_provider, generate_answers_with_provider,
)
from app.core.quality import closest_answer_similarity, validate_persona_quality
from app.core.submitter import submit
from app.models.session import FormSession
from app.models.submission_log import SubmissionLog
from app.models.form_schema import FormSchemaRecord
from app.models.generated_persona_log import GeneratedPersonaLog
from app.schemas.batch import BatchRunRequest, BatchRunResponse, IterationResult
from sqlmodel import col, select

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


def _load_used_persona_names(db, form_url: str) -> set[str]:
    rows = db.exec(select(GeneratedPersonaLog.name).where(GeneratedPersonaLog.form_url == form_url)).all()
    return {name for name in rows if name}


def _log_generated_persona(db, session_id: int, form_url: str, persona) -> None:
    db.add(GeneratedPersonaLog(
        session_id=session_id,
        form_url=form_url,
        name=persona.name,
        gender=persona.gender,
        age=persona.age,
        occupation=persona.occupation,
        persona_json=persona.model_dump_json(),
    ))


def _load_answer_history(db, form_url: str, limit: int = 12) -> list[dict[str, Any]]:
    session_ids = db.exec(
        select(FormSession.id)
        .where(col(FormSession.form_url) == form_url)
        .order_by(text("created_at DESC"))
        .limit(limit)
    ).all()
    if not session_ids:
        return []

    rows = db.exec(
        select(SubmissionLog.answers_used)
        .where(col(SubmissionLog.session_id).in_(session_ids))
        .order_by(text("submitted_at DESC"))
        .limit(limit)
    ).all()

    history: list[dict[str, Any]] = []
    for raw_answers in rows:
        try:
            parsed = json.loads(raw_answers)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            history.append(parsed)
    return history


@router.post("/run")
def batch_run(req: BatchRunRequest, db: SessionDep, request: Request):
    if "text/event-stream" in request.headers.get("accept", ""):
        logger.info("Batch stream requested through /api/batch/run")
        return batch_run_stream(req)
    # 1. Parse form + analyze
    try:
        form_schema, form_analysis = parse_form_with_analysis(req.form_url)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Gagal parse form: {e}")

    answer_history = _load_answer_history(db, req.form_url)
    used_persona_names = _load_used_persona_names(db, req.form_url)
    logger.info("Loaded %d previous answer sets and %d used persona names for this form", len(answer_history), len(used_persona_names))

    # 2. Create session + save form schema record
    db_session = FormSession(
        form_url=req.form_url,
        batch_count=req.count,
        status="running",
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    schema_record = FormSchemaRecord(
        session_id=db_session.id,
        schema_data=form_schema.model_dump_json(),
    )
    db.add(schema_record)
    db.commit()

    # 3. Generate N personas (structured Persona objects)
    try:
        persona_objects = generate_persona_objects(req.count, analysis=form_analysis, blocked_names=used_persona_names)
    except Exception as e:
        db_session.status = "failed"
        db.add(db_session)
        db.commit()
        raise HTTPException(status_code=502, detail=f"Gagal generate persona: {e}")

    # 4. For each persona: generate answers + submit
    results: list[IterationResult] = []
    success_count = 0
    fail_count = 0

    for i, persona in enumerate(persona_objects, start=1):
        _log_generated_persona(db, db_session.id or 0, req.form_url, persona)
        persona_text = persona.to_prompt_text()
        iteration_result = IterationResult(
            iteration=i,
            persona_text=f"{persona.name}, {persona.age} thn, {persona.occupation} ({persona.city})",
            answers={},
            tokens_used=0,
            retries=0,
            submit_status="failed",
            http_code=0,
        )

        # Generate answers
        try:
            gen = generate_answers(form_schema, persona_text, answer_history)
            iteration_result.answers = gen.answers
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

        # Log to DB
        log = SubmissionLog(
            session_id=db_session.id,
            iteration_number=i,
            answers_used=json.dumps(gen.answers),
            submit_status=iteration_result.submit_status,
            error_message=iteration_result.error_message,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        iteration_result.log_id = log.id

        if iteration_result.submit_status == "success":
            success_count += 1
            db_session.success_count += 1
        else:
            fail_count += 1
            db_session.fail_count += 1

        results.append(iteration_result)

    db_session.status = "completed"
    db.add(db_session)
    db.commit()

    return BatchRunResponse(
        form_title=form_schema.title,
        session_id=db_session.id or 0,
        count=req.count,
        results=results,
        success_count=success_count,
        fail_count=fail_count,
    )


@router.post("/run-stream")
@router.post("/run-stream/")
def batch_run_stream(req: BatchRunRequest):
    """
    Server-Sent Events endpoint for real-time batch execution updates.
    Yields JSON events: { phase, message, provider?, ... }
    """
    logger.info("Batch stream requested through /api/batch/run-stream")
    from app.db import engine
    from sqlmodel import Session

    def event_stream():
        yield _sse("log", {"phase": "init", "message": "Initializing AI pipeline..."})

        # DB session has to be managed manually in a generator
        with Session(engine) as db:
            # 1. Parse
            yield _sse("log", {"phase": "parse", "message": "Parsing form structure..."})
            try:
                form_schema, form_analysis = parse_form_with_analysis(req.form_url)
                yield _sse("log", {"phase": "parse", "message": f"Form parsed: {form_schema.title}"})
            except Exception as e:
                yield _sse("error", {"message": f"Gagal parse form: {e}"})
                return

            answer_history = _load_answer_history(db, req.form_url)
            used_persona_names = _load_used_persona_names(db, req.form_url)
            yield _sse("log", {"phase": "generate", "message": f"Loaded {len(answer_history)} previous answer sets and {len(used_persona_names)} used names for this form."})

            db_session = FormSession(
                form_url=req.form_url,
                batch_count=req.count,
                status="running",
            )
            db.add(db_session)
            db.commit()
            db.refresh(db_session)

            schema_record = FormSchemaRecord(
                session_id=db_session.id,
                schema_data=form_schema.model_dump_json(),
            )
            db.add(schema_record)
            db.commit()

            # 2. Generate Personas
            yield _sse("log", {"phase": "generate", "message": f"Generating {req.count} personas..."})
            try:
                persona_objects, persona_provider = generate_persona_objects_with_provider(req.count, analysis=form_analysis, blocked_names=used_persona_names)
                yield _sse("provider", {"phase": "generate", "provider": persona_provider})
                yield _sse("log", {"phase": "generate", "message": f"Personas generated successfully using {persona_provider}"})
                quality_issues = []
                for persona in persona_objects:
                    result = validate_persona_quality(persona, form_analysis)
                    if not result.passed:
                        quality_issues.append(f"{persona.name}: {', '.join(result.issues)}")
                if quality_issues:
                    yield _sse("log", {"phase": "generate", "message": f"Persona quality warnings: {len(quality_issues)} issue(s)."})
                    logger.warning("Persona quality warnings: %s", quality_issues[:5])
                else:
                    yield _sse("log", {"phase": "generate", "message": "Persona quality check passed."})
            except Exception as e:
                db_session.status = "failed"
                db.add(db_session)
                db.commit()
                yield _sse("error", {"message": f"Gagal generate persona: {e}"})
                return

            # 3. Generate Answers & Submit
            results = []
            success_count = 0
            fail_count = 0

            for i, persona in enumerate(persona_objects, start=1):
                _log_generated_persona(db, db_session.id or 0, req.form_url, persona)
                yield _sse("log", {"phase": "submit", "message": f"Processing iteration {i}/{req.count} ({persona.name})..."})
                persona_text = persona.to_prompt_text()

                iter_res = {
                    "iteration": i,
                    "persona_text": f"{persona.name}, {persona.age} thn, {persona.occupation} ({persona.city})",
                    "answers": {},
                    "tokens_used": 0,
                    "retries": 0,
                    "submit_status": "failed",
                    "http_code": 0,
                    "error_message": None
                }

                # Generate answers
                try:
                    gen_resp, ans_provider = generate_answers_with_provider(form_schema, persona_text, answer_history)
                    iter_res["answers"] = gen_resp.answers
                    iter_res["tokens_used"] = gen_resp.tokens_used
                    iter_res["retries"] = gen_resp.retries
                    similarity = closest_answer_similarity(gen_resp.answers, answer_history, form_schema)
                    answer_history.append(gen_resp.answers)
                    yield _sse("provider", {"phase": "submit", "provider": ans_provider, "iteration": i})
                    yield _sse("log", {"phase": "submit", "message": f"Persona {i}: generated with {ans_provider} after {gen_resp.retries + 1} attempt(s), {gen_resp.tokens_used} tokens."})
                    if similarity.compared_fields > 0 and similarity.score >= 0.82:
                        yield _sse("log", {"phase": "submit", "message": f"Answer history applied; warning persona {i}: {similarity.score:.0%} similar to prior answers."})
                    else:
                        yield _sse("log", {"phase": "submit", "message": f"Answer history applied before persona {i}; generated answer accepted after validation."})
                except Exception as e:
                    logger.warning("Iterasi %d: generate gagal: %s", i, e)
                    iter_res["error_message"] = f"Generate error: {e}"
                    fail_count += 1
                    results.append(iter_res)
                    yield _sse("iteration_result", iter_res)
                    continue

                # Submit
                if not req.skip_submit:
                    delay = random.uniform(2.0, 5.0) if i > 1 else 0.0
                    fields_by_page = {}
                    for field in form_schema.fields:
                        page_idx = getattr(field, 'page_index', 0)
                        if page_idx not in fields_by_page:
                            fields_by_page[page_idx] = []
                        fields_by_page[page_idx].append(field.entry_id)

                    try:
                        sub = submit(
                            req.form_url,
                            gen_resp.answers,
                            delay=delay,
                            page_count=form_schema.page_count,
                            fields_by_page=fields_by_page if form_schema.page_count > 1 else None
                        )
                        iter_res["submit_status"] = sub["status"]
                        iter_res["http_code"] = sub["http_code"]
                        iter_res["error_message"] = sub.get("error_message")
                    except Exception as e:
                        logger.warning("Iterasi %d: submit gagal: %s", i, e)
                        iter_res["submit_status"] = "failed"
                        iter_res["error_message"] = f"Submit error: {e}"
                else:
                    iter_res["submit_status"] = "pending_review"

                # Log to DB
                log = SubmissionLog(
                    session_id=db_session.id,
                    iteration_number=i,
                    answers_used=json.dumps(gen_resp.answers),
                    submit_status=iter_res["submit_status"],
                    error_message=iter_res["error_message"],
                )
                db.add(log)
                db.commit()
                db.refresh(log)

                iter_res["log_id"] = log.id

                if iter_res["submit_status"] == "success":
                    success_count += 1
                    db_session.success_count += 1
                else:
                    fail_count += 1
                    db_session.fail_count += 1

                results.append(iter_res)
                yield _sse("iteration_result", iter_res)

            db_session.status = "completed"
            db.add(db_session)
            db.commit()

            yield _sse("complete", {
                "form_title": form_schema.title,
                "session_id": db_session.id or 0,
                "count": req.count,
                "results": results,
                "success_count": success_count,
                "fail_count": fail_count,
            })

    return _streaming_response(event_stream())
