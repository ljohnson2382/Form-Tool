import { openDb, promisifyRequest } from './db'
import { createId } from '../data/formSchema'
import { normalizeForm } from '../data/formValidation'
import { getApiBaseUrl, getAdminToken, hasBackend, isBackendReadOnly } from './backendConfig'

// Each form is stored as its own independent record — never merged into a
// single blob — so forms can be listed, duplicated, and deleted individually.
//
// Every read and write passes through normalizeForm, so screens can rely on
// the documented shape without defensive checks of their own. Reads are
// lenient (repair, don't throw) so a record written by an older build still
// lists and can still be deleted; imports are strict (see importForm).
//
// hasBackend() is the single switch for every function below: with a
// backend configured, drafts live in Cosmos DB via /drafts (see
// draftsHandler.js) and are shared across every device/browser; with none
// configured, they stay in this browser's IndexedDB, same as before this
// backend mode existed. Either way, `publishedAt` is attached to every form
// returned here — null if never published, or the updatedAt of whichever
// version is currently live — letting the Dashboard tell "published" apart
// from "edited since it was published" with no extra bookkeeping of its own.

async function apiRequest(path, options = {}, { allow404 = false } = {}) {
  const res = await fetch(`${getApiBaseUrl()}${path}`, options)
  if (allow404 && res.status === 404) return null
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function adminHeaders(extra = {}) {
  return { ...extra, 'x-admin-token': getAdminToken() }
}

function normalizeWithPublishedAt(form) {
  const normalized = normalizeForm(form)
  const publishedAt = typeof form?.publishedAt === 'string' && form.publishedAt.trim() ? form.publishedAt : null
  return { ...normalized, publishedAt }
}

async function listDraftsBackend() {
  return apiRequest('/drafts', { headers: adminHeaders() })
}

async function getDraftBackend(id) {
  return apiRequest(`/drafts?id=${encodeURIComponent(id)}`, { headers: adminHeaders() }, { allow404: true })
}

async function putDraftBackend(form) {
  return apiRequest('/drafts', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(form),
  })
}

async function deleteDraftBackend(id) {
  await apiRequest(`/drafts?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: adminHeaders() })
}

async function getLocalForm(id) {
  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  const form = await promisifyRequest(store.get(id))
  return form ? normalizeForm(form) : null
}

async function listLocalFormsRaw() {
  const db = await openDb()
  const forms = await promisifyRequest(db.transaction('forms', 'readonly').objectStore('forms').getAll())
  return forms.map((form) => normalizeForm(form))
}

export async function listForms() {
  if (hasBackend()) {
    const drafts = (await listDraftsBackend()).map((form) => normalizeWithPublishedAt(form))
    // Read-only backend: a local copy (created or edited on this browser,
    // since the real backend can't be written to) always wins over the
    // backend's copy of the same id, and local-only forms — never seen by
    // the backend at all — are included too. Without this, listForms()
    // would only ever show prod's real data, and anything saveForm() wrote
    // locally would be invisible.
    if (isBackendReadOnly()) {
      const localForms = await listLocalFormsRaw()
      const merged = new Map(drafts.map((form) => [form.id, form]))
      for (const form of localForms) merged.set(form.id, { ...form, publishedAt: null })
      return [...merged.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    }
    return drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }
  const forms = await listLocalFormsRaw()
  return forms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

// Always reads local IndexedDB directly, ignoring hasBackend() — the only
// consumer is the "Migrate to database" flow, which needs to see what's
// stranded locally after listForms()/getForm() have switched to the backend.
export async function listLocalForms() {
  const db = await openDb()
  const forms = await promisifyRequest(db.transaction('forms', 'readonly').objectStore('forms').getAll())
  return forms.map((form) => normalizeForm(form)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

// Local forms missing from, or newer than, the backend's copy — the set a
// "Migrate to database" action would affect. Safe to call on every Dashboard
// load; local copies are never deleted, so this naturally stays accurate.
export async function listMigratableForms() {
  // Migrating writes local forms *to* the backend — meaningless (and
  // unsafe to even offer) when the backend can't be written to.
  if (!hasBackend() || isBackendReadOnly()) return []
  const localForms = await listLocalForms()
  const candidates = []
  for (const form of localForms) {
    const backendCopy = await getDraftBackend(form.id)
    if (!backendCopy || backendCopy.updatedAt < form.updatedAt) candidates.push(form)
  }
  return candidates
}

export async function migrateFormsToBackend(forms, onProgress) {
  const results = []
  for (const form of forms) {
    try {
      await putDraftBackend(form)
      results.push({ id: form.id, title: form.title, ok: true })
    } catch (err) {
      results.push({ id: form.id, title: form.title, ok: false, error: err.message })
    }
    onProgress?.(results.length, forms.length)
  }
  return results
}

export async function getForm(id) {
  if (hasBackend()) {
    // Read-only backend: a local copy always wins, same reasoning as
    // listForms() above — it's the only place an edit or a brand-new form
    // could actually have been persisted.
    if (isBackendReadOnly()) {
      const local = await getLocalForm(id)
      if (local) return local
    }
    // Real admin sessions carry a token; anonymous fill-mode respondents
    // never do (see FormBuilderApp.jsx — a fill mount is never configured
    // with one). Checking first just skips a guaranteed 401 for
    // respondents; the actual security boundary is server-side either way.
    if (getAdminToken()) {
      const draft = await getDraftBackend(id)
      if (draft) return normalizeWithPublishedAt(draft)
      // Falls through: a form that only ever exists as a published
      // snapshot (published before this migration, or with no backend
      // draft counterpart) still resolves for Preview/Fill Out.
    }
    return await apiRequest(`/forms?id=${encodeURIComponent(id)}`).catch(() => null)
  }

  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  const form = await promisifyRequest(store.get(id))
  if (form) return normalizeForm(form)
  // No local draft — the fill app has no local copy of anything by design,
  // so its only way to resolve a formId is whatever's currently published.
  return null
}

export async function saveForm(form, { touch = true } = {}) {
  const normalized = normalizeForm(form)
  const updated = touch ? { ...normalized, updatedAt: new Date().toISOString() } : normalized
  if (hasBackend() && !isBackendReadOnly()) return await putDraftBackend(updated)

  // No backend, or a read-only one: this browser's IndexedDB is the only
  // place that can actually be written to.
  const db = await openDb()
  const store = db.transaction('forms', 'readwrite').objectStore('forms')
  await promisifyRequest(store.put(updated))
  return updated
}

export async function deleteForm(id) {
  if (hasBackend() && !isBackendReadOnly()) return await deleteDraftBackend(id)

  // Read-only backend: this only ever clears a local override (there's no
  // way to actually delete the real backend's copy), so the backend's
  // version of this form reappears on the next read — which is exactly
  // right, since a read-only environment was never able to delete it for
  // real in the first place.
  const db = await openDb()
  const tx = db.transaction(['forms', 'publishState'], 'readwrite')
  await Promise.all([promisifyRequest(tx.objectStore('forms').delete(id)), promisifyRequest(tx.objectStore('publishState').delete(id))])
}

export async function duplicateForm(id) {
  const original = await getForm(id)
  if (!original) throw new Error(`Form not found: ${id}`)
  const now = new Date().toISOString()
  const copy = {
    ...original,
    id: createId('form'),
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
    // A copy is a new standalone form, not actually part of whatever guided
    // stage sequence the original belonged to — inheriting these would make
    // the duplicate silently masquerade as another stage in someone else's
    // chain (or, if the original was mid-chain, orphan the real next stage).
    seriesId: null,
    seriesIndex: null,
    seriesTotal: null,
    nextFormId: null,
  }
  // saveForm's normalizeForm strips publishedAt (it's not part of the form
  // schema — see the hasBackend() note above), so the copy starts as an
  // unpublished Draft even if the original was live: publishing is a
  // deliberate action, not something a copy inherits.
  return saveForm(copy)
}

/**
 * Imports a form parsed from an arbitrary file. Validated strictly so a file
 * that isn't a form export is rejected with a clear message rather than
 * persisted and then blowing up at render time. Throws FormValidationError.
 */
export async function importForm(form) {
  const validated = normalizeForm(form, { strict: true })
  const existing = hasBackend() ? await getDraftBackend(validated.id) : await getLocalForm(validated.id)

  if (!existing) {
    // True export/import round-trip: preserve id and timestamps exactly.
    return saveForm(validated, { touch: false })
  }

  const now = new Date().toISOString()
  return saveForm({
    ...validated,
    // If this instance already has the same id, avoid clobbering it.
    id: createId('form'),
    createdAt: validated.createdAt ?? now,
    updatedAt: now,
  })
}

// Only seeds on a fresh/empty store — never overwrites forms the user has
// since created, edited, or deleted.
export async function seedIfEmpty(seedForms) {
  const existing = await listForms()
  if (existing.length > 0) return
  for (const form of seedForms) {
    await saveForm(form)
  }
}

/**
 * Pushes the given form to the backend as the live copy respondents fetch
 * (requires a configured backend + admin token — see backendConfig.js).
 * "Published" status shown in the Dashboard is derived server-side (see
 * draftsHandler.js) by comparing this against the draft's own updatedAt —
 * no separate local bookkeeping to keep in sync.
 */
export async function publishForm(form) {
  // Unlike saveForm/deleteForm, there's no local fallback that means
  // anything here — publishing is inherently "make this the live copy real
  // respondents fetch," which only the real backend can do. A read-only
  // backend fails this outright rather than silently no-op or attempt (and
  // get rejected by) a real write.
  if (isBackendReadOnly()) throw new Error('Publishing is disabled on this read-only environment.')
  return await apiRequest('/forms', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(form),
  })
}

/**
 * Takes a form down — the fill link stops resolving it — without touching
 * responses already collected for it.
 */
export async function unpublishForm(id) {
  if (isBackendReadOnly()) throw new Error('Unpublishing is disabled on this read-only environment.')
  await apiRequest(`/forms?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })
}
