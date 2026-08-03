// Reference storage implementation for the published-form/response HTTP
// contract, backed by Vercel Blob. This is the one module to swap if a
// project needs a different backend later (Postgres, Supabase, ...) — the
// handlers in formsHandler.js/responsesHandler.js only call the functions
// exported here.

import { put, head, del, BlobNotFoundError } from '@vercel/blob'
import { createId } from '../data/formSchema.js'
import { normalizeForm } from '../data/formValidation.js'

function formsPath(id) {
  return `forms/${id}.json`
}

function responsesPath(formId) {
  return `responses/${formId}.json`
}

// Blobs are created with a fixed pathname (no random suffix) so publishing
// the same form twice overwrites its one published copy rather than piling
// up orphaned versions. That pathname is guessable, so treat the store's
// base URL as the actual secret — fine for an internal UAT tool, not a
// substitute for real auth if this ever holds sensitive responses.
async function putJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

async function getJson(pathname) {
  try {
    const meta = await head(pathname)
    const res = await fetch(meta.url)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    if (err instanceof BlobNotFoundError) return null
    throw err
  }
}

export async function getPublishedForm(id) {
  const raw = await getJson(formsPath(id))
  return raw ? normalizeForm(raw) : null
}

export async function putPublishedForm(form) {
  const normalized = normalizeForm(form, { strict: true })
  await putJson(formsPath(normalized.id), normalized)
  return normalized
}

export async function deletePublishedForm(id) {
  try {
    const meta = await head(formsPath(id))
    await del(meta.url)
  } catch (err) {
    if (err instanceof BlobNotFoundError) return
    throw err
  }
}

export async function listResponsesFor(formId) {
  const raw = await getJson(responsesPath(formId))
  return Array.isArray(raw) ? raw : []
}

export async function appendResponse(formId, answers) {
  const existing = await listResponsesFor(formId)
  const response = {
    id: createId('response'),
    formId,
    answers,
    submittedAt: new Date().toISOString(),
  }
  await putJson(responsesPath(formId), [...existing, response])
  return response
}
