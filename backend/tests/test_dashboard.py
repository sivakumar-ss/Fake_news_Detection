"""Tests for GET /api/dashboard."""

from __future__ import annotations

import pytest

from conftest import REALISTIC_TEXT

pytestmark = pytest.mark.usefixtures("ai_stub")

SENSATIONAL_TEXT = (
    "SHOCKING secret exposed!!! You won't believe what the doctors hate "
    "about this miracle cure. Wake up and share this before it's deleted!!! "
    "MAINSTREAM MEDIA is hiding the truth from you!!!"
)

EMPTY_CATEGORIES = {
    "likely_reliable": 0,
    "potentially_misleading": 0,
    "likely_false": 0,
    "insufficient_evidence": 0,
}


def test_dashboard_on_an_empty_database(client):
    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True

    data = body["data"]
    assert data["total_analyses"] == 0
    assert data["categories"] == EMPTY_CATEGORIES
    assert data["percentages"] == {key: 0.0 for key in EMPTY_CATEGORIES}
    assert data["average_assessment_score"] == 0.0
    assert data["sources"] == {"url": 0, "text": 0}
    assert data["recent"] == []


def test_dashboard_aggregates_saved_analyses(client, test_site):
    client.post("/api/analyze", json={"text": REALISTIC_TEXT})
    client.post("/api/analyze", json={"text": SENSATIONAL_TEXT})
    client.post("/api/analyze", json={"text": REALISTIC_TEXT})
    client.post("/api/analyze-url", json={"url": f"{test_site}/article"})

    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.get_json()["data"]

    assert data["total_analyses"] == 4
    assert data["categories"] == {
        "likely_reliable": 3,
        "potentially_misleading": 0,
        "likely_false": 1,
        "insufficient_evidence": 0,
    }
    assert data["percentages"]["likely_reliable"] == 75.0
    assert data["percentages"]["likely_false"] == 25.0
    assert data["sources"] == {"url": 1, "text": 3}
    # Stub scores: three reliable analyses at 74 and one false at 12.
    assert data["average_assessment_score"] == 58.5
    assert len(data["recent"]) == 4
    # Newest first.
    recent_ids = [item["id"] for item in data["recent"]]
    assert recent_ids == sorted(recent_ids, reverse=True)


def test_dashboard_recent_is_capped(client):
    for _ in range(7):
        client.post("/api/analyze", json={"text": REALISTIC_TEXT})

    data = client.get("/api/dashboard").get_json()["data"]

    assert data["total_analyses"] == 7
    assert len(data["recent"]) == 5
