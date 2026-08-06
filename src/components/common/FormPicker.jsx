import { useEffect, useState } from 'react'
import { listForms } from '../../utils/formStore'

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

export default function FormPicker({ currentFormId, onPick }) {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    listForms()
      .then((loaded) => {
        if (cancelled) return
        setForms(loaded)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hasOptions = forms.length > 0
  const selectedValue = forms.some((form) => form.id === currentFormId) ? currentFormId : ''

  return (
    <label className="flex w-full items-center gap-2 sm:w-auto">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Form</span>
      <select
        className={selectClass}
        value={selectedValue}
        onChange={(e) => {
          const nextId = e.target.value
          if (!nextId || nextId === currentFormId) return
          onPick(nextId)
        }}
        disabled={loading || loadFailed || !hasOptions}
        aria-label="Pick a form"
      >
        {loading && <option value="">Loading forms…</option>}
        {!loading && loadFailed && <option value="">Couldn’t load forms</option>}
        {!loading && !loadFailed && !hasOptions && <option value="">No forms yet</option>}
        {!loading && !loadFailed && hasOptions &&
          forms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.title || 'Untitled Form'}
            </option>
          ))}
      </select>
    </label>
  )
}