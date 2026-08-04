import { useEffect, useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

/**
 * Confirmation step for BuilderScreen.jsx's "Split into Stages" — one row
 * per current section, each with an audience input. Audience is the whole
 * mechanism here: stages sharing the same (non-blank) audience get chained
 * together in order by the caller (see handleSplitConfirm), stages with a
 * blank or unique audience become standalone forms. No separate "include in
 * flow" toggle — assigning an audience *is* opting into a guided chain.
 */
export default function SplitIntoStagesModal({ open, sections, defaultAudience, onCancel, onConfirm }) {
  const [audiences, setAudiences] = useState([])

  // Reset fresh each time the modal opens, not on every keystroke elsewhere
  // in the Builder while it's closed.
  useEffect(() => {
    if (open) setAudiences(sections.map(() => defaultAudience ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function updateAudience(index, value) {
    setAudiences((current) => current.map((a, i) => (i === index ? value : a)))
  }

  return (
    <Modal open={open} onClose={onCancel} title="Split into Stages" maxWidthClassName="max-w-lg">
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Each section below becomes its own form. Give each one an audience — stages sharing the same audience chain
        together automatically, so that audience's link walks them through their stages in order. Leave it blank (or
        make it unique) to keep a stage standalone. The current form is left as-is; this only adds new forms.
      </p>
      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {sections.map((section, i) => (
          <div key={section.id} className="flex items-center gap-3">
            <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{section.title || `Section ${i + 1}`}</span>
            <input
              className={`${inputClass} w-48 shrink-0`}
              placeholder="Audience (optional)"
              value={audiences[i] ?? ''}
              onChange={(e) => updateAudience(i, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onConfirm(audiences)} disabled={sections.length === 0}>
          Create {sections.length} form{sections.length === 1 ? '' : 's'}
        </Button>
      </div>
    </Modal>
  )
}
