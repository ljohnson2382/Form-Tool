// Shared by both handlers below. `allowedOrigin` is the one thing that
// changes per deployment (the fill app's origin) — everything else about
// these headers is fixed.
export function applyCors(res, { allowedOrigin, methods = 'GET,POST,OPTIONS' } = {}) {
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
}
