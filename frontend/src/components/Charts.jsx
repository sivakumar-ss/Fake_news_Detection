import { BarChart3 } from 'lucide-react'
import { CATEGORY_META, CATEGORY_ORDER } from '../data/categories'

export const TREND_DAYS = 14

/* --------------------------------------------------------------------------
   Derive the last-N-days activity from real history records (client-side,
   no backend change needed). Each point counts analyses created that day.
-------------------------------------------------------------------------- */
export function buildTrendPoints(items, days = TREND_DAYS) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    buckets.push({
      key: `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`,
      date: day,
      count: 0,
    })
  }

  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]))

  for (const item of items) {
    const created = new Date(item.created_at)
    if (Number.isNaN(created.getTime())) continue
    created.setHours(0, 0, 0, 0)
    const key = `${created.getFullYear()}-${created.getMonth() + 1}-${created.getDate()}`
    const index = indexByKey.get(key)
    if (index !== undefined) buckets[index].count += 1
  }

  return buckets
}

export function TrendChart({ points }) {
  const width = 720
  const height = 220
  const paddingX = 34
  const paddingY = 20
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingY * 2

  const maxCount = Math.max(1, ...points.map((point) => point.count))
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0

  const coords = points.map((point, index) => ({
    ...point,
    x: paddingX + index * stepX,
    y: paddingY + plotHeight - (point.count / maxCount) * plotHeight,
  }))

  const linePath = coords
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(' ')

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(paddingY + plotHeight).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(paddingY + plotHeight).toFixed(1)} Z`
      : ''

  const gridLines = [0, 0.5, 1].map((ratio) => ({
    y: paddingY + plotHeight - ratio * plotHeight,
    label: Math.round(ratio * maxCount),
  }))

  const hasActivity = points.some((point) => point.count > 0)
  const dateFormat = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  })

  if (!hasActivity) {
    return (
      <div className="trend__empty">
        <BarChart3 size={22} aria-hidden="true" />
        <span>No analyses in the last {TREND_DAYS} days.</span>
        <span>Run an analysis to start the trend chart.</span>
      </div>
    )
  }

  return (
    <>
      <div className="trend__plot">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Analysis activity over the last ${TREND_DAYS} days, from saved history records.`}
        >
          {gridLines.map((line) => (
            <g key={line.label}>
              <line
                className="trend__grid-line"
                x1={paddingX}
                y1={line.y}
                x2={width - paddingX}
                y2={line.y}
              />
              <text className="trend__axis-label" x={6} y={line.y + 4}>
                {line.label}
              </text>
            </g>
          ))}
          <path className="trend__area" d={areaPath} />
          <path className="trend__line" d={linePath} />
          {coords.map((point) => (
            <circle
              key={point.key}
              className="trend__dot"
              cx={point.x}
              cy={point.y}
              r={3.5}
            >
              <title>{`${dateFormat.format(point.date)}: ${point.count} analysis${point.count === 1 ? '' : 'es'}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="trend__footer">
        <span className="trend__legend">Analyses per day</span>
        <span>
          {dateFormat.format(points[0].date)} –{' '}
          {dateFormat.format(points[points.length - 1].date)}
        </span>
      </div>
    </>
  )
}

export function DonutChart({ data, total }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const safeTotal = Math.max(1, total)

  let accumulated = 0

  return (
    <div
      className="donut"
      role="img"
      aria-label="Category distribution of saved analyses."
    >
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="donut__track" cx="80" cy="80" r={radius} />
        {CATEGORY_ORDER.map((key) => {
          const count = data[key] || 0
          if (count === 0) return null
          const fraction = count / safeTotal
          const dash = fraction * circumference
          const gap = circumference - dash
          const offset = -accumulated * circumference
          accumulated += fraction
          return (
            <circle
              key={key}
              className={`donut__seg donut__seg--${CATEGORY_META[key].tone}`}
              cx="80"
              cy="80"
              r={radius}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </svg>
      <div className="donut__center">
        <strong>{total}</strong>
        <span>analyses</span>
      </div>
    </div>
  )
}
