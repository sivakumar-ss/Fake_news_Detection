import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileText,
  Info,
  Link2,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { categoryMeta } from '../data/categories'
import { formatDate } from '../utils/format'
import CategoryBadge from './CategoryBadge'
import DemoBadge from './DemoBadge'
import ScoreMeter from './ScoreMeter'

function EvidenceList({ title, items = [], tone, Icon, emptyText }) {
  return (
    <section className={`evidence-card evidence-card--${tone}`}>
      <header className="evidence-card__header">
        <span className="evidence-card__icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <h3>{title}</h3>
        <span className="evidence-card__count">{items.length}</span>
      </header>
      {items.length > 0 ? (
        <ul className="evidence-card__list">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="evidence-card__empty">{emptyText}</p>
      )}
    </section>
  )
}

export default function AnalysisResult({ analysis }) {
  if (!analysis) return null

  const meta = categoryMeta(analysis.category)
  const suspicious = analysis.suspicious_claims || []
  const supporting = analysis.supporting_evidence || []
  const contradicting = analysis.contradicting_evidence || []
  const sources = analysis.sources || []
  const isUrl = analysis.input_type === 'url'

  return (
    <article className="result-card glass-card">
      <header className="result-card__header">
        <div className="result-card__identity">
          <div className="result-card__badges">
            <CategoryBadge category={analysis.category} />
            {analysis.is_demo && <DemoBadge />}
          </div>
          <h2>{analysis.title || 'Analysis result'}</h2>
          <div className="result-card__meta">
            <span>
              <CalendarDays size={14} aria-hidden="true" />
              {formatDate(analysis.created_at)}
            </span>
            <span>
              {isUrl ? (
                <Link2 size={14} aria-hidden="true" />
              ) : (
                <FileText size={14} aria-hidden="true" />
              )}
              {isUrl ? 'Article URL' : 'Pasted text'}
            </span>
            <span>
              <Sparkles size={14} aria-hidden="true" />
              {(analysis.model || 'AI model').split(' · ')[0]}
            </span>
          </div>
        </div>
        <ScoreMeter
          score={analysis.assessment_score}
          category={analysis.category}
        />
      </header>

      <section className="result-card__summary">
        <div className="result-card__summary-heading">
          <span className="result-card__summary-icon" aria-hidden="true">
            <Sparkles size={17} />
          </span>
          <h3>Assessment explanation</h3>
          <span className={`text-tone text-tone--${meta.tone}`}>
            {meta.label}
          </span>
        </div>
        <p>{analysis.explanation}</p>
        <p className="result-card__fineprint">
          <Info size={14} aria-hidden="true" />
          The assessment score estimates how strongly the writing signals
          reliability. It is not a probability that the content is true.
        </p>
      </section>

      <div className="evidence-grid">
        <EvidenceList
          title="Suspicious claims"
          items={suspicious}
          tone="warning"
          Icon={AlertTriangle}
          emptyText="No specific claims were flagged for verification."
        />
        <EvidenceList
          title="Supporting evidence"
          items={supporting}
          tone="success"
          Icon={CheckCircle2}
          emptyText="No supporting reliability signals were reported."
        />
        <EvidenceList
          title="Contradicting evidence"
          items={contradicting}
          tone="danger"
          Icon={XCircle}
          emptyText="No internal contradictions were reported."
        />
      </div>

      <section className="result-card__sources">
        <div className="result-card__sources-heading">
          <h3>Sources</h3>
          <span className="badge badge--soft">
            <CircleHelp size={13} aria-hidden="true" />
            Check independently
          </span>
        </div>

        {sources.length === 0 ? (
          <p className="sources-empty">
            <Info size={15} aria-hidden="true" />
            {analysis.is_demo
              ? 'Demo data has no sources attached. No real evidence was checked.'
              : 'No external sources were returned. This assessment is based only on the submitted text and is not proof of anything.'}
          </p>
        ) : (
          <ul className="source-list">
            {sources.map((source, index) => (
              <li key={`${source.url || source.title}-${index}`}>
                <span className="source-list__icon" aria-hidden="true">
                  <Link2 size={15} />
                </span>
                <div className="source-list__body">
                  <strong>{source.title || 'Source'}</strong>
                  {source.note && <span>{source.note}</span>}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {source.url}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="result-card__footer">
        <p>
          <ShieldAlert size={16} aria-hidden="true" />
          This is an AI-assisted reading of the writing, not a verified
          fact-check. Confirm important claims with primary sources.
        </p>
        <div className="result-card__actions">
          <Link className="btn btn--ghost btn--sm" to="/history">
            View history
          </Link>
          <Link className="btn btn--primary btn--sm" to="/analyze">
            <Sparkles size={15} aria-hidden="true" />
            Analyze another
          </Link>
        </div>
      </footer>
    </article>
  )
}
