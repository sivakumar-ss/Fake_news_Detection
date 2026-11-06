"""Application errors that map cleanly to JSON responses."""

from __future__ import annotations

from typing import Any


class APIError(Exception):
    """An error with a friendly message and an HTTP status code.

    Raise it anywhere in routes or services; app.py turns it into the
    standard JSON error envelope.
    """

    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details
