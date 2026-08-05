import { useEffect, useMemo, useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { BrandProvider, mergeBrandLayers, useBrand } from './context/BrandContext'
import PageBackground from './components/PageBackground'
import ThemeToggle from './components/ThemeToggle'
import ErrorBoundary from './components/common/ErrorBoundary'
import { configureStorage } from './utils/db'
import { configureBackend } from './utils/backendConfig'
import { seedIfEmpty } from './utils/formStore'
import { getAppBrand } from './utils/appSettings'
import DashboardScreen from './screens/DashboardScreen'
import BuilderScreen from './screens/BuilderScreen'
import PreviewScreen from './screens/PreviewScreen'
import FillScreen from './screens/FillScreen'
import ResponsesScreen from './screens/ResponsesScreen'
import AdminSettingsScreen from './screens/AdminSettingsScreen'

const VIEWS = {
  DASHBOARD: 'dashboard',
  BUILDER: 'builder',
  PREVIEW: 'preview',
  FILL: 'fill',
  RESPONSES: 'responses',
  SETTINGS: 'settings',
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
        // Fixed height, auto width alone shrinks any logo that isn't a wide
        // horizontal lockup — a stacked icon-over-wordmark composition gets
        // half its height handed to each row, rendering its text at half
        // size for no reason tied to image quality. max-w + object-contain
        // gives every aspect ratio (wide, square, stacked) the same real
        // estate to work with, capping only pathologically wide logos
        // instead of shortchanging tall ones.
        <img src={logo} alt={brand.appName} className="h-14 w-auto max-w-[200px] object-contain" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-500 text-base font-bold text-white">
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

// Admin mode only (RespondentShell never passes onOpenSettings) — opens
// AdminSettingsScreen, the app-level counterpart to a form's own Design
// controls in BrandEditor.jsx.
function SettingsButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Admin settings"
      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:text-slate-200"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        />
      </svg>
    </button>
  )
}

function Chrome({ onHome, onOpenSettings, children }) {
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
            <div className="flex items-center gap-2">
              {onOpenSettings && <SettingsButton onClick={onOpenSettings} />}
              <ThemeToggle />
            </div>
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
  // The form being filled may carry its own brand (logo/background/accent) —
  // see BrandEditor.jsx. FillScreen reports it once loaded; nesting a second
  // BrandProvider here overrides the app-level default for this one mount,
  // exactly like Microsoft Forms themes an individual form.
  const [activeBrand, setActiveBrand] = useState(null)
  // Resetting during render (React's documented pattern for "state derived
  // from a prop") rather than in a useEffect, which would apply one render
  // late and flash the previous form's brand behind the loading state.
  const [lastFormId, setLastFormId] = useState(formId)
  if (formId !== lastFormId) {
    setLastFormId(formId)
    setActiveBrand(null)
  }

  // Always mounted (never conditionally), even with no override — React
  // treats a BrandProvider that appears only sometimes as a different
  // element at this tree position, remounting everything below it (losing
  // FillScreen's state) the moment a brand toggles between set/unset.
  return (
    <BrandProvider brand={activeBrand}>
      <Chrome>
        <ErrorBoundary resetKey={formId}>{seeded ? <FillScreen formId={formId} onBrandLoaded={setActiveBrand} /> : <Loading />}</ErrorBoundary>
      </Chrome>
    </BrandProvider>
  )
}

function AdminShell({ seedForms, fillBaseUrl, detectedBrands, onAppBrandSaved }) {
  const seeded = useSeeded(seedForms)
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [activeFormId, setActiveFormId] = useState(null)
  // Only Builder/Preview/Fill/Responses are scoped to one form — Dashboard
  // lists many, so it always shows the app-level default (this never gets
  // set while there). Cleared synchronously inside each navigation function
  // below, in the same batch as the view/form change — not via a useEffect
  // keyed on [view, activeFormId], which would apply the reset one render
  // late and flash the previous form's theme over the destination screen.
  const [activeBrand, setActiveBrand] = useState(null)
  // Set alongside the other navigation state so BuilderScreen knows to jump
  // straight to its branding panel — used by the Dashboard's "⋯ More →
  // Settings" entry (see DashboardScreen.jsx), not by plain "Edit".
  const [builderFocusBrand, setBuilderFocusBrand] = useState(false)

  function goToDashboard() {
    setActiveFormId(null)
    setActiveBrand(null)
    setView(VIEWS.DASHBOARD)
  }

  function openBuilder(formId, { focusBrand = false } = {}) {
    setActiveFormId(formId)
    setActiveBrand(null)
    setBuilderFocusBrand(focusBrand)
    setView(VIEWS.BUILDER)
  }

  function openSettings(formId) {
    openBuilder(formId, { focusBrand: true })
  }

  function openPreview(formId) {
    setActiveFormId(formId)
    setActiveBrand(null)
    setView(VIEWS.PREVIEW)
  }

  function openFill(formId) {
    setActiveFormId(formId)
    setActiveBrand(null)
    setView(VIEWS.FILL)
  }

  function openResponses(formId) {
    setActiveFormId(formId)
    setActiveBrand(null)
    setView(VIEWS.RESPONSES)
  }

  function openAdminSettings() {
    setActiveFormId(null)
    setActiveBrand(null)
    setView(VIEWS.SETTINGS)
  }

  // Always mounted (never conditionally) — see the matching comment in
  // RespondentShell for why a sometimes-present BrandProvider would remount
  // the active screen and lose its state every time a brand toggles on/off.
  return (
    <BrandProvider brand={activeBrand}>
      <Chrome onHome={goToDashboard} onOpenSettings={openAdminSettings}>
        {/* Scoped per view+form so a screen that fails to render doesn't strand
            the user — navigating away clears the error and the dashboard (which
            can delete the offending form) stays reachable. */}
        <ErrorBoundary resetKey={`${view}:${activeFormId}`} onReset={goToDashboard}>
          {!seeded ? (
            <Loading />
          ) : view === VIEWS.DASHBOARD ? (
            <DashboardScreen
              onOpenBuilder={openBuilder}
              onOpenPreview={openPreview}
              onOpenFill={openFill}
              onOpenResponses={openResponses}
              onOpenSettings={openSettings}
              fillBaseUrl={fillBaseUrl}
            />
          ) : view === VIEWS.BUILDER ? (
            <BuilderScreen
              formId={activeFormId}
              onBack={goToDashboard}
              onPreview={openPreview}
              onBrandLoaded={setActiveBrand}
              detectedBrands={detectedBrands}
              focusBrand={builderFocusBrand}
              fillBaseUrl={fillBaseUrl}
            />
          ) : view === VIEWS.PREVIEW ? (
            <PreviewScreen formId={activeFormId} onBack={goToDashboard} onFill={openFill} onEdit={openBuilder} onBrandLoaded={setActiveBrand} />
          ) : view === VIEWS.FILL ? (
            <FillScreen formId={activeFormId} onBack={goToDashboard} onBrandLoaded={setActiveBrand} />
          ) : view === VIEWS.RESPONSES ? (
            <ResponsesScreen formId={activeFormId} onBack={goToDashboard} onBrandLoaded={setActiveBrand} />
          ) : view === VIEWS.SETTINGS ? (
            <AdminSettingsScreen onBack={goToDashboard} onSaved={onAppBrandSaved} detectedBrands={detectedBrands} />
          ) : null}
        </ErrorBoundary>
      </Chrome>
    </BrandProvider>
  )
}

/**
 * Mount once per project: <FormBuilderApp brand={yourBrand} seedForms={yourForms} />
 *
 * - `brand` overrides the neutral default (see context/BrandContext.jsx) as
 *   the app-level look — shown on the Dashboard and anywhere a form hasn't
 *   customized its own. A form with its own brand (see BrandEditor.jsx,
 *   reachable from the Builder) overrides this while that form is open in
 *   Builder/Preview/Fill/Responses, the same way Microsoft Forms themes one
 *   form without changing the rest of the product.
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
 * - `apiBaseUrl` — points forms/responses at a real backend (see
 *   `form-builder-kit/server`) instead of IndexedDB only. Required for a
 *   fill-mode mount hosted separately from the admin app, since the two
 *   share no browser storage — see README "Publishing across a subdomain."
 * - `adminToken` — required alongside `apiBaseUrl` in 'admin' mode to
 *   publish/unpublish forms and read collected responses. Never pass this to
 *   a 'fill' mount: it would ship the secret to every respondent's browser.
 * - `fillBaseUrl` — admin mode only: the origin respondents are sent to
 *   (e.g. `https://forms.itzipper.com`), used to build the "Copy link"
 *   shareable URL after publishing. Has no effect without `apiBaseUrl`.
 * - `detectedBrands` — admin mode only: the array `parseDetectedBrands`
 *   (from `form-builder-kit`) produces from this project's own
 *   `import.meta.glob('/src/assets/brands/**\/*', { eager: true })` call —
 *   shows up as one-click presets in the Builder's branding panel
 *   (BrandEditor.jsx). Omit to just show the manual entry fields.
 *
 * The admin app's own default brand is additionally editable at runtime
 * from the Settings screen (gear icon, admin mode) — see
 * utils/appSettings.js. Once saved, that stored override takes precedence
 * over the `brand` prop, which becomes the factory default for first load
 * (same relationship `seedForms` already has to whatever's actually stored).
 */
export default function FormBuilderApp({
  brand,
  seedForms = [],
  mode = MODES.ADMIN,
  formId = null,
  storageNamespace,
  apiBaseUrl,
  adminToken,
  fillBaseUrl,
  detectedBrands,
}) {
  // Runs during render, so storage is pointed at the right database/backend
  // before any child effect can open it.
  useMemo(() => configureStorage({ namespace: storageNamespace }), [storageNamespace])
  useMemo(() => configureBackend({ apiBaseUrl, adminToken }), [apiBaseUrl, adminToken])

  const [effectiveBrand, setEffectiveBrand] = useState(null)
  // Nothing renders until this flips true (see the blank-screen return
  // below) — so there's no window where the factory-default `brand` prop
  // is visible on its own before a stored override (if any) has actually
  // been checked. `.finally` covers both outcomes (an override was found,
  // or there truly isn't one) — either way, once this is true, `brand` +
  // `effectiveBrand` together are the real, final answer, not a guess.
  const [brandReady, setBrandReady] = useState(false)
  useEffect(() => {
    getAppBrand()
      .then((stored) => {
        if (stored) setEffectiveBrand(stored)
      })
      .finally(() => setBrandReady(true))
    // Checked once per mount — AdminSettingsScreen updates effectiveBrand
    // directly on save from then on, no need to re-poll storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const respondentMode = mode === MODES.FILL

  // Merged in plain JS, not via a second nested BrandProvider: the runtime
  // override (Settings screen, or a stored fetch) is very often partial —
  // e.g. "just change the logo" — and this merge is what makes it correctly
  // fall back to every field `brand` (the app's factory default, baked in
  // at <FormBuilderApp brand={...}>) already set, instead of falling all
  // the way back to the kit's own generic defaultBrand for whatever the
  // override didn't touch. A second BrandProvider would do the same field
  // merge, but its own layout effect writing --fb-brand-* would run *after*
  // this one's (React always runs a parent's effects after its child's) and
  // clobber it back to the factory colors on every load — one provider,
  // pre-merged, means only one effect ever touches document.documentElement.
  const appBrand = useMemo(() => mergeBrandLayers(brand, effectiveBrand), [brand, effectiveBrand])

  if (!brandReady) return null

  return (
    <ThemeProvider>
      <BrandProvider brand={appBrand}>
        {respondentMode ? (
          <RespondentShell seedForms={seedForms} formId={formId} />
        ) : (
          <AdminShell
            seedForms={seedForms}
            fillBaseUrl={fillBaseUrl}
            detectedBrands={detectedBrands}
            onAppBrandSaved={setEffectiveBrand}
          />
        )}
      </BrandProvider>
    </ThemeProvider>
  )
}
