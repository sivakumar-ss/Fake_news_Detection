import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eraser,
  FlaskConical,
  Info,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'
import { analyzeText, analyzeUrl } from '../services/analysisService'
import { USE_SAMPLE_DATA } from '../services/api'
import AnalysisResult from './AnalysisResult'
import LoadingAnalysis from './LoadingAnalysis'

const MIN_CHARS = 50
const MAX_CHARS = 20000

// Backend messages that mean "the site refused an automated reader" — we show
// a paste-text shortcut instead of leaving the user at a dead end.
const BLOCKED_ERROR_PATTERN =
  /automated reader|refused|HTTP 40[13]|CAPTCHA|bot-check/i

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AnalysisForm() {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const resultRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    if (loading || result) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, result])

  const trimmedUrl = url.trim()
  const trimmedText = text.trim()
  const usingUrl = trimmedUrl.length > 0
  const blockedError = BLOCKED_ERROR_PATTERN.test(error)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (usingUrl && !isValidHttpUrl(trimmedUrl)) {
      setError('Enter a complete article URL starting with http:// or https://.')
      return
    }

    if (!usingUrl && trimmedText.length < MIN_CHARS) {
      setError(
        `Add at least ${MIN_CHARS} characters of article text (currently ${trimmedText.length}).`,
      )
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const analysis = usingUrl
        ? await analyzeUrl(trimmedUrl)
        : await analyzeText(trimmedText)
      setResult(analysis)
    } catch (requestError) {
      setError(
        requestError.message ||
          'The analysis could not be completed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText('')
    setUrl('')
    setError('')
    setResult(null)
  }

  // When a site blocks automated reading (401/403/CAPTCHA), move the user to
  // the manual paste path: focus the textarea so they can paste right away.
  function handlePasteInstead() {
    textRef.current?.focus()
    textRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <div className="analyze-layout">
        <form className="analysis-form glass-card" onSubmit={handleSubmit}>
          <div className="analysis-form__header">
            <div>
              <span className="eyebrow">Workspace</span>
              <h2>Analyze an article</h2>
              <p>
                Paste the text you want to examine, or point the backend at a
                public article URL.
              </p>
            </div>
            <span className="badge badge--soft">
              <Sparkles size={14} aria-hidden="true" />
              AI-assisted
            </span>
          </div>

          <div className="field">
            <div className="field__label-row">
              <label htmlFor="article-text">Article text</label>
              <span className="field__counter">
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              id="article-text"
              ref={textRef}
              className="field__textarea"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste a headline, article excerpt, or social post here…"
              rows={10}
              maxLength={MAX_CHARS}
              spellCheck="true"
              disabled={loading}
            />
            <p className="field__hint">
              Minimum {MIN_CHARS} characters. Longer excerpts give the model
              more context.
            </p>
          </div>

          <div className="or-divider">
            <span>or analyze a link</span>
          </div>

          <div className="field">
            <div className="field__label-row">
              <label htmlFor="article-url">Article URL</label>
              {usingUrl && (
                <span className="field__priority">
                  <Link2 size={13} aria-hidden="true" />
                  URL takes priority
                </span>
              )}
            </div>
            <div className="input-with-icon">
              <Link2 size={18} aria-hidden="true" />
              <input
                id="article-url"
                type="url"
                className="field__input"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/news-article"
                inputMode="url"
                autoComplete="off"
                disabled={loading}
              />
            </div>
            <p className="field__hint">
              The backend fetches the page, extracts its article text, and
              discards scripts and menus. If both fields are filled, the URL is
              analyzed.
            </p>
          </div>

          {error && (
            <div className="form-alert" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <div className="form-alert__body">
                <span>{error}</span>
                {blockedError && usingUrl && (
                  <button
                    type="button"
                    className="form-alert__action"
                    onClick={handlePasteInstead}
                  >
                    <Info size={14} aria-hidden="true" />
                    Paste the article text instead
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="analysis-form__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleClear}
              disabled={loading || (!text && !url && !result && !error)}
            >
              <Eraser size={17} aria-hidden="true" />
              Clear
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle
                  size={18}
                  className="spin"
                  aria-hidden="true"
                />
              ) : (
                <Sparkles size={18} aria-hidden="true" />
              )}
              {loading ? 'Analyzing…' : 'Analyze News'}
            </button>
          </div>

          <p className="analysis-form__privacy">
            <LockKeyhole size={14} aria-hidden="true" />
            Submitted content goes to your Flask API. The AI API key stays on
            the server and is never sent to the browser.
          </p>
        </form>

        <aside className="analyze-aside" aria-label="Guidance">
          <div className="guidance-card glass-card">
            <h2>
              <CheckCircle2 size={17} aria-hidden="true" />
              How to read a result
            </h2>
            <ul className="guidance-list">
              {CATEGORY_ORDER.map((key) => {
                const meta = CATEGORY_META[key]
                const Icon = meta.Icon
                return (
                  <li key={key}>
                    <span
                      className={`guidance-list__icon guidance-list__icon--${meta.tone}`}
                      aria-hidden="true"
                    >
                      <Icon size={15} />
                    </span>
                    <div>
                      <strong>{meta.label}</strong>
                      <p>{meta.summary}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="guidance-card guidance-card--warning glass-card">
            <h2>
              <TriangleAlert size={17} aria-hidden="true" />
              Important limits
            </h2>
            <ul className="bullet-list">
              <li>
                The score is an estimate of writing-level signals,{' '}
                <strong>not a truth probability</strong>.
              </li>
              <li>
                The model cannot browse the web and does not verify facts or
                named sources.
              </li>
              <li>
                Treat every result as a starting point for your own
                verification.
              </li>
            </ul>
            {USE_SAMPLE_DATA && (
              <p className="guidance-card__demo">
                <FlaskConical size={14} aria-hidden="true" />
                Demo mode is enabled. Submissions are not analyzed by AI.
              </p>
            )}
            <p className="guidance-card__note">
              <Info size={14} aria-hidden="true" />
              Read the full limitations on the About page.
            </p>
          </div>
        </aside>
      </div>

      <div
        ref={resultRef}
        className="result-anchor"
        aria-live="polite"
        aria-busy={loading}
      >
        {loading && <LoadingAnalysis viaUrl={usingUrl} />}
        {!loading && result && (
          <>
            {result.feed && (
              <p className="result-anchor__feed">
                <Info size={14} aria-hidden="true" />
                Analyzed from an RSS feed: <strong>{result.feed.feed_title}</strong>
                {' — '}
                entry “{result.feed.entry_title}”
                {result.feed.entry_published
                  ? ` (${result.feed.entry_published})`
                  : ''}
                . The full article behind the headline was fetched and analyzed,
                not just the feed summary.
              </p>
            )}
            <AnalysisResult analysis={result} />
          </>
        )}
      </div>
    </>
  )
}
