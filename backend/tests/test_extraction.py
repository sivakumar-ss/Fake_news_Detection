"""Tests for article extraction (BeautifulSoup + trafilatura) and RSS feeds.

Every extraction path is covered: the trafilatura primary extractor, the
BeautifulSoup fallback, meta title/description parsing, RSS 2.0 and Atom feed
parsing, feed-to-article resolution, and the friendly errors for blocked
(401/403) and CAPTCHA pages. Route tests run against the local test site.
"""

from __future__ import annotations

import pytest
from bs4 import BeautifulSoup

from conftest import ARTICLE_HTML
from services import article_service
from services.article_service import extract_article, parse_feed
from utils.errors import APIError

pytestmark = pytest.mark.usefixtures("ai_stub")


RICH_HTML = """<!doctype html>
<html lang="en">
<head>
  <title>Fallback Title</title>
  <meta property="og:title" content="OG Title Wins" />
  <meta property="og:description" content="An og description of the story." />
</head>
<body>
  <article>
    <p>According to officials, the new regulation takes effect next month and
    affects thousands of households across the region, based on data the
    ministry published on Monday morning.</p>
    <p>Researchers said the change was expected after months of debate among
    members of the committee, and the findings were confirmed in the report.</p>
  </article>
</body>
</html>"""

ATOM_XML = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <subtitle>Sub description</subtitle>
  <entry>
    <title>Story One</title>
    <summary>Short summary text</summary>
    <updated>2026-11-06T10:00:00Z</updated>
    <link href="https://example.com/story-1" rel="alternate"/>
  </entry>
</feed>"""


# ---------------------------------------------------------------------------
# extract_article: title, description and body
# ---------------------------------------------------------------------------


def test_extract_article_returns_title_description_and_text():
    title, description, text = extract_article(RICH_HTML, url="https://example.com/a")

    assert title == "OG Title Wins"
    assert description == "An og description of the story."
    assert "takes effect next month" in text
    assert "confirmed in the report" in text


def test_extract_article_reads_the_html_title_when_no_og_tags():
    title, _description, text = extract_article(ARTICLE_HTML)

    assert title == "City Council Approves New Park Budget"
    assert "city council" in text


def test_extract_article_never_includes_scripts_or_menus():
    _title, _description, text = extract_article(ARTICLE_HTML)

    assert "SCRIPT_MUST_NEVER_APPEAR" not in text
    assert "analytics-id-42" not in text
    assert "Home" not in text
    assert "Copyright 2026" not in text


def test_extract_article_raises_a_friendly_error_without_text():
    html = "<html><head><title>Empty</title></head><body><nav>Home</nav></body></html>"

    with pytest.raises(APIError) as info:
        extract_article(html)

    assert info.value.status_code == 422
    assert "readable article text" in info.value.message


def test_primary_extractor_works_without_the_fallback(monkeypatch):
    """Prove trafilatura alone can extract the test article."""
    monkeypatch.setattr(
        article_service,
        "_fallback_text",
        lambda soup: (_ for _ in ()).throw(AssertionError("fallback used")),
    )

    _title, _description, text = extract_article(ARTICLE_HTML)

    assert "city council" in text


def test_beautifulsoup_fallback_skips_scripts_and_menus():
    soup = BeautifulSoup(ARTICLE_HTML, "html.parser")

    text = article_service._fallback_text(soup)

    assert "city council" in text
    assert "SCRIPT_MUST_NEVER_APPEAR" not in text
    assert "Home" not in text
    assert "Copyright 2026" not in text


# ---------------------------------------------------------------------------
# parse_feed: RSS 2.0 and Atom
# ---------------------------------------------------------------------------


def test_parse_feed_extracts_rss_fields():
    from conftest import FEED_XML

    feed = parse_feed(FEED_XML)

    assert feed["title"] == "Example News Feed"
    assert feed["description"] == "Daily example headlines for tests."
    assert len(feed["entries"]) == 2

    first = feed["entries"][0]
    assert first["title"] == "City Council Approves New Park Budget"
    assert first["description"] == "Council approves budget after debate. (RSS summary only)"
    assert first["published"] == "Tue, 05 Nov 2026 09:00:00 GMT"
    assert first["link"] == "/article"


def test_parse_feed_extracts_atom_fields():
    feed = parse_feed(ATOM_XML)

    assert feed["title"] == "Atom Feed"
    assert feed["description"] == "Sub description"

    entry = feed["entries"][0]
    assert entry["title"] == "Story One"
    assert entry["description"] == "Short summary text"
    assert entry["published"] == "2026-11-06T10:00:00Z"
    assert entry["link"] == "https://example.com/story-1"


def test_parse_feed_returns_no_entries_for_non_feed_xml():
    from conftest import NOT_A_FEED_XML

    feed = parse_feed(NOT_A_FEED_XML)

    assert feed["title"] == ""
    assert feed["entries"] == []


# ---------------------------------------------------------------------------
# Route: feed URLs resolve to the full article (never the summary)
# ---------------------------------------------------------------------------


def test_analyze_url_resolves_a_feed_to_its_full_article(client, test_site, ai_stub):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/feed.xml"})

    assert response.status_code == 201
    data = response.get_json()["data"]

    # The entry's link is what gets fetched, analyzed and saved.
    assert data["source_url"] == f"{test_site}/article"
    assert data["title"] == "City Council Approves New Park Budget"
    assert ai_stub[-1]["source_url"] == f"{test_site}/article"

    # The FULL article was analyzed, not the RSS headline/summary.
    assert "sustainable drainage" in data["content"]
    assert "RSS summary only" not in data["content"]

    # Feed metadata travels with the result (requirement 6).
    feed = data["feed"]
    assert feed["feed_title"] == "Example News Feed"
    assert feed["feed_description"] == "Daily example headlines for tests."
    assert feed["entry_title"] == "City Council Approves New Park Budget"
    assert "RSS summary only" in feed["entry_description"]
    assert feed["entry_published"] == "Tue, 05 Nov 2026 09:00:00 GMT"
    assert feed["entry_link"] == f"{test_site}/article"


def test_analyze_url_returns_the_page_description(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/article"})

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert (
        data["description"]
        == "The city council approved the new central park budget on Tuesday."
    )
    assert "feed" not in data


def test_analyze_url_rejects_a_feed_without_entries(client, test_site):
    response = client.post(
        "/api/analyze-url", json={"url": f"{test_site}/feed-empty.xml"}
    )

    assert response.status_code == 422
    assert "no entries" in response.get_json()["message"]


def test_analyze_url_rejects_xml_that_is_not_a_feed(client, test_site):
    response = client.post(
        "/api/analyze-url", json={"url": f"{test_site}/not-a-feed.xml"}
    )

    assert response.status_code == 422
    assert "not a recognized" in response.get_json()["message"]


def test_analyze_url_reports_feed_context_when_the_entry_is_blocked(
    client, test_site
):
    response = client.post(
        "/api/analyze-url", json={"url": f"{test_site}/feed-blocked.xml"}
    )

    assert response.status_code == 502
    message = response.get_json()["message"]
    assert "Example News Feed" in message
    assert "City Council Approves New Park Budget" in message
    assert "HTTP 403" in message


# ---------------------------------------------------------------------------
# Route: blocked sites and CAPTCHA pages get friendly errors, never crashes
# ---------------------------------------------------------------------------


def test_analyze_url_blocked_site_returns_a_friendly_error(client, test_site):
    response = client.post("/api/analyze-url", json={"url": f"{test_site}/blocked"})

    assert response.status_code == 502
    message = response.get_json()["message"]
    assert "HTTP 403" in message
    assert "paste" in message.lower()
    assert response.get_json()["success"] is False


def test_analyze_url_unauthorized_site_returns_a_friendly_error(client, test_site):
    response = client.post(
        "/api/analyze-url", json={"url": f"{test_site}/unauthorized"}
    )

    assert response.status_code == 502
    message = response.get_json()["message"]
    assert "HTTP 401" in message
    assert "paste" in message.lower()


def test_analyze_url_refuses_captcha_pages_without_bypassing_them(
    client, test_site
):
    response = client.post(
        "/api/analyze-url", json={"url": f"{test_site}/challenge"}
    )

    assert response.status_code == 502
    message = response.get_json()["message"]
    assert "CAPTCHA" in message
    assert "paste" in message.lower()
