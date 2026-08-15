// Response persistence abstraction. The rest of the app only calls the
// functions exported here. With no backend configured (see
// backendConfig.js), responses stay local (IndexedDB) exactly as before.
// Once configureBackend({ apiBaseUrl }) has been called, submit/list switch
// to the HTTP contract in src/server/ instead — this is the "swap the
// internals, not the UI" point the README describes.

import { openDb, promisifyRequest } from './db'
import { createId } from '../data/formSchema'
import { saveJsonToFile } from './fileStorage'
import { getApiBaseUrl, getAdminToken, hasBackend, isBackendReadOnly } from './backendConfig'

async function apiRequest(path, options = {}) {
  const res = await fetch(`${getApiBaseUrl()}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function listLocalResponses(formId) {
  const db = await openDb()
  const store = db.transaction('responses', 'readonly').objectStore('responses')
  const index = store.index('formId')
  return promisifyRequest(index.getAll(formId))
}

export async function submitResponse(formId, answers) {
  if (hasBackend() && !isBackendReadOnly()) {
    return apiRequest('/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, answers }),
    })
  }
  // No backend, or a read-only one: a real submission can't be written to
  // the real backend, so it's kept in this browser instead of being lost.
  const db = await openDb()
  const store = db.transaction('responses', 'readwrite').objectStore('responses')
  const response = {
    id: createId('response'),
    formId,
    answers,
    submittedAt: new Date().toISOString(),
  }
  await promisifyRequest(store.put(response))
  return response
}

export async function listResponses(formId) {
  if (hasBackend()) {
    const responses = await apiRequest(`/responses?formId=${encodeURIComponent(formId)}`, {
      headers: { 'x-admin-token': getAdminToken() },
    })
    // Read-only backend: any test submissions landed in local IndexedDB
    // (see submitResponse above) — without this, they'd never show up
    // alongside the real backend's responses.
    if (isBackendReadOnly()) {
      const local = await listLocalResponses(formId)
      return [...responses, ...local].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    }
    return responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  }
  const responses = await listLocalResponses(formId)
  return responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

// Local-only: the backend's HTTP contract has no delete endpoint for
// responses yet, so with a backend configured these only ever clear the
// (empty, unused) local IndexedDB copy — collected responses on the backend
// for a deleted form are left in place. Worth closing before this holds
// anything sensitive; fine for now since nothing currently surfaces
// per-response deletion in the admin UI either.
export async function deleteResponse(id) {
  const db = await openDb()
  const store = db.transaction('responses', 'readwrite').objectStore('responses')
  await promisifyRequest(store.delete(id))
}

export async function deleteResponsesForForm(formId) {
  const db = await openDb()
  const store = db.transaction('responses', 'readwrite').objectStore('responses')
  const index = store.index('formId')
  const localResponses = await promisifyRequest(index.getAll(formId))
  await Promise.all(localResponses.map((r) => promisifyRequest(store.delete(r.id))))
}

/** Exports all saved responses for a form to a local JSON file (placeholder for a future backend export). */
export async function exportResponsesToFile(form) {
  const responses = await listResponses(form.id)
  const payload = { formId: form.id, formTitle: form.title, exportedAt: new Date().toISOString(), responses }
  return saveJsonToFile(payload, `${form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.responses.json`)
}
