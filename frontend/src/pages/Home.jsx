import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Layers,
  Link2,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
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
]

const steps = [
  {
    number: '01',
    Icon: FileSearch,
    title: 'Paste or link',
    description:
      'Drop in an article excerpt, a social post, or a public article URL. The backend extracts the readable article text.',
  },
  {
    number: '02',
    Icon: ScanSearch,
    title: 'AI reads the writing',
    description:
      'The AI model estimates a category and an assessment score, then lists the specific signals it noticed — without inventing sources.',
  },
  {
    number: '03',
    Icon: ShieldCheck,
    title: 'You verify',
    description:
      'Review the explanation and evidence panels. Treat the result as a prompt for further research, never as a final verdict.',
  },
]

const previewSignals = [
  { label: 'Source attribution', value: 'Partial', tone: 'warning' },
  { label: 'Emotional language', value: 'Elevated', tone: 'danger' },
  { label: 'Internal consistency', value: 'Mostly clear', tone: 'success' },
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero__glow hero__glow--one" aria-hidden="true" />
        <div className="hero__glow hero__glow--two" aria-hidden="true" />
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
              Paste an article or a link. Get a transparent, category-based
              reading of the writing — with the signals the model found, clearly
              separated from fact.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/analyze">
                <Sparkles size={19} aria-hidden="true" />
                Analyze a claim
              </Link>
              <Link className="btn btn--ghost btn--lg" to="/dashboard">
                <BarChart3 size={18} aria-hidden="true" />
                View dashboard
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
                Demo · A viral post about a policy change
              </h2>
              <div className="preview-card__badges">
                <CategoryBadge category="potentially_misleading" />
                <span className="preview-card__score-inline">56 / 100</span>
              </div>

              <div className="preview-bar" aria-hidden="true">
                <span style={{ width: '56%' }} />
              </div>
              <p className="preview-card__score-note">
                Estimated assessment — not a truth probability.
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

      <section className="trust-strip" aria-label="Project highlights">
        <div className="container trust-strip__grid">
          <div className="trust-strip__item">
            <strong>4</strong>
            <span>assessment categories</span>
          </div>
          <div className="trust-strip__item">
            <strong>SQLite</strong>
            <span>local analysis history</span>
          </div>
          <div className="trust-strip__item">
            <strong>AI</strong>
            <span>reasoning behind every result</span>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="features-heading">
        <div className="container">
          <SectionHeading
            eyebrow="What this app does"
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

      <section className="section section--muted" aria-labelledby="steps-heading">
        <div className="container">
          <SectionHeading
            eyebrow="How it works"
            title="From link to reasoning in three steps."
            description="A short, transparent workflow that keeps the final judgement with you."
            id="steps-heading"
          />

          <ol className="step-grid">
            {steps.map(({ number, Icon, title, description }) => (
              <li className="step-card glass-card" key={number}>
                <span className="step-card__number">{number}</span>
                <span className="step-card__icon" aria-hidden="true">
                  <Icon size={21} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="categories-heading">
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

      <section className="section" aria-labelledby="cta-heading">
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
                Open the workspace
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
