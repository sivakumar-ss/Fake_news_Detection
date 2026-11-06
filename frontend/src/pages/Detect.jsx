import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { API_BASE_URL } from '../services/api'
import { getHealth } from '../services/healthService'

export default function Detect() {
  const [health, setHealth] = useState({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setHealth({ state: 'loading' })

    getHealth()
      .then((data) => {
        if (!cancelled) setHealth({ state: 'online', data })
      })
      .catch((error) => {
        if (!cancelled) setHealth({ state: 'offline', error: error.message })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const tone =
    health.state === 'online'
      ? 'success'
      : health.state === 'offline'
        ? 'danger'
        : 'neutral'

  const label =
    health.state === 'online'
      ? 'Online'
      : health.state === 'offline'
        ? 'Offline'
        : 'Checking'

  return (
    <section className="page">
      <div className="container">
        <div className="page-heading">
          <span className="eyebrow">Workspace</span>
          <h1>Detect fake news</h1>
          <p>
            The claim form is the next milestone. For now, this page proves the
            React app, Axios client, Flask API, and SQLite database are wired
            together correctly.
          </p>
        </div>

        <div className="workspace-grid">
          <article className="panel panel--placeholder">
            <div className="panel__header">
              <h2>Claim analysis</h2>
              <span className="badge">Phase 2</span>
            </div>

            <div className="placeholder-block">
              <span className="placeholder-block__mark" aria-hidden="true">
                ✦
              </span>
              <h3>Detection form coming next</h3>
              <p>
                Paste a headline, article excerpt, or social post. The backend
                will ask the AI model for a verdict, a confidence score, and the
                signals behind the result.
              </p>
              <ul className="check-list">
                <li>Input validation and length limits</li>
                <li>AI response schema and error handling</li>
                <li>Result card with confidence meter</li>
              </ul>
            </div>
          </article>

          <aside className="panel" aria-labelledby="system-status-heading">
            <div className="panel__header">
              <h2 id="system-status-heading">System status</h2>
              <StatusBadge tone={tone}>{label}</StatusBadge>
            </div>

            <div aria-live="polite">
              {health.state === 'loading' && (
                <p className="status-copy">Calling the Flask health endpoint…</p>
              )}

              {health.state === 'online' && (
                <>
                  <dl className="status-list">
                    <div>
                      <dt>API</dt>
                      <dd>
                        v{health.data.version} · {health.data.environment}
                      </dd>
                    </div>
                    <div>
                      <dt>Database</dt>
                      <dd>SQLite · {health.data.checks.database}</dd>
                    </div>
                    <div>
                      <dt>AI provider</dt>
                      <dd>
                        {health.data.ai?.configured
                          ? health.data.ai.provider
                          : 'Not configured'}
                      </dd>
                    </div>
                    <div>
                      <dt>Model</dt>
                      <dd>
                        {health.data.ai?.configured
                          ? health.data.ai.model
                          : '—'}
                      </dd>
                    </div>
                  </dl>

                  {health.data.ai?.configured === false && (
                    <p className="status-hint">
                      API and database are connected. Add an AI provider key
                      to <code>backend/.env</code> (see{' '}
                      <code>.env.example</code>) before enabling live
                      detection.
                    </p>
                  )}
                </>
              )}

              {health.state === 'offline' && (
                <>
                  <p className="status-copy status-copy--error">
                    {health.error}
                  </p>
                  <p className="status-hint">
                    Start the API from <code>backend</code> with{' '}
                    <code>python app.py</code>, then confirm the frontend is
                    calling <code>{API_BASE_URL}</code>.
                  </p>
                </>
              )}
            </div>

            <div className="panel__footer">
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setAttempt((value) => value + 1)}
                disabled={health.state === 'loading'}
              >
                Retry connection
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
