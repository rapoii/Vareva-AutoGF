from app.core.quality import closest_answer_similarity, validate_persona_quality
from app.schemas.answer import Persona
from app.schemas.form import FormAnalysis, FormField, FormSchema, QuestionType


def _schema() -> FormSchema:
    return FormSchema(
        form_id="test-form",
        title="Survey Starbucks",
        fields=[
            FormField(entry_id="entry.name", question_text="Nama", question_type=QuestionType.SHORT_ANSWER),
            FormField(entry_id="entry.age", question_text="Usia", question_type=QuestionType.SHORT_ANSWER),
            FormField(entry_id="entry.rating", question_text="Rating Starbucks", question_type=QuestionType.LINEAR_SCALE, options=["1", "2", "3", "4", "5"]),
            FormField(entry_id="entry.reason", question_text="Alasan membeli", question_type=QuestionType.PARAGRAPH),
            FormField(entry_id="entry.menu", question_text="Menu favorit", question_type=QuestionType.CHECKBOXES, options=["Latte", "Americano", "Tea"]),
        ],
    )


def test_closest_answer_similarity_detects_duplicate_non_identity_answers():
    schema = _schema()
    answers = {
        "entry.name": "Aulia Safitri",
        "entry.age": "21",
        "entry.rating": "5",
        "entry.reason": "Suka tempatnya nyaman untuk nongkrong",
        "entry.menu": ["Latte", "Tea"],
    }
    history = [{
        "entry.name": "Dimas Pratama",
        "entry.age": "25",
        "entry.rating": "5",
        "entry.reason": "Suka tempatnya nyaman untuk nongkrong",
        "entry.menu": ["Latte", "Tea"],
    }]

    result = closest_answer_similarity(answers, history, schema)

    assert result.score > 0.95
    assert result.matched_fields == 3
    assert result.compared_fields == 3


def test_closest_answer_similarity_allows_different_answers():
    schema = _schema()
    answers = {
        "entry.name": "Aulia Safitri",
        "entry.age": "21",
        "entry.rating": "2",
        "entry.reason": "Harganya cukup mahal untuk mahasiswa",
        "entry.menu": ["Americano"],
    }
    history = [{
        "entry.name": "Dimas Pratama",
        "entry.age": "25",
        "entry.rating": "5",
        "entry.reason": "Suka tempatnya nyaman untuk nongkrong",
        "entry.menu": ["Latte", "Tea"],
    }]

    result = closest_answer_similarity(answers, history, schema)

    assert result.score < 0.5
    assert result.compared_fields == 3


def test_validate_persona_quality_rejects_specific_occupation():
    persona = Persona(
        name="Rizky Pratama",
        age=24,
        gender="Laki-laki",
        city="Jakarta",
        occupation="Freelancer Digital Marketing",
        education="S1",
        interests=["kopi"],
        daily_habits="Sering bekerja dari cafe",
        personality_tone="Santai",
    )

    result = validate_persona_quality(persona)

    assert not result.passed
    assert any("occupation not whitelisted" in issue for issue in result.issues)


def test_validate_persona_quality_warns_young_context_age_mismatch():
    persona = Persona(
        name="Aulia Safitri",
        age=45,
        gender="Perempuan",
        city="Jakarta",
        occupation="Karyawan swasta",
        education="S1",
        interests=["kopi"],
        daily_habits="Bekerja di kantor",
        personality_tone="Rapi",
    )
    analysis = FormAnalysis(
        topic_summary="Survey Starbucks",
        is_multi_page=False,
        page_count=1,
        question_types=[],
        requires_personal_info=True,
        context_for_persona="Survei coffee shop untuk mahasiswa dan anak muda 18-30",
        target_audience_hint="Mahasiswa dan young adult 18-30",
    )

    result = validate_persona_quality(persona, analysis)

    assert not result.passed
    assert any("age too high" in issue for issue in result.issues)
