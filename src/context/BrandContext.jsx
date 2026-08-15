import { createContext, useContext, useLayoutEffect, useMemo } from 'react'

// Neutral placeholder brand — no logo image, an indigo accent, no custom
// background image. Every field here can be overridden by a consuming
// project's own brand config passed to <FormBuilderApp brand={...} />.
export const defaultBrand = {
  appName: 'Form Builder',
  logoLight: null,
  logoDark: null,
  favicon: null,
  backgroundLight: null,
  backgroundDark: null,
  backgroundColorLight: null,
  backgroundColorDark: null,
  colors: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
}

const BrandContext = createContext(defaultBrand)

// An empty string counts as "not set" here, same as normalizeBrand.js treats
// it at the storage boundary — otherwise a field mid-edit in BrandEditor.jsx
// (cleared but not yet re-typed, or the panel just toggled on) would blank
// out the inherited value instead of falling through to it, before the user
// has actually typed a replacement.
function pickSetFields(brand) {
  const result = {}
  for (const [key, value] of Object.entries(brand)) {
    if (key === 'colors') continue
    if (typeof value === 'string' && value.trim() === '') continue
    if (value === null || value === undefined) continue
    result[key] = value
  }
  return result
}

// Exported so a component that needs to combine two brand *sources* itself
// (e.g. FormBuilderApp.jsx merging its factory-default `brand` prop with a
// fetched runtime override into one value) can do it in plain JS instead of
// nesting two BrandProviders — nesting works fine when the layers genuinely
// mount at different times (a per-form override appearing only once that
// screen opens), but two providers that both need to be correct on the very
// same first paint would each try to write --fb-brand-* on document.
// documentElement in their own layout effect, and React always runs a
// parent's effects after its child's — so the outer (less specific) one
// would clobber the inner (more specific) one's colors, every time. One
// provider means one effect, so there's nothing to clobber.
export function mergeBrandLayers(inherited, brand) {
  if (!brand) return inherited
  return {
    ...inherited,
    ...pickSetFields(brand),
    colors: { ...inherited.colors, ...(brand.colors ?? {}) },
  }
}

// Merges against whatever BrandProvider is already active above it (falling
// all the way back to `defaultBrand` at the outermost one, since useContext
// resolves to createContext's default with no ancestor provider) rather than
// always resetting to the kit's neutral default. That's what makes nesting a
// second BrandProvider around one form's screens (see FormBuilderApp.jsx)
// behave as "this form overrides what it customizes, inherits the rest"
// instead of discarding the app-level brand entirely.
export function BrandProvider({ brand, children }) {
  const inherited = useContext(BrandContext)

  const merged = useMemo(() => mergeBrandLayers(inherited, brand), [inherited, brand])

  // Tailwind's `bg-brand-500` etc. compile to `background-color:
  // var(--color-brand-500)`, and `--color-brand-500: var(--fb-brand-500,
  // #6366f1)` is declared exactly once, at `:root` (styles.css `@theme`
  // block) — that's inherent to how Tailwind v4's @theme works, not
  // something scoped per component tree. A custom property's var()
  // references resolve at the element where the property is *declared*,
  // not where it's *used* — so setting --fb-brand-* only on a wrapper div
  // nested somewhere below :root would never reach that resolution and
  // Tailwind utility classes would stay frozen at the fallback color,
  // even though a direct `var(--fb-brand-500)` read (like PageBackground.jsx
  // uses) would correctly see the override. Setting the properties directly
  // on document.documentElement — the actual :root — is what makes them
  // real for both paths. On cleanup, restore whatever was ambient before
  // (the parent BrandProvider's colors, or nothing for the outermost one),
  // so a per-form override doesn't leak once its screen is left.
  //
  // useLayoutEffect, not useEffect: it runs synchronously before the browser
  // paints, so the brand's colors are already on :root for the very first
  // frame instead of one frame after — otherwise that first frame paints
  // with styles.css's fallback indigo (the generic look) and then snaps to
  // the real brand color once the effect fires.
  useLayoutEffect(() => {
    const root = document.documentElement
    for (const [shade, value] of Object.entries(merged.colors)) {
      root.style.setProperty(`--fb-brand-${shade}`, value)
    }
    return () => {
      for (const [shade, value] of Object.entries(inherited.colors)) {
        root.style.setProperty(`--fb-brand-${shade}`, value)
      }
    }
  }, [merged, inherited])

  // Swaps the actual browser-tab favicon (index.html only ever declares a
  // static placeholder per app — see demo/index.html, fill/index.html) to
  // whatever this brand sets. Only acts when a favicon is
  // actually set anywhere in the chain — `merged.favicon` already carries
  // the inherited value if this level doesn't override it (pickSetFields),
  // so the common case (no favicon configured at any level) never touches
  // the DOM and the static placeholder stands untouched. On cleanup, restore
  // whatever href was there before this override — same nesting behavior as
  // the colors effect above, so leaving a form with its own favicon back to
  // the Dashboard correctly reverts to the app-level (or static) one.
  useLayoutEffect(() => {
    if (!merged.favicon) return
    let link = document.querySelector('link[rel="icon"]')
    const created = !link
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    const previousHref = link.getAttribute('href')
    const previousType = link.getAttribute('type')
    link.setAttribute('href', merged.favicon)
    link.setAttribute('type', 'image/svg+xml')
    return () => {
      if (created) {
        link.remove()
      } else {
        if (previousHref !== null) link.setAttribute('href', previousHref)
        if (previousType !== null) link.setAttribute('type', previousType)
      }
    }
  }, [merged.favicon])

  return <BrandContext.Provider value={merged}>{children}</BrandContext.Provider>
}

export function useBrand() {
  return useContext(BrandContext)
}
