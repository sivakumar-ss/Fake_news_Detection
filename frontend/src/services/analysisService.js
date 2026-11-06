import api, { USE_SAMPLE_DATA } from './api'
import {
  addDemoHistoryItem,
  createDemoAnalysis,
  deleteDemoHistoryItem,
  getDemoDashboard,
  getDemoHistory,
  getDemoHistoryItem,
} from './demoStore'

const demoDelay = (ms = 350) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

export async function analyzeText(text) {
  if (USE_SAMPLE_DATA) {
    await demoDelay(1200)
    const analysis = createDemoAnalysis({ text })
    return addDemoHistoryItem(analysis)
  }

  const { data } = await api.post('/analyze', { text: text.trim() })
  return data.data
}

export async function analyzeUrl(url) {
  if (USE_SAMPLE_DATA) {
    await demoDelay(1200)
    const analysis = createDemoAnalysis({ url })
    return addDemoHistoryItem(analysis)
  }

  const { data } = await api.post('/analyze-url', { url: url.trim() })
  return data.data
}

export async function getHistory({ page = 1, perPage = 50 } = {}) {
  if (USE_SAMPLE_DATA) {
    await demoDelay(250)
    const all = getDemoHistory()
    return {
      items: all,
      pagination: {
        page,
        per_page: perPage,
        total: all.length,
        pages: Math.max(1, Math.ceil(all.length / perPage)),
      },
    }
  }

  const { data } = await api.get('/history', {
    params: { page, per_page: perPage },
  })
  return data.data
}

export async function getHistoryItem(id) {
  if (USE_SAMPLE_DATA) {
    await demoDelay(200)
    return getDemoHistoryItem(id)
  }

  const { data } = await api.get(`/history/${id}`)
  return data.data
}

export async function deleteHistoryItem(id) {
  if (USE_SAMPLE_DATA) {
    await demoDelay(200)
    return deleteDemoHistoryItem(id)
  }

  const { data } = await api.delete(`/history/${id}`)
  return data.data
}

export async function getDashboard() {
  if (USE_SAMPLE_DATA) {
    await demoDelay(250)
    return getDemoDashboard()
  }

  const { data } = await api.get('/dashboard')
  return data.data
}

export async function getHealth() {
  if (USE_SAMPLE_DATA) {
    await demoDelay(150)
    return {
      status: 'ok',
      environment: 'demo',
      checks: { database: 'sample' },
      ai: { provider: 'demo', model: 'demo-sample', configured: true },
    }
  }

  const { data } = await api.get('/health')
  return data.data
}
