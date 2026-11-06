import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Database,
  FileSearch,
  Layers,
  Link2,
  Megaphone,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
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
    Icon: Layers,
    title: 'Review the evidence',
    description:
      'See key claims, supporting evidence, contradicting evidence and source references laid out in separate, colour-coded panels.',
  },
  {
    number: '04',
    Icon: ShieldCheck,
    title: 'You verify',
    description:
      'Treat the result as a prompt for further research, then decide for yourself. The final judgement always stays with you.',
  },
]

const reasons = [
  {
    Icon: TrendingDown,
    title: 'Misinformation spreads fast',
    description:
      'Sensational claims travel further and faster than careful corrections. A quick second opinion before sharing helps break the chain.',
  },
  {
    Icon: Megaphone,
    title: 'Headlines are engineered',
    description:
      'Loaded language, urgency and outrage are designed to bypass reflection. Noticing those cues is a learnable media-literacy skill.',
  },
  {
    Icon: CircleHelp,
    title: 'Evidence often comes late',
    description:
      'By the time credible reporting corrects a claim, engagement has already peaked. Early caution costs little and matters most.',
  },
  {
    Icon: BookOpen,
    title: 'Verification is a habit',
    description:
      'Checking attribution, specificity and internal consistency turns passive scrolling into an active, repeatable review routine.',
  },
]

const capabilities = [
  {
    Icon: Radar,
    title: 'Reads writing-level cues',
    description:
      'Tone, attribution, specificity, loaded language, internal consistency and pressure to share.',
  },
  {
    Icon: BookOpen,
    title: 'Explains its reasoning',
    description:
      'Each result separates suspicious claims, supporting signals and contradicting signals in plain language.',
  },
  {
    Icon: Link2,
    title: 'Fetches article URLs',
    description:
      'Public links are downloaded and the main article text is extracted, skipping scripts, menus and ads.',
  },
  {
    Icon: Database,
    title: 'Keeps a local trail',
    description:
      'Analyses are stored in a local SQLite database so you can search, filter, revisit and delete your own history.',
  },
]

const previewSignals = [
  { label: 'Claim indicators', value: '3 flagged', tone: 'warning' },
  { label: 'Source attribution', value: 'Partial', tone: 'warning' },
  { label: 'Internal consistency', value: 'Mostly clear', tone: 'success' },
]

export default function Home() {
  const { hash } = useLocation()

  // Smooth-scroll to anchored sections (e.g. the "Explore How It Works" CTA).
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
                to="/#how-it-works"
              >
                <ArrowRight size={18} aria-hidden="true" />
                Explore How It Works
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

      <section
        className="section section--muted"
        aria-labelledby="steps-heading"
        id="how-it-works"
      >
        <div className="container">
          <SectionHeading
            eyebrow="How it works"
            title="From link to reasoning in four steps."
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

      <section
        className="section section--muted"
        aria-labelledby="reasons-heading"
      >
        <div className="container reason-grid">
          <div className="reason-copy">
            <SectionHeading
              eyebrow="Why fact checking matters"
              title="A quick pause before you share changes the outcome."
              description="Misinformation exploits attention, emotion and speed. Building a habit of verification is one of the most practical defences available to everyday readers."
              id="reasons-heading"
            />
          </div>
          <ul className="reason-list">
            {reasons.map(({ Icon, title, description }) => (
              <li key={title}>
                <span className="reason-list__icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="section"
        aria-labelledby="capabilities-heading"
      >
        <div className="container">
          <SectionHeading
            eyebrow="Analysis capabilities"
            title="What the analysis actually does."
            description="A clear scope of the signals reviewed during each submission — and what is stored locally."
            id="capabilities-heading"
          />

          <div className="feature-grid feature-grid--two">
            {capabilities.map(({ Icon, title, description }) => (
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
