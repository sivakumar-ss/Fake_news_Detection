export default function StatusBadge({ tone = 'neutral', children }) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {children}
    </span>
  )
}
