"""Dashboard endpoint: aggregate stats across all saved analyses."""

from __future__ import annotations

from flask import Blueprint

from services import history_service
from utils.responses import success_response

bp = Blueprint("dashboard", __name__, url_prefix="/api")


@bp.get("/dashboard")
def dashboard():
    """Return category totals, percentages, sources and recent activity."""
    return success_response(
        data=history_service.get_dashboard_stats(),
        message="Dashboard data loaded.",
    )
