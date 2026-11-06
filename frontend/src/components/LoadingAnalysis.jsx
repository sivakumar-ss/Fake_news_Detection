import { FlaskConical, ScanSearch } from 'lucide-react'
import { USE_SAMPLE_DATA } from '../services/api'

export default function LoadingAnalysis({ viaUrl = false }) {
  return (
    <div className="loading-analysis glass-card" role="status">
      <div className="loading-analysis__orb" aria-hidden="true">
        <span className="loading-analysis__ring" />
        <span className="loading-analysis__ring loading-analysis__ring--delay" />
        <ScanSearch size={34} strokeWidth={1.8} />
      </div>
      <h2>{viaUrl ? 'Fetching the article…' : 'Analyzing the writing…'}</h2>
      <p>
        {viaUrl
          ? 'Downloading the page, extracting the article text (skipping scripts and menus), then analyzing it.'
          : 'Reviewing tone, attribution, loaded language and unsupported claims.'}
      </p>
      <div className="loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {USE_SAMPLE_DATA && (
        <p className="loading-analysis__demo">
          <FlaskConical size={14} aria-hidden="true" />
          Demo mode: this is a simulated wait. No AI request is being sent.
        </p>
      )}
    </div>
  )
}
