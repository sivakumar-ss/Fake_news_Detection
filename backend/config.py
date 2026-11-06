"""Application configuration.

All secrets are read from the backend-only ``.env`` file. Nothing in this
module is ever sent to the browser.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _database_path() -> str:
    """Resolve DATABASE_PATH relative to the backend directory."""
    raw = os.getenv("DATABASE_PATH", "instance/fakenews.db").strip()
    path = Path(raw)
    if not path.is_absolute():
        path = BASE_DIR / path
    return str(path)


def _cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class BaseConfig:
    """Settings shared by every environment."""

    APP_NAME = "Fake News Detection API"
    APP_VERSION = "0.1.0"
    ENV_NAME = "base"

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-secret")
    DEBUG = False
    TESTING = False
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 1024 * 1024  # 1 MiB request limit

    DATABASE_PATH = _database_path()
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()

    # Which AI provider runs analysis: auto | gemini | groq
    AI_PROVIDER = os.getenv("AI_PROVIDER", "auto").strip().lower()
    AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "30"))

    CORS_ORIGINS = _cors_origins()
    FLASK_HOST = os.getenv("FLASK_HOST", "127.0.0.1").strip()
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))

    # Article fetching (POST /api/analyze-url)
    FETCH_TIMEOUT_SECONDS = float(os.getenv("FETCH_TIMEOUT_SECONDS", "10"))
    FETCH_MAX_BYTES = int(os.getenv("FETCH_MAX_BYTES", str(2 * 1024 * 1024)))


class DevelopmentConfig(BaseConfig):
    ENV_NAME = "development"
    DEBUG = _env_bool("FLASK_DEBUG", True)


class TestingConfig(BaseConfig):
    ENV_NAME = "testing"
    TESTING = True
    DATABASE_PATH = str(BASE_DIR / "instance" / "test.db")


class ProductionConfig(BaseConfig):
    ENV_NAME = "production"
    DEBUG = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name: str | None = None) -> type[BaseConfig]:
    """Return a config class for the requested environment."""
    env_name = (name or os.getenv("FLASK_ENV") or "development").strip().lower()
    config_class = CONFIG_MAP.get(env_name)

    if config_class is None:
        valid = ", ".join(sorted(CONFIG_MAP))
        raise ValueError(f"Unknown FLASK_ENV '{env_name}'. Expected one of: {valid}.")

    return config_class
