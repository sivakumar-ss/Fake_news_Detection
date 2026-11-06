"""Shared test setup: a clean database, a fresh app and a local test site.

Run the suite from the backend/ directory:

    python -m pytest

Route tests use the ``ai_stub`` fixture instead of calling Gemini. The stub
returns deterministic analyses, so tests never need an API key or network
access.
"""

from __future__ import annotations

import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Test settings — set before config.py is imported (load_dotenv never
# overrides variables that already exist).
os.environ["FLASK_ENV"] = "testing"
os.environ["GEMINI_API_KEY"] = ""  # tests must never call the real AI API
os.environ["GROQ_API_KEY"] = ""  # (the real key lives only in backend/.env)
os.environ["AI_PROVIDER"] = "auto"  # no keys configured -> deterministic 503
os.environ["FETCH_TIMEOUT_SECONDS"] = "3"
os.environ["FETCH_MAX_BYTES"] = "150000"

TEST_DB = BACKEND_DIR / "instance" / "test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

# A believable news article used by the local test site below.
ARTICLE_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>City Council Approves New Park Budget</title>
  <meta name="description" content="The city council approved the new central park budget on Tuesday." />
  <style>body { color: red; }</style>
  <script>window.TRACK = "analytics-id-42";</script>
</head>
<body>
  <nav><a href="/">Home</a><a href="/about">About</a></nav>
  <header><h1>City Council Approves New Park Budget</h1></header>
  <article>
    <p>According to the city council, the new budget for the central park was
    approved on Tuesday after a long debate among members.</p>
    <p>The mayor said the project will create 40 new jobs and that construction
    is expected to begin early next year, based on data released by the parks
    department.</p>
    <p>Researchers from the local university confirmed that the plan includes a
    sustainable drainage system, and the findings were reported in the council
    minutes published online.</p>
  </article>
  <footer>Copyright 2026 Example News</footer>
  <script>document.write("SCRIPT_MUST_NEVER_APPEAR");</script>
</body>
</html>"""

# An RSS 2.0 feed whose first entry points at /article above. The RSS summary
# deliberately does NOT contain the article's later paragraphs, so tests can
# prove the full article (not the headline/summary) gets analyzed.
FEED_XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example News Feed</title>
    <description>Daily example headlines for tests.</description>
    <link>http://127.0.0.1/</link>
    <item>
      <title>City Council Approves New Park Budget</title>
      <description>Council approves budget after debate. (RSS summary only)</description>
      <pubDate>Tue, 05 Nov 2026 09:00:00 GMT</pubDate>
      <link>/article</link>
    </item>
    <item>
      <title>Second story nobody analyzed</title>
      <description>Another short summary.</description>
      <pubDate>Mon, 04 Nov 2026 09:00:00 GMT</pubDate>
      <link>/other</link>
    </item>
  </channel>
</rss>"""

# A feed with a channel but no items.
EMPTY_FEED_XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Example Feed</title>
    <description>Nothing to analyze here.</description>
  </channel>
</rss>"""

# XML that is not a feed at all (a sitemap).
NOT_A_FEED_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://127.0.0.1/article</loc></url>
</urlset>"""

# A feed whose first entry points at the blocked /blocked endpoint.
FEED_BLOCKED_XML = FEED_XML.replace(
    "<link>/article</link>", "<link>/blocked</link>", 1
)

# A CAPTCHA / bot-challenge page (we must refuse, never bypass).
CHALLENGE_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Just a moment...</title>
</head>
<body>
  <form id="challenge-form" action="/cdn-cgi/challenge-platform/verify">
    <p>Checking your browser before accessing the site.</p>
  </form>
</body>
</html>"""


class _TestSiteHandler(BaseHTTPRequestHandler):
    """Tiny local site used to test URL analysis without the internet."""

    def log_message(self, *args) -> None:  # keep pytest output clean
        pass

    def do_GET(self) -> None:  # noqa: N802 (stdlib naming)
        if self.path == "/article":
            self._send(200, "text/html; charset=utf-8", ARTICLE_HTML)
        elif self.path == "/feed.xml":
            self._send(200, "application/rss+xml; charset=utf-8", FEED_XML)
        elif self.path == "/feed-empty.xml":
            self._send(200, "application/rss+xml; charset=utf-8", EMPTY_FEED_XML)
        elif self.path == "/feed-blocked.xml":
            self._send(
                200, "application/rss+xml; charset=utf-8", FEED_BLOCKED_XML
            )
        elif self.path == "/not-a-feed.xml":
            self._send(200, "application/xml; charset=utf-8", NOT_A_FEED_XML)
        elif self.path == "/blocked":
            self._send(403, "text/html; charset=utf-8",
                       "<html><body><h1>Forbidden</h1></body></html>")
        elif self.path == "/unauthorized":
            self._send(401, "text/html; charset=utf-8",
                       "<html><body><h1>Unauthorized</h1></body></html>")
        elif self.path == "/challenge":
            self._send(200, "text/html; charset=utf-8", CHALLENGE_HTML)
        elif self.path == "/slow":
            time.sleep(8)  # longer than FETCH_TIMEOUT_SECONDS
            self._send(200, "text/html", "<html><body><p>too late</p></body></html>")
        elif self.path == "/not-html":
            self._send(200, "application/json", '{"ok": true}')
        elif self.path == "/large":
            body = "x" * 200_000  # over the 150_000 byte test limit
            self._send(200, "text/html", body)
        elif self.path == "/no-text":
            self._send(
                200,
                "text/html",
                '<html><head><title>Gallery</title></head>'
                '<body><div><img src="a.png"><img src="b.png"></div></body></html>',
            )
        else:
            self._send(404, "text/html", "<html><body>Not found</body></html>")

    def _send(self, status: int, content_type: str, body: str) -> None:
        payload = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


@pytest.fixture(scope="session")
def app():
    from app import create_app

    return create_app("testing")


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_database(app):
    """Start every test with an empty analyses table."""
    from database.db import get_db

    with app.app_context():
        db = get_db()
        db.execute("DELETE FROM analyses")
        db.commit()
    yield


@pytest.fixture()
def ai_stub(monkeypatch):
    """Replace Gemini with a deterministic in-memory analysis.

    Returns the list of keyword arguments each call received so tests can
    confirm the URL route forwards title/source information.
    """
    from models.analysis import Analysis
    from services import ai_service

    calls: list[dict] = []

    def fake_analyze(text, *, title=None, source_url=None, input_type="text"):
        calls.append(
            {
                "text": text,
                "title": title,
                "source_url": source_url,
                "input_type": input_type,
            }
        )

        lowered = text.lower()
        if "miracle cure" in lowered or "shocking" in lowered:
            category = "likely_false"
            score = 12
            suspicious = ["The text promotes a secret cure without a verifiable source."]
            supporting: list[str] = []
            contradicting = ["Sensational wording and pressure to share immediately."]
        elif "according to" in lowered:
            category = "likely_reliable"
            score = 74
            suspicious = []
            supporting = ["The text attributes its claims to named institutions."]
            contradicting = []
        else:
            category = "insufficient_evidence"
            score = 50
            suspicious = []
            supporting = []
            contradicting = []

        sources = []
        if source_url:
            sources.append(
                {
                    "title": title or "Fetched article",
                    "url": source_url,
                    "note": "Fetched by the backend for analysis.",
                }
            )

        return Analysis(
            content=text,
            category=category,
            assessment_score=score,
            explanation="Test analysis generated by the deterministic AI stub.",
            model="test-stub",
            title=title or "",
            source_url=source_url,
            input_type=input_type,
            suspicious_claims=suspicious,
            supporting_evidence=supporting,
            contradicting_evidence=contradicting,
            sources=sources,
        )

    monkeypatch.setattr(ai_service, "analyze_text", fake_analyze)
    return calls


@pytest.fixture(scope="session")
def test_site():
    """Run the local article site on an ephemeral port."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), _TestSiteHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()
    server.server_close()


@pytest.fixture()
def sample_analysis(client, ai_stub) -> dict:
    """Create one saved analysis and return its response data."""
    response = client.post("/api/analyze", json={"text": REALISTIC_TEXT})
    assert response.status_code == 201
    return response.get_json()["data"]


REALISTIC_TEXT = (
    "According to the Ministry of Health, a new study was published on "
    "Tuesday morning. The minister said the results were confirmed by "
    "independent researchers at three universities. The findings were "
    "announced in an official statement, and data shows a steady trend "
    "over the past five years. Officials reported that the full report "
    "will be released next month, and the study found no need for "
    "immediate action."
)
