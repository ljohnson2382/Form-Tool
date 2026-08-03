// Azure Functions (what Static Web Apps uses for its API) hands a handler
// `(request, context) => response` — a Web-API-shaped request in, a plain
// object out — not Vercel's `(req, res)` with a mutable response object.
// Rather than rewrite formsHandler.js/responsesHandler.js for a second
// runtime, this adapts one shape to the other so that logic is reused as-is.

function buildFakeRes() {
  let statusCode = 200
  const headers = {}
  let jsonBody
  let ended = false

  const res = {
    status(code) {
      statusCode = code
      return res
    },
    setHeader(name, value) {
      headers[name] = value
      return res
    },
    json(payload) {
      jsonBody = payload
      ended = true
      return res
    },
    end() {
      ended = true
      return res
    },
  }

  return {
    res,
    toResponseInit() {
      const init = { status: statusCode, headers }
      if (ended && jsonBody !== undefined) init.jsonBody = jsonBody
      return init
    },
  }
}

/**
 * Wraps a Vercel-shaped `(req, res)` handler (`createFormsHandler(...)` /
 * `createResponsesHandler(...)`) into an Azure Functions v4
 * `(request, context) => response` handler.
 */
export function toAzureFunctionHandler(handler) {
  return async function azureFunctionHandler(request) {
    const query = Object.fromEntries(request.query.entries())
    const headers = Object.fromEntries([...request.headers.entries()].map(([key, value]) => [key.toLowerCase(), value]))
    // Only POST bodies are ever read by formsHandler.js/responsesHandler.js;
    // parsing a body that isn't there (GET/DELETE/OPTIONS) would throw.
    const body = request.method === 'POST' ? await request.json() : undefined

    const { res, toResponseInit } = buildFakeRes()
    await handler({ method: request.method, query, headers, body }, res)
    return toResponseInit()
  }
}
