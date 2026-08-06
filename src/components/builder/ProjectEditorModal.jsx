import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import BrandEditor from './BrandEditor'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

/**
 * Create/edit form for one Project (see createEmptyProject in
 * data/formSchema.js) — a name plus a brand, reusing BrandEditor the same
 * way AdminSettingsScreen.jsx does for the app's own default brand.
 * Rendered by ProjectsPanel.jsx.
 */
export default function ProjectEditorModal({ project, onSave, onClose, detectedBrands }) {
  const [name, setName] = useState(project?.name ?? '')
  const [brand, setBrand] = useState(project?.brand ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) {
      setError('Give this project a name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...project, name: name.trim(), brand })
      onClose()
    } catch (err) {
      setError(`Couldn't save: ${err.message}`)
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={project ? 'Edit Project' : 'New Project'} maxWidthClassName="max-w-2xl">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Project name</label>
          <input
            className={inputClass}
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <BrandEditor
          brand={brand}
          onChange={setBrand}
          alwaysEnabled
          appNamePlaceholder="Shown to respondents — defaults to the project name above"
          detectedBrands={detectedBrands}
        />

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Project'}
        </Button>
      </div>
    </Modal>
  )
}
