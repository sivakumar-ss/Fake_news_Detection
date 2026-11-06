"""Tests for GET/DELETE /api/history."""

from __future__ import annotations

import pytest

from conftest import REALISTIC_TEXT

pytestmark = pytest.mark.usefixtures("ai_stub")


def _analyze(client, text: str = REALISTIC_TEXT) -> dict:
    response = client.post("/api/analyze", json={"text": text})
    assert response.status_code == 201
    return response.get_json()["data"]


def test_history_starts_empty(client):
    response = client.get("/api/history")

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["items"] == []
    assert body["data"]["pagination"] == {
        "page": 1,
        "per_page": 10,
        "total": 0,
        "pages": 1,
    }


def test_history_lists_saved_analyses_newest_first(client):
    first = _analyze(client, "x" * 60)
    second = _analyze(client, "y" * 60)

    response = client.get("/api/history")
    items = response.get_json()["data"]["items"]

    assert len(items) == 2
    assert items[0]["id"] == second["id"]
    assert items[1]["id"] == first["id"]


def test_history_paginates(client):
    for _ in range(3):
        _analyze(client)

    page_two = client.get("/api/history?page=2&per_page=2").get_json()["data"]

    assert len(page_two["items"]) == 1
    assert page_two["pagination"] == {
        "page": 2,
        "per_page": 2,
        "total": 3,
        "pages": 2,
    }


def test_history_rejects_invalid_pagination(client):
    for query in ("page=0", "page=abc", "per_page=0", "per_page=999", "page=-1"):
        response = client.get(f"/api/history?{query}")
        assert response.status_code == 400, query
        assert response.get_json()["success"] is False


def test_history_detail_returns_one_analysis(client):
    saved = _analyze(client)

    response = client.get(f"/api/history/{saved['id']}")

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["id"] == saved["id"]
    assert data["content"] == saved["content"]
    assert data["category"] == saved["category"]
    assert data["assessment_score"] == saved["assessment_score"]
    assert data["sources"] == saved["sources"]


def test_history_detail_missing_id_returns_404(client):
    response = client.get("/api/history/9999")

    assert response.status_code == 404
    body = response.get_json()
    assert body["success"] is False
    assert body["message"] == "Analysis not found."


def test_history_detail_rejects_non_numeric_id(client):
    response = client.get("/api/history/not-a-number")

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_history_delete_removes_the_analysis(client):
    saved = _analyze(client)

    delete = client.delete(f"/api/history/{saved['id']}")
    assert delete.status_code == 200
    assert delete.get_json()["message"] == "Analysis deleted."

    # It is gone from both detail and list views.
    assert client.get(f"/api/history/{saved['id']}").status_code == 404
    listing = client.get("/api/history").get_json()["data"]
    assert listing["pagination"]["total"] == 0


def test_history_delete_missing_id_returns_404(client):
    response = client.delete("/api/history/9999")

    assert response.status_code == 404
    assert response.get_json()["success"] is False
