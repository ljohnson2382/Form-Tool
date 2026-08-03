import { createFormsHandler } from 'form-builder-kit/server'

export default createFormsHandler({
  adminToken: process.env.ADMIN_API_TOKEN,
  allowedOrigin: process.env.FILL_APP_ORIGIN,
})
