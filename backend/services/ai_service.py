"""All AI integration lives here.

Supported providers:

- ``gemini``  Google Gemini (needs ``GEMINI_API_KEY``)
- ``groq``    Groq hosted models (needs ``GROQ_API_KEY``)

The active provider is chosen with the ``AI_PROVIDER`` environment variable
(``auto`` | ``gemini`` | ``groq``). With ``auto`` the first configured key wins
(Gemini, then Groq); with no keys configured the API answers 503. API keys are
read from Flask's server-side configuration (loaded from ``backend/.env``) and
never leave the backend.

The returned assessment is an estimated model reading of the submitted text.
It is not a fact-check and not a probability that a claim is true. The model is
explicitly instructed not to invent sources, facts or links.
"""

from __future__ import annotations

import json
import re
from typing import Any

import requests
from flask import current_app

from models.analysis import CATEGORIES, Analysis
from utils.errors import APIError

# Prompt version used for the stored ``model`` field.
PROMPT_VERSION = "gemini-analysis-v1"

# Groq exposes an OpenAI-compatible chat completions API.
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

_VALID_PROVIDERS = ("auto", "gemini", "groq")

_SYSTEM_PROMPT = """\
You are a careful media-literacy assistant. Analyse ONLY the supplied article
text and the way it is written. You cannot browse the web, so never invent
facts, quotes, sources or URLs, and never claim that something has been
externally verified.

Choose exactly one category:
- "likely_reliable": reads like responsible reporting; attribution, specifics
  and an internally consistent account are present.
- "potentially_misleading": mixed signals, loaded language, missing context or
  unsupported claims that warrant caution.
- "likely_false": strongly resembles fabricated or manipulative content, such as
  sensational claims, invented authority, or contradictions inside the text.
- "insufficient_evidence": there is not enough context to make even a cautious
  assessment.

The assessment_score is an integer from 0 to 100. It estimates how strongly the
writing signals reliability. It is NOT a probability that the content is true.

Return ONLY this JSON object:
{
  "category": "likely_reliable" | "potentially_misleading" | "likely_false" | "insufficient_evidence",
  "assessment_score": 0,
  "explanation": "2-4 sentences explaining the assessment and its limits",
  "suspicious_claims": ["claims that need independent verification"],
  "supporting_evidence": ["specific reliability signals found in the text"],
  "contradicting_evidence": ["problems or contradictions found in the text"]
}

Use plain strings in all arrays. Use empty arrays when there is nothing useful
to report. Do not include markdown or any text outside the JSON object.
"""

_CATEGORY_ALIASES = {
    "likely_reliable": "likely_reliable",
    "reliable": "likely_reliable",
    "credible": "likely_reliable",
    "real": "likely_reliable",
    "likely real": "likely_reliable",
    "potentially_misleading": "potentially_misleading",
    "misleading": "potentially_misleading",
    "possibly_misleading": "potentially_misleading",
    "likely_false": "likely_false",
    "false": "likely_false",
    "fake": "likely_false",
    "fabricated": "likely_false",
    "likely fake": "likely_false",
    "insufficient_evidence": "insufficient_evidence",
    "insufficient": "insufficient_evidence",
    "uncertain": "insufficient_evidence",
    "unknown": "insufficient_evidence",
}


class _AIFormatError(Exception):
    """The model returned something that could not be parsed."""


def _config_str(name: str, default: str = "") -> str:
    """Read a string setting from the Flask config."""
    return str(current_app.config.get(name, default)).strip()


def _resolve_provider() -> tuple[str, str, str]:
    """Pick the AI provider and return ``(name, api_key, model)``.

    Raises a 503 APIError when no usable key is configured, so the API never
    silently downgrades the analysis.
    """
    choice = _config_str("AI_PROVIDER", "auto").lower() or "auto"
    if choice not in _VALID_PROVIDERS:
        raise APIError("AI_PROVIDER must be one of: auto, gemini, groq.", 500)

    gemini_key = _config_str("GEMINI_API_KEY")
    groq_key = _config_str("GROQ_API_KEY")

    if choice == "auto":
        if gemini_key:
            return "gemini", gemini_key, _config_str(
                "GEMINI_MODEL", "gemini-2.5-flash"
            )
        if groq_key:
            return "groq", groq_key, _config_str(
                "GROQ_MODEL", "openai/gpt-oss-120b"
            )
        raise APIError(
            "AI analysis is not configured. Add GEMINI_API_KEY or GROQ_API_KEY "
            "to backend/.env and restart the Flask server.",
            503,
        )

    if choice == "gemini":
        if not gemini_key:
            raise APIError(
                "AI_PROVIDER is set to 'gemini' but GEMINI_API_KEY is empty "
                "in backend/.env.",
                503,
            )
        return "gemini", gemini_key, _config_str("GEMINI_MODEL", "gemini-2.5-flash")

    if not groq_key:
        raise APIError(
            "AI_PROVIDER is set to 'groq' but GROQ_API_KEY is empty in backend/.env.",
            503,
        )
    return "groq", groq_key, _config_str("GROQ_MODEL", "openai/gpt-oss-120b")


def get_ai_status() -> dict[str, object]:
    """Report AI configuration without exposing any API key."""
    gemini_configured = bool(_config_str("GEMINI_API_KEY"))
    groq_configured = bool(_config_str("GROQ_API_KEY"))

    try:
        provider, _api_key, model = _resolve_provider()
        configured = True
    except APIError:
        # No usable key (or a bad AI_PROVIDER value): report the raw state so
        # the health endpoint stays up and shows what is missing.
        provider = "not_configured"
        configured = False
        model = _config_str("GEMINI_MODEL", "gemini-2.5-flash")

    return {
        "provider": provider,
        "model": model,
        "configured": configured,
        "gemini_configured": gemini_configured,
        "groq_configured": groq_configured,
    }


def analyze_text(
    text: str,
    *,
    title: str | None = None,
    source_url: str | None = None,
    input_type: str = "text",
) -> Analysis:
    """Analyse text with the configured provider and return an Analysis."""
    provider, api_key, model = _resolve_provider()

    try:
        if provider == "groq":
            raw = _request_groq(api_key, model, text)
        else:
            raw = _request_gemini(api_key, model, text)

        payload = _parse_json_object(raw)
        return _analysis_from_payload(
            payload,
            text=text,
            title=title,
            source_url=source_url,
            input_type=input_type,
            model=model,
        )
    except APIError:
        raise
    except _AIFormatError as exc:
        current_app.logger.warning(
            "%s returned an unreadable analysis: %s", provider, exc
        )
        raise APIError(
            "The AI returned a response that could not be understood. Please try again.",
            502,
        ) from exc
    except Exception as exc:
        current_app.logger.exception("%s request failed", provider)
        raise APIError(
            "The AI service could not be reached. Please try again later.",
            502,
        ) from exc


def _request_gemini(api_key: str, model: str, text: str) -> str:
    """Call the Google Gemini SDK and return the raw response text."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=f"{_SYSTEM_PROMPT}\n\nARTICLE TEXT:\n{text.strip()[:20000]}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    raw = getattr(response, "text", None)
    if not isinstance(raw, str) or not raw.strip():
        raise _AIFormatError("Gemini returned an empty response.")
    return raw


def _request_groq(api_key: str, model: str, text: str) -> str:
    """Call the Groq chat completions API and return the message content."""
    timeout = float(current_app.config.get("AI_TIMEOUT_SECONDS", 30))

    try:
        response = requests.post(
            GROQ_CHAT_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"ARTICLE TEXT:\n{text.strip()[:20000]}",
                    },
                ],
                "temperature": 0.2,
                "max_tokens": 1024,
            },
            timeout=timeout,
        )
    except requests.exceptions.Timeout as exc:
        raise APIError(
            "The AI service took too long to respond. Please try again.", 504
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise APIError(
            "The AI service could not be reached. Please try again later.", 502
        ) from exc

    if response.status_code in (401, 403):
        current_app.logger.error(
            "Groq rejected the API key (HTTP %s).", response.status_code
        )
        raise APIError(
            "The AI service rejected the API key. Check GROQ_API_KEY in backend/.env.",
            502,
        )
    if response.status_code == 429:
        raise APIError(
            "The AI service is rate limited. Please try again in a moment.", 502
        )
    if response.status_code >= 400:
        current_app.logger.error(
            "Groq returned HTTP %s: %s", response.status_code, response.text[:300]
        )
        raise APIError(
            "The AI service returned an error. Please try again later.", 502
        )

    try:
        content = response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise _AIFormatError("Groq returned an unexpected response shape.") from exc
    if not isinstance(content, str) or not content.strip():
        raise _AIFormatError("Groq returned an empty response.")
    return content


def _parse_json_object(raw: str) -> dict[str, Any]:
    """Parse a JSON object, tolerating optional markdown fences."""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end <= start:
        raise _AIFormatError("No JSON object found.")

    try:
        payload = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError as exc:
        raise _AIFormatError("Invalid JSON.") from exc

    if not isinstance(payload, dict):
        raise _AIFormatError("Response was not a JSON object.")
    return payload


def _analysis_from_payload(
    payload: dict[str, Any],
    *,
    text: str,
    title: str | None,
    source_url: str | None,
    input_type: str,
    model: str,
) -> Analysis:
    """Validate the model JSON and turn it into an Analysis."""
    category = _normalize_category(payload.get("category"))
    score = _normalize_score(payload.get("assessment_score"))
    explanation = _normalize_explanation(payload.get("explanation"))

    suspicious = _string_list(payload.get("suspicious_claims"))
    supporting = _string_list(payload.get("supporting_evidence"))
    contradicting = _string_list(payload.get("contradicting_evidence"))

    sources = []
    if source_url:
        sources.append(
            {
                "title": title or "Fetched article",
                "url": source_url,
                "note": "Fetched by the backend for analysis.",
            }
        )

    return Analysis(
        content=text,
        category=category,
        assessment_score=score,
        explanation=explanation,
        model=f"{model} · {PROMPT_VERSION}",
        title=title or "",
        source_url=source_url,
        input_type=input_type,
        suspicious_claims=suspicious,
        supporting_evidence=supporting,
        contradicting_evidence=contradicting,
        sources=sources,
    )


def _normalize_category(value: Any) -> str:
    normalized = str(value or "").strip().lower().replace("-", "_")
    category = _CATEGORY_ALIASES.get(normalized)
    if category not in CATEGORIES:
        return "insufficient_evidence"
    return category


def _normalize_score(value: Any) -> int:
    match = re.search(r"-?\d+(?:\.\d+)?", str(value if value is not None else ""))
    if not match:
        return 50

    try:
        score = float(match.group())
    except ValueError:
        return 50

    # Be forgiving if a model answers as a 0.0-1.0 fraction instead of 0-100.
    if 0.0 <= score <= 1.0:
        score *= 100.0
    return int(round(max(0.0, min(100.0, score))))


def _normalize_explanation(value: Any) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()[:2000]
    return (
        "The model did not provide a detailed explanation. "
        "This assessment is an estimate based only on the submitted text."
    )


def _string_list(value: Any) -> list[str]:
    if value is None:
        return []
    items = value if isinstance(value, list) else [value]

    cleaned: list[str] = []
    for item in items:
        if isinstance(item, dict):
            candidate = item.get("claim") or item.get("text") or item.get("detail")
            text = str(candidate).strip() if candidate else ""
        else:
            text = str(item).strip()
        if text:
            cleaned.append(text[:500])

    return cleaned[:10]
