import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Inbox,
  Link2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import CategoryBadge from '../components/CategoryBadge'
import DemoBadge from '../components/DemoBadge'
import EmptyState from '../components/EmptyState'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'
import {
  deleteHistoryItem,
  getHistory,
} from '../services/analysisService'
import { USE_SAMPLE_DATA } from '../services/api'
import { excerpt, formatShortDate } from '../utils/format'

const PAGE_SIZE = 6

export default function History() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', items: [], error: '' })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let active = true
    setState({ status: 'loading', items: [], error: '' })

    getHistory({ page: 1, perPage: 50 })
      .then((data) => {
        if (active) {
          setState({ status: 'ready', items: data.items || [], error: '' })
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            status: 'error',
            items: [],
            error: error.message || 'History could not be loaded.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    setPage(1)
  }, [query, category])

  async function handleDelete(item) {
    if (
      !window.confirm(
        `Delete “${item.title || 'this analysis'}”? This cannot be undone.`,
      )
    ) {
      return
    }

    setDeletingId(item.id)
    setActionError('')

    try {
      await deleteHistoryItem(item.id)
      setState((current) => ({
        ...current,
        items: current.items.filter((entry) => entry.id !== item.id),
      }))
    } catch (error) {
      setActionError(error.message || 'The analysis could not be deleted.')
    } finally {
      setDeletingId(null)
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = state.items.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category
    const matchesQuery =
      !normalizedQuery ||
      `${item.title} ${item.content} ${item.explanation}`
        .toLowerCase()
        .includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const isFiltering = normalizedQuery || category !== 'all'

  function clearFilters() {
    setQuery('')
    setCategory('all')
  }

  return (
    <section className="page">
      <div className="container">
        <div className="page-heading page-heading--with-actions">
          <div>
            <span className="eyebrow">
              <Inbox size={14} aria-hidden="true" />
              Archive
            </span>
            <h1>Analysis history</h1>
            <p>
              Revisit past submissions, compare explanations and remove entries
              you no longer need.
            </p>
            {USE_SAMPLE_DATA && (
              <div className="page-heading__badges">
                <DemoBadge label="Demo history" />
              </div>
            )}
          </div>
          <div className="page-heading__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setAttempt((value) => value + 1)}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <Link className="btn btn--primary btn--sm" to="/analyze">
              <Sparkles size={15} aria-hidden="true" />
              New analysis
            </Link>
          </div>
        </div>

        <div className="history-toolbar glass-card">
          <div className="history-toolbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles and content…"
              aria-label="Search analyses"
            />
          </div>
          <label className="history-toolbar__select">
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORY_ORDER.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_META[key].label}
                </option>
              ))}
            </select>
          </label>
          <span className="history-toolbar__count">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {actionError && (
          <div className="form-alert" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}

        {state.status === 'loading' && (
          <div className="panel-loading glass-card" role="status">
            <RefreshCw size={22} className="spin" aria-hidden="true" />
            <p>Loading saved analyses…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="form-alert form-alert--block" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>History unavailable</strong>
              <p>{state.error}</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setAttempt((value) => value + 1)}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {state.status === 'ready' && state.items.length === 0 && (
          <EmptyState
            Icon={Inbox}
            title="No analyses yet"
            description="Once you run an article through the workspace, it will be saved here automatically."
            action={
              <Link className="btn btn--primary" to="/analyze">
                <Sparkles size={17} aria-hidden="true" />
                Analyze your first article
              </Link>
            }
          />
        )}

        {state.status === 'ready' &&
          state.items.length > 0 &&
          visible.length === 0 && (
            <EmptyState
              Icon={Search}
              title="No matching analyses"
              description="Try a different search term or category filter."
              action={
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              }
            />
          )}

        {visible.length > 0 && (
          <>
            <div className="history-list">
              {visible.map((item) => (
                <article className="history-card glass-card" key={item.id}>
                  <Link
                    className="history-card__main"
                    to={`/history/${item.id}`}
                  >
                    <div className="history-card__top">
                      <CategoryBadge category={item.category} />
                      {item.is_demo && <DemoBadge />}
                      <span className="history-card__date">
                        {formatShortDate(item.created_at)}
                      </span>
                    </div>
                    <h2>{item.title || 'Untitled analysis'}</h2>
                    <p className="history-card__excerpt">
                      {excerpt(item.content, 190)}
                    </p>
                    <div className="history-card__meta">
                      <span>
                        <Gauge size={14} aria-hidden="true" />
                        Score {item.assessment_score}/100
                      </span>
                      <span>
                        {item.input_type === 'url' ? (
                          <Link2 size={14} aria-hidden="true" />
                        ) : (
                          <FileText size={14} aria-hidden="true" />
                        )}
                        {item.input_type === 'url' ? 'Article URL' : 'Pasted text'}
                      </span>
                    </div>
                  </Link>

                  <div className="history-card__actions">
                    <Link
                      className="icon-btn"
                      to={`/history/${item.id}`}
                      aria-label={`Open ${item.title || 'analysis'}`}
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      aria-label={`Delete ${item.title || 'analysis'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {pages > 1 && (
              <nav className="pagination" aria-label="History pages">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  Previous
                </button>
                <span>
                  Page {currentPage} of {pages}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() =>
                    setPage((value) => Math.min(pages, value + 1))
                  }
                  disabled={currentPage === pages}
                >
                  Next
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </nav>
            )}

            {isFiltering && (
              <p className="page-disclaimer">
                Filters apply to the items loaded in this view.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
