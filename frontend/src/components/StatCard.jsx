export default function StatCard({
  label,
  value,
  detail,
  Icon,
  tone = 'neutral',
}) {
  return (
    <article className={`stat-card glass-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon" aria-hidden="true">
          {Icon && <Icon size={18} />}
        </span>
        {detail && <span className="stat-card__detail">{detail}</span>}
      </div>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__label">{label}</span>
    </article>
  )
}
