import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import FormPicker from '../components/common/FormPicker'
import QuestionField from '../components/fill/QuestionField'
import { getForm } from '../utils/formStore'
import { sectionsOf, itemsOf } from '../data/formSchema'
import { listResponses, exportResponsesToFile, deleteResponsesForForm } from '../utils/responseStore'

export default function PreviewScreen({ formId, onBack, onFill, onEdit, onPickForm, onBrandLoaded }) {
  const [form, setForm] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [responseCount, setResponseCount] = useState(0)
  const [exportState, setExportState] = useState('idle')
  const [confirmingClear, setConfirmingClear] = useState(false)

  async function refreshResponseCount(id) {
    const responses = await listResponses(id)
    setResponseCount(responses.length)
  }

  useEffect(() => {
    let cancelled = false
    setLoadFailed(false)
    setForm(null)
    getForm(formId)
      .then((loaded) => {
        if (cancelled) return
        if (!loaded) {
          setLoadFailed(true)
          return
        }
        setForm(loaded)
        onBrandLoaded?.(loaded.brand ?? null)
        listResponses(formId).then((responses) => {
          if (!cancelled) setResponseCount(responses.length)
        })
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
    // onBrandLoaded is a setState function from the parent shell — stable
    // across renders, and re-running this on every render would refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])

  async function handleExport() {
    setExportState('exporting')
    try {
      await exportResponsesToFile(form)
    } finally {
      setExportState('idle')
    }
  }

  async function handleClearResponses() {
    await deleteResponsesForForm(form.id)
    setConfirmingClear(false)
    refreshResponseCount(form.id)
  }

  if (loadFailed) {
    return <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Couldn’t load this form.</Card>
  }

  if (!form) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading form…</div>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Form Dashboard
          </Button>
          {onPickForm && <FormPicker currentFormId={form.id} onPick={onPickForm} />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => onEdit(form.id)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={responseCount === 0 || exportState === 'exporting'}>
            {exportState === 'exporting' ? 'Exporting…' : `Export ${responseCount} Response${responseCount === 1 ? '' : 's'}`}
          </Button>
          {/* Responses can contain personal data, so there needs to be a way
              to remove them that doesn't involve deleting the form itself. */}
          <Button variant="danger" onClick={() => setConfirmingClear(true)} disabled={responseCount === 0}>
            Clear Responses
          </Button>
          <Button onClick={() => onFill(form.id)}>Fill Out This Form</Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && <p className="mt-1 text-slate-600 dark:text-slate-300">{form.description}</p>}
      </div>

      <div className="space-y-4">
        {sectionsOf(form).map((section) => (
          <Card key={section.id}>
            <h2 className="mb-1 text-lg font-semibold">{section.title}</h2>
            {section.description && <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{section.description}</p>}
            <div className="space-y-4">
              {itemsOf(section).map((item) => (
                <QuestionField key={item.id} item={item} value={undefined} onChange={() => {}} disabled />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear stored responses?"
        message={`All ${responseCount} response${responseCount === 1 ? '' : 's'} collected for "${form.title}" will be permanently deleted from this browser. The form itself is kept. This can't be undone — export first if you need the data.`}
        confirmLabel="Delete responses"
        onConfirm={handleClearResponses}
        onCancel={() => setConfirmingClear(false)}
      />
    </div>
  )
}
