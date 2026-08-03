import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'form-builder-kit/style.css'
import { FormBuilderApp, MODES } from 'form-builder-kit'
import { fillBrand } from './brand.js'

// This app has exactly one job: render a single published form for
// respondents to fill out and submit. It's deployed separately from the
// admin app — its own Vercel project, its own subdomain (see the root
// README's deployment runbook) — and talks to the same backend over
// VITE_API_BASE_URL. It intentionally has no admin token anywhere in its
// build: publishing, unpublishing, and reading responses aren't reachable
// from here (see demo/src/main.jsx, which does carry one).
const params = new URLSearchParams(window.location.search)
const formId = params.get('formId') ?? import.meta.env.VITE_DEFAULT_FORM_ID

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FormBuilderApp brand={fillBrand} mode={MODES.FILL} formId={formId} apiBaseUrl={import.meta.env.VITE_API_BASE_URL} />
  </StrictMode>,
)
