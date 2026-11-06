"""Unit tests for the Gemini service (no network calls)."""

from __future__ import annotations

import pytest

from conftest import REALISTIC_TEXT
from models.analysis import Analysis
from services.ai_service import (
    _analysis_from_payload,
    _normalize_category,
    _normalize_score,
    _parse_json_object,
    analyze_text,
)
from utils.errors import APIError


def _payload(**overrides):
    payload = {
        "category": "likely_reliable",
        "assessment_score": 82,
        "explanation": "The text attributes claims to named institutions.",
        "suspicious_claims": [],
        "supporting_evidence": ["Named sources and specific figures."],
        "contradicting_evidence": [],
    }
    payload.update(overrides)
    return payload


def test_parse_json_object_accepts_markdown_fences():
    raw = '```json\n{"category": "likely_false", "assessment_score": 10}\n```'

    assert _parse_json_object(raw)["category"] == "likely_false"


def test_parse_json_object_rejects_text_without_json():
    with pytest.raises(Exception):
        _parse_json_object("The model refused to answer.")


def test_normalize_category_accepts_aliases():
    assert _normalize_category("Fake") == "likely_false"
    assert _normalize_category("misleading") == "potentially_misleading"
    assert _normalize_category("uncertain") == "insufficient_evidence"
    assert _normalize_category("something else") == "insufficient_evidence"


def test_normalize_score_handles_fractions_and_clamps():
    assert _normalize_score(0.82) == 82
    assert _normalize_score("74 out of 100") == 74
    assert _normalize_score(150) == 100
    assert _normalize_score(-5) == 0
    assert _normalize_score("not a number") == 50


def test_analysis_from_payload_builds_a_complete_analysis():
    analysis = _analysis_from_payload(
        _payload(
            category="Fake",
            assessment_score=0.18,
            suspicious_claims=["A secret cure is promised."],
            contradicting_evidence=["No source is named."],
        ),
        text=REALISTIC_TEXT,
        title="Example article",
        source_url="https://example.com/story",
        input_type="url",
        model="gemini-2.5-flash",
    )

    assert isinstance(analysis, Analysis)
    assert analysis.category == "likely_false"
    assert analysis.assessment_score == 18
    assert analysis.title == "Example article"
    assert analysis.source_url == "https://example.com/story"
    assert analysis.input_type == "url"
    assert analysis.suspicious_claims == ["A secret cure is promised."]
    assert analysis.contradicting_evidence == ["No source is named."]
    assert analysis.model == "gemini-2.5-flash · gemini-analysis-v1"
    assert analysis.sources == [
        {
            "title": "Example article",
            "url": "https://example.com/story",
            "note": "Fetched by the backend for analysis.",
        }
    ]


def test_analysis_from_payload_defaults_unknown_values_safely():
    analysis = _analysis_from_payload(
        {"category": "definitely_true", "assessment_score": None},
        text=REALISTIC_TEXT,
        title=None,
        source_url=None,
        input_type="text",
        model="gemini-2.5-flash",
    )

    assert analysis.category == "insufficient_evidence"
    assert analysis.assessment_score == 50
    assert analysis.title
    assert analysis.sources == []
    assert "did not provide a detailed explanation" in analysis.explanation


def test_analysis_from_payload_accepts_object_claims():
    analysis = _analysis_from_payload(
        _payload(
            suspicious_claims=[{"claim": "The moon is made of cheese."}],
            supporting_evidence="A single string is accepted.",
            contradicting_evidence=["Contradiction one.", "Contradiction two."],
        ),
        text=REALISTIC_TEXT,
        title=None,
        source_url=None,
        input_type="text",
        model="gemini-2.5-flash",
    )

    assert analysis.suspicious_claims == ["The moon is made of cheese."]
    assert analysis.supporting_evidence == ["A single string is accepted."]
    assert len(analysis.contradicting_evidence) == 2


def test_missing_gemini_key_raises_503(app):
    original = app.config["GEMINI_API_KEY"]
    app.config["GEMINI_API_KEY"] = ""

    try:
        with app.app_context():
            with pytest.raises(APIError) as info:
                analyze_text(REALISTIC_TEXT)
    finally:
        app.config["GEMINI_API_KEY"] = original

    assert info.value.status_code == 503
    assert "GEMINI_API_KEY" in info.value.message


def test_analyze_endpoint_reports_missing_configuration(client, app):
    original = app.config["GEMINI_API_KEY"]
    app.config["GEMINI_API_KEY"] = ""

    try:
        response = client.post("/api/analyze", json={"text": REALISTIC_TEXT})
    finally:
        app.config["GEMINI_API_KEY"] = original

    assert response.status_code == 503
    body = response.get_json()
    assert body["success"] is False
    assert "GEMINI_API_KEY" in body["message"]
