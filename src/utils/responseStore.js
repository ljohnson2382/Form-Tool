// Response persistence abstraction. Today responses are saved locally
// (IndexedDB) and can be exported to a JSON file on disk. The rest of the
// app only calls the functions exported here — swapping this module's
// internals for a real backend (REST/GraphQL API) later requires no changes
// to the UI, since the call signatures stay the same.

import { openDb, promisifyRequest } from './db'
import { createId } from '../data/formSchema'
import { saveJsonToFile } from './fileStorage'

export async function submitResponse(formId, answers) {
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
  const db = await openDb()
  const store = db.transaction('responses', 'readonly').objectStore('responses')
  const index = store.index('formId')
  const responses = await promisifyRequest(index.getAll(formId))
  return responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export async function deleteResponse(id) {
  const db = await openDb()
  const store = db.transaction('responses', 'readwrite').objectStore('responses')
  await promisifyRequest(store.delete(id))
}

export async function deleteResponsesForForm(formId) {
  const responses = await listResponses(formId)
  const db = await openDb()
  const store = db.transaction('responses', 'readwrite').objectStore('responses')
  await Promise.all(responses.map((r) => promisifyRequest(store.delete(r.id))))
}

/** Exports all saved responses for a form to a local JSON file (placeholder for a future backend export). */
export async function exportResponsesToFile(form) {
  const responses = await listResponses(form.id)
  const payload = { formId: form.id, formTitle: form.title, exportedAt: new Date().toISOString(), responses }
  return saveJsonToFile(payload, `${form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.responses.json`)
}
