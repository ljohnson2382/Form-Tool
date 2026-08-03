import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import QuestionField from '../components/fill/QuestionField'
import { getForm } from '../utils/formStore'
import { sectionsOf, itemsOf } from '../data/formSchema'
import { listResponses } from '../utils/responseStore'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ResponsesScreen({ formId, onBack, onBrandLoaded }) {
  const [form, setForm] = useState(null)
  const [responses, setResponses] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadFailed(false)
    setForm(null)
    setResponses(null)
    Promise.all([getForm(formId), listResponses(formId)])
      .then(([loadedForm, loadedResponses]) => {
        if (cancelled) return
        if (!loadedForm) {
          setLoadFailed(true)
          return
        }
        setForm(loadedForm)
        onBrandLoaded?.(loadedForm.brand ?? null)
        setResponses(loadedResponses)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])

  if (loadFailed) {
    return (
      <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        Couldn’t load responses for this form.
      </Card>
    )
  }

  if (!form || !responses) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading responses…</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {responses.length} response{responses.length === 1 ? '' : 's'} collected
        </p>
      </div>

      {responses.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No responses yet.</Card>
      ) : (
        <div className="space-y-4">
          {responses.map((response, index) => (
            <Card key={response.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Response {responses.length - index}</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(response.submittedAt)}</span>
              </div>
              <div className="space-y-4">
                {sectionsOf(form).map((section) =>
                  itemsOf(section).map((item) => (
                    <QuestionField key={item.id} item={item} value={response.answers?.[item.id]} onChange={() => {}} disabled />
                  )),
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
