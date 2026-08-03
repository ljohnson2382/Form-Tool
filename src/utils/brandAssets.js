import { normalizeBrand } from '../data/formSchema.js'

const BRANDS_PATH_SEGMENT = '/brands/'

function folderSlug(path) {
  const idx = path.indexOf(BRANDS_PATH_SEGMENT)
  if (idx === -1) return null
  const rest = path.slice(idx + BRANDS_PATH_SEGMENT.length)
  return rest.split('/')[0] || null
}

// Heuristic, not a fixed filename — "logo" / "background" (or "bg") plus
// "dark" anywhere in the name, in any order, any extension. Matches how the
// existing itzipper folder was actually named (background.light.png,
// itzipper-logo-dark.svg) without requiring anyone to rename files to fit a
// rigid scheme.
function classify(filename) {
  const lower = filename.toLowerCase()
  const isDark = lower.includes('dark')
  if (lower.includes('logo')) return isDark ? 'logoDark' : 'logoLight'
  if (lower.includes('background') || lower.includes('-bg') || lower.includes('_bg')) {
    return isDark ? 'backgroundDark' : 'backgroundLight'
  }
  return null
}

/**
 * Turns the object a consuming project's own
 * `import.meta.glob('/src/assets/brands/**\/*', { eager: true })` call
 * produces into selectable brand presets for BrandEditor.jsx. Grouped by the
 * folder name under `brands/`; an optional `brand.json` per folder supplies
 * `appName`/`colors`, merged with any detected image files and run through
 * `normalizeBrand` — the same sanitization every other brand source uses, so
 * a preset is exactly as safe to apply as a hand-typed one.
 *
 * No Vite-specific code here — the glob call itself has to live in the
 * consuming project (it resolves relative to their own source tree), this
 * just parses whatever eager-glob result it's handed.
 */
export function parseDetectedBrands(globModules) {
  const byFolder = new Map()

  for (const [path, mod] of Object.entries(globModules ?? {})) {
    const slug = folderSlug(path)
    if (!slug) continue
    if (!byFolder.has(slug)) byFolder.set(slug, { images: {}, config: null })
    const entry = byFolder.get(slug)

    const filename = path.slice(path.lastIndexOf('/') + 1)
    if (filename.toLowerCase() === 'brand.json') {
      entry.config = mod?.default ?? null
      continue
    }
    const field = classify(filename)
    if (field) entry.images[field] = mod?.default ?? null
  }

  return Array.from(byFolder.entries())
    .map(([slug, { images, config }]) => {
      const brand = normalizeBrand({
        ...(config ?? {}),
        logoLight: images.logoLight,
        logoDark: images.logoDark,
        backgroundLight: images.backgroundLight,
        backgroundDark: images.backgroundDark,
      })
      return brand ? { slug, brand } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.slug.localeCompare(b.slug))
}
