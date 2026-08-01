import { openDb, promisifyRequest } from './db'
import { createId } from '../data/formSchema'
import { normalizeForm } from '../data/formValidation'

// Each form is stored as its own independent record — never merged into a
// single blob — so forms can be listed, duplicated, and deleted individually.
//
// Every read and write passes through normalizeForm, so screens can rely on
// the documented shape without defensive checks of their own. Reads are
// lenient (repair, don't throw) so a record written by an older build still
// lists and can still be deleted; imports are strict (see importForm).

export async function listForms() {
  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  const forms = await promisifyRequest(store.getAll())
  return forms.map((form) => normalizeForm(form)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function getForm(id) {
  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  const form = await promisifyRequest(store.get(id))
  return form ? normalizeForm(form) : form
}

export async function saveForm(form) {
  const db = await openDb()
  const store = db.transaction('forms', 'readwrite').objectStore('forms')
  const updated = { ...normalizeForm(form), updatedAt: new Date().toISOString() }
  await promisifyRequest(store.put(updated))
  return updated
}

export async function deleteForm(id) {
  const db = await openDb()
  const store = db.transaction('forms', 'readwrite').objectStore('forms')
  await promisifyRequest(store.delete(id))
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
