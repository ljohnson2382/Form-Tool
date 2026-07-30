# form-builder

A Microsoft Forms–style form/survey builder, built to be embedded in any
project rather than tied to one brand. This repo is a monorepo:

```
packages/form-builder-kit/   the reusable engine (npm package)
apps/demo/                   this repo's own running app — a "staging" brand
                              consuming the kit, for local dev and preview
```

## Run the demo locally

```bash
npm install
npm run dev
```

This builds the kit and starts the demo app at `http://localhost:5173`,
themed with a neutral placeholder "Staging Forms" brand (violet accent, no
logo image, gradient background) and pre-seeded with an example form (the
ITZipper UAT survey, `apps/demo/src/seeds/itzipperUatSurvey.js`).

## Using `form-builder-kit` in another project

Install directly from this repo (private, so the consuming machine needs
access):

```bash
npm install github:ljohnson2382/form-builder#path:packages/form-builder-kit
```

npm clones the repo, installs the kit's own devDependencies, and runs its
`prepare` script (`vite build`) automatically — no need to publish to a
registry or commit `dist/`.

Then mount it:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'form-builder-kit/style.css'
import { FormBuilderApp } from 'form-builder-kit'
import { myBrand } from './brand'
import { myStarterForms } from './seeds'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FormBuilderApp brand={myBrand} seedForms={myStarterForms} />
  </StrictMode>,
)
```

`seedForms` are only ever written to a genuinely empty form store (first
load) — they never overwrite forms a user has since created, edited, or
deleted.

### Brand config

Every field is optional; omit anything to fall back to the neutral default
(indigo accent, monogram logo, gradient background — see
`packages/form-builder-kit/src/context/BrandContext.jsx`).

```js
export const myBrand = {
  appName: 'My Project',
  logoLight: '/logo.svg',       // optional — falls back to a monogram + appName
  logoDark: '/logo-dark.svg',   // optional — falls back to logoLight
  backgroundLight: '/bg.png',   // optional — falls back to a brand-tinted gradient
  backgroundDark: '/bg-dark.png',
  colors: {                     // optional — a 50–900 accent scale, any subset
    500: '#0ea5e9',
    400: '#38bdf8',
    // ...
  },
}
```

See `apps/demo/src/brands/itzipper.js` for a filled-out example (ITZipper's
actual brand, not wired up by default — just a reference for what a real
project's config looks like).

### Avoiding a flash of the wrong theme

Dark/light mode follows the OS preference until the user toggles it, and
that choice is read synchronously before first paint. Paste this into your
own `index.html` `<head>` (the kit can't inject into a file that lives in
your project):

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('form-builder-theme');
      var theme = stored === 'light' || stored === 'dark'
        ? stored
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  })();
</script>
```

(`form-builder-theme` is also exported as `THEME_STORAGE_KEY` from the kit,
if you'd rather not hardcode the string.)

## What's swappable later

- **Responses**: `submitResponse`/`listResponses`/`exportResponsesToFile`
  (in `utils/responseStore.js`) are the only surface the UI talks to.
  Responses are saved to IndexedDB today; swapping in a real backend later
  means changing this module's internals, not the UI.
- **Forms**: saved to IndexedDB via `formStore.js`, each form its own
  record. Save/open to disk (including a synced cloud folder) uses the File
  System Access API with a download/upload fallback for browsers that don't
  support it (Safari, Firefox).
