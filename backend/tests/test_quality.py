import pytest

from app.core.generator import _apply_custom_answers, _build_persona_prompt, _build_system_prompt, _build_user_prompt
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


def test_persona_prompt_text_includes_economic_class():
    persona = Persona(
        name="Aulia Safitri",
        age=21,
        gender="Perempuan",
        city="Bandung",
        occupation="Mahasiswa",
        economic_class="lower",
        education="S1",
        interests=["kopi", "belajar"],
        daily_habits="Kuliah dan mencari promo makanan/minuman",
        personality_tone="Santai",
    )

    prompt_text = persona.to_prompt_text()

    assert "Kelas Ekonomi: lower" in prompt_text


def test_persona_rejects_invalid_economic_class():
    with pytest.raises(ValueError):
        Persona(
            name="Aulia Safitri",
            age=21,
            gender="Perempuan",
            city="Bandung",
            occupation="Mahasiswa",
            economic_class="premium",
            education="S1",
            interests=["kopi"],
            daily_habits="Kuliah",
            personality_tone="Santai",
        )


def test_persona_generation_prompt_requests_economic_class():
    prompt = _build_persona_prompt(
        3,
        "\nKonteks form: Survey Starbucks",
        "\nTarget audience: Mahasiswa dan karyawan muda",
        "1. Aulia Safitri — Perempuan\n2. Rizky Pratama — Laki-laki\n3. Nabila Putri — Perempuan",
    )

    assert "economic_class('lower'|'middle'|'upper')" in prompt
    assert "lower lebih sensitif harga" in prompt


def test_system_prompt_mentions_price_sensitive_economic_class():
    system_prompt = _build_system_prompt(
        "Nama: Aulia Safitri\n"
        "Usia: 21 tahun\n"
        "Jenis Kelamin: Perempuan\n"
        "Pekerjaan: Mahasiswa\n"
        "Kelas Ekonomi: lower"
    )

    assert "economic_class" in system_prompt
    assert "price-sensitive" in system_prompt


def test_persona_generation_prompt_includes_custom_config_when_given():
    prompt = _build_persona_prompt(
        1,
        "\nKonteks form: Survey Starbucks",
        "\nTarget audience: Mahasiswa dan karyawan muda",
        "Persona 1: Nama='Aulia Safitri', Gender='Perempuan'",
        persona_description="Persona harus mahasiswa hemat yang sering cari promo.",
        economic_class="lower",
    )

    assert "Arahan persona user" in prompt
    assert "mahasiswa hemat" in prompt
    assert "Semua persona harus economic_class='lower'" in prompt


def test_answer_prompt_includes_custom_instructions_when_given():
    prompt = _build_user_prompt(
        _schema(),
        answer_instructions="Jawaban harus mempertimbangkan budget bulanan terbatas.",
    )

    assert "User answer direction" in prompt
    assert "budget bulanan terbatas" in prompt


def test_answer_prompt_omits_custom_instructions_when_empty():
    prompt = _build_user_prompt(_schema())

    assert "User answer direction" not in prompt


def test_answer_prompt_includes_per_question_custom_answers():
    prompt = _build_user_prompt(
        _schema(),
        custom_answers={
            "entry.rating": "2",
            "entry.menu": ["Americano"],
        },
    )

    assert "User selected preferred answers" in prompt
    assert "entry.rating" in prompt
    assert "2" in prompt
    assert "entry.menu" in prompt
    assert "Americano" in prompt


def test_apply_custom_answers_overrides_generated_answers():
    answers = {
        "entry.rating": "5",
        "entry.reason": "Suka tempatnya nyaman",
        "entry.menu": ["Latte"],
    }

    result = _apply_custom_answers(answers, {
        "entry.rating": "2",
        "entry.menu": ["Americano"],
        "entry.reason": "",
    })

    assert result["entry.rating"] == "2"
    assert result["entry.menu"] == ["Americano"]
    assert result["entry.reason"] == "Suka tempatnya nyaman"
