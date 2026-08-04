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
 * Vercel Node function handler for `GET/POST /api/settings` — the admin
 * app's own default brand override, a singleton rather than one-per-form
 * (see cosmosStore.js's getAppSettings/putAppSettings).
 *
 * GET is public, same reasoning as formsHandler.js: a respondent filling
 * out a form with no form-specific brand still needs the app's shell brand
 * to render the surrounding chrome. POST (save) requires `x-admin-token`.
 *
 * `store` — any object implementing getAppSettings/putAppSettings (see
 * cosmosStore.js). Defaults to blobStore so existing Vercel-only consumers
 * are unaffected — note blobStore.js doesn't implement these yet.
 */
export function createSettingsHandler({ adminToken, allowedOrigin, store = blobStore } = {}) {
  return async function settingsHandler(req, res) {
    applyCors(res, { allowedOrigin, methods: 'GET,POST,OPTIONS' })
    if (req.method === 'OPTIONS') return res.status(204).end()

    if (req.method === 'GET') {
      const settings = await store.getAppSettings()
      return res.status(200).json(settings)
    }

    if (!requireAdmin(req, res, adminToken)) return

    if (req.method === 'POST') {
      const settings = await store.putAppSettings(req.body ?? {})
      return res.status(200).json(settings)
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  }
}
