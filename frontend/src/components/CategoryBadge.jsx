import { categoryMeta } from '../data/categories'

export default function CategoryBadge({ category, className = '' }) {
  const meta = categoryMeta(category)
  const Icon = meta.Icon

  return (
    <span
      className={`category-badge category-badge--${meta.tone} ${className}`.trim()}
      title={meta.summary}
    >
      <Icon size={14} strokeWidth={2.3} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
