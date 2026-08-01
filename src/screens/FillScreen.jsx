import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import QuestionField from '../components/fill/QuestionField'
import { getForm } from '../utils/formStore'
import { validateResponses, sectionsOf, itemsOf } from '../data/formSchema'
import { submitResponse } from '../utils/responseStore'

export default function FillScreen({ formId, onBack }) {
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadFailed(false)
    getForm(formId)
      .then((loaded) => {
        if (cancelled) return
        if (loaded) setForm(loaded)
        else setLoadFailed(true)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [formId])

  function setAnswer(itemId, value) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }))
  }

  async function handleSubmit() {
    const validationErrors = validateResponses(form, answers)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorId = Object.keys(validationErrors)[0]
      document.getElementById(`item-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    await submitResponse(form.id, answers)
    setSubmitted(true)
  }

  function handleFillAnother() {
    setAnswers({})
    setErrors({})
    setSubmitted(false)
  }

  if (loadFailed) {
    return (
      <Card className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        This form isn’t available. Check the link you were given.
      </Card>
    )
  }

  if (!form) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading form…</div>
  }

  if (submitted) {
    return (
      <div>
        <Card className="py-12 text-center">
          <p className="mb-4 text-lg font-semibold">Thanks — your response has been recorded.</p>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={handleFillAnother}>
              Submit Another Response
            </Button>
            {/* Respondent mode has no dashboard to return to. */}
            {onBack && <Button onClick={onBack}>Back to Dashboard</Button>}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {onBack && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Dashboard
          </Button>
        </div>
      )}

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
                <div key={item.id} id={`item-${item.id}`}>
                  <QuestionField
                    item={item}
                    value={answers[item.id]}
                    onChange={(value) => setAnswer(item.id, value)}
                    error={errors[item.id]}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  )
}
