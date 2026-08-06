export { createFormsHandler } from './formsHandler.js'
export { createResponsesHandler } from './responsesHandler.js'
export { createDraftsHandler } from './draftsHandler.js'
export { createSettingsHandler } from './settingsHandler.js'
export { createProjectsHandler } from './projectsHandler.js'
export { toAzureFunctionHandler } from './azureFunctionsAdapter.js'

// Reference storage implementations — pass one as `store` to either handler
// factory above. blobStore.js (Vercel Blob) is the default if `store` is
// omitted; cosmosStore.js (Azure Cosmos DB) is opt-in. A project can also
// supply its own object implementing the same five functions.
export * as blobStore from './blobStore.js'
export * as cosmosStore from './cosmosStore.js'
