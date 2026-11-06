import axios from 'axios'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/$/, '')

/**
 * Demo mode is ON by default so the interface is useful before an AI key is
 * configured. Set VITE_USE_SAMPLE_DATA=false to call the Flask API.
 */
export const USE_SAMPLE_DATA =
  String(import.meta.env.VITE_USE_SAMPLE_DATA ?? 'true').toLowerCase() !== 'false'

const timeout = Number(import.meta.env.VITE_API_TIMEOUT_MS || 60000)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error
    // The API answers JSON ({ message }) or HTML on proxy errors — only read
    // `message` from a real object so string bodies never crash this handler.
    const data = response?.data
    const serverMessage =
      data && typeof data === 'object' && !Array.isArray(data) ? data.message : undefined

    const message =
      serverMessage ||
      (error.code === 'ECONNABORTED'
        ? 'The analysis took too long. Please try again.'
        : response
          ? `The API returned an error (${response.status}). Please try again.`
          : 'The API did not respond. Is the Flask server running?')

    const apiError = new Error(message, { cause: error })
    apiError.status = response?.status
    return Promise.reject(apiError)
  },
)

export default api
