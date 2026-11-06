"""Consistent JSON response envelopes for the API."""

from __future__ import annotations

from typing import Any

from flask import Response, jsonify


def success_response(
    data: Any = None,
    message: str = "OK",
    status_code: int = 200,
) -> tuple[Response, int]:
    return (
        jsonify(
            {
                "success": True,
                "message": message,
                "data": data,
            }
        ),
        status_code,
    )


def error_response(
    message: str,
    status_code: int = 400,
    details: Any = None,
) -> tuple[Response, int]:
    body: dict[str, Any] = {
        "success": False,
        "message": message,
    }
    if details is not None:
        body["details"] = details

    return jsonify(body), status_code
