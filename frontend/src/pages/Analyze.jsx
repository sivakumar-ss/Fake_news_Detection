import { ShieldCheck } from 'lucide-react'
import AnalysisForm from '../components/AnalysisForm'

export default function Analyze() {
  return (
    <section className="page">
      <div className="container">
        <div className="page-heading">
          <span className="eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            Analysis workspace
          </span>
          <h1>Verify before you share.</h1>
          <p>
            Submit an article excerpt or a public URL. The result is an
            AI-assisted reading of the writing, with an explanation and the
            signals behind it.
          </p>
        </div>

        <AnalysisForm />
      </div>
    </section>
  )
}
