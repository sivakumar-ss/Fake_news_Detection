"""Thin SQLite connection layer built on Flask's application context."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from flask import Flask, current_app, g


def _connect(path: str) -> sqlite3.Connection:
    connection = sqlite3.connect(path, detect_types=sqlite3.PARSE_DECLTYPES)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def get_db() -> sqlite3.Connection:
    """Return a connection reused for the lifetime of the current request."""
    if "db" not in g:
        db_path = Path(current_app.config["DATABASE_PATH"])
        db_path.parent.mkdir(parents=True, exist_ok=True)
        g.db = _connect(str(db_path))
    return g.db


def close_db(_exception: BaseException | None = None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    """Apply the idempotent schema file."""
    schema_path = Path(current_app.root_path) / "database" / "schema.sql"
    db = get_db()
    db.executescript(schema_path.read_text(encoding="utf-8"))
    db.commit()


def init_app(app: Flask) -> None:
    """Register teardown handling and create tables on startup."""
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()
