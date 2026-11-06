"""Cross-cutting tests: error envelopes, CORS, health and the index."""

from __future__ import annotations


def test_unknown_route_returns_json_404(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    body = response.get_json()
    assert body["success"] is False
    assert "message" in body


def test_wrong_method_returns_json_405(client):
    response = client.get("/api/analyze")

    assert response.status_code == 405
    assert response.get_json()["success"] is False


def test_oversized_payload_returns_413(client):
    response = client.post("/api/analyze", json={"text": "x" * 1_500_000})

    assert response.status_code == 413
    assert response.get_json()["success"] is False


def test_cors_allows_the_react_frontend(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_cors_preflight_allows_delete(client):
    response = client.open(
        "/api/history/1",
        method="OPTIONS",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "DELETE",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    allowed = response.headers.get("Access-Control-Allow-Methods", "")
    assert "DELETE" in allowed


def test_index_lists_every_endpoint(client):
    response = client.get("/")

    assert response.status_code == 200
    endpoints = response.get_json()["data"]["endpoints"]
    assert endpoints["analyze"] == "POST /api/analyze"
    assert endpoints["analyze_url"] == "POST /api/analyze-url"
    assert "GET /api/history" in endpoints["history"]
    assert "dashboard" in endpoints


def test_health_still_works(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "ok"
    assert data["checks"]["database"] == "ok"
    assert data["checks"]["gemini"] == "not_configured"
    assert data["ai"]["provider"] == "not_configured"
    assert data["gemini_model"]


def test_security_headers_are_present(client):
    response = client.get("/api/health")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
