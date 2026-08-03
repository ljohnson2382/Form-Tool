import { openDb, promisifyRequest } from './db'
import { createId } from '../data/formSchema'
import { normalizeForm } from '../data/formValidation'
import { getApiBaseUrl, getAdminToken, hasBackend } from './backendConfig'

// Each form is stored as its own independent record — never merged into a
// single blob — so forms can be listed, duplicated, and deleted individually.
//
// Every read and write passes through normalizeForm, so screens can rely on
// the documented shape without defensive checks of their own. Reads are
// lenient (repair, don't throw) so a record written by an older build still
// lists and can still be deleted; imports are strict (see importForm).
//
// publishedAt (from the separate publishState store) is attached to every
// form returned here as `{ publishedAt }` — null if never published, or the
// updatedAt of whichever version is currently live. Comparing it against the
// form's own updatedAt is what lets the Dashboard tell "published" apart
// from "edited since it was published" with no extra bookkeeping.

async function apiRequest(path, options = {}) {
  const res = await fetch(`${getApiBaseUrl()}${path}`, options)
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

async function getPublishState(formId) {
  const db = await openDb()
  const store = db.transaction('publishState', 'readonly').objectStore('publishState')
  const record = await promisifyRequest(store.get(formId))
  return record?.publishedAt ?? null
}

async function setPublishState(formId, publishedAt) {
  const db = await openDb()
  const store = db.transaction('publishState', 'readwrite').objectStore('publishState')
  if (publishedAt) {
    await promisifyRequest(store.put({ formId, publishedAt }))
  } else {
    await promisifyRequest(store.delete(formId))
  }
}

export async function listForms() {
  const db = await openDb()
  const forms = await promisifyRequest(db.transaction('forms', 'readonly').objectStore('forms').getAll())
  const publishRecords = await promisifyRequest(db.transaction('publishState', 'readonly').objectStore('publishState').getAll())
  const publishedAtById = new Map(publishRecords.map((r) => [r.formId, r.publishedAt]))
  return forms
    .map((form) => ({ ...normalizeForm(form), publishedAt: publishedAtById.get(form.id) ?? null }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function getForm(id) {
  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  const form = await promisifyRequest(store.get(id))
  if (form) {
    return { ...normalizeForm(form), publishedAt: await getPublishState(id) }
  }
  // No local draft — the fill app has no local copy of anything by design,
  // so its only way to resolve a formId is whatever's currently published.
  if (!hasBackend()) return null
  try {
    return await apiRequest(`/forms?id=${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

export async function saveForm(form, { touch = true } = {}) {
  const db = await openDb()
  const store = db.transaction('forms', 'readwrite').objectStore('forms')
  const normalized = normalizeForm(form)
  const updated = touch ? { ...normalized, updatedAt: new Date().toISOString() } : normalized
  await promisifyRequest(store.put(updated))
  return updated
}

export async function deleteForm(id) {
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
  }
  // saveForm's normalizeForm strips publishedAt (it's not part of the form
  // schema — see the publishState note above), so the copy starts as an
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
  const now = new Date().toISOString()
  const validated = normalizeForm(form, { strict: true })
  return saveForm({
    ...validated,
    // A fresh ID, so importing can never overwrite a form already stored.
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
 * Records the published version's updatedAt locally so the Dashboard can
 * tell "matches what's live" apart from "edited since."
 */
export async function publishForm(form) {
  const published = await apiRequest('/forms', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(form),
  })
  await setPublishState(form.id, published.updatedAt)
  return published
}

/**
 * Takes a form down — the fill link stops resolving it — without touching
 * responses already collected for it.
 */
export async function unpublishForm(id) {
  await apiRequest(`/forms?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })
  await setPublishState(id, null)
}
