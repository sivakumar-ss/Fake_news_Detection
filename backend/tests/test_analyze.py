"""Tests for POST /api/analyze."""

from __future__ import annotations

import pytest

from conftest import REALISTIC_TEXT

pytestmark = pytest.mark.usefixtures("ai_stub")

SENSATIONAL_TEXT = (
    "SHOCKING secret exposed!!! You won't believe what the doctors hate "
    "about this miracle cure. Wake up and share this before it's deleted!!! "
    "MAINSTREAM MEDIA is hiding the truth from you!!!"
)

UNCERTAIN_TEXT = (
    "The local park will open on Saturday morning after the spring "
    "renovation finishes. Visitors can book picnic tables starting next week."
)


def test_analyze_requires_json_content_type(client):
    response = client.post("/api/analyze", data=REALISTIC_TEXT)

    assert response.status_code == 400
    body = response.get_json()
    assert body["success"] is False
    assert "JSON" in body["message"]


def test_analyze_rejects_malformed_json(client):
    response = client.post(
        "/api/analyze",
        data="{not valid json",
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_analyze_rejects_non_object_body(client):
    response = client.post("/api/analyze", json=["not", "an", "object"])

    assert response.status_code == 400
    assert "JSON object" in response.get_json()["message"]


def test_analyze_requires_text_field(client):
    response = client.post("/api/analyze", json={"article": REALISTIC_TEXT})

    assert response.status_code == 400
    assert "'text' is required" in response.get_json()["message"]


def test_analyze_rejects_non_string_text(client):
    response = client.post("/api/analyze", json={"text": 12345})

    assert response.status_code == 400
    assert "must be a string" in response.get_json()["message"]


def test_analyze_rejects_too_short_text(client):
    response = client.post("/api/analyze", json={"text": "Too short."})

    assert response.status_code == 400
    assert "at least 50 characters" in response.get_json()["message"]


def test_analyze_rejects_too_long_text(client):
    response = client.post("/api/analyze", json={"text": "x" * 20_001})

    assert response.status_code == 400
    assert "at most 20000 characters" in response.get_json()["message"]


def test_analyze_returns_and_stores_an_analysis(client):
    response = client.post("/api/analyze", json={"text": REALISTIC_TEXT})

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["message"] == "Analysis complete."

    data = body["data"]
    assert data["id"] is not None
    assert data["category"] == "likely_reliable"
    assert 0 <= data["assessment_score"] <= 100
    assert data["model"] == "test-stub"
    assert data["created_at"] is not None
    assert data["input_type"] == "text"
    assert data["title"]
    assert data["explanation"]
    assert isinstance(data["suspicious_claims"], list)
    assert isinstance(data["supporting_evidence"], list)
    assert isinstance(data["contradicting_evidence"], list)
    assert isinstance(data["sources"], list)

    # The analysis was saved to history.
    listing = client.get("/api/history").get_json()
    assert listing["data"]["pagination"]["total"] == 1


def test_analyze_sensational_text_reads_as_likely_false(client):
    response = client.post("/api/analyze", json={"text": SENSATIONAL_TEXT})

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["category"] == "likely_false"
    assert data["assessment_score"] < 50
    assert data["suspicious_claims"]
    assert data["contradicting_evidence"]


def test_analyze_attributed_text_reads_as_likely_reliable(client):
    response = client.post("/api/analyze", json={"text": REALISTIC_TEXT})

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["category"] == "likely_reliable"
    assert data["supporting_evidence"]


def test_analyze_neutral_text_reads_as_insufficient_evidence(client):
    response = client.post("/api/analyze", json={"text": UNCERTAIN_TEXT})

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["category"] == "insufficient_evidence"
