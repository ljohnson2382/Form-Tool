import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'form-builder-kit/style.css'
import { FormBuilderApp } from 'form-builder-kit'
import { stagingBrand } from './brands/staging.js'
import { itzipperUatSurvey } from './seeds'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FormBuilderApp brand={stagingBrand} seedForms={[itzipperUatSurvey]} />
  </StrictMode>,
)
