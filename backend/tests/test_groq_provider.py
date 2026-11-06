"""Tests for AI provider selection and the Groq request path (no network)."""

from __future__ import annotations

import pytest
import requests

from conftest import REALISTIC_TEXT
from services import ai_service
from utils.errors import APIError


@pytest.fixture()
def provider_config(app):
    """Let a test change AI settings, then restore the original config."""
    snapshot = dict(app.config)
    yield app
    app.config.clear()
    app.config.update(snapshot)


class _FakeResponse:
    """Minimal stand-in for a requests.Response."""

    def __init__(self, status_code, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        return self._payload


def test_auto_prefers_gemini_when_both_keys_are_set(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "auto"
        provider_config.config["GEMINI_API_KEY"] = "gemini-key"
        provider_config.config["GROQ_API_KEY"] = "groq-key"

        name, key, model = ai_service._resolve_provider()

    assert name == "gemini"
    assert key == "gemini-key"
    assert model == provider_config.config["GEMINI_MODEL"]


def test_auto_falls_back_to_groq_when_only_the_groq_key_is_set(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "auto"
        provider_config.config["GEMINI_API_KEY"] = ""
        provider_config.config["GROQ_API_KEY"] = "groq-key"

        name, key, model = ai_service._resolve_provider()

    assert name == "groq"
    assert key == "groq-key"
    assert model == provider_config.config["GROQ_MODEL"]


def test_auto_without_any_key_raises_503_naming_both_keys(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "auto"
        provider_config.config["GEMINI_API_KEY"] = ""
        provider_config.config["GROQ_API_KEY"] = ""

        with pytest.raises(APIError) as info:
            ai_service._resolve_provider()

    assert info.value.status_code == 503
    assert "GEMINI_API_KEY" in info.value.message
    assert "GROQ_API_KEY" in info.value.message


def test_forced_gemini_without_key_raises_503(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "gemini"
        provider_config.config["GEMINI_API_KEY"] = ""

        with pytest.raises(APIError) as info:
            ai_service._resolve_provider()

    assert info.value.status_code == 503
    assert "GEMINI_API_KEY" in info.value.message


def test_forced_groq_without_key_raises_503(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "groq"
        provider_config.config["GROQ_API_KEY"] = ""

        with pytest.raises(APIError) as info:
            ai_service._resolve_provider()

    assert info.value.status_code == 503
    assert "GROQ_API_KEY" in info.value.message


def test_unknown_provider_is_a_configuration_error(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "skynet"

        with pytest.raises(APIError) as info:
            ai_service._resolve_provider()

    assert info.value.status_code == 500
    assert "AI_PROVIDER" in info.value.message


def test_status_reports_groq_without_exposing_the_key(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "auto"
        provider_config.config["GEMINI_API_KEY"] = ""
        provider_config.config["GROQ_API_KEY"] = "groq-key"

        status = ai_service.get_ai_status()

    assert status["provider"] == "groq"
    assert status["configured"] is True
    assert status["gemini_configured"] is False
    assert status["groq_configured"] is True
    assert status["model"] == provider_config.config["GROQ_MODEL"]
    assert "groq-key" not in str(status)


def test_status_without_any_key_reports_not_configured(provider_config):
    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "auto"
        provider_config.config["GEMINI_API_KEY"] = ""
        provider_config.config["GROQ_API_KEY"] = ""

        status = ai_service.get_ai_status()

    assert status["provider"] == "not_configured"
    assert status["configured"] is False
    assert status["gemini_configured"] is False
    assert status["groq_configured"] is False
    assert status["model"]  # the health endpoint still shows a model name


def test_analyze_text_uses_groq_when_only_the_groq_key_is_set(
    provider_config, monkeypatch
):
    canned = (
        '{"category": "potentially_misleading", "assessment_score": 40, '
        '"explanation": "Loaded language without attribution.", '
        '"suspicious_claims": [], "supporting_evidence": [], '
        '"contradicting_evidence": []}'
    )
    seen: dict = {}

    def fake_request_groq(api_key, model, text):
        seen.update(api_key=api_key, model=model, text=text)
        return canned

    monkeypatch.setattr(ai_service, "_request_groq", fake_request_groq)

    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "auto"
        provider_config.config["GEMINI_API_KEY"] = ""
        provider_config.config["GROQ_API_KEY"] = "groq-key"

        analysis = ai_service.analyze_text(REALISTIC_TEXT)

    assert analysis.category == "potentially_misleading"
    assert analysis.assessment_score == 40
    assert analysis.model == (
        f"{provider_config.config['GROQ_MODEL']} · {ai_service.PROMPT_VERSION}"
    )
    assert seen["api_key"] == "groq-key"
    assert REALISTIC_TEXT[:40] in seen["text"]


def test_analyze_text_maps_unreadable_groq_output_to_502(
    provider_config, monkeypatch
):
    monkeypatch.setattr(ai_service, "_request_groq", lambda *args: "not json at all")

    with provider_config.app_context():
        provider_config.config["AI_PROVIDER"] = "groq"
        provider_config.config["GROQ_API_KEY"] = "groq-key"

        with pytest.raises(APIError) as info:
            ai_service.analyze_text(REALISTIC_TEXT)

    assert info.value.status_code == 502
    assert "could not be understood" in info.value.message


def test_groq_bad_key_maps_to_502_with_a_setup_hint(provider_config, monkeypatch):
    monkeypatch.setattr(
        ai_service.requests,
        "post",
        lambda *args, **kwargs: _FakeResponse(401, text="invalid api key"),
    )

    with provider_config.app_context():
        with pytest.raises(APIError) as info:
            ai_service._request_groq("bad-key", "openai/gpt-oss-120b", REALISTIC_TEXT)

    assert info.value.status_code == 502
    assert "GROQ_API_KEY" in info.value.message


def test_groq_timeout_maps_to_504(provider_config, monkeypatch):
    def slow(*args, **kwargs):
        raise requests.exceptions.Timeout("too slow")

    monkeypatch.setattr(ai_service.requests, "post", slow)

    with provider_config.app_context():
        with pytest.raises(APIError) as info:
            ai_service._request_groq("groq-key", "openai/gpt-oss-120b", REALISTIC_TEXT)

    assert info.value.status_code == 504
