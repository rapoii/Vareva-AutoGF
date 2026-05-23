"""
AI Answer Generator — builds a structured prompt from form schema + persona,
calls OpenAI, validates the JSON output against the form's option constraints,
and retries up to llm_max_retries times on validation failure.
"""

import json
import logging
from dataclasses import dataclass
from typing import Any, Sequence

from openai import OpenAI

from app.config import get_settings
from app.schemas.form import FormSchema, FormAnalysis, QuestionType
from app.schemas.answer import AnswerMap, GenerateResponse, Persona
from app.data.indonesian_names import get_random_names

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AIProvider:
    name: str
    model: str
    client: OpenAI
    fallback_models: tuple[str, ...] = ()


def _short_text(value: str, limit: int = 120) -> str:
    text = " ".join(value.split())
    return text if len(text) <= limit else f"{text[:limit].rstrip()}…"


def _compact_persona_text(persona_text: str) -> str:
    key_map = {
        "Nama": "name",
        "Usia": "age",
        "Jenis Kelamin": "gender",
        "Kota": "city",
        "Pekerjaan": "job",
        "Pendidikan": "edu",
        "Minat": "interests",
        "Kebiasaan Sehari-hari": "habits",
        "Kepribadian & Gaya Bicara": "tone",
        "Motivasi Mengisi Form": "motivation",
    }
    parts: list[str] = []
    for raw_line in persona_text.splitlines():
        if ":" not in raw_line:
            continue
        key, value = raw_line.split(":", 1)
        short_key = key_map.get(key.strip(), key.strip())
        parts.append(f"{short_key}={_short_text(value.strip(), 80)}")
    return "; ".join(parts)


def _build_system_prompt(persona_text: str) -> str:
    persona = _compact_persona_text(persona_text)
    return (
        f"Fill this Google Form as persona: {persona}\n"
        "Return JSON only. Keys must be entry IDs. Identity answers must match persona exactly: "
        "name/nama=name, age/umur/usia=age number, gender=gender, job/pekerjaan/profesi=job exactly. "
        "Never add job details like semester, industry, company, IT, or marketing."
    )


def _compact_value(value: Any) -> Any:
    if isinstance(value, list):
        return [_short_text(str(item), 60) for item in value[:4]]
    if isinstance(value, str):
        return _short_text(value, 90)
    return value


def _format_answer_history(answer_history: Sequence[dict[str, Any]], max_items: int = 5) -> str:
    history_lines: list[str] = []
    for answers in answer_history[-max_items:]:
        compact_answers = {
            entry_id: _compact_value(value)
            for entry_id, value in answers.items()
            if not entry_id.endswith(".other_option_response")
        }
        if compact_answers:
            history_lines.append(json.dumps(compact_answers, ensure_ascii=False, separators=(",", ":")))
    return "\n".join(history_lines)


def _field_prompt_line(field) -> str:
    required = "!" if field.required else ""
    question = _short_text(field.question_text, 120)
    line = f"{field.entry_id}|{field.question_type.value}{required}|{question}"
    if field.options:
        options = [_short_text(str(option), 70) for option in field.options]
        line += f"|opts={json.dumps(options, ensure_ascii=False, separators=(',', ':'))}"
    elif field.question_type == QuestionType.LINEAR_SCALE:
        line += f"|scale={field.scale_low}-{field.scale_high}"
    return line


def _build_user_prompt(schema: FormSchema, answer_history: Sequence[dict[str, Any]] | None = None) -> str:
    lines = [
        f"Form: {_short_text(schema.title, 100)}",
    ]
    if schema.description:
        lines.append(f"Desc: {_short_text(schema.description, 180)}")

    lines.append("Fields format: entry_id|type(!=required)|question|opts=[...]")
    lines.extend(_field_prompt_line(field) for field in schema.fields)

    if answer_history:
        formatted_history = _format_answer_history(answer_history)
        if formatted_history:
            lines += [
                "Used answers for same form; avoid same non-identity combo:",
                formatted_history,
            ]

    lines += [
        "Rules: output one JSON object only; include all required fields.",
        "MC/DROPDOWN/LINEAR=value exactly from opts; CHECKBOXES=array from opts; text=string.",
        "If value is 'Yang lain:', also add '<entry_id>.other_option_response' with a specific custom answer.",
        "Vary opinions/ratings/choices/text from used answers; keep identity fields exact.",
    ]
    return "\n".join(lines)


def _validate_answers(answers: dict[str, Any], schema: FormSchema) -> list[str]:
    """Returns list of validation error messages. Empty list = valid."""
    errors: list[str] = []
    field_map = {f.entry_id: f for f in schema.fields}

    for entry_id, value in answers.items():
        # Skip special Google Forms parameters like .other_option_response
        if entry_id.endswith(".other_option_response"):
            continue
        field = field_map.get(entry_id)
        if not field:
            errors.append(f"Unknown entry_id: {entry_id}")
            continue

        if field.question_type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN):
            if value not in field.options:
                errors.append(
                    f"{entry_id}: '{value}' is not a valid option. Valid: {field.options}"
                )

        elif field.question_type == QuestionType.CHECKBOXES:
            if isinstance(value, str):
                value = [value]
            invalid = [v for v in value if v not in field.options]
            if invalid:
                errors.append(
                    f"{entry_id}: {invalid} not in valid options {field.options}"
                )

        elif field.question_type == QuestionType.LINEAR_SCALE:
            str_val = str(value)
            if str_val not in field.options:
                errors.append(
                    f"{entry_id}: '{value}' not a valid scale value. Valid: {field.options}"
                )

    for field in schema.fields:
        if field.required and field.entry_id not in answers:
            errors.append(f"Missing required field: {field.entry_id}")

    return errors


def _make_providers() -> list[AIProvider]:
    """Return configured AI providers in retry priority order."""
    settings = get_settings()
    providers: list[AIProvider] = []

    if settings.gemini_api_key:
        providers.append(AIProvider(
            name="Gemini",
            model=settings.gemini_model,
            client=OpenAI(api_key=settings.gemini_api_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/"),
        ))
    if settings.groq_api_key:
        providers.append(AIProvider(
            name="Groq",
            model=settings.groq_model,
            client=OpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1"),
        ))
    if settings.cerebras_api_key:
        providers.append(AIProvider(
            name="Cerebras",
            model=settings.cerebras_model,
            client=OpenAI(api_key=settings.cerebras_api_key, base_url="https://api.cerebras.ai/v1"),
        ))
    if settings.openrouter_api_key:
        providers.append(AIProvider(
            name="OpenRouter",
            model=settings.openrouter_model,
            client=OpenAI(api_key=settings.openrouter_api_key, base_url=settings.openrouter_base_url),
            fallback_models=tuple(settings.openrouter_fallback_model_list),
        ))

    return providers


def _completion_extra_kwargs(provider: AIProvider) -> dict[str, Any]:
    """OpenRouter supports server-side model fallback via extra_body.models."""
    if not provider.fallback_models:
        return {}
    return {"extra_body": {"models": list(provider.fallback_models)}}


def _try_generate_personas(provider: AIProvider, n: int, prompt: str) -> tuple[list[Persona], str]:
    """Try to generate personas from a single provider. Returns (personas, provider_name) on success."""
    if provider.fallback_models:
        logger.info(
            "Trying persona generation with %s (%s; fallbacks: %s)",
            provider.name,
            provider.model,
            ", ".join(provider.fallback_models),
        )
    else:
        logger.info("Trying persona generation with %s (%s)", provider.name, provider.model)
    response = provider.client.chat.completions.create(  # type: ignore[call-overload]
        model=provider.model,
        messages=[{"role": "user", "content": prompt}],  # type: ignore[list-item]
        response_format={"type": "json_object"},
        temperature=1.1,
        **_completion_extra_kwargs(provider),
    )
    raw = response.choices[0].message.content or "{}"
    data = json.loads(raw)

    raw_personas: list[dict] = data.get("personas") or data.get("persona") or []
    if isinstance(raw_personas, dict):
        raw_personas = [raw_personas]

    personas: list[Persona] = []
    for p in raw_personas[:n]:
        try:
            personas.append(Persona(**p))
        except Exception as e:
            logger.warning("%s: Gagal parse persona: %s", provider.name, e)

    if len(personas) < n:
        raise ValueError(f"{provider.name} hanya menghasilkan {len(personas)}/{n} persona valid")

    logger.info("%s: Berhasil generate %d personas", provider.name, len(personas))
    return personas, provider.name


def _build_persona_prompt(n: int, context_block: str, audience_block: str, assigned_block: str) -> str:
    """Build the persona generation prompt with compact instructions."""
    jobs = [
        "Mahasiswa", "Karyawan swasta", "Wiraswasta", "Freelancer", "PNS", "Guru", "Dosen",
        "Pedagang", "Ibu rumah tangga", "Buruh", "Ojol", "Pegawai BUMN", "Karyawan pabrik",
        "Petani", "Nelayan", "Sopir", "Tukang", "Perawat", "Dokter", "Apoteker",
        "Pengacara", "Akuntan", "Arsitek", "Desainer", "Fotografer", "Penulis", "Wartawan",
        "Youtuber", "Influencer", "Atlet", "Musisi", "Seniman",
    ]
    return (
        f"Buat {n} persona Indonesia realistis untuk mengisi Google Form."
        f"{context_block}{audience_block}\n"
        f"Nama/gender WAJIB pakai ini, jangan buat nama baru:\n{assigned_block}\n"
        "Aturan: usia/kota/job/minat/kebiasaan harus cocok dengan konteks & target form; "
        "contoh coffee shop/Starbucks biasanya 18-30 mahasiswa/karyawan/freelancer, kampus 18-25 mahasiswa. "
        "Jangan persona tidak masuk akal untuk topik form. "
        f"occupation harus persis salah satu dari: {json.dumps(jobs, ensure_ascii=False, separators=(',', ':'))}. "
        "Jangan tambah detail pekerjaan seperti semester, jurusan, IT, marketing, perusahaan. "
        "Variasikan kepribadian dan motivasi; tetap natural Indonesia.\n"
        f"Return JSON only: {{\"personas\":[exactly {n} objects]}}. "
        "Fields per object: name, age, gender('Laki-laki'|'Perempuan'), city, occupation, education, interests(array), daily_habits, personality_tone, motivation."
    )


def generate_persona_objects(
    n: int,
    analysis: "FormAnalysis | None" = None,
    blocked_names: set[str] | None = None,
) -> list[Persona]:
    """
    Generate n distinct, realistic Indonesian personas.
    Tries providers in order: Gemini → Groq → Cerebras → OpenRouter.
    Raises if every configured AI provider fails; no hardcoded persona generation.
    """
    personas, _provider_name = generate_persona_objects_with_provider(n, analysis=analysis, blocked_names=blocked_names)
    return personas


def generate_persona_objects_with_provider(
    n: int,
    analysis: "FormAnalysis | None" = None,
    blocked_names: set[str] | None = None,
) -> tuple[list[Persona], str]:
    """Generate personas and return the provider name that succeeded."""
    context_block = ""
    audience_block = ""
    if analysis:
        context_block = f"\nKonteks: {_short_text(analysis.context_for_persona, 260)}\n"
        if analysis.target_audience_hint:
            audience_block = f"Target: {_short_text(analysis.target_audience_hint, 180)}\n"

    name_pairs = get_random_names(n, blocked_names=blocked_names)
    assigned_personas = []
    for i, (name, gender) in enumerate(name_pairs, start=1):
        g_label = "Laki-laki" if gender == "male" else "Perempuan"
        assigned_personas.append(f"Persona {i}: Nama='{name}', Gender='{g_label}'")

    assigned_block = "\n".join(assigned_personas)
    prompt = _build_persona_prompt(n, context_block, audience_block, assigned_block)

    providers = _make_providers()
    for provider in providers:
        try:
            return _try_generate_personas(provider, n, prompt)
        except Exception as e:
            logger.warning("Provider %s gagal: %s — mencoba provider berikutnya", provider.name, str(e)[:120])

    raise ValueError("Gagal generate persona: semua AI provider tidak tersedia atau rate limited. Coba lagi beberapa saat.")


def generate_personas(n: int, context: str = "") -> list[str]:
    """Legacy wrapper — generate personas as plain text strings."""
    from app.schemas.form import FormAnalysis as FA
    analysis = FA(
        topic_summary=context,
        is_multi_page=False,
        page_count=1,
        question_types=[],
        requires_personal_info=False,
        context_for_persona=context,
        target_audience_hint="",
    ) if context else None
    persona_objects = generate_persona_objects(n, analysis=analysis)
    return [p.to_prompt_text() for p in persona_objects]


def generate_answers_with_provider(
    schema: FormSchema,
    persona_text: str,
    answer_history: Sequence[dict[str, Any]] | None = None,
) -> tuple[GenerateResponse, str]:
    """
    Generate form answers using AI providers in retry order.
    Returns (GenerateResponse, provider_name).
    """
    settings = get_settings()
    providers = _make_providers()

    if not providers:
        raise ValueError("Tidak ada AI provider yang dikonfigurasi")

    system_prompt = _build_system_prompt(persona_text)
    user_prompt = _build_user_prompt(schema, answer_history)

    last_errors: list[str] = []

    # Try each configured AI provider in retry order.
    for provider in providers:
        if provider.fallback_models:
            logger.info(
                "Trying answer generation with %s (%s; fallbacks: %s)",
                provider.name,
                provider.model,
                ", ".join(provider.fallback_models),
            )
        else:
            logger.info("Trying answer generation with %s (%s)", provider.name, provider.model)
        total_tokens = 0
        retries = 0

        try:
            messages: list[dict] = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            for attempt in range(settings.llm_max_retries + 1):
                retries = attempt
                response = provider.client.chat.completions.create(  # type: ignore[call-overload]
                    model=provider.model,
                    messages=messages,  # type: ignore[arg-type]
                    response_format={"type": "json_object"},
                    temperature=0.8,
                    **_completion_extra_kwargs(provider),
                )

                total_tokens += response.usage.total_tokens if response.usage else 0
                raw_content = response.choices[0].message.content or "{}"

                try:
                    raw_answers: dict = json.loads(raw_content)
                except json.JSONDecodeError as e:
                    last_errors = [f"JSON parse error: {e}"]
                    logger.warning("%s attempt %d: JSON parse failed: %s", provider.name, attempt + 1, e)
                    messages.append({"role": "assistant", "content": raw_content})
                    messages.append({
                        "role": "user",
                        "content": f"Your response was not valid JSON. Error: {e}. Please try again."
                    })
                    continue

                validation_errors = _validate_answers(raw_answers, schema)
                if not validation_errors:
                    logger.info("%s: answers valid after %d attempt(s)", provider.name, attempt + 1)
                    AnswerMap(answers=raw_answers)
                    return GenerateResponse(
                        answers=raw_answers,
                        tokens_used=total_tokens,
                        retries=retries,
                    ), provider.name

                last_errors = validation_errors
                logger.warning(
                    "%s attempt %d: validation failed (%d errors): %s",
                    provider.name, attempt + 1, len(validation_errors), validation_errors[:3],
                )

                if attempt < settings.llm_max_retries:
                    error_summary = "\n".join(f"- {e}" for e in validation_errors[:5])
                    messages.append({"role": "assistant", "content": raw_content})
                    messages.append({
                        "role": "user",
                        "content": (
                            f"Your answers have validation errors. Please fix them:\n{error_summary}\n"
                            "Return only the corrected JSON object."
                        ),
                    })

        except Exception as e:
            logger.warning("Provider %s gagal untuk generate answers: %s — mencoba berikutnya", provider.name, str(e)[:120])
            last_errors = [str(e)]
            continue

    raise ValueError(
        f"Semua provider gagal generate answers. Last errors: {last_errors}"
    )


def generate_answers(
    schema: FormSchema,
    persona_text: str,
    answer_history: Sequence[dict[str, Any]] | None = None,
) -> GenerateResponse:
    """Legacy wrapper for generating form answers without returning provider info."""
    resp, _provider_name = generate_answers_with_provider(schema, persona_text, answer_history)
    return resp
