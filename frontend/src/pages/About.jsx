import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  Flame,
  KeyRound,
  LockKeyhole,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'
import CategoryBadge from '../components/CategoryBadge'
import SectionHeading from '../components/SectionHeading'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'

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
    Icon: Database,
    title: 'Keeps a local trail',
    description:
      'Analyses are stored in SQLite on the machine running the Flask backend, so they can be revisited or deleted.',
  },
]

const objectives = [
  'Give readers a fast, explainable first pass over a suspicious article or post.',
  'Surface writing-level signals — attribution, tone, loaded language — that casual reading often misses.',
  'Present uncertainty honestly instead of a false-precision true/false verdict.',
  'Keep every analysis reviewable through a local, searchable history trail.',
  'Promote responsible sharing habits and independent verification, not blind trust in AI.',
]

const limits = [
  'It cannot browse the web, so it cannot confirm whether a claim is true.',
  'It cannot verify named people, organisations, studies, quotes or links.',
  'It does not detect every kind of misinformation, satire, or missing context.',
  'Its language understanding can be wrong, especially with short or ambiguous text.',
  'A high assessment score is not proof of accuracy; a low score is not proof of falsity.',
]

export default function About() {
  return (
    <>
      <section className="page about-intro">
        <div className="container">
          <div className="page-heading page-heading--wide">
            <span className="eyebrow">
              <ShieldCheck size={14} aria-hidden="true" />
              About the project
            </span>
            <h1>Media literacy, with the limits in plain sight.</h1>
            <p>
              FakeNewsDetect is an AI-assisted tool for examining how a piece of
              text is written. It is designed to slow down sharing, not to
              deliver a final verdict on what is true.
            </p>
          </div>

          <div className="about-callout glass-card">
            <span className="about-callout__icon" aria-hidden="true">
              <ShieldAlert size={22} />
            </span>
            <div>
              <h2>Read this first</h2>
              <p>
                Every result is an <strong>estimated assessment of writing-level
                signals</strong>, not a truth probability and not a substitute
                for professional fact-checking. Verify important claims with
                primary sources before acting on them or sharing them.
              </p>
            </div>
          </div>

          <div className="about-grid">
            {capabilities.map(({ Icon, title, description }) => (
              <article className="feature-card glass-card" key={title}>
                <span className="feature-card__icon" aria-hidden="true">
                  <Icon size={21} />
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
        aria-labelledby="problem-objectives-heading"
      >
        <div className="container">
          <SectionHeading
            eyebrow="Problem & objectives"
            title="Why this project exists."
            description="The problem it addresses, and the outcomes it aims to deliver."
            id="problem-objectives-heading"
          />

          <div className="problem-objectives">
            <article className="problem-card glass-card">
              <span className="problem-card__icon" aria-hidden="true">
                <AlertTriangle size={21} />
              </span>
              <h3>Problem statement</h3>
              <p>
                Misinformation spreads faster than corrections, and most readers
                lack a quick way to sanity-check an article before sharing it.
                Existing fact-checking is thorough but slow and manual, while a
                plain true/false verdict from AI would be overconfident and easy
                to misuse.
              </p>
              <p>
                Readers need a lightweight, transparent first pass that flags
                suspicious writing patterns and explains its reasoning — without
                pretending to have verified the real world.
              </p>
            </article>

            <article className="problem-card glass-card">
              <span className="problem-card__icon" aria-hidden="true">
                <Target size={21} />
              </span>
              <h3>Project objectives</h3>
              <ul className="objective-list">
                {objectives.map((objective) => (
                  <li key={objective}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="about-categories">
        <div className="container">
          <SectionHeading
            eyebrow="Assessment categories"
            title="Four cautious labels."
            description="Each category describes a reading of the submitted writing — never a verified fact."
            id="about-categories"
          />

          <div className="about-category-list">
            {CATEGORY_ORDER.map((key) => (
              <article className="about-category glass-card" key={key}>
                <div className="about-category__heading">
                  <CategoryBadge category={key} />
                </div>
                <p>{CATEGORY_META[key].summary}</p>
              </article>
            ))}
          </div>

          <div className="score-explainer glass-card">
            <div className="score-explainer__icon" aria-hidden="true">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2>What the assessment score means</h2>
              <p>
                The score runs from 0 to 100 and estimates how strongly the
                writing signals reliability. It is <strong>not</strong> the
                percentage chance that a claim is true, and it should not be
                quoted as one.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="about-limits">
        <div className="container about-limits-grid">
          <div>
            <SectionHeading
              eyebrow="Limitations"
              title="What this app cannot do."
              description="Knowing the boundaries is part of using the tool responsibly."
              id="about-limits"
            />
            <ul className="limit-list">
              {limits.map((limit) => (
                <li key={limit}>
                  <TriangleAlert size={17} aria-hidden="true" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="about-aside">
            <div className="about-aside__card glass-card">
              <span className="about-aside__icon" aria-hidden="true">
                <LockKeyhole size={20} />
              </span>
              <h2>Privacy &amp; API keys</h2>
              <p>
                The AI API key lives in <code>backend/.env</code> and is read
                only by the Flask server. It is never sent to the browser. Saved
                analyses stay in the local SQLite database.
              </p>
            </div>

            <div className="about-aside__card glass-card" id="demo-mode">
              <span className="about-aside__icon" aria-hidden="true">
                <KeyRound size={20} />
              </span>
              <h2>Demo mode &amp; live analysis</h2>
              <p>
                Demo mode is on by default so the interface works without a key.
                All demo entries are labelled and are not real fact-checks. To
                enable live analysis, set{' '}
                <code>VITE_USE_SAMPLE_DATA=false</code> in the frontend
                environment and add an AI provider key to{' '}
                <code>backend/.env</code>, then restart both servers.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section section--muted" aria-labelledby="about-stack">
        <div className="container">
          <SectionHeading
            eyebrow="Under the hood"
            title="Small stack, clear separation."
            description="The browser never talks to the AI provider directly."
            id="about-stack"
          />

          <div className="stack-grid">
            <article className="stack-card glass-card">
              <span className="stack-card__icon" aria-hidden="true">
                <Sparkles size={19} />
              </span>
              <h3>React + Vite</h3>
              <p>Responsive interface, reusable components, Lucide icons and Axios services.</p>
            </article>
            <article className="stack-card glass-card">
              <span className="stack-card__icon" aria-hidden="true">
                <BrainCircuit size={19} />
              </span>
              <h3>Flask API</h3>
              <p>Validated endpoints, JSON error envelopes, CORS and a clean route/service split.</p>
            </article>
            <article className="stack-card glass-card">
              <span className="stack-card__icon" aria-hidden="true">
                <ScanSearch size={19} />
              </span>
              <h3>AI model</h3>
              <p>AI integration stays in one service and returns a strict, normalized schema.</p>
            </article>
            <article className="stack-card glass-card">
              <span className="stack-card__icon" aria-hidden="true">
                <Database size={19} />
              </span>
              <h3>SQLite</h3>
              <p>Local persistence for history, detail views and dashboard aggregates.</p>
            </article>
          </div>

          <div className="cta-panel glass-card">
            <div>
              <span className="eyebrow">Try the workflow</span>
              <h2>See how the result is structured.</h2>
              <p>
                Use demo mode to explore the interface, then enable live
                analysis for a real reading of the writing.
              </p>
            </div>
            <div className="cta-panel__actions">
              <Link className="btn btn--primary" to="/analyze">
                <FileText size={17} aria-hidden="true" />
                Open the workspace
              </Link>
              <Link className="btn btn--ghost" to="/dashboard">
                View dashboard
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="about-footer-note">
            <Flame size={15} aria-hidden="true" />
            Built as a media-literacy project. Not a commercial fact-checking
            service.
            <CheckCircle2 size={15} aria-hidden="true" />
          </div>
        </div>
      </section>
    </>
  )
}
