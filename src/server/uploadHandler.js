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
 * Vercel Node function handler for `POST /api/upload` — admin-only (see
 * requireAdmin), same as publishing or reading responses. The request body
 * is the raw image bytes, Content-Type set to the image's actual mime type
 * (not multipart/form-data — see BrandEditor.jsx's uploadFieldImage, the
 * one caller, and azureFunctionsAdapter.js, which needs Content-Type to
 * decide whether to parse a POST body as JSON or raw bytes).
 *
 * `store` — any object implementing `uploadImage(bytes, contentType) ->
 * url` (see blobStore.js or a project's own, e.g. Azure Blob Storage).
 * Defaults to blobStore so existing Vercel-only consumers are unaffected.
 */
export function createUploadHandler({ adminToken, allowedOrigin, store = blobStore } = {}) {
  return async function uploadHandler(req, res) {
    applyCors(res, { allowedOrigin, methods: 'POST,OPTIONS' })
    if (req.method === 'OPTIONS') return res.status(204).end()
    if (!requireAdmin(req, res, adminToken)) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

    const contentType = req.headers['content-type']
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Expected an image file.' })
    }
    try {
      const url = await store.uploadImage(req.body, contentType)
      return res.status(200).json({ url })
    } catch {
      return res.status(500).json({ error: 'Could not upload that image.' })
    }
  }
}
