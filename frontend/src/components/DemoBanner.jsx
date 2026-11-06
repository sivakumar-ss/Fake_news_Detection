import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical } from 'lucide-react'

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      <div className="container demo-banner__inner">
        <span className="demo-banner__icon" aria-hidden="true">
          <FlaskConical size={16} />
        </span>
        <p>
          <strong>Demo mode is on.</strong> Sample data only — results are not
          real fact-checks.
        </p>
        <Link to="/about">
          How to enable live analysis
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
