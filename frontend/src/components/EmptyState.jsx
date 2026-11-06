export default function EmptyState({
  Icon,
  title,
  description,
  action,
  tone = 'neutral',
}) {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      {Icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={28} />
        </span>
      )}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
