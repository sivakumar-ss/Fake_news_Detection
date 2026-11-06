"""Fetch a news article URL (or an RSS/Atom feed) and extract readable text.

Extraction pipeline:
- ``trafilatura`` isolates the article body (best on real news pages).
- ``BeautifulSoup`` supplies the page title/description from Open Graph and
  meta tags, and serves as the fallback body extractor.
- ``<script>`` content is skipped, never executed.

Access policy (important):
- We send standard browser-compatible headers so ordinary public pages load.
- We NEVER bypass paywalls, logins, CAPTCHAs or publisher restrictions.
  A 401/403 or a bot-challenge page is reported with a friendly message so
  the user can paste the article text manually instead.

RSS/Atom feeds:
- A feed headline or summary is NOT a complete article, so a feed URL is
  resolved to its first entry's link and that full page is fetched instead.
- The feed's title, description, entry title, summary, publication date and
  link are kept and returned alongside the analysis.
"""

from __future__ import annotations

import re
from urllib.parse import urljoin

import requests
import trafilatura
from bs4 import BeautifulSoup
from flask import current_app

from utils.errors import APIError

# A plain browser-like user agent; some sites block the default "python-requests".
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36 FakeNewsDetection/1.0"
)

# Standard browser-compatible request headers (requirement: look like a browser).
BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}

# Tags whose contents are never useful article text (and must never run).
_SKIP_TAGS = {
    "script", "style", "noscript", "template", "iframe", "svg", "canvas",
    "object", "embed", "form", "button", "select", "textarea", "nav",
    "footer", "aside",
}

# Tags that hold one paragraph/block of prose.
_BLOCK_TAGS = [
    "p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li", "pre",
    "figcaption", "dt", "dd",
]

# Minimum amount of extracted text before we call the fetch successful.
MIN_ARTICLE_CHARS = 100
MAX_ARTICLE_CHARS = 20_000

# Structural signs of a CAPTCHA / bot-challenge page. We stop here and never
# attempt to solve or bypass the challenge.
_CHALLENGE_TITLE_MARKERS = (
    "just a moment",
    "attention required",
    "verify you are human",
    "checking your browser",
    "one more step",
    "please solve the challenge",
)
_CHALLENGE_BODY_MARKERS = (
    "g-recaptcha",
    "h-captcha",
    "hcaptcha.com/1/api.js",
    "captcha-delivery",
    "id=\"challenge-form\"",
    "cf-challenge",
)


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------


def fetch_article(url: str, *, _depth: int = 0) -> dict:
    """Download ``url`` and return ``{"url", "title", "description", "text"}``.

    Feed URLs return the same shape plus a ``"feed"`` key describing the feed
    and the entry that was resolved. Raises APIError with a friendly message
    for invalid URLs, blocked sites, timeouts, non-HTML pages and pages with
    no readable text — the application never crashes on a fetch problem.
    """
    max_bytes = current_app.config["FETCH_MAX_BYTES"]
    response = _get(url)

    with response:
        _check_status(response)
        _check_size_header(response, max_bytes)
        content_type = response.headers.get("Content-Type", "").lower()
        raw = _read_body(response, max_bytes)

    page = _decode(raw, response)

    if _looks_like_feed(content_type, page):
        return _fetch_feed_entry(url, page, _depth)

    if "html" not in content_type and not _looks_like_html(page):
        raise APIError("That URL did not return an HTML page.", 415)

    _reject_challenge(page)
    title, description, text = extract_article(page, url=url)
    return {"url": url, "title": title, "description": description, "text": text}


def _get(url: str) -> requests.Response:
    """GET ``url`` with browser headers; map transport errors to APIError."""
    timeout = current_app.config["FETCH_TIMEOUT_SECONDS"]
    try:
        return requests.get(
            url,
            timeout=timeout,
            stream=True,
            allow_redirects=True,
            headers=BROWSER_HEADERS,
        )
    except requests.exceptions.Timeout as exc:
        raise APIError(
            "The website took too long to respond. Please try again later.", 504
        ) from exc
    except requests.exceptions.TooManyRedirects as exc:
        raise APIError("The URL redirected too many times.", 502) from exc
    except requests.exceptions.RequestException as exc:
        raise APIError(
            "The URL could not be reached. Check the link and try again.", 502
        ) from exc


def _check_status(response: requests.Response) -> None:
    """Turn HTTP errors into friendly messages (401/403 explain the paste path)."""
    if response.status_code in (401, 403):
        # Many sites (news wires, social networks...) reject every automated
        # reader. We do not try to bypass the restriction.
        raise APIError(
            f"The website refused to serve this page to an automated reader "
            f"(HTTP {response.status_code}). Many news sites block scripts "
            "like this one, and we never bypass access restrictions. Try a "
            "different link, or paste the article text instead.",
            502,
        )
    if response.status_code >= 400:
        raise APIError(
            f"The website returned an error (HTTP {response.status_code}).", 502
        )


def _check_size_header(response: requests.Response, max_bytes: int) -> None:
    raw_length = response.headers.get("Content-Length", "")
    if raw_length.isdigit() and int(raw_length) > max_bytes:
        raise APIError("The page is too large to analyze.", 413)


def _read_body(response: requests.Response, max_bytes: int) -> bytes:
    """Read the body in chunks, stopping if it exceeds ``max_bytes``."""
    chunks: list[bytes] = []
    total = 0
    for chunk in response.iter_content(chunk_size=65_536):
        total += len(chunk)
        if total > max_bytes:
            raise APIError("The page is too large to analyze.", 413)
        chunks.append(chunk)
    return b"".join(chunks)


def _decode(raw: bytes, response: requests.Response) -> str:
    """Decode the page: header charset, then <meta charset>, then UTF-8."""
    candidates: list[str] = []
    header_encoding = response.encoding
    if header_encoding and header_encoding.lower() not in ("iso-8859-1", "latin-1"):
        candidates.append(header_encoding)

    sniffed = _sniff_meta_charset(raw)
    if sniffed:
        candidates.append(sniffed)
    candidates.append("utf-8")

    for name in candidates:
        try:
            text = raw.decode(name)
        except (UnicodeDecodeError, LookupError):
            continue
        return text[1:] if text.startswith("\ufeff") else text
    return raw.decode("utf-8", errors="replace")


def _sniff_meta_charset(raw: bytes) -> str | None:
    """Find ``charset=...`` in the first few KB of the document."""
    head = raw[:4096].decode("ascii", errors="ignore")
    match = re.search(r"charset\s*=\s*[\"']?([A-Za-z0-9_-]+)", head, re.IGNORECASE)
    return match.group(1) if match else None


# ---------------------------------------------------------------------------
# Challenge / paywall policy
# ---------------------------------------------------------------------------


def _reject_challenge(page: str) -> None:
    """Stop on CAPTCHA, login or bot-check pages — never try to bypass them."""
    head = page[:4000]
    title_match = re.search(r"<title[^>]*>(.*?)</title>", head, re.I | re.S)
    title = title_match.group(1).lower() if title_match else ""
    lowered = head.lower()

    hit_title = any(marker in title for marker in _CHALLENGE_TITLE_MARKERS)
    hit_body = any(marker in lowered for marker in _CHALLENGE_BODY_MARKERS)
    if hit_title or hit_body:
        raise APIError(
            "This site is showing a CAPTCHA, login or bot-check page. We "
            "never bypass those restrictions — open the page in your browser "
            "and paste the article text instead.",
            502,
        )


# ---------------------------------------------------------------------------
# RSS / Atom feeds
# ---------------------------------------------------------------------------


def _looks_like_feed(content_type: str, page: str) -> bool:
    """True when the response is RSS/Atom/RDF XML (by header or by sniffing)."""
    if any(hint in content_type for hint in ("xml", "rss", "atom")):
        return True
    head = page.lstrip()[:600].lower()
    return head.startswith("<?xml") and any(
        tag in head for tag in ("<rss", "<feed", "<rdf:rdf")
    )


def _looks_like_html(page: str) -> bool:
    head = page.lstrip()[:600].lower()
    return head.startswith("<!doctype html") or head.startswith("<html")


def parse_feed(page: str) -> dict:
    """Parse an RSS 2.0, Atom or RDF feed into plain strings.

    Returns ``{"title", "description", "entries"}`` where every entry holds
    ``{"title", "description", "published", "link"}``.
    """
    soup = BeautifulSoup(page, "xml")

    container = soup.find("channel") or soup.find("feed")
    feed_title = _first_text(container, ("title",)) if container else ""
    feed_description = (
        _first_text(container, ("description", "subtitle")) if container else ""
    )

    items = soup.find_all("item") or soup.find_all("entry")
    entries = []
    for item in items[:10]:
        entries.append(
            {
                "title": _first_text(item, ("title",)),
                "description": _first_text(
                    item, ("description", "summary", "content:encoded")
                ),
                "published": _first_text(
                    item, ("pubDate", "published", "updated", "date")
                ),
                "link": _entry_link(item),
            }
        )

    return {
        "title": feed_title,
        "description": feed_description,
        "entries": entries,
    }


def _first_text(node, names: tuple[str, ...]) -> str:
    """Text of the first matching child tag, HTML stripped from the value."""
    for name in names:
        tag = node.find(name)
        if tag is None:
            continue
        text = _strip_html(tag.get_text(" ", strip=True))
        if text:
            return text
    return ""


def _entry_link(item) -> str:
    """Entry link: Atom uses <link href="..."/>, RSS uses <link>text</link>."""
    tag = item.find("link")
    if tag is None:
        return ""
    href = tag.get("href")
    if href:
        return str(href).strip()
    return tag.get_text(strip=True)


def _strip_html(value: str) -> str:
    """Turn an HTML fragment (common in RSS descriptions) into plain text."""
    if "<" in value and ">" in value:
        return BeautifulSoup(value, "html.parser").get_text(" ", strip=True)
    return " ".join(value.split())


def _fetch_feed_entry(feed_url: str, page: str, depth: int) -> dict:
    """Resolve a feed to its first entry's full article page.

    A headline or summary is never analyzed as if it were a complete article:
    we always follow the entry link and fetch the real page instead.
    """
    feed = parse_feed(page)

    if not feed["title"] and not feed["entries"]:
        raise APIError("That URL is XML but not a recognized RSS or Atom feed.", 422)
    if not feed["entries"]:
        raise APIError(
            f"The feed '{feed['title']}' contains no entries to analyze.", 422
        )

    entry = feed["entries"][0]
    if depth >= 1:
        raise APIError(
            "This feed's entry links to another feed instead of an article, "
            "so there is no full text to analyze. Paste the text instead.",
            422,
        )

    link = urljoin(feed_url, entry["link"])
    if not link:
        raise APIError(
            f"The feed '{feed['title']}' has an entry without a link "
            f"('{entry['title']}'). Nothing full-text to analyze — paste the "
            "text instead.",
            422,
        )

    try:
        article = fetch_article(link, _depth=depth + 1)
    except APIError as exc:
        # Keep the extracted feed details in the error so the user still sees
        # what was found before the article itself refused to load.
        raise APIError(
            f"Found the feed '{feed['title']}' and its first entry "
            f"\"{entry['title']}\" ({entry['published'] or 'no date'}) at "
            f"{link}, but the article could not be read: {exc.message}",
            exc.status_code,
        ) from exc

    article["feed"] = {
        "feed_title": feed["title"],
        "feed_description": feed["description"],
        "entry_title": entry["title"],
        "entry_description": entry["description"],
        "entry_published": entry["published"],
        "entry_link": link,
    }
    return article


# ---------------------------------------------------------------------------
# Article extraction (BeautifulSoup + trafilatura)
# ---------------------------------------------------------------------------


def extract_article(html: str, url: str | None = None) -> tuple[str, str, str]:
    """Return ``(title, description, article_text)`` from an HTML document.

    1. BeautifulSoup reads title/description from og:, twitter: and meta tags.
    2. trafilatura extracts the article body (primary).
    3. A BeautifulSoup block scan is the fallback for pages trafilatura
       cannot read (tiny pages, unusual layouts).
    """
    soup = BeautifulSoup(html, "html.parser")

    title = (
        _meta_content(soup, "property", "og:title")
        or _meta_content(soup, "name", "twitter:title")
        or (soup.title.get_text(strip=True) if soup.title else "")
    )
    description = (
        _meta_content(soup, "property", "og:description")
        or _meta_content(soup, "name", "twitter:description")
        or _meta_content(soup, "name", "description")
    )

    # trafilatura can fill in metadata the meta tags did not provide.
    try:
        meta = trafilatura.extract_metadata(html)
    except Exception:  # metadata is a nice-to-have, never a hard failure
        meta = None
    if meta is not None:
        title = title or str(getattr(meta, "title", "") or "").strip()
        description = description or str(
            getattr(meta, "description", "") or ""
        ).strip()

    # Primary body extractor: trafilatura.
    text = ""
    try:
        text = (
            trafilatura.extract(
                html, url=url, include_comments=False, include_tables=False
            )
            or ""
        ).strip()
    except Exception:
        text = ""

    # Fallback: BeautifulSoup block scan (skips scripts, menus, footers).
    if len(text) < MIN_ARTICLE_CHARS:
        text = _fallback_text(soup)

    if len(text) < MIN_ARTICLE_CHARS:
        raise APIError(
            "We could not find readable article text on that page.", 422
        )

    if not title:
        title = text.split(".", 1)[0][:120]

    return title, description, text[:MAX_ARTICLE_CHARS]


def _meta_content(soup: BeautifulSoup, key: str, value: str) -> str:
    tag = soup.find("meta", attrs={key: value})
    if tag and tag.get("content"):
        return " ".join(str(tag["content"]).split())
    return ""


def _fallback_text(soup: BeautifulSoup) -> str:
    """Collect readable text blocks with BeautifulSoup.

    Navigation, scripts, styles and footers are removed first so they can
    never leak into the analysis. Blocks inside ``<article>``/``<main>`` are
    preferred when present.
    """
    if soup.head is not None:
        soup.head.decompose()  # title/description were already read
    for tag in soup.find_all(_SKIP_TAGS):
        tag.decompose()

    containers = soup.find_all(["article", "main"])
    text = _collect_blocks(containers) if containers else ""
    if len(text) < MIN_ARTICLE_CHARS:
        text = _collect_blocks([soup])
    if len(text) < MIN_ARTICLE_CHARS:
        text = soup.get_text(" ", strip=True)
    return text


def _collect_blocks(roots: list) -> str:
    """Join the innermost block-tag texts under ``roots`` (no duplicates)."""
    pieces: list[str] = []
    for root in roots:
        for tag in root.find_all(_BLOCK_TAGS):
            if tag.find(_BLOCK_TAGS):
                continue  # a parent block; its children are collected instead
            piece = tag.get_text(" ", strip=True)
            if piece:
                pieces.append(piece)
    return "\n\n".join(pieces)
