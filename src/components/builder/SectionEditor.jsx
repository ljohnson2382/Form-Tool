import { createItem } from '../../data/formSchema'
import Button from '../common/Button'
import Card from '../common/Card'
import QuestionEditor from './QuestionEditor'
import QuestionTypePicker from './QuestionTypePicker'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

export default function SectionEditor({ section, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  function updateItem(index, updatedItem) {
    const items = [...section.items]
    items[index] = updatedItem
    onChange({ ...section, items })
  }

  function deleteItem(index) {
    onChange({ ...section, items: section.items.filter((_, i) => i !== index) })
  }

  function moveItem(index, direction) {
    const items = [...section.items]
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    onChange({ ...section, items })
  }

  function addItem(type) {
    onChange({ ...section, items: [...section.items, createItem(type)] })
  }

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <input
            className={`${inputClass} font-semibold`}
            placeholder="Section title"
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
          />
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Section description (optional)"
            value={section.description ?? ''}
            onChange={(e) => onChange({ ...section, description: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="ghost" onClick={onMoveUp} disabled={isFirst} aria-label="Move section up">
            ↑
          </Button>
          <Button size="sm" variant="ghost" onClick={onMoveDown} disabled={isLast} aria-label="Move section down">
            ↓
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            Delete Section
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {section.items.map((item, i) => (
          <QuestionEditor
            key={item.id}
            item={item}
            onChange={(updated) => updateItem(i, updated)}
            onDelete={() => deleteItem(i)}
            onMoveUp={() => moveItem(i, -1)}
            onMoveDown={() => moveItem(i, 1)}
            isFirst={i === 0}
            isLast={i === section.items.length - 1}
          />
        ))}
      </div>

      <div className="mt-3">
        <QuestionTypePicker onAdd={addItem} />
      </div>
    </Card>
  )
}
