// Points formStore/responseStore at a real backend implementing the HTTP
// contract in src/server/, instead of IndexedDB only. Mirrors configureStorage
// in db.js — set once (FormBuilderApp does this during render) before any
// storage call.
//
// adminToken is only ever meaningful for the admin-mode mount: it's what
// authorizes publish/unpublish and reading collected responses. A fill-mode
// deploy must never be configured with it — that would ship the secret to
// every respondent's browser.

let apiBaseUrl = null
let adminToken = null

export function configureBackend({ apiBaseUrl: url, adminToken: token } = {}) {
  apiBaseUrl = url || null
  adminToken = token || null
}

export function hasBackend() {
  return Boolean(apiBaseUrl)
}

export function getApiBaseUrl() {
  return apiBaseUrl
}

export function getAdminToken() {
  return adminToken
}
