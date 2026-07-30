import { useEffect, useRef, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { createEmptyForm, countQuestions } from '../data/formSchema'
import { listForms, saveForm, deleteForm, duplicateForm, importForm } from '../utils/formStore'
import { deleteResponsesForForm } from '../utils/responseStore'
import { saveJsonToFile, suggestedFormFilename, openJsonFile, readJsonFromInputFile, supportsFileSystemAccess } from '../utils/fileStorage'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DashboardScreen({ onOpenBuilder, onOpenPreview, onOpenFill }) {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  async function refresh() {
    setForms(await listForms())
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    const form = createEmptyForm('Untitled Form')
    await saveForm(form)
    onOpenBuilder(form.id)
  }

  async function handleDuplicate(id) {
    await duplicateForm(id)
    refresh()
  }

  async function handleDeleteConfirmed() {
    await deleteForm(pendingDelete.id)
    await deleteResponsesForForm(pendingDelete.id)
    setPendingDelete(null)
    refresh()
  }

  async function handleExport(form) {
    try {
      await saveJsonToFile(form, suggestedFormFilename(form))
    } catch {
      setError(`Couldn't export "${form.title}".`)
    }
  }

  async function handleImportClick() {
    setError('')
    if (supportsFileSystemAccess) {
      try {
        const data = await openJsonFile()
        if (!data) return
        await importForm(data)
        refresh()
      } catch {
        setError('Couldn’t import that file — make sure it’s a valid form JSON export.')
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  async function handleFileInputChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await readJsonFromInputFile(file)
      await importForm(data)
      refresh()
    } catch {
      setError('Couldn’t import that file — make sure it’s a valid form JSON export.')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading forms…</div>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your Forms</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create, edit, and collect responses for surveys and forms.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleImportClick}>
            Import from file
          </Button>
          <Button onClick={handleCreate}>+ Create New Form</Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileInputChange} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {forms.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No forms yet. Create one, or import a form JSON file.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-lg font-semibold">{form.title}</h2>
                {form.description && <p className="mb-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{form.description}</p>}
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    {countQuestions(form)} questions
                  </span>
                  <span>Updated {formatDate(form.updatedAt)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onOpenBuilder(form.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onOpenPreview(form.id)}>
                  Preview
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onOpenFill(form.id)}>
                  Fill Out
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleDuplicate(form.id)}>
                  Duplicate
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleExport(form)}>
                  Export
                </Button>
                <Button size="sm" variant="danger" onClick={() => setPendingDelete(form)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete form?"
        message={`"${pendingDelete?.title}" and all its saved responses will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
