import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'form-builder-kit/style.css'
import { FormBuilderApp, MODES, parseDetectedBrands } from 'form-builder-kit'
import { stagingBrand } from './brands/staging.js'
import { itzipperUatSurvey } from './seeds'

// Any src/assets/brands/<slug>/ folder becomes a one-click preset in the
// Builder's branding panel (see BrandEditor.jsx) — this glob call has to
// live here, in the consuming project, since it resolves relative to this
// project's own source tree; parseDetectedBrands just parses the result.
const detectedBrands = parseDetectedBrands(import.meta.glob('/src/assets/brands/**/*', { eager: true }))

// Two mounts, chosen by query string, to exercise both surfaces:
//   /                          -> the authoring app (dashboard, builder, export)
//   /?mode=fill&formId=<id>    -> what you hand a test participant: that one
//                                 form, submit only, no dashboard or export
// A real deployment would pick the mode from its own routing rather than a
// query param a respondent could edit — and once responses live on a server,
// the server has to enforce the split too. This is a demo of the surfaces.
const params = new URLSearchParams(window.location.search)
const mode = params.get('mode') === 'fill' ? MODES.FILL : MODES.ADMIN
const formId = params.get('formId') ?? itzipperUatSurvey.id

// VITE_API_BASE_URL, if set, points both surfaces at a real backend (see
// src/server/ in the kit and the README's deployment runbook) instead of
// this browser's own IndexedDB. VITE_ADMIN_TOKEN authorizes publish/
// unpublish/response-reading and must only ever reach the admin surface —
// see fill/src/main.jsx, which intentionally has no equivalent.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const adminToken = mode === MODES.ADMIN ? import.meta.env.VITE_ADMIN_TOKEN : undefined
const fillBaseUrl = import.meta.env.VITE_FILL_BASE_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FormBuilderApp
      brand={stagingBrand}
      seedForms={[itzipperUatSurvey]}
      mode={mode}
      formId={formId}
      apiBaseUrl={apiBaseUrl}
      adminToken={adminToken}
      fillBaseUrl={fillBaseUrl}
      detectedBrands={detectedBrands}
    />
  </StrictMode>,
)
