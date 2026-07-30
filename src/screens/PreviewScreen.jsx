import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import QuestionField from '../components/fill/QuestionField'
import { getForm } from '../utils/formStore'
import { listResponses, exportResponsesToFile } from '../utils/responseStore'

export default function PreviewScreen({ formId, onBack, onFill }) {
  const [form, setForm] = useState(null)
  const [responseCount, setResponseCount] = useState(0)
  const [exportState, setExportState] = useState('idle')

  useEffect(() => {
    let cancelled = false
    getForm(formId).then((loaded) => {
      if (cancelled) return
      setForm(loaded)
      listResponses(formId).then((responses) => {
        if (!cancelled) setResponseCount(responses.length)
      })
    })
    return () => {
      cancelled = true
    }
  }, [formId])

  async function handleExport() {
    setExportState('exporting')
    try {
      await exportResponsesToFile(form)
    } finally {
      setExportState('idle')
    }
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
          <Button variant="secondary" onClick={handleExport} disabled={responseCount === 0 || exportState === 'exporting'}>
            {exportState === 'exporting' ? 'Exporting…' : `Export ${responseCount} Response${responseCount === 1 ? '' : 's'}`}
          </Button>
          <Button onClick={() => onFill(form.id)}>Fill Out This Form</Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && <p className="mt-1 text-slate-600 dark:text-slate-300">{form.description}</p>}
      </div>

      <div className="space-y-4">
        {form.sections.map((section) => (
          <Card key={section.id}>
            <h2 className="mb-1 text-lg font-semibold">{section.title}</h2>
            {section.description && <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{section.description}</p>}
            <div className="space-y-4">
              {section.items.map((item) => (
                <QuestionField key={item.id} item={item} value={undefined} onChange={() => {}} disabled />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
