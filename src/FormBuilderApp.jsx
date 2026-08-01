import { useEffect, useMemo, useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { BrandProvider, useBrand } from './context/BrandContext'
import PageBackground from './components/PageBackground'
import ThemeToggle from './components/ThemeToggle'
import ErrorBoundary from './components/common/ErrorBoundary'
import { configureStorage } from './utils/db'
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

export const MODES = {
  /** Full authoring surface: dashboard, builder, preview, export. */
  ADMIN: 'admin',
  /** One form, fill and submit only — no dashboard, no editing, no export. */
  FILL: 'fill',
}

function BrandMark({ onClick }) {
  const { theme } = useTheme()
  const brand = useBrand()
  const logo = theme === 'dark' ? (brand.logoDark ?? brand.logoLight) : brand.logoLight

  const content = (
    <>
      {logo ? (
        <img src={logo} alt={brand.appName} className="h-12 w-auto" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-base font-bold text-white">
          {brand.appName.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{brand.appName}</span>
    </>
  )

  // Respondent mode has no dashboard, so the mark is a plain label rather than
  // a control that looks like it goes somewhere.
  if (!onClick) return <div className="flex items-center gap-3">{content}</div>

  return (
    <button type="button" onClick={onClick} aria-label={`Go to ${brand.appName} dashboard`} className="flex items-center gap-3">
      {content}
    </button>
  )
}

function Chrome({ onHome, children }) {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <PageBackground />

      <div
        className="sticky top-0 z-30 w-full bg-slate-50/75 backdrop-blur-md dark:bg-slate-950/75"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <BrandMark onClick={onHome} />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <div className="py-6">{children}</div>
      </div>
    </div>
  )
}

function useSeeded(seedForms) {
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    seedIfEmpty(seedForms).finally(() => setSeeded(true))
    // Only ever seed from the forms this app was mounted with, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return seeded
}

function Loading() {
  return <div className="flex items-center justify-center py-24 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
}

function RespondentShell({ seedForms, formId }) {
  const seeded = useSeeded(seedForms)

  return (
    <Chrome>
      <ErrorBoundary resetKey={formId}>{seeded ? <FillScreen formId={formId} /> : <Loading />}</ErrorBoundary>
    </Chrome>
  )
}

function AdminShell({ seedForms }) {
  const seeded = useSeeded(seedForms)
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [activeFormId, setActiveFormId] = useState(null)

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
    <Chrome onHome={goToDashboard}>
      {/* Scoped per view+form so a screen that fails to render doesn't strand
          the user — navigating away clears the error and the dashboard (which
          can delete the offending form) stays reachable. */}
      <ErrorBoundary resetKey={`${view}:${activeFormId}`} onReset={goToDashboard}>
        {!seeded ? (
          <Loading />
        ) : view === VIEWS.DASHBOARD ? (
          <DashboardScreen onOpenBuilder={openBuilder} onOpenPreview={openPreview} onOpenFill={openFill} />
        ) : view === VIEWS.BUILDER ? (
          <BuilderScreen formId={activeFormId} onBack={goToDashboard} onPreview={openPreview} />
        ) : view === VIEWS.PREVIEW ? (
          <PreviewScreen formId={activeFormId} onBack={goToDashboard} onFill={openFill} />
        ) : view === VIEWS.FILL ? (
          <FillScreen formId={activeFormId} onBack={goToDashboard} />
        ) : null}
      </ErrorBoundary>
    </Chrome>
  )
}

/**
 * Mount once per project: <FormBuilderApp brand={yourBrand} seedForms={yourForms} />
 *
 * - `brand` overrides the neutral default (see context/BrandContext.jsx).
 * - `seedForms` are written only to a genuinely empty store (first load).
 * - `mode` — 'admin' (default) is the full authoring surface. 'fill' serves a
 *   single form for submission only, with no dashboard, editing, or response
 *   export reachable. Give respondents a 'fill' mount, not an 'admin' one.
 *   While storage is local this is about intent and ergonomics; once responses
 *   live on a server it must also be enforced there — the client can't be the
 *   thing that decides who is allowed to read other people's answers.
 * - `formId` — required in 'fill' mode: which form to serve.
 * - `storageNamespace` — separates this instance's IndexedDB from other mounts
 *   on the same origin, which would otherwise share forms and responses.
 */
export default function FormBuilderApp({ brand, seedForms = [], mode = MODES.ADMIN, formId = null, storageNamespace }) {
  // Runs during render, so storage is pointed at the right database before any
  // child effect can open it.
  useMemo(() => configureStorage({ namespace: storageNamespace }), [storageNamespace])

  const respondentMode = mode === MODES.FILL

  return (
    <ThemeProvider>
      <BrandProvider brand={brand}>
        {respondentMode ? (
          <RespondentShell seedForms={seedForms} formId={formId} />
        ) : (
          <AdminShell seedForms={seedForms} />
        )}
      </BrandProvider>
    </ThemeProvider>
  )
}
