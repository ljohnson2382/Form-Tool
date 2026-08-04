import * as blobStore from './blobStore.js'
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
 * Vercel Node function handler for `GET/POST/DELETE /api/drafts`.
 *
 * Unlike formsHandler.js, every method here requires `x-admin-token` —
 * drafts are private, unpublished authoring work, with no respondent-facing
 * reason to ever be public. GET with no `id` lists every draft; each one
 * gets `publishedAt` attached server-side (one HTTP round trip from the
 * browser, however many drafts exist).
 *
 * `store` — any object implementing listDraftForms/getDraftForm/
 * putDraftForm/deleteDraftForm/getPublishedForm (see cosmosStore.js).
 * Defaults to blobStore so existing Vercel-only consumers are unaffected —
 * note blobStore.js doesn't implement the draft functions yet.
 */
export function createDraftsHandler({ adminToken, allowedOrigin, store = blobStore } = {}) {
  return async function draftsHandler(req, res) {
    applyCors(res, { allowedOrigin, methods: 'GET,POST,DELETE,OPTIONS' })
    if (req.method === 'OPTIONS') return res.status(204).end()
    if (!requireAdmin(req, res, adminToken)) return

    if (req.method === 'GET') {
      const id = req.query?.id
      if (id) {
        const draft = await store.getDraftForm(id)
        if (!draft) return res.status(404).json({ error: 'Draft not found.' })
        const published = await store.getPublishedForm(id)
        return res.status(200).json({ ...draft, publishedAt: published?.updatedAt ?? null })
      }
      const drafts = await store.listDraftForms()
      const withStatus = await Promise.all(
        drafts.map(async (draft) => ({ ...draft, publishedAt: (await store.getPublishedForm(draft.id))?.updatedAt ?? null })),
      )
      return res.status(200).json(withStatus)
    }

    if (req.method === 'POST') {
      try {
        const draft = await store.putDraftForm(req.body)
        return res.status(200).json(draft)
      } catch (err) {
        const message = err instanceof FormValidationError ? err.message : 'Could not save draft.'
        return res.status(400).json({ error: message })
      }
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id
      if (!id) return res.status(400).json({ error: 'Missing "id" query param.' })
      await store.deleteDraftForm(id)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  }
}
