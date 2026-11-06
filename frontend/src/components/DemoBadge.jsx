import { FlaskConical } from 'lucide-react'

export default function DemoBadge({ label = 'Demo data' }) {
  return (
    <span className="demo-badge">
      <FlaskConical size={13} aria-hidden="true" />
      {label}
    </span>
  )
}
