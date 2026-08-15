// Points formStore/responseStore at a real backend implementing the HTTP
// contract in src/server/, instead of IndexedDB only. Mirrors configureStorage
// in db.js — set once (FormBuilderApp does this during render) before any
// storage call.
//
// adminToken is only ever meaningful for the admin-mode mount: it's what
// authorizes publish/unpublish and reading collected responses. A fill-mode
// deploy must never be configured with it — that would ship the secret to
// every respondent's browser.
//
// readOnly is for a backend that's deliberately not writable at the
// database level (e.g. a Cosmos DB read-only key pointed at another
// deployment's real data — a "staging looks at prod's data" setup, where
// staging must never be able to write to prod). Every store below reads
// this the same way: reads still go to the backend, but every write falls
// back to local IndexedDB instead of attempting (and failing) a real
// backend write, with local always checked first on read so whatever was
// last written — local or backend — is what's actually shown.

let apiBaseUrl = null
let adminToken = null
let backendReadOnly = false

export function configureBackend({ apiBaseUrl: url, adminToken: token, readOnly = false } = {}) {
  apiBaseUrl = url || null
  adminToken = token || null
  backendReadOnly = Boolean(readOnly)
}

export function hasBackend() {
  return Boolean(apiBaseUrl)
}

export function isBackendReadOnly() {
  return backendReadOnly
}

export function getApiBaseUrl() {
  return apiBaseUrl
}

export function getAdminToken() {
  return adminToken
}
