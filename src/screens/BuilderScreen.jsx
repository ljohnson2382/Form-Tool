import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import SectionEditor from '../components/builder/SectionEditor'
import { getForm, saveForm } from '../utils/formStore'
import { createSection } from '../data/formSchema'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

export default function BuilderScreen({ formId, onBack, onPreview }) {
  const [form, setForm] = useState(null)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved

  useEffect(() => {
    let cancelled = false
    getForm(formId).then((loaded) => {
      if (!cancelled) setForm(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [formId])

  function updateSection(index, updatedSection) {
    const sections = [...form.sections]
    sections[index] = updatedSection
    setForm({ ...form, sections })
  }

  function deleteSection(index) {
    setForm({ ...form, sections: form.sections.filter((_, i) => i !== index) })
  }

  function moveSection(index, direction) {
    const sections = [...form.sections]
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    ;[sections[index], sections[target]] = [sections[target], sections[index]]
    setForm({ ...form, sections })
  }

  function addSection() {
    setForm({ ...form, sections: [...form.sections, createSection(`Section ${form.sections.length + 1}`)] })
  }

  async function handleSave() {
    setSaveState('saving')
    const saved = await saveForm(form)
    setForm(saved)
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 1500)
  }

  if (!form) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading form…</div>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          {saveState === 'saved' && <span className="text-sm text-slate-500 dark:text-slate-400">Saved</span>}
          <Button variant="secondary" onClick={() => onPreview(form.id)}>
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <input
          className={`${inputClass} text-xl font-bold`}
          placeholder="Form title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Form description (optional)"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        {form.sections.map((section, i) => (
          <SectionEditor
            key={section.id}
            section={section}
            onChange={(updated) => updateSection(i, updated)}
            onDelete={() => deleteSection(i)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            isFirst={i === 0}
            isLast={i === form.sections.length - 1}
          />
        ))}
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={addSection}>
          + Add Section
        </Button>
      </div>
    </div>
  )
}
