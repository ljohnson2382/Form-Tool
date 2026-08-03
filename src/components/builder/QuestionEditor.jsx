import { QUESTION_TYPES, QUESTION_TYPE_LABELS, MAX_SCALE_POINTS } from '../../data/formSchema'
import Button from '../common/Button'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

function TypeFields({ item, onChange }) {
  if (item.type === QUESTION_TYPES.SHORT_TEXT || item.type === QUESTION_TYPES.LONG_TEXT) {
    return (
      <input
        className={inputClass}
        placeholder="Placeholder text (optional)"
        value={item.placeholder ?? ''}
        onChange={(e) => onChange({ ...item, placeholder: e.target.value })}
      />
    )
  }

  if (item.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    const options = item.options ?? []
    return (
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={inputClass}
              value={opt}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                onChange({ ...item, options: next })
              }}
            />
            <Button
              size="sm"
              variant="danger"
              onClick={() => onChange({ ...item, options: options.filter((_, idx) => idx !== i) })}
              disabled={options.length <= 2}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => onChange({ ...item, options: [...options, `Option ${options.length + 1}`] })}>
          + Add Option
        </Button>
      </div>
    )
  }

  if (item.type === QUESTION_TYPES.RATING_SCALE) {
    const scale = item.scale ?? { min: 1, max: 5, minLabel: '', maxLabel: '' }
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* The real safety net is normalizeScale at render/save time — these
            bounds just steer toward a sane range without fighting typing. */}
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Min
          <input
            type="number"
            step="1"
            className={inputClass}
            value={scale.min}
            onChange={(e) => onChange({ ...item, scale: { ...scale, min: Number(e.target.value) } })}
          />
        </label>
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Max
          <input
            type="number"
            step="1"
            max={scale.min + MAX_SCALE_POINTS - 1}
            className={inputClass}
            value={scale.max}
            onChange={(e) => onChange({ ...item, scale: { ...scale, max: Number(e.target.value) } })}
          />
        </label>
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Min label
          <input
            className={inputClass}
            value={scale.minLabel ?? ''}
            onChange={(e) => onChange({ ...item, scale: { ...scale, minLabel: e.target.value } })}
          />
        </label>
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Max label
          <input
            className={inputClass}
            value={scale.maxLabel ?? ''}
            onChange={(e) => onChange({ ...item, scale: { ...scale, maxLabel: e.target.value } })}
          />
        </label>
      </div>
    )
  }

  if (item.type === QUESTION_TYPES.PASS_FAIL) {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={item.allowNotes ?? true} onChange={(e) => onChange({ ...item, allowNotes: e.target.checked })} />
        Include evidence/notes field
      </label>
    )
  }

  return null
}

export default function QuestionEditor({ item, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const isHeader = item.type === QUESTION_TYPES.SECTION_HEADER

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/50 dark:bg-slate-900/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {QUESTION_TYPE_LABELS[item.type]}
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onMoveUp} disabled={isFirst} aria-label="Move question up">
            ↑
          </Button>
          <Button size="sm" variant="ghost" onClick={onMoveDown} disabled={isLast} aria-label="Move question down">
            ↓
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <textarea
        className={`${inputClass} mb-2`}
        rows={isHeader ? 1 : 2}
        placeholder={isHeader ? 'Section header text' : 'Question text'}
        value={item.text}
        onChange={(e) => onChange({ ...item, text: e.target.value })}
      />

      <div className="mb-2">
        <TypeFields item={item} onChange={onChange} />
      </div>

      <input
        className={`${inputClass} mb-2`}
        placeholder="Hint (optional, shown to respondents)"
        value={item.hint ?? ''}
        onChange={(e) => onChange({ ...item, hint: e.target.value })}
      />

      {!isHeader && (
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={item.required} onChange={(e) => onChange({ ...item, required: e.target.checked })} />
          Required
        </label>
      )}
    </div>
  )
}
