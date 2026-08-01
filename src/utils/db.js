const BASE_DB_NAME = 'form-builder-db'
const DB_VERSION = 1

let dbName = BASE_DB_NAME
let dbPromise = null

/**
 * Give this instance its own database.
 *
 * IndexedDB is scoped to the origin, not to the page — so two mounts of the
 * kit on the same origin (say /feedback and /uat) would otherwise share one
 * set of forms and, more importantly, one set of collected responses. Pass a
 * namespace to keep them separate.
 *
 * Idempotent, and safe to call before or between storage operations: changing
 * the name closes the previous handle so the next call reopens against the
 * new database.
 */
export function configureStorage({ namespace } = {}) {
  const nextName = namespace ? `${BASE_DB_NAME}-${namespace}` : BASE_DB_NAME
  if (nextName === dbName) return

  dbName = nextName
  if (dbPromise) {
    dbPromise.then((db) => db.close()).catch(() => {})
    dbPromise = null
  }
}

export function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('forms')) {
        db.createObjectStore('forms', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('responses')) {
        const store = db.createObjectStore('responses', { keyPath: 'id' })
        store.createIndex('formId', 'formId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

export function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
