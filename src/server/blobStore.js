// Reference storage implementation for the published-form/response HTTP
// contract, backed by Vercel Blob. This is the one module to swap if a
// project needs a different backend later (Postgres, Supabase, ...) — the
// handlers in formsHandler.js/responsesHandler.js only call the functions
// exported here.

import { put, head, del, BlobNotFoundError } from '@vercel/blob'
import { createId } from '../data/formSchema.js'
import { normalizeForm, normalizeProject } from '../data/formValidation.js'

function formsPath(id) {
  return `forms/${id}.json`
}

function responsesPath(formId) {
  return `responses/${formId}.json`
}

// A handful of admin-managed records (utils/projectStore.js) — one shared
// array, same reasoning as responsesPath: nothing here needs per-record
// querying, just "list them all" and "replace the whole list."
const PROJECTS_PATH = 'projects.json'

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

export async function listProjects() {
  const raw = await getJson(PROJECTS_PATH)
  return Array.isArray(raw) ? raw.map((p) => normalizeProject(p)) : []
}

export async function getProject(id) {
  const projects = await listProjects()
  return projects.find((p) => p.id === id) ?? null
}

export async function putProject(project) {
  const normalized = normalizeProject(project)
  const projects = await listProjects()
  const withoutExisting = projects.filter((p) => p.id !== normalized.id)
  await putJson(PROJECTS_PATH, [...withoutExisting, normalized])
  return normalized
}

export async function deleteProject(id) {
  const projects = await listProjects()
  await putJson(PROJECTS_PATH, projects.filter((p) => p.id !== id))
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
