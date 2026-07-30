import { useEffect, useState } from 'react'
import { useTheme } from './context/ThemeContext'
import PageBackground from './components/PageBackground'
import ThemeToggle from './components/ThemeToggle'
import { seedIfEmpty } from './utils/formStore'
import { itzipperUatSurvey } from './data/seedForms/itzipperUatSurvey'
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

function App() {
  const { theme } = useTheme()
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [activeFormId, setActiveFormId] = useState(null)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    seedIfEmpty([itzipperUatSurvey]).finally(() => setSeeded(true))
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
            <button type="button" onClick={goToDashboard} aria-label="Go to forms dashboard" className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? '/itzipper-logo-dark.svg' : '/itzipper-logo.svg'}
                alt="ITZipper.com"
                className="h-12 w-auto drop-shadow-[0_0_10px_rgba(0,126,212,0.18)] dark:drop-shadow-[0_0_22px_rgba(110,193,255,0.55)]"
              />
              <span className="hidden text-sm font-semibold tracking-wide text-slate-500 uppercase sm:inline dark:text-slate-400">
                Form Builder
              </span>
            </button>
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

export default App
