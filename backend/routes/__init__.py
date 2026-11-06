"""HTTP route registration."""

from flask import Flask

from routes.analyze import bp as analyze_bp
from routes.dashboard import bp as dashboard_bp
from routes.health import bp as health_bp
from routes.history import bp as history_bp


def register_blueprints(app: Flask) -> None:
    """Attach every feature blueprint to the app."""
    app.register_blueprint(analyze_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(health_bp)
