import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSearch,
  Layers,
  Link2,
  Radar,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import CategoryBadge from '../components/CategoryBadge'
import DemoBadge from '../components/DemoBadge'
import SectionHeading from '../components/SectionHeading'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'

const features = [
  {
    Icon: Radar,
    title: 'Writing-level signals',
    description:
      'Every analysis looks at tone, attribution, loaded language and unsupported assertions — the cues that shape how a claim is presented.',
  },
  {
    Icon: Layers,
    title: 'Explainable categories',
    description:
      'Results are grouped into four clear categories and paired with suspicious claims, supporting signals and contradictions.',
  },
  {
    Icon: Database,
    title: 'A reviewable trail',
    description:
      'Saved analyses live in local SQLite, so you can revisit past submissions and compare the reasoning over time.',
  },
  {
    Icon: FileSearch,
    title: 'Text or URL input',
    description:
      'Paste an excerpt directly or submit a public article link — the backend extracts the readable text before analysis.',
  },
  {
    Icon: BrainCircuit,
    title: 'AI-assisted reasoning',
    description:
      'A language model reviews the writing and returns a category, an estimated score and the signals it noticed — never invented facts.',
  },
  {
    Icon: BarChart3,
    title: 'Dashboard & trends',
    description:
      'Real records from your own history power category distribution and analysis activity charts on the dashboard.',
  },
]

const previewSignals = [
  { label: 'Claim indicators', value: '3 flagged', tone: 'warning' },
  { label: 'Source attribution', value: 'Partial', tone: 'warning' },
  { label: 'Internal consistency', value: 'Mostly clear', tone: 'success' },
]

export default function Home() {
  const { hash } = useLocation()

  // Smooth-scroll to anchored sections (e.g. the "Explore Key Features" CTA).
  // Deferred one frame so it runs after Layout's scroll-to-top on route change.
  useEffect(() => {
    if (!hash) return undefined
    const target = document.getElementById(hash.slice(1))
    if (!target) return undefined
    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash])

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
              <Link
                className="btn btn--ghost btn--lg"
                to="/#features-heading"
              >
                <ArrowRight size={18} aria-hidden="true" />
                Explore Key Features
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

      <section className="section" aria-labelledby="features-heading">
        <div className="container">
          <SectionHeading
            eyebrow="Key features"
            title="More context. Less blind sharing."
            description="Designed around one question: what should you notice before trusting a claim?"
            id="features-heading"
          />

          <div className="feature-grid">
            {features.map(({ Icon, title, description }) => (
              <article className="feature-card glass-card" key={title}>
                <span className="feature-card__icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
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
