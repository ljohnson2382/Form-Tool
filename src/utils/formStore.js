import { openDb, promisifyRequest } from './db'
import { createId } from '../data/formSchema'

// Each form is stored as its own independent record — never merged into a
// single blob — so forms can be listed, duplicated, and deleted individually.

export async function listForms() {
  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  const forms = await promisifyRequest(store.getAll())
  return forms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function getForm(id) {
  const db = await openDb()
  const store = db.transaction('forms', 'readonly').objectStore('forms')
  return promisifyRequest(store.get(id))
}

export async function saveForm(form) {
  const db = await openDb()
  const store = db.transaction('forms', 'readwrite').objectStore('forms')
  const updated = { ...form, updatedAt: new Date().toISOString() }
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

export async function importForm(form) {
  const now = new Date().toISOString()
  const imported = {
    ...form,
    id: createId('form'),
    createdAt: form.createdAt ?? now,
    updatedAt: now,
  }
  return saveForm(imported)
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
