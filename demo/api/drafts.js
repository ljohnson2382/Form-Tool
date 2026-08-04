import { createDraftsHandler, cosmosStore } from 'form-builder-kit/server'

export default createDraftsHandler({
  adminToken: process.env.ADMIN_API_TOKEN,
  allowedOrigin: process.env.FILL_APP_ORIGIN,
  store: cosmosStore,
})
