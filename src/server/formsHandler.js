import { getPublishedForm, putPublishedForm, deletePublishedForm } from './blobStore.js'
import { FormValidationError } from '../data/formValidation.js'
import { applyCors } from './cors.js'

function requireAdmin(req, res, adminToken) {
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    res.status(401).json({ error: 'Missing or invalid admin token.' })
    return false
  }
  return true
}

/**
 * Vercel Node function handler for `GET/POST/DELETE /api/forms`.
 * GET is public (respondents resolve a formId with no token). POST
 * (publish) and DELETE (unpublish) require `x-admin-token` to match
 * `adminToken` — the one gate standing between "anyone with the deploy URL"
 * and "anyone who can publish a form."
 */
export function createFormsHandler({ adminToken, allowedOrigin } = {}) {
  return async function formsHandler(req, res) {
    applyCors(res, { allowedOrigin, methods: 'GET,POST,DELETE,OPTIONS' })
    if (req.method === 'OPTIONS') return res.status(204).end()

    if (req.method === 'GET') {
      const id = req.query?.id
      if (!id) return res.status(400).json({ error: 'Missing "id" query param.' })
      const form = await getPublishedForm(id)
      if (!form) return res.status(404).json({ error: 'Form not published.' })
      return res.status(200).json(form)
    }

    if (!requireAdmin(req, res, adminToken)) return

    if (req.method === 'POST') {
      try {
        const form = await putPublishedForm(req.body)
        return res.status(200).json(form)
      } catch (err) {
        const message = err instanceof FormValidationError ? err.message : 'Could not publish form.'
        return res.status(400).json({ error: message })
      }
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id
      if (!id) return res.status(400).json({ error: 'Missing "id" query param.' })
      await deletePublishedForm(id)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  }
}
