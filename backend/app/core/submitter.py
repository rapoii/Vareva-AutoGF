"""
Form Submitter — sends a completed answer map to a Google Form via HTTP POST.

Google Forms accepts submissions at:
  POST https://docs.google.com/forms/d/{form_id}/formResponse

On success, Google returns HTTP 200 with a redirect to a confirmation page.
"""

import re
import time
import random
import logging
from typing import Any
from urllib.parse import urlencode

import httpx  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)

_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


def _build_submit_url(url: str) -> str:
    """Build the formResponse submit URL from any Google Form URL format."""
    # /d/e/{id} format
    match = re.search(r"/forms/d/e/([a-zA-Z0-9_-]+)", url)
    if match:
        return f"https://docs.google.com/forms/d/e/{match.group(1)}/formResponse"
    # /d/{id} format
    match = re.search(r"/forms/d/([a-zA-Z0-9_-]+)", url)
    if match:
        return f"https://docs.google.com/forms/d/{match.group(1)}/formResponse"
    raise ValueError(f"Cannot build submit URL from: {url}")


def _build_referer(url: str) -> str:
    match = re.search(r"/forms/d/(?:e/)?([a-zA-Z0-9_-]+)", url)
    form_id = match.group(1) if match else ""
    if "/d/e/" in url:
        return f"https://docs.google.com/forms/d/e/{form_id}/viewform"
    return f"https://docs.google.com/forms/d/{form_id}/viewform"


def _build_payload(answers: dict[str, Any], fbzx: str = "0", partial: str = "0", page_count: int = 1, current_page: int = 0) -> str:
    """
    Build form POST payload as x-www-form-urlencoded string.
    CHECKBOXES need same key repeated with different values.
    "Yang lain:" option is converted to Google Forms format: __other_option__ + .other_option_response
    fbzx and partial are session tokens extracted from form HTML.
    """
    payload: list[tuple[str, str]] = []
    for entry_id, value in answers.items():
        # Skip .other_option_response keys - handled with parent entry
        if entry_id.endswith(".other_option_response"):
            continue

        if isinstance(value, list):
            # Checkbox: repeat key for each selected option
            for v in value:
                if v == "Yang lain:":
                    payload.append((entry_id, "__other_option__"))
                    other_key = f"{entry_id}.other_option_response"
                    if other_key in answers:
                        payload.append((other_key, str(answers[other_key])))
                else:
                    payload.append((entry_id, str(v)))
        else:
            # Handle "Other" option - convert to Google Forms format
            if value == "Yang lain:":
                payload.append((entry_id, "__other_option__"))
                # Add custom text if provided
                other_key = f"{entry_id}.other_option_response"
                if other_key in answers:
                    payload.append((other_key, str(answers[other_key])))
            else:
                payload.append((entry_id, str(value)))

    # Add required hidden fields for Google Forms
    payload.append(("fvv", "1"))
    payload.append(("draftResponse", "[]"))
    # pageHistory must list all visited pages (0,1,2,...) for multi-page forms
    page_history = ",".join(str(i) for i in range(page_count))
    payload.append(("pageHistory", page_history))
    payload.append(("pageIndex", str(current_page)))  # Current page index
    payload.append(("fbzx", fbzx))
    payload.append(("partialResponse", f'[null,null,"{partial}"]'))
    payload.append(("submissionTimestamp", "-1"))

    # Encode to x-www-form-urlencoded string
    return urlencode(payload, doseq=True)


def _extract_form_tokens(form_url: str) -> tuple[str, str]:
    """Extract fbzx token and partialResponse from form HTML."""
    referer = _build_referer(form_url)
    headers = {
        "User-Agent": random.choice(_USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    with httpx.Client(http2=True, follow_redirects=True, timeout=15) as client:
        response = client.get(referer, headers=headers)
    html = response.text

    fbzx_match = re.search(r'fbzx=([0-9]+)', html)
    fbzx = fbzx_match.group(1) if fbzx_match else "0"

    partial_match = re.search(r'partialResponse=\[null,null,"([0-9]+)"\]', html)
    partial = partial_match.group(1) if partial_match else fbzx

    return fbzx, partial


def _submit_single_page(
    submit_url: str,
    referer: str,
    answers: dict[str, Any],
    fbzx: str,
    partial: str,
    page_count: int,
    current_page: int,
) -> dict[str, Any]:
    """Submit a single page of a multi-page form."""
    payload = _build_payload(answers, fbzx, partial, page_count=page_count, current_page=current_page)
    headers = {
        "User-Agent": random.choice(_USER_AGENTS),
        "Referer": referer,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://docs.google.com",
    }

    logger.info("Submitting page %d/%d to %s with %d fields", current_page + 1, page_count, submit_url, len(answers))

    try:
        with httpx.Client(http2=False, follow_redirects=True, timeout=15) as client:
            response = client.post(submit_url, content=payload, headers=headers)
        http_code = response.status_code

        is_success = http_code == 200
        logger.info("Page %d submit: HTTP %d, redirect to %s", current_page + 1, http_code, str(response.url))

        # Extract new tokens from response for next page
        new_fbzx = fbzx
        new_partial = partial
        if response.text:
            fbzx_match = re.search(r'fbzx=([0-9]+)', response.text)
            if fbzx_match:
                new_fbzx = fbzx_match.group(1)
            partial_match = re.search(r'partialResponse=\[null,null,"([0-9]+)"\]', response.text)
            if partial_match:
                new_partial = partial_match.group(1)

        return {
            "status": "success" if is_success else "error",
            "http_code": http_code,
            "error_message": None if is_success else f"Unexpected HTTP status: {http_code}",
            "fbzx": new_fbzx,
            "partial": new_partial,
        }

    except httpx.TimeoutException:
        logger.error("Page %d submit timed out", current_page + 1)
        return {"status": "error", "http_code": 0, "error_message": "Request timed out", "fbzx": fbzx, "partial": partial}

    except httpx.RequestError as e:
        logger.error("Page %d submit failed: %s", current_page + 1, e)
        return {"status": "error", "http_code": 0, "error_message": str(e), "fbzx": fbzx, "partial": partial}


def submit(form_url: str, answers: dict[str, Any], delay: float = 0.0, page_count: int = 1, fields_by_page: dict[int, list[str]] | None = None) -> dict[str, Any]:
    """
    Submit answers to a Google Form.
    For multi-page forms, submits page by page if fields_by_page is provided.
    
    Returns a dict with: status ('success'|'error'), http_code, error_message.
    delay: seconds to wait before sending (anti-bot).
    page_count: number of pages in the form.
    fields_by_page: dict mapping page_index to list of entry_ids for that page.
    """
    if delay > 0:
        time.sleep(delay)

    # Resolve short links (forms.gle) to full Google Forms URL
    if "forms.gle" in form_url or "goo.gl" in form_url:
        headers = {"User-Agent": _USER_AGENTS[0]}
        resolved = None
        for use_http2 in [False, True, False]:
            try:
                with httpx.Client(http2=use_http2, follow_redirects=True, timeout=10) as client:
                    resp = client.get(form_url, headers=headers)
                candidate = str(resp.url)
                if "/forms/d/" in candidate:
                    resolved = candidate
                    break
            except Exception:
                pass
        if resolved:
            form_url = resolved

    submit_url = _build_submit_url(form_url)
    referer = _build_referer(form_url)

    # Extract initial tokens from form HTML
    fbzx, partial = _extract_form_tokens(form_url)

    # Submit all answers at once with correct pageHistory for multi-page forms
    # page_count drives pageHistory (e.g. page_count=2 → pageHistory=0,1)
    return _submit_single_page(submit_url, referer, answers, fbzx, partial, page_count=page_count, current_page=page_count - 1)
