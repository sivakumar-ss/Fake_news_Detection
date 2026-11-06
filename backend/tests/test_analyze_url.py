"""Tests for POST /api/analyze-url (runs against a local test site)."""

from __future__ import annotations

import socket

import pytest

pytestmark = pytest.mark.usefixtures("ai_stub")


def _closed_port_url() -> str:
    """Return a local URL whose port nothing is listening on."""
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    return f"http://127.0.0.1:{port}/"


def test_analyze_url_extracts_title_and_text(client, test_site, ai_stub):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/article"})

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["message"] == "Article fetched and analyzed."

    data = body["data"]
    assert data["title"] == "City Council Approves New Park Budget"
    assert "city council" in data["content"].lower()
    assert data["source_url"] == f"{test_site}/article"
    assert data["input_type"] == "url"
    assert data["category"] == "likely_reliable"

    # The AI service received the extracted article metadata.
    call = ai_stub[-1]
    assert call["title"] == "City Council Approves New Park Budget"
    assert call["source_url"] == f"{test_site}/article"
    assert call["input_type"] == "url"

    # A fetched URL is recorded as a source, with no invented extra sources.
    assert data["sources"] == [
        {
            "title": "City Council Approves New Park Budget",
            "url": f"{test_site}/article",
            "note": "Fetched by the backend for analysis.",
        }
    ]

    # Scripts and menus from the page must never reach the analysis.
    assert "SCRIPT_MUST_NEVER_APPEAR" not in data["content"]
    assert "analytics-id-42" not in data["content"]
    assert "Home" not in data["content"]


def test_analyze_url_saves_to_history(client, test_site):
    client.post("/api/analyze-url", json={"url": f"{test_site}/article"})

    listing = client.get("/api/history").get_json()["data"]
    assert listing["pagination"]["total"] == 1
    assert listing["items"][0]["source_url"] == f"{test_site}/article"
    assert listing["items"][0]["input_type"] == "url"


def test_analyze_url_requires_url_field(client):
    response = client.post("/api/analyze-url", json={"link": "http://x.com"})

    assert response.status_code == 400
    assert "'url' is required" in response.get_json()["message"]


def test_analyze_url_rejects_non_string_url(client):
    response = client.post("/api/analyze-url", json={"url": 42})

    assert response.status_code == 400
    assert "must be a string" in response.get_json()["message"]


def test_analyze_url_rejects_invalid_url(client):
    response = client.post("/api/analyze-url", json={"url": "not a real url"})

    assert response.status_code == 400
    assert "http" in response.get_json()["message"].lower()


def test_analyze_url_rejects_dangerous_schemes(client):
    for url in ("ftp://example.com/file", "javascript:alert(1)", "file:///etc/passwd"):
        response = client.post("/api/analyze-url", json={"url": url})
        assert response.status_code == 400, url
        assert response.get_json()["success"] is False


def test_analyze_url_rejects_missing_host(client):
    response = client.post("/api/analyze-url", json={"url": "https://"})

    assert response.status_code == 400
    assert "host" in response.get_json()["message"].lower()


def test_analyze_url_times_out(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/slow"})

    assert response.status_code == 504
    assert "too long" in response.get_json()["message"].lower()


def test_analyze_url_handles_unreachable_site(client):
    response = client.post("/api/analyze-url", json={"url": _closed_port_url()})

    assert response.status_code == 502
    assert "could not be reached" in response.get_json()["message"]


def test_analyze_url_handles_site_error(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/missing"})

    assert response.status_code == 502
    assert "HTTP 404" in response.get_json()["message"]


def test_analyze_url_rejects_non_html_page(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/not-html"})

    assert response.status_code == 415
    assert "HTML" in response.get_json()["message"]


def test_analyze_url_rejects_oversized_page(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/large"})

    assert response.status_code == 413
    assert "too large" in response.get_json()["message"]


def test_analyze_url_rejects_page_without_text(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/no-text"})

    assert response.status_code == 422
    assert "readable article text" in response.get_json()["message"]
