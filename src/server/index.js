export { createFormsHandler } from './formsHandler.js'
export { createResponsesHandler } from './responsesHandler.js'
export { createDraftsHandler } from './draftsHandler.js'
export { createSettingsHandler } from './settingsHandler.js'
export { createProjectsHandler } from './projectsHandler.js'
export { toAzureFunctionHandler } from './azureFunctionsAdapter.js'

// Reference storage implementation — pass an object shaped like this as
// `store` to either handler factory above; it's the default if `store` is
// omitted. This is the only concrete database integration the kit ships —
// deliberately: the kit is a shell, not a backend. Any other store (Cosmos
// DB, Postgres, whatever a real deployment actually uses) is the consuming
// project's own code, written to the same five-function shape and passed in
// the same way.
export * as blobStore from './blobStore.js'
