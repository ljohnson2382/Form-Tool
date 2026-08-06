import { openDb, promisifyRequest } from './db'
import { normalizeProject } from '../data/formValidation'
import { getApiBaseUrl, getAdminToken, hasBackend } from './backendConfig'

// Saved, reusable brands (see createEmptyProject in data/formSchema.js) —
// created and edited from Global Settings (ProjectsPanel.jsx), applied to
// any form from BuilderScreen.jsx. Same hasBackend() switch as formStore.js:
// with a backend configured, projects live in the shared store via /projects
// (see projectsHandler.js) so every device sees the same set; with none,
// they stay in this browser's IndexedDB.
//
// Admin-only either way — unlike forms and appSettings, a respondent filling
// out a form never needs to read a Project record directly: applying one
// copies its brand onto the form at the moment you click it (see
// BrandEditor.jsx's applyPreset), so by the time a form is published or
// filled out, its brand is already fully self-contained.

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

export async function listProjects() {
  if (hasBackend()) {
    const projects = await apiRequest('/projects', { headers: adminHeaders() })
    return projects.map((project) => normalizeProject(project)).sort((a, b) => a.name.localeCompare(b.name))
  }
  const db = await openDb()
  const projects = await promisifyRequest(db.transaction('projects', 'readonly').objectStore('projects').getAll())
  return projects.map((project) => normalizeProject(project)).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getProject(id) {
  if (!id) return null
  if (hasBackend()) {
    const project = await apiRequest(`/projects?id=${encodeURIComponent(id)}`, { headers: adminHeaders() }, { allow404: true })
    return project ? normalizeProject(project) : null
  }
  const db = await openDb()
  const project = await promisifyRequest(db.transaction('projects', 'readonly').objectStore('projects').get(id))
  return project ? normalizeProject(project) : null
}

export async function saveProject(project) {
  const normalized = normalizeProject(project)
  const updated = { ...normalized, updatedAt: new Date().toISOString() }
  if (hasBackend()) {
    return await apiRequest('/projects', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updated),
    })
  }
  const db = await openDb()
  await promisifyRequest(db.transaction('projects', 'readwrite').objectStore('projects').put(updated))
  return updated
}

export async function deleteProject(id) {
  if (hasBackend()) {
    await apiRequest(`/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: adminHeaders() })
    return
  }
  const db = await openDb()
  await promisifyRequest(db.transaction('projects', 'readwrite').objectStore('projects').delete(id))
}
