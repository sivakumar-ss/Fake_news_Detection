import { useEffect, useRef } from 'react'
import { TriangleAlert } from 'lucide-react'

/**
 * Accessible confirmation dialog — replaces window.confirm for destructive
 * actions (e.g. deleting a history record) with a premium modal.
 *
 * Props:
 *   open      {boolean}         – whether the dialog is visible
 *   title     {string}          – dialog heading
 *   message   {string}          – explanatory body text
 *   confirmLabel {string}       – confirm button label (default "Confirm")
 *   cancelLabel  {string}       – cancel button label (default "Cancel")
 *   busy      {boolean}         – disables buttons while an action runs
 *   onConfirm {() => void}      – called when confirmed
 *   onCancel  {() => void}      – called when cancelled / dismissed
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)

  // Move focus into the dialog when it opens; trap Tab between the two
  // buttons; close on Escape.
  useEffect(() => {
    if (!open) return

    cancelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (!busy) onCancel?.()
        return
      }
      if (event.key !== 'Tab') return

      const first = cancelRef.current
      const last = confirmRef.current
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        // Dismiss when clicking the backdrop (not the dialog itself).
        if (event.target === event.currentTarget && !busy) onCancel?.()
      }}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <span className="dialog__icon" aria-hidden="true">
          <TriangleAlert size={20} />
        </span>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="dialog__actions">
          <button
            type="button"
            ref={cancelRef}
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
