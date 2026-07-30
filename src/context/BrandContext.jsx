import { createContext, useContext } from 'react'

// Neutral placeholder brand — no logo image, an indigo accent, no custom
// background image. Every field here can be overridden by a consuming
// project's own brand config passed to <FormBuilderApp brand={...} />.
export const defaultBrand = {
  appName: 'Form Builder',
  logoLight: null,
  logoDark: null,
  backgroundLight: null,
  backgroundDark: null,
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

export function BrandProvider({ brand = {}, children }) {
  const merged = {
    ...defaultBrand,
    ...brand,
    colors: { ...defaultBrand.colors, ...(brand.colors ?? {}) },
  }

  const cssVars = Object.fromEntries(Object.entries(merged.colors).map(([shade, value]) => [`--fb-brand-${shade}`, value]))

  return (
    <BrandContext.Provider value={merged}>
      <div style={{ display: 'contents', ...cssVars }}>{children}</div>
    </BrandContext.Provider>
  )
}

export function useBrand() {
  return useContext(BrandContext)
}
