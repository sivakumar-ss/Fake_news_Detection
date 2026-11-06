import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  FileSearch,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import AnalysisResult from '../components/AnalysisResult'
import ConfirmDialog from '../components/ConfirmDialog'
import DemoBadge from '../components/DemoBadge'
import EmptyState from '../components/EmptyState'
import {
  deleteHistoryItem,
  getHistoryItem,
} from '../services/analysisService'
import { USE_SAMPLE_DATA } from '../services/api'

function DetailSkeleton() {
  return (
    <div className="list-skeleton" role="status" aria-label="Loading the saved analysis">
      <div className="list-skeleton__item">
        <div className="skeleton" style={{ width: '34%', height: 16 }} />
        <div className="skeleton" style={{ width: '68%', height: 26 }} />
        <div className="skeleton" style={{ width: '100%', height: 96, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: '88%', height: 14 }} />
        <div className="skeleton" style={{ width: '72%', height: 14 }} />
      </div>
      <span className="sr-only">Loading the saved analysis…</span>
    </div>
  )
}

export default function HistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', item: null, error: '' })
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    let active = true
    setState({ status: 'loading', item: null, error: '' })

    getHistoryItem(id)
      .then((item) => {
        if (!active) return
        if (item) {
          setState({ status: 'ready', item, error: '' })
        } else {
          setState({
            status: 'missing',
            item: null,
            error: 'That saved analysis does not exist.',
          })
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            status: 'error',
            item: null,
            error: error.message || 'The analysis could not be loaded.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [id])

  async function handleDelete() {
    if (!state.item) return

    setDeleting(true)
    try {
      await deleteHistoryItem(state.item.id)
      navigate('/history', { replace: true })
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        error: error.message || 'The analysis could not be deleted.',
      }))
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <section className="page">
      <div className="container">
        <Link className="back-link" to="/history">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to history
        </Link>

        {state.status === 'loading' && <DetailSkeleton />}

        {state.status === 'error' && (
          <div className="form-alert form-alert--block" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>Analysis unavailable</strong>
              <p>{state.error}</p>
            </div>
          </div>
        )}

        {state.status === 'missing' && (
          <EmptyState
            Icon={FileSearch}
            title="Analysis not found"
            description="It may have been deleted, or the link may be incorrect."
            action={
              <Link className="btn btn--primary btn--sm" to="/history">
                Return to history
              </Link>
            }
          />
        )}

        {state.status === 'ready' && state.item && (
          <>
            <div className="page-heading page-heading--compact page-heading--with-actions">
              <div>
                <span className="eyebrow">Saved analysis</span>
                <h1>Analysis detail</h1>
                {USE_SAMPLE_DATA && state.item.is_demo && (
                  <div className="page-heading__badges">
                    <DemoBadge label="Demo history entry" />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                <Trash2 size={15} aria-hidden="true" />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            <AnalysisResult analysis={state.item} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this analysis?"
        message={`“${state.item?.title || 'This analysis'}” will be permanently removed from your history. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  )
}
