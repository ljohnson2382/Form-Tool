import { useEffect, useRef, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Menu, { MenuItem } from '../components/common/Menu'
import { createEmptyForm, countQuestions } from '../data/formSchema'
import {
  listForms,
  saveForm,
  deleteForm,
  duplicateForm,
  importForm,
  publishForm,
  unpublishForm,
  listMigratableForms,
  migrateFormsToBackend,
} from '../utils/formStore'
import { deleteResponsesForForm } from '../utils/responseStore'
import { hasBackend } from '../utils/backendConfig'
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
import { fillUrlFor } from '../utils/fillLink'
import PublishedLinkModal from '../components/common/PublishedLinkModal'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// publishedAt mirrors the updatedAt of whichever version is currently live
// (see formStore.js) — comparing the two is the whole status computation,
// no separate "dirty" flag to keep in sync.
function publishStatus(form) {
  if (!form.publishedAt) return 'draft'
  return form.publishedAt >= form.updatedAt ? 'published' : 'stale'
}

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  stale: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

const STATUS_LABEL = {
  draft: 'Draft',
  published: 'Published',
  stale: 'Unpublished changes',
}

// Groups by an arbitrary key, "Unassigned" bucket last rather than
// scattered alphabetically — same rule for project as for audience.
function groupBy(forms, keyFn) {
  const groups = new Map()
  for (const form of forms) {
    const key = keyFn(form) || 'Unassigned'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(form)
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === 'Unassigned') return 1
    if (b === 'Unassigned') return -1
    return a.localeCompare(b)
  })
}

// Forms with no projectId set (the common case until someone starts using
// the field) land in one "Unassigned" group at the end. Within each
// project, a second level groups by audience (who the form is actually
// for — "Participant", "Moderator", etc., see formSchema.js) the same way —
// this is what makes "which link goes to which audience" visible at a
// glance instead of one flat list per project.
function groupByProjectAndAudience(forms) {
  return groupBy(forms, (form) => form.projectId).map(([project, projectForms]) => [
    project,
    groupBy(projectForms, (form) => form.audience),
  ])
}

export default function DashboardScreen({ onOpenBuilder, onOpenPreview, onOpenFill, onOpenResponses, onOpenSettings, fillBaseUrl }) {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingUnpublish, setPendingUnpublish] = useState(null)
  const [error, setError] = useState('')
  const [publishingId, setPublishingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [migratable, setMigratable] = useState([])
  const [migrating, setMigrating] = useState(null)
  const [publishedLink, setPublishedLink] = useState(null)
  const fileInputRef = useRef(null)
  const markdownInputRef = useRef(null)

  async function refresh() {
    try {
      setForms(await listForms())
      setError('')
    } catch (err) {
      setError(`Couldn't load your forms: ${err.message}`)
    }
  }

  async function refreshMigratable() {
    if (!hasBackend()) return
    setMigratable(await listMigratableForms())
  }

  useEffect(() => {
    Promise.all([refresh(), refreshMigratable()]).finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    try {
      const form = createEmptyForm('Untitled Form')
      await saveForm(form)
      onOpenBuilder(form.id)
    } catch (err) {
      setError(`Couldn't create a new form: ${err.message}`)
    }
  }

  async function handleDuplicate(id) {
    try {
      await duplicateForm(id)
      refresh()
    } catch (err) {
      setError(`Couldn't duplicate that form: ${err.message}`)
    }
  }

  async function handleDeleteConfirmed() {
    const form = pendingDelete
    setPendingDelete(null)
    try {
      // Responses first. These are two transactions, so if the tab closes
      // between them, this ordering leaves a form with no responses
      // (visible, deletable again) rather than orphaned personal data with
      // no form left to reach it — the dialog promises the responses are
      // gone.
      await deleteResponsesForForm(form.id)
      await deleteForm(form.id)
      refresh()
    } catch (err) {
      setError(`Couldn't delete "${form.title}": ${err.message}`)
    }
  }

  async function handleMigrate() {
    setError('')
    setMigrating({ done: 0, total: migratable.length })
    const results = await migrateFormsToBackend(migratable, (done, total) => setMigrating({ done, total }))
    setMigrating(null)
    const failed = results.filter((r) => !r.ok)
    if (failed.length) {
      setError(`Migrated ${results.length - failed.length} of ${results.length} forms — failed: ${failed.map((f) => `${f.title} (${f.error})`).join(', ')}`)
    }
    await refresh()
    await refreshMigratable()
  }

  async function handleExport(form) {
    try {
      await saveJsonToFile(form, suggestedFormFilename(form))
    } catch (err) {
      setError(`Couldn't export "${form.title}": ${err.message}`)
    }
  }

  async function handlePublish(form) {
    setError('')
    setPublishingId(form.id)
    try {
      await publishForm(form)
      setPublishedLink(fillUrlFor(form, fillBaseUrl))
      refresh()
    } catch (err) {
      setError(`Couldn't publish "${form.title}": ${err.message}`)
    } finally {
      setPublishingId(null)
    }
  }

  async function handleUnpublishConfirmed() {
    const form = pendingUnpublish
    setPendingUnpublish(null)
    setError('')
    setPublishingId(form.id)
    try {
      await unpublishForm(form.id)
      refresh()
    } catch (err) {
      setError(`Couldn't unpublish "${form.title}": ${err.message}`)
    } finally {
      setPublishingId(null)
    }
  }

  async function handleCopyLink(form) {
    try {
      await navigator.clipboard.writeText(fillUrlFor(form, fillBaseUrl))
      setCopiedId(form.id)
      setTimeout(() => setCopiedId((current) => (current === form.id ? null : current)), 2000)
    } catch {
      setError("Couldn't copy the link — your browser may be blocking clipboard access.")
    }
  }

  // The import gate rejects with a specific reason ("no sections list", etc.);
  // pass that through rather than replacing it with a generic message.
  function importErrorMessage(error) {
    if (error instanceof FormValidationError) return error.message
    if (error instanceof SyntaxError) return `That file isn’t valid JSON (${error.message}) — it may be empty or corrupted.`
    return `Couldn’t import that file — make sure it’s a valid form JSON export. (${error.message})`
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
        if (err?.name === 'NotAllowedError') {
          // The native picker itself failed to open (lost focus, a
          // permissions policy, a browser quirk) rather than the user
          // declining — fall back to the plain <input type=file> picker.
          fileInputRef.current?.click()
          return
        }
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
      } catch (err) {
        if (err?.name === 'NotAllowedError') {
          markdownInputRef.current?.click()
          return
        }
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

  function renderFormCard(form) {
    const status = publishStatus(form)
    return (
      <Card key={form.id} className="flex flex-col justify-between">
        <div>
          <h2 className="mb-1 text-lg font-semibold">{form.title}</h2>
          {form.description && (
            <p className="mb-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{form.description}</p>
          )}
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {countQuestions(form)} questions
            </span>
            {form.brand && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700/50"
                title="This form has its own custom branding"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: form.brand.colors?.[500] ?? '#6366f1' }}
                />
                Custom branding
              </span>
            )}
            {hasBackend() && (
              <span className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${STATUS_BADGE[status]}`}>
                {STATUS_LABEL[status]}
              </span>
            )}
            <span>Updated {formatDate(form.updatedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => onOpenBuilder(form.id)}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onOpenPreview(form.id)}>
            Preview
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onOpenFill(form.id)}>
            Fill Out
          </Button>
          <Menu label="⋯ More">
            <MenuItem onClick={() => onOpenSettings(form.id)}>Settings</MenuItem>
            <MenuItem onClick={() => onOpenResponses(form.id)}>Responses</MenuItem>
            {hasBackend() && (
              <>
                <MenuItem onClick={() => handlePublish(form)} disabled={publishingId === form.id}>
                  {publishingId === form.id ? 'Working…' : status === 'draft' ? 'Publish' : 'Republish'}
                </MenuItem>
                {status !== 'draft' && (
                  <>
                    <MenuItem onClick={() => handleCopyLink(form)}>{copiedId === form.id ? 'Link copied' : 'Copy link'}</MenuItem>
                    <MenuItem danger onClick={() => setPendingUnpublish(form)} disabled={publishingId === form.id}>
                      Unpublish
                    </MenuItem>
                  </>
                )}
              </>
            )}
            <MenuItem onClick={() => handleDuplicate(form.id)}>Duplicate</MenuItem>
            <MenuItem onClick={() => handleExport(form)}>Export .form.json</MenuItem>
            <MenuItem danger onClick={() => setPendingDelete(form)}>
              Delete
            </MenuItem>
          </Menu>
        </div>
      </Card>
    )
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
            Import .form.json
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

      {hasBackend() && migratable.length > 0 && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-700 dark:text-slate-200">
            {migratable.length} form{migratable.length === 1 ? '' : 's'} saved on this device haven’t been added to the database yet.
          </span>
          <Button onClick={handleMigrate} disabled={Boolean(migrating)}>
            {migrating ? `Migrating ${migrating.done}/${migrating.total}…` : 'Migrate to database'}
          </Button>
        </Card>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {forms.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No forms yet. Create one, or import a form from a markdown doc or a .form.json export.
        </Card>
      ) : (
        <div className="space-y-8">
          {groupByProjectAndAudience(forms).map(([project, audienceGroups]) => (
            <div key={project}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{project}</h2>
              <div className="space-y-5">
                {audienceGroups.map(([audience, audienceForms]) => (
                  <div key={audience}>
                    {audienceGroups.length > 1 && (
                      <h3 className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">{audience}</h3>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{audienceForms.map(renderFormCard)}</div>
                  </div>
                ))}
              </div>
            </div>
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

      <ConfirmDialog
        open={Boolean(pendingUnpublish)}
        title="Unpublish form?"
        message={`"${pendingUnpublish?.title}" will stop being reachable at its fill link. Responses already collected are kept — this only takes the live copy down.`}
        confirmLabel="Unpublish"
        onConfirm={handleUnpublishConfirmed}
        onCancel={() => setPendingUnpublish(null)}
      />

      <PublishedLinkModal url={publishedLink} onClose={() => setPublishedLink(null)} />
    </div>
  )
}
