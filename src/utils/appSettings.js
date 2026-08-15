import { openDb, promisifyRequest } from './db'
import { normalizeBrand } from '../data/formSchema'
import { getApiBaseUrl, getAdminToken, hasBackend, isBackendReadOnly } from './backendConfig'

const RECORD_ID = 'app'

async function apiRequest(path, options = {}) {
  const res = await fetch(`${getApiBaseUrl()}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

/**
 * The admin app's own brand, edited from AdminSettingsScreen.jsx — separate
 * from any one form's brand (formStore.js). Returns null if nothing has
 * been saved yet, in which case FormBuilderApp.jsx falls back to whatever
 * `brand` prop the consuming project passed in as the factory default.
 *
 * With a backend configured, this is a shared document in Cosmos DB (GET
 * /settings — public, same reasoning as GET /forms: a respondent with no
 * form-specific brand still needs the app's shell brand) so a customized
 * brand is consistent across every device, not just the one that saved it.
 */
async function getLocalAppBrand() {
  const db = await openDb()
  const store = db.transaction('appSettings', 'readonly').objectStore('appSettings')
  const record = await promisifyRequest(store.get(RECORD_ID))
  return record ? normalizeBrand(record.brand) : null
}

export async function getAppBrand() {
  if (hasBackend()) {
    // Read-only backend: a local override (see saveAppBrand below) always
    // wins, same reasoning as every other store here.
    if (isBackendReadOnly()) {
      const local = await getLocalAppBrand()
      if (local) return local
    }
    const settings = await apiRequest('/settings')
    return settings.brand ?? null
  }
  return getLocalAppBrand()
}

export async function saveAppBrand(brand) {
  const normalized = normalizeBrand(brand)
  if (hasBackend() && !isBackendReadOnly()) {
    const settings = await apiRequest('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() },
      body: JSON.stringify({ brand: normalized }),
    })
    return settings.brand ?? null
  }
  const db = await openDb()
  const store = db.transaction('appSettings', 'readwrite').objectStore('appSettings')
  await promisifyRequest(store.put({ id: RECORD_ID, brand: normalized }))
  return normalized
}
