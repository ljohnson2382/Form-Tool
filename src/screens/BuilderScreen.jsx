import { useEffect, useRef, useState } from 'react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import SectionEditor from '../components/builder/SectionEditor'
import BrandEditor from '../components/builder/BrandEditor'
import PublishedLinkModal from '../components/common/PublishedLinkModal'
import SplitIntoStagesModal from '../components/builder/SplitIntoStagesModal'
import { getForm, saveForm, publishForm } from '../utils/formStore'
import { listProjects } from '../utils/projectStore'
import { hasBackend } from '../utils/backendConfig'
import { fillUrlFor } from '../utils/fillLink'
import { createSection, createId } from '../data/formSchema'
import { generateFormComponent, suggestedComponentFilename } from '../utils/generateFormComponent'
import { saveJsxToFile } from '../utils/fileStorage'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100'

export default function BuilderScreen({ formId, onBack, onPreview, onBrandLoaded, detectedBrands, focusBrand = false, fillBaseUrl }) {
  const [form, setForm] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [deployState, setDeployState] = useState('idle') // idle | deploying | deployed
  const [publishState, setPublishState] = useState('idle') // idle | publishing | published
  const [error, setError] = useState('')
  const [publishedLink, setPublishedLink] = useState(null)
  const [splitting, setSplitting] = useState(false)
  const [projects, setProjects] = useState([])
  const brandSectionRef = useRef(null)

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
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [formId])

  // Not scoped to formId — the saved Project list is the same regardless of
  // which form is open, so this only needs to run once per mount.
  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => {}) // Non-critical: the branding panel just shows no "Your Projects" presets.
  }, [])

  // Fires once the form has actually loaded, and again on every edit, so the
  // Branding panel previews live in the surrounding chrome (header/
  // background) instead of only after Save. Skipped while form is still
  // null (the pre-fetch gap before the effect below resolves) — firing with
  // null here would stomp whatever brand the parent shell already resolved
  // before navigating to this screen.
  useEffect(() => {
    if (!form) return
    onBrandLoaded?.(form?.brand ?? null)
  }, [form?.brand, onBrandLoaded])

  // Jumps straight to the branding panel — used by the Dashboard's "⋯ More
  // → Settings" entry, so it doesn't leave you to scroll past every section
  // to find it on a long form.
  useEffect(() => {
    if (form && focusBrand) brandSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Only on the form's initial load for this mount, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(form)])

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
    setError('')
    try {
      const saved = await saveForm(form)
      setForm(saved)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    } catch (err) {
      setError(`Couldn't save: ${err.message}`)
      setSaveState('idle')
    }
  }

  // Saves the form as it currently stands in the editor, then pushes that
  // same saved copy live — one action, so "Update" always means what it
  // says (whatever's on screen, not whatever was last explicitly Saved).
  // Still a full-document upsert, not a partial patch — see publishForm/
  // saveForm in formStore.js; documents this size make that distinction
  // immaterial, and a real diff-based patch would be real added complexity
  // for no practical benefit here.
  async function handlePublish() {
    setPublishState('publishing')
    setError('')
    try {
      const saved = await saveForm(form)
      setForm(saved)
      await publishForm(saved)
      setForm({ ...saved, publishedAt: saved.updatedAt })
      setPublishedLink(fillUrlFor(saved, fillBaseUrl))
      setPublishState('published')
      setTimeout(() => setPublishState('idle'), 1500)
    } catch (err) {
      setError(`Couldn't publish: ${err.message}`)
      setPublishState('idle')
    }
  }

  // Turns each of the form's current sections into its own standalone form
  // — audienceBySection[i] is whatever was typed for that stage in
  // SplitIntoStagesModal. Stages sharing an audience chain together via
  // nextFormId, in their original order; a blank/unique audience makes a
  // stage its own chain of one. The source form itself is never touched —
  // splitting only ever adds new forms, matching this app's convention of
  // no silent destructive side effects.
  async function handleSplitConfirm(audienceBySection) {
    setSplitting(false)
    setError('')
    try {
      const ids = form.sections.map(() => createId('form'))
      const now = new Date().toISOString()
      const seriesId = createId('series')

      const indicesByAudience = new Map()
      audienceBySection.forEach((audience, i) => {
        const key = audience?.trim() || null
        if (!indicesByAudience.has(key)) indicesByAudience.set(key, [])
        indicesByAudience.get(key).push(i)
      })

      const newForms = form.sections.map((section, i) => {
        const audience = audienceBySection[i]?.trim() || null
        const group = indicesByAudience.get(audience)
        const posInGroup = group.indexOf(i)
        const nextIndex = group[posInGroup + 1]
        return {
          id: ids[i],
          title: section.title || `${form.title} — Stage ${i + 1}`,
          description: section.description || '',
          projectId: form.projectId,
          audience,
          seriesId,
          seriesIndex: posInGroup + 1,
          seriesTotal: group.length,
          nextFormId: nextIndex !== undefined ? ids[nextIndex] : null,
          createdAt: now,
          updatedAt: now,
          sections: [section],
          brand: form.brand,
        }
      })

      for (const newForm of newForms) {
        await saveForm(newForm)
      }
      onBack()
    } catch (err) {
      setError(`Couldn't split into stages: ${err.message}`)
    }
  }

  // Generates a standalone component from the form as it currently stands
  // in the editor (including unsaved edits — same as Preview already
  // reflects live state) and saves it via the native picker, so it can be
  // dropped straight into this or any other React project's src/. See
  // utils/generateFormComponent.js.
  async function handleDeploy() {
    setDeployState('deploying')
    const code = generateFormComponent(form)
    const result = await saveJsxToFile(code, suggestedComponentFilename(form))
    setDeployState(result === 'saved' ? 'deployed' : 'idle')
    if (result === 'saved') setTimeout(() => setDeployState('idle'), 1500)
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
        <Button variant="ghost" onClick={onBack}>
          ← Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          {saveState === 'saved' && <span className="text-sm text-slate-500 dark:text-slate-400">Saved</span>}
          <Button variant="secondary" onClick={() => onPreview(form.id)}>
            Preview
          </Button>
          <Button variant="secondary" onClick={handleDeploy} disabled={deployState === 'deploying'}>
            {deployState === 'deploying' ? 'Deploying…' : deployState === 'deployed' ? 'Deployed' : 'Deploy'}
          </Button>
          {form.sections.length > 1 && (
            <Button variant="secondary" onClick={() => setSplitting(true)}>
              Split into Stages
            </Button>
          )}
          <Button onClick={handleSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </Button>
          {hasBackend() && (
            <Button onClick={handlePublish} disabled={publishState === 'publishing'}>
              {publishState === 'publishing' ? 'Working…' : form.publishedAt ? 'Update' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className={`${inputClass} flex items-center justify-between gap-2 text-sm`}>
            {form.projectId ? (
              <>
                <span className="truncate text-slate-700 dark:text-slate-200">
                  Project: <span className="font-medium">{projects.find((p) => p.id === form.projectId)?.name ?? form.projectId}</span>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setForm({ ...form, projectId: null })}
                >
                  Unassign
                </button>
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">No project — apply one below in Branding, or leave unassigned.</span>
            )}
          </div>
          <input
            className={`${inputClass} text-sm`}
            placeholder="Audience (optional, e.g. Participant)"
            value={form.audience ?? ''}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
          />
        </div>
      </div>

      <div ref={brandSectionRef} className="mb-4 scroll-mt-24">
        <BrandEditor
          brand={form.brand}
          // Functional updates here, not the `{ ...form, ... }` style used
          // elsewhere in this file — applying a saved Project fires this and
          // onApplyProject back to back in the same tick (see BrandEditor.jsx's
          // applyProject), both against the same stale `form` closure. Reading
          // off the actual previous state instead of that closure is what lets
          // both updates land instead of the second silently clobbering the
          // first.
          onChange={(brand) => setForm((prev) => ({ ...prev, brand }))}
          detectedBrands={detectedBrands}
          savedProjects={projects}
          onApplyProject={(project) => setForm((prev) => ({ ...prev, projectId: project.id }))}
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

      <PublishedLinkModal url={publishedLink} onClose={() => setPublishedLink(null)} />

      <SplitIntoStagesModal
        open={splitting}
        sections={form.sections}
        defaultAudience={form.audience}
        onCancel={() => setSplitting(false)}
        onConfirm={handleSplitConfirm}
      />
    </div>
  )
}
