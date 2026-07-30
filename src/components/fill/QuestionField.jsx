import { QUESTION_TYPES } from '../../data/formSchema'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100 disabled:opacity-60'

function ChoiceButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
        active
          ? 'border-sky-500/60 bg-sky-50 text-sky-700 shadow-[0_0_20px_theme(colors.sky.500/10)] dark:bg-sky-500/20 dark:text-sky-300'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60'
      }`}
    >
      {children}
    </button>
  )
}

export default function QuestionField({ item, value, onChange, error, disabled = false }) {
  if (item.type === QUESTION_TYPES.SECTION_HEADER) {
    return (
      <div className="pt-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.text}</h3>
        {item.hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.hint}</p>}
      </div>
    )
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
        {item.text}
        {item.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {item.hint && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{item.hint}</p>}

      {item.type === QUESTION_TYPES.SHORT_TEXT && (
        <input
          className={inputClass}
          placeholder={item.placeholder || ''}
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {item.type === QUESTION_TYPES.LONG_TEXT && (
        <textarea
          className={inputClass}
          rows={3}
          placeholder={item.placeholder || ''}
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {item.type === QUESTION_TYPES.YES_NO && (
        <div className="flex gap-2">
          <ChoiceButton active={value === true} disabled={disabled} onClick={() => onChange(true)}>
            Yes
          </ChoiceButton>
          <ChoiceButton active={value === false} disabled={disabled} onClick={() => onChange(false)}>
            No
          </ChoiceButton>
        </div>
      )}

      {item.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
        <div className="flex flex-wrap gap-2">
          {(item.options ?? []).map((opt) => (
            <ChoiceButton key={opt} active={value === opt} disabled={disabled} onClick={() => onChange(opt)}>
              {opt}
            </ChoiceButton>
          ))}
        </div>
      )}

      {item.type === QUESTION_TYPES.RATING_SCALE && (
        <div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: item.scale.max - item.scale.min + 1 }, (_, i) => item.scale.min + i).map((n) => (
              <ChoiceButton key={n} active={value === n} disabled={disabled} onClick={() => onChange(n)}>
                {n}
              </ChoiceButton>
            ))}
          </div>
          {(item.scale.minLabel || item.scale.maxLabel) && (
            <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{item.scale.minLabel}</span>
              <span>{item.scale.maxLabel}</span>
            </div>
          )}
        </div>
      )}

      {item.type === QUESTION_TYPES.PASS_FAIL && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <ChoiceButton
              active={value?.result === 'pass'}
              disabled={disabled}
              onClick={() => onChange({ ...(value ?? {}), result: 'pass' })}
            >
              Pass
            </ChoiceButton>
            <ChoiceButton
              active={value?.result === 'fail'}
              disabled={disabled}
              onClick={() => onChange({ ...(value ?? {}), result: 'fail' })}
            >
              Fail
            </ChoiceButton>
          </div>
          {item.allowNotes && (
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Evidence / notes (optional)"
              value={value?.notes ?? ''}
              disabled={disabled}
              onChange={(e) => onChange({ ...(value ?? {}), notes: e.target.value })}
            />
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
