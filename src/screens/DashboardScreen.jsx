import { useEffect, useRef, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { createEmptyForm, countQuestions } from '../data/formSchema'
import { listForms, saveForm, deleteForm, duplicateForm, importForm } from '../utils/formStore'
import { deleteResponsesForForm } from '../utils/responseStore'
import { FormValidationError } from '../data/formValidation'
import {
  saveJsonToFile,
  suggestedFormFilename,
  openJsonFile,
  readJsonFromInputFile,
  openMarkdownFile,
  readTextFromInputFile,
  supportsFileSystemAccess,
} from '../utils/fileStorage'
import { parseMarkdownToForm } from '../utils/markdownImport'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DashboardScreen({ onOpenBuilder, onOpenPreview, onOpenFill }) {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const markdownInputRef = useRef(null)

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
    // Responses first. These are two transactions, so if the tab closes
    // between them, this ordering leaves a form with no responses (visible,
    // deletable again) rather than orphaned personal data with no form left
    // to reach it — the dialog promises the responses are gone.
    await deleteResponsesForForm(pendingDelete.id)
    await deleteForm(pendingDelete.id)
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

  // The import gate rejects with a specific reason ("no sections list", etc.);
  // pass that through rather than replacing it with a generic message.
  function importErrorMessage(error) {
    if (error instanceof FormValidationError) return error.message
    return 'Couldn’t import that file — make sure it’s a valid form JSON export.'
  }

  async function handleImportClick() {
    setError('')
    if (supportsFileSystemAccess) {
      try {
        const data = await openJsonFile()
        if (!data) return
        await importForm(data)
        refresh()
      } catch (err) {
        setError(importErrorMessage(err))
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
    } catch (err) {
      setError(importErrorMessage(err))
    }
  }

  async function handleMarkdownImported(markdownText, filenameFallback) {
    const form = parseMarkdownToForm(markdownText, { title: filenameFallback })
    const saved = await saveForm(form)
    // Heuristic parsing gets you most of the way, not all of it — land in
    // the Builder so questions can be re-typed/edited before use.
    onOpenBuilder(saved.id)
  }

  async function handleImportMarkdownClick() {
    setError('')
    if (supportsFileSystemAccess) {
      try {
        const text = await openMarkdownFile()
        if (text === null) return
        await handleMarkdownImported(text, 'Imported Form')
      } catch {
        setError('Couldn’t import that markdown file.')
      }
    } else {
      markdownInputRef.current?.click()
    }
  }

  async function handleMarkdownInputChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await readTextFromInputFile(file)
      await handleMarkdownImported(text, file.name.replace(/\.(md|markdown)$/i, ''))
    } catch {
      setError('Couldn’t import that markdown file.')
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
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleImportMarkdownClick}>
            Import from Markdown
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            Import from file
          </Button>
          <Button onClick={handleCreate}>+ Create New Form</Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileInputChange} />
      <input
        ref={markdownInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="hidden"
        onChange={handleMarkdownInputChange}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {forms.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No forms yet. Create one, or import a form from a markdown doc or a JSON file.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-lg font-semibold">{form.title}</h2>
                {form.description && <p className="mb-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{form.description}</p>}
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
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
