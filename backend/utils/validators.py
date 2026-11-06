"""Validation helpers for incoming requests.

Every helper raises APIError with a friendly message when the request is
invalid, so routes can stay short and readable.
"""

from __future__ import annotations

from urllib.parse import urlparse

from flask import request

from utils.errors import APIError

# Article text limits: enough room for a real story, small enough to stay fast.
MIN_ARTICLE_CHARS = 50
MAX_ARTICLE_CHARS = 20_000
MAX_URL_CHARS = 2048
MAX_PER_PAGE = 50


def get_json_object() -> dict:
    """Return the request body as a dict, or raise a 400 error."""
    if not request.is_json:
        raise APIError("Request body must be JSON with Content-Type: application/json.")
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise APIError("Request body must be a JSON object.")
    return body


def _get_string(body: dict, field: str, *, min_length: int, max_length: int) -> str:
    if field not in body:
        raise APIError(f"Field '{field}' is required.")
    value = body[field]
    if not isinstance(value, str):
        raise APIError(f"Field '{field}' must be a string.")
    value = value.strip()
    if len(value) < min_length:
        raise APIError(f"Field '{field}' must be at least {min_length} characters long.")
    if len(value) > max_length:
        raise APIError(f"Field '{field}' must be at most {max_length} characters long.")
    return value


def validate_article_text(body: dict) -> str:
    """Validate the ``text`` field of POST /api/analyze."""
    return _get_string(
        body,
        "text",
        min_length=MIN_ARTICLE_CHARS,
        max_length=MAX_ARTICLE_CHARS,
    )


def validate_article_url(body: dict) -> str:
    """Validate the ``url`` field of POST /api/analyze-url."""
    url = _get_string(body, "url", min_length=8, max_length=MAX_URL_CHARS)

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise APIError("Field 'url' must be an http:// or https:// URL.")
    if not parsed.hostname:
        raise APIError("Field 'url' must include a valid host name.")
    if any(character.isspace() for character in url):
        raise APIError("Field 'url' must not contain spaces.")
    return url


def validate_pagination() -> tuple[int, int]:
    """Read and validate the ``page`` and ``per_page`` query parameters."""
    page = _query_int("page", default=1, minimum=1)
    per_page = _query_int("per_page", default=10, minimum=1, maximum=MAX_PER_PAGE)
    return page, per_page


def _query_int(name: str, *, default: int, minimum: int, maximum: int | None = None) -> int:
    raw = request.args.get(name)
    if raw is None or raw == "":
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise APIError(f"Query parameter '{name}' must be a whole number.") from None

    if value < minimum:
        raise APIError(f"Query parameter '{name}' must be at least {minimum}.")
    if maximum is not None and value > maximum:
        raise APIError(f"Query parameter '{name}' must be at most {maximum}.")
    return value
