"""History endpoints: list, view and delete saved analyses."""

from __future__ import annotations

from flask import Blueprint

from services import history_service
from utils.errors import APIError
from utils.responses import success_response
from utils.validators import validate_pagination

bp = Blueprint("history", __name__, url_prefix="/api")


@bp.get("/history")
def list_history():
    """Return one page of saved analyses (newest first)."""
    page, per_page = validate_pagination()
    items, total = history_service.list_analyses(page, per_page)

    return success_response(
        data={
            "items": [item.to_dict() for item in items],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": history_service.count_pages(total, per_page),
            },
        },
        message="History loaded.",
    )


@bp.get("/history/<int:item_id>")
def get_history_item(item_id: int):
    """Return a single saved analysis."""
    item = history_service.get_analysis(item_id)
    if item is None:
        raise APIError("Analysis not found.", 404)

    return success_response(data=item.to_dict(), message="Analysis loaded.")


@bp.delete("/history/<int:item_id>")
def delete_history_item(item_id: int):
    """Delete a single saved analysis."""
    if not history_service.delete_analysis(item_id):
        raise APIError("Analysis not found.", 404)

    return success_response(data={"id": item_id}, message="Analysis deleted.")
