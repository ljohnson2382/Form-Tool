// The app-level default — deliberately generic (standard blue, no logo, no
// background image) so it never looks like it belongs to any one client.
// No backgroundLight/backgroundDark means PageBackground.jsx's fallback
// applies: near-white in light mode, near-black in dark mode. Individual
// forms carry their own look instead (see brands/itzipper.js, applied to
// seeds/itzipperUatSurvey.js's `brand` field — or the Builder's "Customize
// branding for this form" toggle for anything created in the app).
export const stagingBrand = {
  appName: 'Form Designer',
  colors: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
}
