import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Link2,
  Radar,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import CategoryBadge from '../components/CategoryBadge'
import DemoBadge from '../components/DemoBadge'
import SectionHeading from '../components/SectionHeading'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'

const previewSignals = [
  { label: 'Claim indicators', value: '3 flagged', tone: 'warning' },
  { label: 'Source attribution', value: 'Partial', tone: 'warning' },
  { label: 'Internal consistency', value: 'Mostly clear', tone: 'success' },
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="hero__eyebrow">
              <span className="live-dot" aria-hidden="true" />
              AI-assisted media literacy
            </span>
            <h1>
              Don&apos;t Believe Everything You Read.{' '}
              <span className="text-gradient">Verify Before You Share.</span>
            </h1>
            <p className="hero__lede">
              FakeNewsDetect reads the writing — tone, attribution, loaded
              language and unsupported claims — and returns a transparent,
              category-based assessment with the signals clearly separated from
              fact.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/analyze">
                <Sparkles size={19} aria-hidden="true" />
                Analyze News
              </Link>
            </div>
            <ul className="hero__points">
              <li>
                <CheckCircle2 size={16} aria-hidden="true" />
                Four clear categories
              </li>
              <li>
                <CheckCircle2 size={16} aria-hidden="true" />
                Evidence-aware explanations
              </li>
              <li>
                <CheckCircle2 size={16} aria-hidden="true" />
                Local-first history
              </li>
            </ul>
          </div>

          <div className="hero__visual">
            <div className="preview-card glass-card">
              <div className="preview-card__top">
                <span className="preview-card__eyebrow">
                  <Radar size={15} aria-hidden="true" />
                  Assessment preview
                </span>
                <DemoBadge label="Illustrative sample" />
              </div>

              <h2 className="preview-card__title">
                Sample · A viral post about a policy change
              </h2>
              <div className="preview-card__badges">
                <CategoryBadge category="potentially_misleading" />
                <span className="preview-card__score-inline">
                  Credibility estimate 56 / 100
                </span>
              </div>

              <div className="preview-bar" aria-hidden="true">
                <span style={{ width: '56%' }} />
              </div>
              <p className="preview-card__score-note">
                Estimated indicator — not a probability of truth.
              </p>

              <div className="preview-signals">
                {previewSignals.map((signal) => (
                  <div className="preview-signals__row" key={signal.label}>
                    <span>{signal.label}</span>
                    <span className={`signal-pill signal-pill--${signal.tone}`}>
                      {signal.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="preview-block">
                <span className="preview-block__label">
                  Evidence coverage <strong>64%</strong>
                </span>
                <div className="preview-coverage" aria-hidden="true">
                  <span style={{ width: '64%' }} />
                </div>
              </div>

              <div className="preview-block">
                <span className="preview-block__label">Evidence summary</span>
                <ul className="preview-evidence">
                  <li className="evidence-good">
                    <CheckCircle2 size={13} aria-hidden="true" />
                    Attribution present to a named official
                  </li>
                  <li className="evidence-warn">
                    <ShieldAlert size={13} aria-hidden="true" />
                    Central figure claim lacks a cited reference
                  </li>
                </ul>
              </div>

              <div className="preview-source">
                <Link2 size={14} aria-hidden="true" />
                <span>
                  Source attribution: <strong>example-news.test</strong> ·
                  secondary references not verified
                </span>
              </div>

              <p className="preview-card__note">
                This is a static design sample, not a real fact-check. No real
                claim, evidence or source is being assessed.
              </p>
            </div>

            <div
              className="floating-chip floating-chip--bottom"
              aria-hidden="true"
            >
              <ShieldAlert size={15} />
              AI-assisted, not a verdict
            </div>
          </div>
        </div>
      </section>

      <section className="section section--muted" aria-labelledby="categories-heading">
        <div className="container">
          <SectionHeading
            eyebrow="The four categories"
            title="A vocabulary for cautious assessment."
            description="These labels describe the writing, not the truth of the underlying claim."
            id="categories-heading"
          />

          <div className="category-grid">
            {CATEGORY_ORDER.map((key) => {
              const meta = CATEGORY_META[key]
              const Icon = meta.Icon
              return (
                <article
                  className={`category-card glass-card category-card--${meta.tone}`}
                  key={key}
                >
                  <span className="category-card__icon" aria-hidden="true">
                    <Icon size={21} />
                  </span>
                  <h3>{meta.label}</h3>
                  <p>{meta.summary}</p>
                </article>
              )
            })}
          </div>

          <div className="category-footnote">
            <ShieldAlert size={17} aria-hidden="true" />
            <p>
              A category is not a fact-check. The model works only from the
              submitted text and cannot verify the real world.
            </p>
            <Link to="/about">
              Read the limits
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section"
        aria-labelledby="disclaimer-heading"
      >
        <div className="container">
          <div className="disclaimer-panel">
            <span className="disclaimer-panel__icon" aria-hidden="true">
              <ShieldAlert size={22} />
            </span>
            <div>
              <h2 id="disclaimer-heading">Responsible AI disclaimer</h2>
              <p>
                FakeNewsDetect provides <strong>AI-assisted estimates</strong>{' '}
                about how an article is written. It does not confirm whether a
                claim is true or false, and it never replaces independent
                verification or professional journalism.
              </p>
              <p>
                Assessment scores are{' '}
                <strong>estimated indicators, not probabilities of truth</strong>
                . Always consult primary sources and reputable reporting before
                deciding what to believe or share. Read the full{' '}
                <Link to="/about">limits of AI-generated assessments</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--muted" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-panel glass-card">
            <div>
              <span className="eyebrow">Start verifying</span>
              <h2 id="cta-heading">
                Ready to check what you&apos;re reading?
              </h2>
              <p>
                Run an article through the workspace, then use the evidence
                panels to decide what deserves a closer look.
              </p>
            </div>
            <div className="cta-panel__actions">
              <Link className="btn btn--primary btn--lg" to="/analyze">
                <Sparkles size={19} aria-hidden="true" />
                Analyze News
              </Link>
              <Link className="btn btn--ghost btn--lg" to="/history">
                Browse history
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
