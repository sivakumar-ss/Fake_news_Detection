import { categoryMeta } from '../data/categories'

export default function ScoreMeter({ score, category }) {
  const meta = categoryMeta(category)
  const value = Math.max(0, Math.min(100, Number(score) || 0))
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={`score-meter score-meter--${meta.tone}`}>
      <div
        className="score-meter__visual"
        role="img"
        aria-label={`Estimated assessment score: ${value} out of 100. This is not a truth probability.`}
      >
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="score-meter__track" cx="60" cy="60" r={radius} />
          <circle
            className="score-meter__progress"
            cx="60"
            cy="60"
            r={radius}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="score-meter__value">
          <strong>{value}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <div className="score-meter__label">
        <span>Estimated assessment</span>
        <small>Not a truth probability</small>
      </div>
    </div>
  )
}
