"""Analysis endpoints: POST /api/analyze and POST /api/analyze-url."""

from __future__ import annotations

from flask import Blueprint

from services import ai_service, article_service, history_service
from utils.responses import success_response
from utils.validators import get_json_object, validate_article_text, validate_article_url

bp = Blueprint("analyze", __name__, url_prefix="/api")


@bp.post("/analyze")
def analyze_text():
    """Analyse pasted article text and save the result to history."""
    body = get_json_object()
    text = validate_article_text(body)

    analysis = ai_service.analyze_text(text)
    analysis = history_service.save_analysis(analysis)

    return success_response(
        data=analysis.to_dict(),
        message="Analysis complete.",
        status_code=201,
    )


@bp.post("/analyze-url")
def analyze_url():
    """Fetch a news article URL, extract it, analyse it and save it."""
    body = get_json_object()
    url = validate_article_url(body)

    article = article_service.fetch_article(url)
    analysis = ai_service.analyze_text(
        article["text"],
        title=article["title"],
        source_url=article["url"],
        input_type="url",
    )
    analysis = history_service.save_analysis(analysis)

    # Page metadata travels alongside the analysis: the meta description, and
    # feed details when the URL was an RSS/Atom feed resolved to an article.
    data = analysis.to_dict()
    data["description"] = article.get("description", "")
    if article.get("feed"):
        data["feed"] = article["feed"]

    return success_response(
        data=data,
        message="Article fetched and analyzed.",
        status_code=201,
    )
