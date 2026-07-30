import { useEffect, useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { BrandProvider, useBrand } from './context/BrandContext'
import PageBackground from './components/PageBackground'
import ThemeToggle from './components/ThemeToggle'
import { seedIfEmpty } from './utils/formStore'
import DashboardScreen from './screens/DashboardScreen'
import BuilderScreen from './screens/BuilderScreen'
import PreviewScreen from './screens/PreviewScreen'
import FillScreen from './screens/FillScreen'

const VIEWS = {
  DASHBOARD: 'dashboard',
  BUILDER: 'builder',
  PREVIEW: 'preview',
  FILL: 'fill',
}

function BrandMark({ onClick }) {
  const { theme } = useTheme()
  const brand = useBrand()
  const logo = theme === 'dark' ? (brand.logoDark ?? brand.logoLight) : brand.logoLight

  return (
    <button type="button" onClick={onClick} aria-label={`Go to ${brand.appName} dashboard`} className="flex items-center gap-3">
      {logo ? (
        <img src={logo} alt={brand.appName} className="h-12 w-auto" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-base font-bold text-white">
          {brand.appName.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{brand.appName}</span>
    </button>
  )
}

function FormBuilderShell({ seedForms }) {
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [activeFormId, setActiveFormId] = useState(null)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    seedIfEmpty(seedForms).finally(() => setSeeded(true))
    // Only ever seed from the forms this app was mounted with, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function goToDashboard() {
    setActiveFormId(null)
    setView(VIEWS.DASHBOARD)
  }

  function openBuilder(formId) {
    setActiveFormId(formId)
    setView(VIEWS.BUILDER)
  }

  function openPreview(formId) {
    setActiveFormId(formId)
    setView(VIEWS.PREVIEW)
  }

  function openFill(formId) {
    setActiveFormId(formId)
    setView(VIEWS.FILL)
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <PageBackground />

      <div
        className="sticky top-0 z-30 w-full bg-slate-50/75 backdrop-blur-md dark:bg-slate-950/75"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <BrandMark onClick={goToDashboard} />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <div className="py-6">
          {!seeded ? (
            <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
          ) : view === VIEWS.DASHBOARD ? (
            <DashboardScreen onOpenBuilder={openBuilder} onOpenPreview={openPreview} onOpenFill={openFill} />
          ) : view === VIEWS.BUILDER ? (
            <BuilderScreen formId={activeFormId} onBack={goToDashboard} onPreview={openPreview} />
          ) : view === VIEWS.PREVIEW ? (
            <PreviewScreen formId={activeFormId} onBack={goToDashboard} onFill={openFill} />
          ) : view === VIEWS.FILL ? (
            <FillScreen formId={activeFormId} onBack={goToDashboard} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Mount this once per project: <FormBuilderApp brand={yourBrand} seedForms={yourForms} />
 * `brand` overrides the neutral default (see context/BrandContext.jsx for the shape).
 * `seedForms` are only ever written on a genuinely empty form store (first load).
 */
export default function FormBuilderApp({ brand, seedForms = [] }) {
  return (
    <ThemeProvider>
      <BrandProvider brand={brand}>
        <FormBuilderShell seedForms={seedForms} />
      </BrandProvider>
    </ThemeProvider>
  )
}
