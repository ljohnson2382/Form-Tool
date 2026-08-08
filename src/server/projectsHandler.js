import * as blobStore from './blobStore.js'
import { applyCors } from './cors.js'

function requireAdmin(req, res, adminToken) {
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    res.status(401).json({ error: 'Missing or invalid admin token.' })
    return false
  }
  return true
}

/**
 * Vercel Node function handler for `GET/POST/DELETE /api/projects` —
 * saved, reusable brands (see utils/projectStore.js). Every method requires
 * `x-admin-token`, same as draftsHandler.js: unlike a form's own brand, a
 * Project record is only ever read by the authoring UI (BuilderScreen.jsx's
 * branding panel, Global Settings' ProjectsPanel.jsx) — applying one copies
 * its brand onto the form at that moment, so a respondent filling out the
 * published result never needs to fetch a Project directly.
 *
 * `store` — any object implementing listProjects/getProject/putProject/
 * deleteProject (see cosmosStore.js). Defaults to blobStore.
 */
export function createProjectsHandler({ adminToken, allowedOrigin, store = blobStore } = {}) {
  return async function projectsHandler(req, res) {
    applyCors(res, { allowedOrigin, methods: 'GET,POST,DELETE,OPTIONS' })
    if (req.method === 'OPTIONS') return res.status(204).end()
    if (!requireAdmin(req, res, adminToken)) return

    if (req.method === 'GET') {
      const id = req.query?.id
      if (id) {
        const project = await store.getProject(id)
        if (!project) return res.status(404).json({ error: 'Project not found.' })
        return res.status(200).json(project)
      }
      const projects = await store.listProjects()
      return res.status(200).json(projects)
    }

    if (req.method === 'POST') {
      // Unlike formsHandler.js/draftsHandler.js's equivalent, this had no
      // try/catch — an oversized document (e.g. an inline brand image over
      // Cosmos's 2MB item limit, see BrandEditor.jsx) threw unhandled and
      // surfaced as a raw, message-less 500 instead of a clean error (#39).
      try {
        const project = await store.putProject(req.body)
        return res.status(200).json(project)
      } catch (err) {
        return res.status(400).json({ error: 'Could not save project.' })
      }
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id
      if (!id) return res.status(400).json({ error: 'Missing "id" query param.' })
      await store.deleteProject(id)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  }
}
