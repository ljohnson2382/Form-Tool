import * as blobStore from './blobStore.js'
import { applyCors } from './cors.js'

/**
 * Vercel Node function handler for `GET/POST /api/responses`.
 * POST is public — an anonymous respondent submitting a fill-mode form has
 * no prior relationship with this backend to authenticate. GET (used by the
 * admin Responses screen to read submissions) requires `x-admin-token`,
 * since responses are the one thing here that shouldn't be world-readable.
 *
 * `store` — any object implementing listResponsesFor/appendResponse (see
 * blobStore.js or cosmosStore.js). Defaults to blobStore so existing
 * Vercel-only consumers are unaffected.
 */
export function createResponsesHandler({ adminToken, allowedOrigin, store = blobStore } = {}) {
  return async function responsesHandler(req, res) {
    applyCors(res, { allowedOrigin, methods: 'GET,POST,OPTIONS' })
    if (req.method === 'OPTIONS') return res.status(204).end()

    if (req.method === 'POST') {
      const { formId, answers } = req.body ?? {}
      if (!formId || typeof answers !== 'object' || answers === null) {
        return res.status(400).json({ error: 'Expected { formId, answers }.' })
      }
      const response = await store.appendResponse(formId, answers)
      return res.status(201).json(response)
    }

    if (req.method === 'GET') {
      if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
        return res.status(401).json({ error: 'Missing or invalid admin token.' })
      }
      const formId = req.query?.formId
      if (!formId) return res.status(400).json({ error: 'Missing "formId" query param.' })
      const responses = await store.listResponsesFor(formId)
      return res.status(200).json(responses)
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  }
}
