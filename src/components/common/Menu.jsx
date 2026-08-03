import { useEffect, useRef, useState } from 'react'
import Button from './Button'

/**
 * A small anchored dropdown — trigger button + a panel positioned relative
 * to it. Closes on outside click, Escape, or picking any item (a click on
 * any child bubbles to the panel, which closes itself — no per-item wiring
 * needed). Lighter than Modal.jsx, which centers over the whole page rather
 * than anchoring to a trigger.
 */
export default function Menu({ label, children }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
        {label}
      </Button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700/50 dark:bg-slate-900"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ onClick, danger = false, disabled = false, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60'
      }`}
    >
      {children}
    </button>
  )
}
