import { createContext, useContext, useLayoutEffect, useMemo } from 'react'

// Neutral placeholder brand — no logo image, an indigo accent, no custom
// background image. Every field here can be overridden by a consuming
// project's own brand config passed to <FormBuilderApp brand={...} />.
export const defaultBrand = {
  appName: 'Form Builder',
  logoLight: null,
  logoDark: null,
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

// Merges against whatever BrandProvider is already active above it (falling
// all the way back to `defaultBrand` at the outermost one, since useContext
// resolves to createContext's default with no ancestor provider) rather than
// always resetting to the kit's neutral default. That's what makes nesting a
// second BrandProvider around one form's screens (see FormBuilderApp.jsx)
// behave as "this form overrides what it customizes, inherits the rest"
// instead of discarding the app-level brand entirely.
export function BrandProvider({ brand, children }) {
  const inherited = useContext(BrandContext)

  const merged = useMemo(() => {
    if (!brand) return inherited
    return {
      ...inherited,
      ...pickSetFields(brand),
      colors: { ...inherited.colors, ...(brand.colors ?? {}) },
    }
  }, [inherited, brand])

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

  return <BrandContext.Provider value={merged}>{children}</BrandContext.Provider>
}

export function useBrand() {
  return useContext(BrandContext)
}
