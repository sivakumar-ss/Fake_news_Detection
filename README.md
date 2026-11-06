# FakeNewsDetect

An AI-powered fake-news detection application built with **React + Vite**,
**Flask**, **Groq / Google Gemini**, and **SQLite**.

The app works end to end: the React frontend is wired to all six Flask
endpoints, article URLs (including RSS/Atom feeds) are fetched and extracted
server-side, and every result is analyzed by the configured AI provider
(Groq or Gemini) and saved to SQLite. An automated suite of **82 tests**
verifies every endpoint and every extraction path.

## Features

- **Analyze pasted text** — submit a headline, claim or article excerpt and
  get an assessment category, a 0–100 score, an explanation, suspicious
  claims, and supporting/contradicting signals.
- **Analyze by URL** — the backend downloads the page with standard
  browser-compatible headers and extracts title, description and article
  text using **trafilatura + BeautifulSoup**; scripts are stripped and never
  executed.
- **RSS/Atom feed support** — paste a feed URL such as
  `https://feeds.bbci.co.uk/news/rss.xml`; the feed's title, description and
  the first entry's headline, summary, publication date and link are
  extracted, then the **full article behind the headline** is fetched and
  analyzed — never just the feed summary.
- **Friendly blocked-site handling** — HTTP 401/403 and CAPTCHA/bot-check
  pages return a clear message with a "paste the text instead" fallback; the
  app never bypasses paywalls, logins or publisher restrictions.
- **Four assessment categories** — *likely reliable*, *potentially
  misleading*, *likely false*, *insufficient evidence*, each paired with
  evidence panels.
- **History & dashboard** — every analysis is saved to SQLite; list, view
  and delete past results; see totals, category percentages and recent
  activity.
- **Demo mode** — the UI is usable with no API key via labelled sample data
  (`VITE_USE_SAMPLE_DATA=true`, the default).
- **Server-side AI keys** — Groq or Google Gemini chosen by `AI_PROVIDER`;
  keys live only in `backend/.env` and never reach the browser.

## Current status

| Area | Included today |
| --- | --- |
| Project structure | Separate `frontend/` and `backend/` applications |
| Frontend | React 19, Vite, React Router, Axios, responsive design system |
| Backend | Flask app factory, blueprints, CORS, JSON error handling |
| Database | SQLite bootstrap, `analyses` schema with history + dashboard queries |
| AI | Groq + Gemini providers selected by `AI_PROVIDER` (`services/ai_service.py`) |
| Endpoints | Analyze text, analyze URL, history list/detail/delete, dashboard |
| Article extraction | Browser headers, trafilatura + BeautifulSoup, RSS/Atom feeds, friendly 401/403 handling |
| Validation | Every request validated with friendly JSON error messages |
| Tests | 82 automated tests (`python -m pytest`) covering every endpoint and extraction path |
| Security | API keys stay server-side; fetched HTML is parsed, never executed |
| Not yet built | Rate limiting, user accounts, deployment |

## Project structure

```text
FakeNewsDetection/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── About.jsx
│   │   │   ├── Detect.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Home.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── healthService.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── pages.css
│   │   │   └── variables.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── database/
│   │   ├── db.py
│   │   └── schema.sql
│   ├── models/
│   │   ├── __init__.py
│   │   └── analysis.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── analyze.py
│   │   ├── dashboard.py
│   │   ├── health.py
│   │   └── history.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py
│   │   ├── article_service.py
│   │   └── history_service.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_ai_service.py
│   │   ├── test_analyze.py
│   │   ├── test_analyze_url.py
│   │   ├── test_api_errors.py
│   │   ├── test_dashboard.py
│   │   ├── test_extraction.py
│   │   ├── test_groq_provider.py
│   │   └── test_history.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── errors.py
│   │   ├── responses.py
│   │   └── validators.py
│   ├── .env.example
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

The local `backend/.env`, `frontend/.env`, `backend/.venv/`, `backend/instance/`,
and `node_modules/` are generated and excluded from version control, so they do
not appear in the committed tree above.

## Prerequisites

- **Python 3.11+** (verified here with Python 3.14)
- **Node.js 22+ and npm** (verified here with Node 24)
- A Groq API key (https://console.groq.com) or a Google AI Studio key —
  without either, the analysis endpoints return `503` until you add one

## Run locally (Windows PowerShell)

Use two terminals: one for Flask, one for Vite.

### 1. Backend — Flask API

```powershell
cd FakeNewsDetection\backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

# First-time only. Edit .env and set a strong SECRET_KEY.
Copy-Item .env.example .env

python app.py
```

The API starts at **http://127.0.0.1:5000** and the database is created
automatically at `backend/instance/fakenews.db`.

Verify it:

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
```

If PowerShell blocks virtual-environment activation, run the interpreter
directly instead:

```powershell
.\.venv\Scripts\python.exe app.py
```

### 2. Frontend — React app

In the second terminal:

```powershell
cd FakeNewsDetection\frontend

npm install

# First-time only. Public settings only — no secrets.
Copy-Item .env.example .env

npm run dev
```

Open **http://localhost:5173**. Navigate to **Detect** to see the live system
status reported by the Flask API.

### macOS / Linux equivalents

```bash
# Backend
cd FakeNewsDetection/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py

# Frontend (second terminal)
cd FakeNewsDetection/frontend
npm install
cp .env.example .env
npm run dev
```

## Environment variables

### Backend — `backend/.env` (private)

| Variable | Default | Purpose |
| --- | --- | --- |
| `FLASK_ENV` | `development` | Selects the config class |
| `FLASK_DEBUG` | `1` | Enables the debugger/reloader in development |
| `FLASK_HOST` | `127.0.0.1` | API bind address |
| `FLASK_PORT` | `5000` | API port |
| `SECRET_KEY` | — | Flask signing secret; generate a unique value |
| `GEMINI_API_KEY` | empty | Google Gemini key — **backend only** |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model used when Gemini is active |
| `GROQ_API_KEY` | empty | Groq key — **backend only** |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Model used when Groq is active |
| `AI_PROVIDER` | `auto` | `auto` \| `gemini` \| `groq` — which provider analyses |
| `AI_TIMEOUT_SECONDS` | `30` | Timeout for AI requests |
| `CORS_ORIGINS` | localhost:5173 | Comma-separated allowed frontend origins |
| `DATABASE_PATH` | `instance/fakenews.db` | Relative paths resolve from `backend/` |
| `FETCH_TIMEOUT_SECONDS` | `10` | How long `POST /api/analyze-url` waits for a page |
| `FETCH_MAX_BYTES` | `2097152` | Maximum article page size (2 MiB) |

Generate a strong local secret:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend — `frontend/.env` (public)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Flask API base URL used by Axios |
| `VITE_USE_SAMPLE_DATA` | `true` | `true` shows labelled demo data; `false` calls the live API |

## Security rules

- **AI API keys (Groq, Gemini) exist only in `backend/.env`.** They are read
  by `config.py` and exposed to code only through Flask's server-side config.
- The browser calls Flask only. Flask is the only component that may call an
  AI provider.
- Vite embeds every `VITE_*` variable into the public JavaScript bundle. Treat
  those values as public; never place secrets in `frontend/.env`.
- `.env` is gitignored at the project root and in both applications.
  `.env.example` is the only committed template.
- CORS is restricted to the configured frontend origins rather than `*`.
- If a key is ever exposed, revoke and rotate it (Groq: console.groq.com;
  Gemini: Google AI Studio).
- The backend refuses to start in production with a placeholder `SECRET_KEY`.

## Current API

Responses use a consistent envelope:

```json
{
  "success": true,
  "message": "Service is healthy.",
  "data": {}
}
```

Errors use the same shape with `"success": false`:

```json
{
  "success": false,
  "message": "Field 'text' must be at least 50 characters long."
}
```

| Method | Endpoint | Description | Success |
| --- | --- | --- | --- |
| `GET` | `/` | API metadata and endpoint list | 200 |
| `GET` | `/api/health` | API, SQLite, and AI provider configuration checks | 200 |
| `POST` | `/api/analyze` | Analyze `{"text": "..."}` and save the result | 201 |
| `POST` | `/api/analyze-url` | Fetch `{"url": "..."}` (article page **or RSS/Atom feed**), extract title + description + text, analyze, save | 201 |
| `GET` | `/api/history` | Paginated history (`?page=1&per_page=10`) | 200 |
| `GET` | `/api/history/<id>` | One saved analysis (404 when missing) | 200 |
| `DELETE` | `/api/history/<id>` | Delete one saved analysis (404 when missing) | 200 |
| `GET` | `/api/dashboard` | Totals, percentages, sources, recent activity | 200 |

Notes:

- Every request body is validated; invalid input returns `400` with a
  human-readable `message`.
- `/api/analyze-url` only accepts `http://`/`https://` URLs. Timeouts return
  `504`, unreachable sites `502`, non-HTML pages `415`, oversized pages `413`
  and pages without readable text `422`.
- Fetched pages are downloaded and parsed as text only — scripts are stripped
  and **never executed**.
- Each analysis is saved to history automatically, so `/api/history` and
  `/api/dashboard` always have data to show.

## Article extraction and RSS feeds

`POST /api/analyze-url` runs a dedicated pipeline in
`backend/services/article_service.py`:

1. **Fetch with browser-compatible headers** — a standard browser
   `User-Agent`, `Accept`, `Accept-Language` and `Sec-Fetch-*` headers, so
   ordinary public pages load instead of being rejected as a bot.
2. **Extract with trafilatura + BeautifulSoup** —
   [`trafilatura`](https://trafilatura.readthedocs.io/) isolates the article
   body (primary), and **BeautifulSoup** reads the title and description from
   `og:`/`twitter:`/`meta` tags and acts as the fallback body extractor for
   pages trafilatura cannot read. Scripts, styles, menus and footers are
   skipped — never executed.
3. **Analyze the extracted text** — the same AI analysis path as pasted text
   (see *AI analysis behaviour*).

**RSS/Atom feeds** (e.g. `https://feeds.bbci.co.uk/news/rss.xml`):

- A feed URL is recognized by content type or by sniffing the XML, and the
  feed's **title, description** plus the first entry's **headline,
  summary, publication date and link** are extracted.
- A headline or short summary is **never treated as a complete article**:
  the pipeline follows the entry's link and fetches the full article page
  instead, then analyzes that.
- Feed details travel with the response in `data.feed`
  (`feed_title`, `feed_description`, `entry_title`, `entry_description`,
  `entry_published`, `entry_link`), and the page's meta description is
  returned in `data.description`.

**Access policy — no bypassing:**

- HTTP `401`/`403` responses and CAPTCHA / bot-challenge pages are turned
  into a friendly `502` message explaining that the site refused automated
  reading. The app **never bypasses paywalls, logins, CAPTCHAs or publisher
  access restrictions** and never solves a challenge.
- The React UI detects these messages and offers a **"Paste the article
  text instead"** shortcut that focuses the text box, so a blocked site
  never becomes a dead end.

## Running the tests

```powershell
cd FakeNewsDetection\backend
python -m pytest
```

The suite covers every endpoint: validation failures, the happy paths,
history CRUD, dashboard aggregates, CORS preflight, error envelopes, and
URL fetching against a local test site (including timeouts, oversized and
non-HTML pages). `tests/test_extraction.py` additionally covers every
extraction path: the trafilatura primary extractor, the BeautifulSoup
fallback, meta title/description parsing, RSS 2.0 and Atom feed parsing,
feed-to-article resolution, and the friendly `401`/`403`/CAPTCHA errors.
No API key or internet connection is required.

## AI analysis behaviour

- Analysis runs inside `services/ai_service.py`. The provider is chosen by
  `AI_PROVIDER` in `backend/.env`:
  - `auto` (default) — Google Gemini when `GEMINI_API_KEY` is set, otherwise
    Groq when `GROQ_API_KEY` is set;
  - `gemini` / `groq` — force one provider (returns `503` if its key is
    missing).
- Without any key configured the API returns `503` with a message naming the
  key to add — it never silently guesses. The health check reports the active
  provider and each key's state (`checks.gemini`, `checks.groq`).
- Each stored analysis records the model used, e.g.
  `openai/gpt-oss-120b · gemini-analysis-v1`.
- API keys never leave the backend.

## Useful commands

```powershell
# Frontend production build
cd FakeNewsDetection\frontend
npm run build

# Backend import/smoke check
cd FakeNewsDetection\backend
.\.venv\Scripts\python.exe -c "from app import app; print(app.url_map)"
```

## Troubleshooting

- **Detect page says Offline:** start Flask first and check
  `VITE_API_BASE_URL`. The sidebar shows the exact URL Axios is using.
- **CORS error:** make sure the frontend origin matches `CORS_ORIGINS` in
  `backend/.env`, then restart Flask.
- **Port 5173 already in use:** Vite is configured with `strictPort`; stop the
  other process or change `server.port` in `vite.config.js`. If the origin
  changes, update `CORS_ORIGINS` too.
- **Port 5000 already in use:** change `FLASK_PORT` in `backend/.env` and point
  `VITE_API_BASE_URL` at the new port.
- **Environment changes not applied:** restart the relevant dev server; the
  backend reads `.env` at startup.

## Next steps

1. **Frontend integration:** wire the Detect and History pages to
   `POST /api/analyze`, `POST /api/analyze-url` and the history/dashboard
   endpoints (an Axios client already exists in `frontend/src/services/api.js`).
2. **Hardening:** rate limiting, request logging, SSRF protection for
   `/api/analyze-url`, production server setup (gunicorn/waitress) and
   deployment documentation.

The goal is to keep each phase independently runnable and reviewable.
