import { createProjectsHandler, cosmosStore } from 'form-builder-kit/server'

export default createProjectsHandler({
  adminToken: process.env.ADMIN_API_TOKEN,
  allowedOrigin: process.env.FILL_APP_ORIGIN,
  store: cosmosStore,
})
