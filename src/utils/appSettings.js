import { openDb, promisifyRequest } from './db'
import { normalizeBrand } from '../data/formSchema'

const RECORD_ID = 'app'

/**
 * The admin app's own brand, edited from AdminSettingsScreen.jsx — separate
 * from any one form's brand (formStore.js). Returns null if nothing has
 * been saved yet, in which case FormBuilderApp.jsx falls back to whatever
 * `brand` prop the consuming project passed in as the factory default.
 */
export async function getAppBrand() {
  const db = await openDb()
  const store = db.transaction('appSettings', 'readonly').objectStore('appSettings')
  const record = await promisifyRequest(store.get(RECORD_ID))
  return record ? normalizeBrand(record.brand) : null
}

export async function saveAppBrand(brand) {
  const db = await openDb()
  const store = db.transaction('appSettings', 'readwrite').objectStore('appSettings')
  const normalized = normalizeBrand(brand)
  await promisifyRequest(store.put({ id: RECORD_ID, brand: normalized }))
  return normalized
}
