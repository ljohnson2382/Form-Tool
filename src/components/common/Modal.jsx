import { useEffect, useRef } from 'react'

export default function Modal({ open, onClose, title, children, maxWidthClassName = 'max-w-md' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${maxWidthClassName} rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700/50 dark:bg-slate-900`}
      >
        {title && <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
