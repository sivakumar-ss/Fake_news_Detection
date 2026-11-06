"""SQLite persistence: saving analyses, history CRUD and dashboard stats."""

from __future__ import annotations

import json
import math
from typing import Any

from database.db import get_db
from models.analysis import Analysis

RECENT_LIMIT = 5


def save_analysis(analysis: Analysis) -> Analysis:
    """Insert a new analysis and return it with ``id`` and ``created_at``."""
    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO analyses
            (title, content, source_url, input_type, category, assessment_score,
             explanation, suspicious_claims, supporting_evidence,
             contradicting_evidence, sources, model)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            analysis.title,
            analysis.content,
            analysis.source_url,
            analysis.input_type,
            analysis.category,
            analysis.assessment_score,
            analysis.explanation,
            json.dumps(analysis.suspicious_claims, ensure_ascii=False),
            json.dumps(analysis.supporting_evidence, ensure_ascii=False),
            json.dumps(analysis.contradicting_evidence, ensure_ascii=False),
            json.dumps(analysis.sources, ensure_ascii=False),
            analysis.model,
        ),
    )
    db.commit()
    saved = get_analysis(cursor.lastrowid)
    if saved is None:  # pragma: no cover - only possible if the row vanished
        raise RuntimeError("Saved analysis could not be reloaded.")
    return saved


def list_analyses(page: int, per_page: int) -> tuple[list[Analysis], int]:
    """Return one page of analyses (newest first) plus the total count."""
    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM analyses").fetchone()[0]
    rows = db.execute(
        """
        SELECT * FROM analyses
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        """,
        (per_page, (page - 1) * per_page),
    ).fetchall()
    return [_row_to_analysis(row) for row in rows], total


def get_analysis(item_id: int) -> Analysis | None:
    """Return one analysis by id, or None when it does not exist."""
    row = get_db().execute(
        "SELECT * FROM analyses WHERE id = ?", (item_id,)
    ).fetchone()
    return _row_to_analysis(row) if row else None


def delete_analysis(item_id: int) -> bool:
    """Delete one analysis. Returns False when the id does not exist."""
    db = get_db()
    cursor = db.execute("DELETE FROM analyses WHERE id = ?", (item_id,))
    db.commit()
    return cursor.rowcount > 0


def get_dashboard_stats() -> dict[str, Any]:
    """Aggregate counts, percentages and recent activity for the dashboard."""
    db = get_db()
    row = db.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN category = 'likely_reliable'         THEN 1 ELSE 0 END) AS likely_reliable,
            SUM(CASE WHEN category = 'potentially_misleading'  THEN 1 ELSE 0 END) AS potentially_misleading,
            SUM(CASE WHEN category = 'likely_false'            THEN 1 ELSE 0 END) AS likely_false,
            SUM(CASE WHEN category = 'insufficient_evidence'   THEN 1 ELSE 0 END) AS insufficient_evidence,
            AVG(assessment_score) AS avg_score,
            SUM(CASE WHEN source_url IS NOT NULL THEN 1 ELSE 0 END) AS url_count
        FROM analyses
        """
    ).fetchone()

    total = int(row["total"] or 0)
    counts = {
        "likely_reliable": int(row["likely_reliable"] or 0),
        "potentially_misleading": int(row["potentially_misleading"] or 0),
        "likely_false": int(row["likely_false"] or 0),
        "insufficient_evidence": int(row["insufficient_evidence"] or 0),
    }
    url_count = int(row["url_count"] or 0)

    def percent(count: int) -> float:
        return round(count * 100 / total, 1) if total else 0.0

    recent_rows = db.execute(
        """
        SELECT id, title, source_url, input_type, category, assessment_score,
               explanation, created_at
        FROM analyses
        ORDER BY id DESC
        LIMIT ?
        """,
        (RECENT_LIMIT,),
    ).fetchall()

    return {
        "total_analyses": total,
        "categories": counts,
        "percentages": {key: percent(value) for key, value in counts.items()},
        "average_assessment_score": round(float(row["avg_score"] or 0.0), 1),
        "sources": {"url": url_count, "text": total - url_count},
        "recent": [dict(recent_row) for recent_row in recent_rows],
    }


def count_pages(total: int, per_page: int) -> int:
    """Number of pages for a given total and page size (at least 1)."""
    return max(1, math.ceil(total / per_page))


def _row_to_analysis(row) -> Analysis:
    """Convert a database row into an Analysis."""
    return Analysis(
        id=row["id"],
        title=row["title"] or "",
        content=row["content"],
        source_url=row["source_url"],
        input_type=row["input_type"],
        category=row["category"],
        assessment_score=int(row["assessment_score"]),
        explanation=row["explanation"],
        suspicious_claims=_json_list(row["suspicious_claims"]),
        supporting_evidence=_json_list(row["supporting_evidence"]),
        contradicting_evidence=_json_list(row["contradicting_evidence"]),
        sources=_json_sources(row["sources"]),
        model=row["model"],
        created_at=row["created_at"],
    )


def _json_list(raw: str | None) -> list[str]:
    try:
        value = json.loads(raw or "[]")
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if str(item).strip()]


def _json_sources(raw: str | None) -> list[dict[str, Any]]:
    try:
        value = json.loads(raw or "[]")
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]
