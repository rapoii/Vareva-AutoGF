from __future__ import annotations

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any

from app.schemas.answer import Persona
from app.schemas.form import FormAnalysis, FormSchema, QuestionType

OCCUPATION_WHITELIST = {
    "Mahasiswa",
    "Karyawan swasta",
    "Wiraswasta",
    "Freelancer",
    "PNS",
    "Guru",
    "Dosen",
    "Pedagang",
    "Ibu rumah tangga",
    "Buruh",
    "Ojol",
    "Pegawai BUMN",
    "Karyawan pabrik",
    "Petani",
    "Nelayan",
    "Sopir",
    "Tukang",
    "Perawat",
    "Dokter",
    "Apoteker",
    "Pengacara",
    "Akuntan",
    "Arsitek",
    "Desainer",
    "Fotografer",
    "Penulis",
    "Wartawan",
    "Youtuber",
    "Influencer",
    "Atlet",
    "Musisi",
    "Seniman",
}

IDENTITY_KEYWORDS = (
    "nama",
    "name",
    "usia",
    "umur",
    "age",
    "jenis kelamin",
    "gender",
    "pekerjaan",
    "profesi",
    "occupation",
)

MASCULINE_NAME_PARTS = {
    "andi",
    "irawan",
    "wicaksono",
    "yanto",
    "saputra",
    "putra",
    "prasetyo",
    "santoso",
    "setiawan",
    "nugroho",
    "gunawan",
}


@dataclass(frozen=True)
class SimilarityResult:
    score: float
    matched_fields: int
    compared_fields: int
    closest_history_index: int | None


@dataclass(frozen=True)
class PersonaQualityResult:
    passed: bool
    issues: list[str]


def _normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value).strip().casefold())


def _is_identity_field(question_text: str) -> bool:
    normalized = _normalize_text(question_text)
    return any(keyword in normalized for keyword in IDENTITY_KEYWORDS)


def _value_similarity(current: Any, previous: Any, question_type: QuestionType) -> float:
    if question_type == QuestionType.CHECKBOXES:
        current_set = set(current if isinstance(current, list) else [current])
        previous_set = set(previous if isinstance(previous, list) else [previous])
        if not current_set and not previous_set:
            return 1.0
        if not current_set or not previous_set:
            return 0.0
        return len(current_set & previous_set) / len(current_set | previous_set)

    if question_type in (QuestionType.SHORT_ANSWER, QuestionType.PARAGRAPH):
        current_text = _normalize_text(current)
        previous_text = _normalize_text(previous)
        if not current_text and not previous_text:
            return 1.0
        if not current_text or not previous_text:
            return 0.0
        return SequenceMatcher(None, current_text, previous_text).ratio()

    return 1.0 if current == previous else 0.0


def answer_similarity(
    answers: dict[str, Any],
    previous_answers: dict[str, Any],
    schema: FormSchema,
    ignore_identity_fields: bool = True,
) -> SimilarityResult:
    field_map = {field.entry_id: field for field in schema.fields}
    scores: list[float] = []
    matched_fields = 0

    for entry_id, value in answers.items():
        if entry_id.endswith(".other_option_response") or entry_id not in previous_answers:
            continue

        field = field_map.get(entry_id)
        if not field:
            continue
        if ignore_identity_fields and _is_identity_field(field.question_text):
            continue

        score = _value_similarity(value, previous_answers[entry_id], field.question_type)
        scores.append(score)
        if score >= 0.98:
            matched_fields += 1

    if not scores:
        return SimilarityResult(score=0.0, matched_fields=0, compared_fields=0, closest_history_index=None)

    return SimilarityResult(
        score=sum(scores) / len(scores),
        matched_fields=matched_fields,
        compared_fields=len(scores),
        closest_history_index=None,
    )


def closest_answer_similarity(
    answers: dict[str, Any],
    answer_history: list[dict[str, Any]],
    schema: FormSchema,
) -> SimilarityResult:
    closest = SimilarityResult(score=0.0, matched_fields=0, compared_fields=0, closest_history_index=None)

    for index, previous_answers in enumerate(answer_history):
        result = answer_similarity(answers, previous_answers, schema)
        if result.score > closest.score:
            closest = SimilarityResult(
                score=result.score,
                matched_fields=result.matched_fields,
                compared_fields=result.compared_fields,
                closest_history_index=index,
            )

    return closest


def validate_persona_quality(persona: Persona, analysis: FormAnalysis | None = None) -> PersonaQualityResult:
    issues: list[str] = []

    if persona.occupation not in OCCUPATION_WHITELIST:
        issues.append(f"occupation not whitelisted: {persona.occupation}")

    if persona.age < 13 or persona.age > 70:
        issues.append(f"age out of general range: {persona.age}")

    target_hint = _normalize_text(analysis.target_audience_hint if analysis else "")
    context = _normalize_text(analysis.context_for_persona if analysis else "")
    youth_context = any(keyword in f"{target_hint} {context}" for keyword in ("mahasiswa", "pelajar", "18-25", "18-30", "anak muda", "young"))
    if youth_context and persona.age > 35:
        issues.append(f"age too high for young-audience form: {persona.age}")

    name_parts = {_normalize_text(part) for part in persona.name.split()}
    if persona.gender == "Perempuan" and name_parts & MASCULINE_NAME_PARTS:
        issues.append(f"female name contains masculine-looking part: {persona.name}")

    return PersonaQualityResult(passed=not issues, issues=issues)
