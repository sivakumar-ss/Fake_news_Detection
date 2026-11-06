import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="page">
      <div className="container">
        <div className="not-found glass-card">
          <span className="not-found__icon" aria-hidden="true">
            <Compass size={34} />
          </span>
          <span className="eyebrow">404 · Page not found</span>
          <h1>This page wandered off.</h1>
          <p>
            The link may be outdated, or the address may have a typo. Head back
            to the workspace or the home page.
          </p>
          <div className="not-found__actions">
            <Link className="btn btn--primary" to="/">
              <ArrowLeft size={17} aria-hidden="true" />
              Back home
            </Link>
            <Link className="btn btn--ghost" to="/analyze">
              Open the workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
