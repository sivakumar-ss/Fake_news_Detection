"""Fake News Detection API entry point.

Run locally with:
    python app.py
"""

from __future__ import annotations

import logging

from flask import Flask
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import get_config
from database.db import init_app as init_database
from routes import register_blueprints
from utils.errors import APIError
from utils.responses import error_response, success_response

_INSECURE_SECRET_PREFIXES = ("dev-only", "change-me", "replace-")


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    _configure_logging(app)
    _validate_production_settings(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    init_database(app)
    register_blueprints(app)
    _register_error_handlers(app)

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        return response

    @app.get("/")
    def api_index():
        return success_response(
            data={
                "service": app.config["APP_NAME"],
                "version": app.config["APP_VERSION"],
                "endpoints": {
                    "health": "/api/health",
                    "analyze": "POST /api/analyze",
                    "analyze_url": "POST /api/analyze-url",
                    "history": "GET /api/history",
                    "history_item": "GET|DELETE /api/history/<id>",
                    "dashboard": "GET /api/dashboard",
                },
            },
            message="API is running.",
        )

    return app


def _configure_logging(app: Flask) -> None:
    logging.basicConfig(
        level=logging.DEBUG if app.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def _validate_production_settings(app: Flask) -> None:
    """Refuse to boot production with an obvious placeholder secret."""
    if app.config["ENV_NAME"] != "production":
        return

    secret_key = str(app.config.get("SECRET_KEY", ""))
    if not secret_key or secret_key.startswith(_INSECURE_SECRET_PREFIXES):
        raise RuntimeError(
            "SECRET_KEY must be set to a strong, unique value before running "
            "the API in production."
        )


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        """Turn errors raised by routes/services into JSON responses."""
        return error_response(error.message, error.status_code, error.details)

    @app.errorhandler(404)
    def handle_not_found(_error):
        return error_response("The requested resource was not found.", 404)

    @app.errorhandler(405)
    def handle_method_not_allowed(_error):
        return error_response("This HTTP method is not allowed for that endpoint.", 405)

    @app.errorhandler(413)
    def handle_payload_too_large(_error):
        return error_response("The request payload is too large.", 413)

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        return error_response(
            error.description or error.name,
            error.code or 500,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error: Exception):
        app.logger.exception("Unhandled exception", exc_info=error)
        return error_response("An unexpected server error occurred.", 500)


app = create_app()


if __name__ == "__main__":
    app.run(
        host=app.config["FLASK_HOST"],
        port=app.config["FLASK_PORT"],
        debug=app.config["DEBUG"],
    )
