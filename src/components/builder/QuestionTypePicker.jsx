import { useState } from 'react'
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '../../data/formSchema'
import Button from '../common/Button'

const TYPE_ORDER = [
  QUESTION_TYPES.SECTION_HEADER,
  QUESTION_TYPES.SHORT_TEXT,
  QUESTION_TYPES.LONG_TEXT,
  QUESTION_TYPES.YES_NO,
  QUESTION_TYPES.MULTIPLE_CHOICE,
  QUESTION_TYPES.RATING_SCALE,
  QUESTION_TYPES.PASS_FAIL,
]

export default function QuestionTypePicker({ onAdd }) {
  const [type, setType] = useState(QUESTION_TYPES.SHORT_TEXT)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="new-question-type">
        Question type to add
      </label>
      <select
        id="new-question-type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100"
      >
        {TYPE_ORDER.map((t) => (
          <option key={t} value={t}>
            {QUESTION_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <Button size="sm" variant="secondary" onClick={() => onAdd(type)}>
        + Add Question
      </Button>
    </div>
  )
}
