import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'form-builder-kit/style.css'
import { FormBuilderApp, MODES } from 'form-builder-kit'
import { stagingBrand } from './brands/staging.js'
import { itzipperUatSurvey } from './seeds'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FormBuilderApp brand={stagingBrand} seedForms={[itzipperUatSurvey]} mode={mode} formId={formId} />
  </StrictMode>,
)
