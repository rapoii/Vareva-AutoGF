"""
Form Parser — extracts question structure from public Google Forms.

Strategy: Google embeds all form data as a JS variable `FB_PUBLIC_LOAD_DATA_`
in the page HTML. This JSON blob contains questions, options, and entry IDs —
much more reliable than scraping raw HTML elements.
"""

import json
import re
import random
from typing import Optional

import httpx

from app.schemas.form import FormField, FormSchema, FormAnalysis, QuestionType


_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

_BROWSER_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
}

_GFORM_TYPE_MAP = {
    0: QuestionType.SHORT_ANSWER,
    1: QuestionType.PARAGRAPH,
    2: QuestionType.MULTIPLE_CHOICE,
    3: QuestionType.DROPDOWN,
    4: QuestionType.CHECKBOXES,
    5: QuestionType.LINEAR_SCALE,
    7: QuestionType.GRID,
    9: QuestionType.SHORT_ANSWER,
}


def _extract_form_id(url: str) -> str:
    # Format 1: /forms/d/e/{id}/viewform  (published/distributed)
    match = re.search(r"/forms/d/e/([a-zA-Z0-9_-]+)", url)
    if match:
        return match.group(1)
    # Format 2: /forms/d/{id}/  (edit/other)
    match = re.search(r"/forms/d/([a-zA-Z0-9_-]+)", url)
    if match:
        return match.group(1)
    raise ValueError(f"Cannot extract form ID from URL: {url}")


def _resolve_url(url: str) -> str:
    """Resolve short URLs (forms.gle) and normalize to /viewform endpoint."""
    url = url.strip()

    # Follow redirects for forms.gle short links
    if "forms.gle" in url or "goo.gl" in url:
        headers = {"User-Agent": random.choice(_USER_AGENTS), **_BROWSER_HEADERS}
        resolved = None
        # Try up to 3 times: http1 GET, http2 GET, http1 HEAD
        strategies = [
            (False, "GET"),
            (True, "GET"),
            (False, "HEAD"),
        ]
        for use_http2, method in strategies:
            try:
                with httpx.Client(http2=use_http2, follow_redirects=True, timeout=10) as client:
                    resp = client.get(url, headers=headers) if method == "GET" else client.head(url, headers=headers)
                candidate = str(resp.url)
                if "/forms/d/" in candidate:
                    resolved = candidate
                    break
            except Exception:
                pass
        if resolved:
            url = resolved

    # /d/e/{id} format — use viewform directly
    match = re.search(r"/forms/d/e/([a-zA-Z0-9_-]+)", url)
    if match:
        return f"https://docs.google.com/forms/d/e/{match.group(1)}/viewform"

    # /d/{id} format
    match = re.search(r"/forms/d/([a-zA-Z0-9_-]+)", url)
    if match:
        return f"https://docs.google.com/forms/d/{match.group(1)}/viewform"

    raise ValueError(f"Unrecognized Google Form URL format: {url}")


def _fetch_form_html(url: str) -> str:
    headers = {"User-Agent": random.choice(_USER_AGENTS), **_BROWSER_HEADERS}
    with httpx.Client(http2=True, follow_redirects=True, timeout=20) as client:
        resp = client.get(url, headers=headers)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to fetch form: HTTP {resp.status_code}")
    return resp.text


def _extract_fb_public_load_data(html: str) -> list:
    """Extract the FB_PUBLIC_LOAD_DATA_ JS variable from the page."""
    pattern = r"FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\]);\s*</script>"
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        raise ValueError(
            "Could not find FB_PUBLIC_LOAD_DATA_ in page. "
            "The form may require a Google login or is not publicly accessible."
        )
    return json.loads(match.group(1))


def _parse_field_from_item(item: list) -> Optional[FormField]:
    """
    Parse a single question item from the FB_PUBLIC_LOAD_DATA_ structure.
    Structure (relevant indices):
      item[1]  = question text
      item[3]  = question type int
      item[4]  = list of answer entries (each entry has entry_id at [0], options at [1])
    """
    try:
        question_text: str = item[1]
        q_type_int: int = item[3]
        question_type = _GFORM_TYPE_MAP.get(q_type_int, QuestionType.OTHER)

        entries = item[4]
        if not entries:
            return None

        entry = entries[0]
        entry_id = f"entry.{entry[0]}"
        required = bool(entry[2]) if len(entry) > 2 else False

        options: list[str] = []
        scale_low: Optional[int] = None
        scale_high: Optional[int] = None
        scale_low_label: Optional[str] = None
        scale_high_label: Optional[str] = None

        if question_type in (
            QuestionType.MULTIPLE_CHOICE,
            QuestionType.CHECKBOXES,
            QuestionType.DROPDOWN,
        ):
            raw_options = entry[1] if len(entry) > 1 and entry[1] else []
            # Parse options - regular options have text, "Other" option has empty string with flag 1
            options = []
            for opt in raw_options:
                if not opt:
                    continue
                opt_text = opt[0] if isinstance(opt[0], str) else ""
                opt_flag = opt[4] if len(opt) > 4 else 0  # Flag 1 indicates "Other" option
                if opt_text:
                    options.append(opt_text)
                elif opt_flag == 1:
                    # This is an "Other" option - Google Forms uses empty string with flag=1
                    # Value to submit is "__other_option__" with separate .other_option_response key
                    options.append("Yang lain:")

            # Mark if we have an "Other" option - will be handled specially during submit
            # Google Forms expects "__other_option__" as value with .other_option_response param

        elif question_type == QuestionType.LINEAR_SCALE:
            if len(entry) > 1 and entry[1]:
                scale_options = entry[1]  # [['1'], ['2'], ..., ['5']]
                scale_low = int(scale_options[0][0]) if scale_options and scale_options[0] else 1
                scale_high = int(scale_options[-1][0]) if scale_options and scale_options[-1] else 5
            # Labels are in entry[3]: ['Sangat Tidak Penting', 'Sangat Penting']
            if len(entry) > 3 and entry[3]:
                scale_low_label = str(entry[3][0]) if entry[3][0] else None
                scale_high_label = str(entry[3][1]) if len(entry[3]) > 1 and entry[3][1] else None
            options = [str(i) for i in range(scale_low or 1, (scale_high or 5) + 1)]

        return FormField(
            entry_id=entry_id,
            question_text=question_text,
            question_type=question_type,
            required=required,
            options=options,
            scale_low=scale_low,
            scale_high=scale_high,
            scale_low_label=scale_low_label,
            scale_high_label=scale_high_label,
        )
    except (IndexError, TypeError, KeyError):
        return None


def _detect_pages(data: list) -> int:
    """
    Detect number of pages in a Google Form from FB_PUBLIC_LOAD_DATA_.
    Page breaks are represented by items with type 8 (PAGE_BREAK).
    """
    try:
        raw_items: list = data[1][1] if len(data) > 1 and data[1] and len(data[1]) > 1 else []
        page_breaks = sum(1 for item in raw_items if isinstance(item, list) and len(item) > 3 and item[3] == 8)
        return page_breaks + 1
    except (IndexError, TypeError):
        return 1


def _parse_schema_from_data(form_id: str, data: list) -> FormSchema:
    title: str = data[3] if len(data) > 3 else "Untitled Form"
    description: Optional[str] = data[4] if len(data) > 4 and data[4] else None
    raw_items: list = data[1][1] if len(data) > 1 and data[1] and len(data[1]) > 1 else []

    fields: list[FormField] = []
    current_page = 0
    for item in raw_items:
        if not isinstance(item, list) or len(item) < 4:
            continue
        
        # Check if this is a page break (type 8)
        if item[3] == 8:
            current_page += 1
            continue
        
        field = _parse_field_from_item(item)
        if field:
            field.page_index = current_page
            fields.append(field)

    if not fields:
        raise ValueError("No parseable questions found in form. Check if the form is public.")

    page_count = _detect_pages(data)

    return FormSchema(form_id=form_id, title=title, description=description, fields=fields, page_count=page_count)


def parse_form(url: str) -> FormSchema:
    """
    Fetch and parse a public Google Form URL.
    Returns a FormSchema with all extractable questions.
    """
    viewform_url = _resolve_url(url)
    form_id = _extract_form_id(viewform_url)
    html = _fetch_form_html(viewform_url)
    data = _extract_fb_public_load_data(html)
    return _parse_schema_from_data(form_id, data)


def parse_form_with_analysis(url: str) -> tuple[FormSchema, FormAnalysis]:
    """
    Fetch, parse, and analyze a public Google Form URL.
    Returns both FormSchema and FormAnalysis (multi-page, question types, context).
    """
    viewform_url = _resolve_url(url)
    form_id = _extract_form_id(viewform_url)
    html = _fetch_form_html(viewform_url)
    data = _extract_fb_public_load_data(html)
    schema = _parse_schema_from_data(form_id, data)
    analysis = analyze_form(schema, raw_data=data)
    return schema, analysis


def _infer_target_audience(schema: FormSchema) -> str:
    """
    Infer the ideal target audience demographics from the form's title,
    description, and question texts. Returns a concise hint string that guides
    persona generation toward realistic respondents for this specific form.
    """
    # Combine all text signals from the form
    all_text = " ".join([
        schema.title.lower(),
        (schema.description or "").lower(),
        " ".join(f.question_text.lower() for f in schema.fields),
        " ".join(opt.lower() for f in schema.fields for opt in (f.options or [])),
    ])

    hints: list[str] = []

    # --- Age range inference ---
    young_signals = {
        "mahasiswa", "kuliah", "kampus", "universitas", "semester", "ipk",
        "sekolah", "sma", "smp", "pelajar", "gen z", "tiktok", "instagram",
        "skincare", "kpop", "k-pop", "drakor", "aesthetic", "content creator",
        "mobile legend", "valorant", "genshin", "gaming", "esport",
        "spotify", "netflix", "nongkrong", "hangout", "jajan",
    }
    young_adult_signals = {
        "karyawan", "pekerja", "kantoran", "freelancer", "startup", "remote",
        "wfh", "coworking", "linkedin", "networking", "karir", "career",
        "investasi", "saham", "crypto", "reksadana", "kpr", "cicilan",
        "ngopi", "coffee shop", "cafe", "starbucks", "kencan", "dating",
        "gym", "fitness", "self-improvement", "produktivitas",
    }
    broad_age_signals = {
        "keluarga", "anak", "orang tua", "rumah tangga", "belanja",
        "pasar", "supermarket", "kesehatan", "obat", "dokter",
        "pensiun", "lansia", "veteran",
    }

    young_score = sum(1 for kw in young_signals if kw in all_text)
    young_adult_score = sum(1 for kw in young_adult_signals if kw in all_text)
    broad_score = sum(1 for kw in broad_age_signals if kw in all_text)

    if young_score >= 2:
        hints.append("Usia mayoritas 17-24 tahun (pelajar/mahasiswa/Gen Z)")
    elif young_adult_score >= 2:
        hints.append("Usia mayoritas 20-35 tahun (pekerja muda/profesional)")
    elif broad_score >= 2:
        hints.append("Usia bervariasi 25-50 tahun (dewasa umum)")
    # If no strong signal, don't add age hint — let prompt use default range

    # --- Occupation/lifestyle inference ---
    brand_cafe_signals = {
        "starbucks", "kopi kenangan", "janji jiwa", "fore coffee", "coffee shop",
        "cafe", "kafe", "barista", "latte", "espresso", "americano",
        "mcd", "mcdonald", "kfc", "burger king", "pizza hut",
        "grab", "gojek", "shopee", "tokopedia", "lazada",
    }
    academic_signals = {
        "penelitian", "riset", "skripsi", "tesis", "disertasi", "jurnal",
        "akademik", "dosen", "guru", "pengajar", "kurikulum",
    }
    tech_signals = {
        "aplikasi", "app", "website", "software", "developer", "programmer",
        "coding", "ui", "ux", "digital", "teknologi", "fintech",
    }
    health_signals = {
        "kesehatan", "gizi", "nutrisi", "olahraga", "diet",
        "rumah sakit", "klinik", "obat", "penyakit", "mental health",
    }

    if sum(1 for kw in brand_cafe_signals if kw in all_text) >= 1:
        hints.append("Persona harus konsumen urban yang familiar dengan brand/cafe modern, pekerjaan: mahasiswa/karyawan/freelancer/content creator")
    if sum(1 for kw in academic_signals if kw in all_text) >= 2:
        hints.append("Persona harus dari kalangan akademisi: mahasiswa, dosen, peneliti")
    if sum(1 for kw in tech_signals if kw in all_text) >= 2:
        hints.append("Persona harus tech-savvy: pekerja IT, startup, digital marketer")
    if sum(1 for kw in health_signals if kw in all_text) >= 2:
        hints.append("Persona peduli kesehatan: pekerja aktif, olahragawan, profesional medis")

    # --- Location inference ---
    urban_signals = {
        "starbucks", "cafe", "mall", "bioskop", "coworking", "mrt", "lrt",
        "transjakarta", "grab", "gojek", "apartemen", "startup",
    }
    if sum(1 for kw in urban_signals if kw in all_text) >= 2:
        hints.append("Lokasi mayoritas kota besar (Jakarta, Bandung, Surabaya, Yogyakarta, Medan)")

    return "; ".join(hints) if hints else ""


def analyze_form(schema: FormSchema, raw_data: Optional[list] = None) -> FormAnalysis:
    """
    Analyze a parsed FormSchema to produce context for persona + answer generation.
    Detects: multi-page, question type diversity, personal info requirements,
    and infers target audience demographics.
    """
    question_types = list({f.question_type.value for f in schema.fields})

    personal_keywords = {"nama", "name", "email", "umur", "usia", "age", "pekerjaan",
                         "occupation", "alamat", "address", "nomor", "phone", "hp", "gender"}
    requires_personal = any(
        any(kw in f.question_text.lower() for kw in personal_keywords)
        for f in schema.fields
    )

    page_count = _detect_pages(raw_data) if raw_data else schema.page_count
    is_multi_page = page_count > 1

    questions_summary = "; ".join(
        f.question_text[:60] + ("..." if len(f.question_text) > 60 else "")
        for f in schema.fields[:8]  # Show more questions for better context
    )
    context = (
        f"Form berjudul '{schema.title}'. "
        f"{'Deskripsi: ' + schema.description + '. ' if schema.description else ''}"
        f"Berisi {len(schema.fields)} pertanyaan tentang: {questions_summary}. "
        f"Tipe pertanyaan: {', '.join(question_types)}."
    )

    target_audience_hint = _infer_target_audience(schema)

    return FormAnalysis(
        topic_summary=f"{schema.title}: {schema.description or 'survei umum'}",
        is_multi_page=is_multi_page,
        page_count=page_count,
        question_types=question_types,
        requires_personal_info=requires_personal,
        context_for_persona=context,
        target_audience_hint=target_audience_hint,
    )
