"""Service health endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, current_app

from database.db import get_db
from services.ai_service import get_ai_status
from utils.responses import success_response

bp = Blueprint("health", __name__, url_prefix="/api")


@bp.get("/health")
def health_check():
    """Confirm the API, SQLite connection and AI configuration state."""
    get_db().execute("SELECT 1").fetchone()
    ai = get_ai_status()

    return success_response(
        data={
            "status": "ok",
            "service": current_app.config["APP_NAME"],
            "version": current_app.config["APP_VERSION"],
            "environment": current_app.config["ENV_NAME"],
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "checks": {
                "database": "ok",
                "gemini": (
                    "configured" if ai["gemini_configured"] else "not_configured"
                ),
                "groq": "configured" if ai["groq_configured"] else "not_configured",
            },
            "ai": {
                "provider": ai["provider"],
                "model": ai["model"],
                "configured": ai["configured"],
            },
            "gemini_model": current_app.config["GEMINI_MODEL"],
            "groq_model": current_app.config["GROQ_MODEL"],
        },
        message="Service is healthy.",
    )
