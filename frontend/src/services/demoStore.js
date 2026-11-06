import { demoAnalyses } from '../data/demoData'

let items = demoAnalyses.map((item) => ({ ...item })).sort(byNewest)
let nextId = 2000

function byNewest(a, b) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function recomputeDashboard() {
  const total = items.length
  const categories = {
    likely_reliable: 0,
    potentially_misleading: 0,
    likely_false: 0,
    insufficient_evidence: 0,
  }

  for (const item of items) {
    categories[item.category] = (categories[item.category] || 0) + 1
  }

  const percent = (count) => (total ? Math.round((count * 1000) / total) / 10 : 0)
  const average = total
    ? Math.round(
        (items.reduce((sum, item) => sum + item.assessment_score, 0) / total) * 10,
      ) / 10
    : 0
  const urlCount = items.filter((item) => item.input_type === 'url').length

  return {
    total_analyses: total,
    categories,
    percentages: Object.fromEntries(
      Object.entries(categories).map(([key, value]) => [key, percent(value)]),
    ),
    average_assessment_score: average,
    sources: { url: urlCount, text: total - urlCount },
    recent: items.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      source_url: item.source_url,
      input_type: item.input_type,
      category: item.category,
      assessment_score: item.assessment_score,
      explanation: item.explanation,
      created_at: item.created_at,
      is_demo: true,
    })),
  }
}

export function getDemoHistory() {
  return items.map((item) => ({ ...item }))
}

export function getDemoHistoryItem(id) {
  const item = items.find((entry) => String(entry.id) === String(id))
  return item ? { ...item } : null
}

export function addDemoHistoryItem(analysis) {
  items = [{ ...analysis }, ...items]
  return { ...analysis }
}

export function deleteDemoHistoryItem(id) {
  const before = items.length
  items = items.filter((entry) => String(entry.id) !== String(id))
  return items.length < before
}

export function getDemoDashboard() {
  return recomputeDashboard()
}

export function createDemoAnalysis({ text = '', url = '' } = {}) {
  const hasUrl = Boolean(url.trim())
  const now = new Date().toISOString()

  return {
    id: nextId++,
    title: hasUrl
      ? 'Demo · Submitted link (not analyzed)'
      : 'Demo · Submitted text (not analyzed)',
    content: hasUrl
      ? `Demo mode received this link: ${url.trim()}`
      : text.trim(),
    source_url: hasUrl ? url.trim() : null,
    input_type: hasUrl ? 'url' : 'text',
    category: 'insufficient_evidence',
    assessment_score: 50,
    explanation:
      'Demo mode is enabled, so this submission was not sent to the AI provider ' +
      'and no real assessment was made. This placeholder result exists only to ' +
      'demonstrate the interface. For a real analysis, disable demo mode and ' +
      'configure an AI provider key on the Flask backend.',
    suspicious_claims: [],
    supporting_evidence: [],
    contradicting_evidence: [],
    sources: [],
    model: 'demo-mode',
    created_at: now,
    is_demo: true,
  }
}
