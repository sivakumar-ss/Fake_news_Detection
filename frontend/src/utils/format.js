export function formatDate(value) {
  if (!value) return 'Unknown date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatShortDate(value) {
  if (!value) return 'Unknown date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function excerpt(value, length = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= length) return text
  return `${text.slice(0, length).trimEnd()}…`
}
