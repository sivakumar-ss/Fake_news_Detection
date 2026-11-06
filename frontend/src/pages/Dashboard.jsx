import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  Clock3,
  Database,
  FileText,
  Link2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import CategoryBadge from '../components/CategoryBadge'
import { DonutChart, TrendChart, TREND_DAYS, buildTrendPoints } from '../components/Charts'
import DemoBadge from '../components/DemoBadge'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'
import { getDashboard, getHistory } from '../services/analysisService'
import { USE_SAMPLE_DATA } from '../services/api'
import { excerpt, formatShortDate } from '../utils/format'

const statIcons = {
  likely_reliable: ShieldCheck,
  potentially_misleading: TriangleAlert,
  likely_false: ShieldX,
  insufficient_evidence: CircleHelp,
}

const HISTORY_SAMPLE_LIMIT = 50

function DashboardSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading dashboard">
      <div className="stats-grid">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="stat-skeleton" key={`stat-${index}`}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div className="skeleton" style={{ width: '55%', height: 26 }} />
            <div className="skeleton" style={{ width: '75%', height: 12 }} />
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-panel glass-card">
          <div className="skeleton" style={{ width: '45%', height: 18, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 12 }} />
        </div>
        <div className="insight-stack">
          <div className="insight-card glass-card">
            <div className="skeleton" style={{ width: '100%', height: 54 }} />
          </div>
          <div className="insight-card glass-card">
            <div className="skeleton" style={{ width: '100%', height: 74 }} />
          </div>
        </div>
      </div>
      <div className="list-skeleton">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="list-skeleton__item" key={`row-${index}`}>
            <div className="skeleton" style={{ width: '42%', height: 16 }} />
            <div className="skeleton" style={{ width: '78%', height: 12 }} />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading dashboard figures…</span>
    </div>
  )
}

export default function Dashboard() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    history: [],
    error: '',
  })

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, status: 'loading', error: '' }))

    Promise.all([
      getDashboard(),
      getHistory({ page: 1, perPage: HISTORY_SAMPLE_LIMIT }).catch(() => ({
        items: [],
      })),
    ])
      .then(([dashboard, history]) => {
        if (!active) return
        setState({
          status: 'ready',
          data: dashboard,
          history: history.items || [],
          error: '',
        })
      })
      .catch((error) => {
        if (active) {
          setState({
            status: 'error',
            data: null,
            history: [],
            error: error.message || 'Dashboard data could not be loaded.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [attempt])

  if (state.status === 'loading') {
    return (
      <section className="page">
        <div className="container">
          <div className="page-heading">
            <span className="eyebrow">
              <BarChart3 size={14} aria-hidden="true" />
              Overview
            </span>
            <h1>Dashboard</h1>
          </div>
          <DashboardSkeleton />
        </div>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="page">
        <div className="container">
          <div className="page-heading">
            <span className="eyebrow">
              <BarChart3 size={14} aria-hidden="true" />
              Overview
            </span>
            <h1>Dashboard</h1>
          </div>
          <div className="form-alert form-alert--block" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>Dashboard unavailable</strong>
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
        </div>
      </section>
    )
  }

  const data = state.data
  const total = data.total_analyses
  const recent = data.recent || []
  const trendPoints = buildTrendPoints(state.history)

  return (
    <section className="page">
      <div className="container">
        <div className="page-heading page-heading--with-actions">
          <div>
            <span className="eyebrow">
              <BarChart3 size={14} aria-hidden="true" />
              Overview
            </span>
            <h1>Dashboard</h1>
            <p>
              A quick view of saved analyses, category balance and recent
              activity. Counts describe the app&apos;s history — not the
              reliability of the news ecosystem.
            </p>
            {USE_SAMPLE_DATA && (
              <div className="page-heading__badges">
                <DemoBadge label="Demo dashboard data" />
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

        <div className="stats-grid">
          <StatCard
            label="Total analyses"
            value={total}
            detail="All time"
            Icon={Database}
            tone="accent"
          />
          {CATEGORY_ORDER.map((key) => {
            const meta = CATEGORY_META[key]
            return (
              <StatCard
                key={key}
                label={meta.label}
                value={data.categories[key] || 0}
                detail={`${data.percentages[key] || 0}%`}
                Icon={statIcons[key]}
                tone={meta.tone}
              />
            )
          })}
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-panel glass-card">
            <div className="dashboard-panel__header">
              <div>
                <h2>
                  <BarChart3 size={18} aria-hidden="true" />
                  Category distribution
                </h2>
                <p>Share of all saved analyses.</p>
              </div>
              <span className="badge badge--soft">{total} saved</span>
            </div>

            <div className="distribution">
              <DonutChart data={data.categories} total={total} />
              <div className="breakdown">
                {CATEGORY_ORDER.map((key) => {
                  const meta = CATEGORY_META[key]
                  const count = data.categories[key] || 0
                  const percent = data.percentages[key] || 0

                  return (
                    <div className="breakdown__row" key={key}>
                      <div className="breakdown__label">
                        <span
                          className={`breakdown__dot breakdown__dot--${meta.tone}`}
                          aria-hidden="true"
                        />
                        <span>{meta.label}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="breakdown__track">
                        <span
                          className={`breakdown__bar breakdown__bar--${meta.tone}`}
                          style={{ width: `${Math.max(percent, count ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="breakdown__percent">{percent}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <div className="insight-stack">
            <section className="insight-card glass-card">
              <span className="insight-card__icon" aria-hidden="true">
                <TrendingUp size={19} />
              </span>
              <div>
                <span>Average assessment score</span>
                <strong>{data.average_assessment_score}</strong>
                <small>out of 100 · not a truth probability</small>
              </div>
            </section>

            <section className="insight-card glass-card">
              <span className="insight-card__icon" aria-hidden="true">
                <FileText size={19} />
              </span>
              <div>
                <span>Input sources</span>
                <div className="source-split">
                  <div>
                    <strong>{data.sources.text}</strong>
                    <small>
                      <FileText size={13} aria-hidden="true" /> Pasted text
                    </small>
                  </div>
                  <div>
                    <strong>{data.sources.url}</strong>
                    <small>
                      <Link2 size={13} aria-hidden="true" /> Article URL
                    </small>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="dashboard-panel glass-card dashboard-panel--wide">
          <div className="dashboard-panel__header">
            <div>
              <h2>
                <TrendingUp size={18} aria-hidden="true" />
                Analysis trends
              </h2>
              <p>
                Daily analysis volume over the last {TREND_DAYS} days, computed
                from your saved history records.
              </p>
            </div>
            <span className="badge">{state.history.length} recent records</span>
          </div>

          <div className="trend">
            <TrendChart points={trendPoints} />
          </div>
        </section>

        <section className="dashboard-panel glass-card dashboard-panel--recent">
          <div className="dashboard-panel__header">
            <div>
              <h2>
                <Clock3 size={18} aria-hidden="true" />
                Recent analyses
              </h2>
              <p>The five most recently saved results.</p>
            </div>
            <Link className="text-link" to="/history">
              View all
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              Icon={Sparkles}
              title="No analyses yet"
              description="Run your first article through the workspace and it will appear here."
              action={
                <Link className="btn btn--primary btn--sm" to="/analyze">
                  Start an analysis
                </Link>
              }
            />
          ) : (
            <ul className="recent-list">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link
                    className="recent-list__item"
                    to={`/history/${item.id}`}
                  >
                    <span
                      className={`recent-list__score recent-list__score--${
                        CATEGORY_META[item.category]?.tone || 'neutral'
                      }`}
                    >
                      {item.assessment_score}
                    </span>
                    <div className="recent-list__body">
                      <div className="recent-list__top">
                        <h3>{item.title || 'Untitled analysis'}</h3>
                        <CategoryBadge category={item.category} />
                        {item.is_demo && <DemoBadge />}
                      </div>
                      <p>{excerpt(item.explanation, 140)}</p>
                      <span className="recent-list__meta">
                        {formatShortDate(item.created_at)}
                        <span aria-hidden="true">·</span>
                        {item.input_type === 'url' ? 'Article URL' : 'Pasted text'}
                      </span>
                    </div>
                    <ArrowUpRight
                      className="recent-list__arrow"
                      size={18}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="page-disclaimer">
          <ShieldCheck size={15} aria-hidden="true" />
          Dashboard totals count saved app activity. They are not a measure of
          real-world misinformation.
        </p>
      </div>
    </section>
  )
}
