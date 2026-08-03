# form-builder

A Microsoft Forms–style form/survey builder, built to be embedded in any
project rather than tied to one brand. The repo root **is** the installable
package (`form-builder-kit`); `demo/` is this repo's own running app — a
"staging" brand consuming the kit as a local dependency, for dev and preview.

```
src/            the reusable engine — this is what gets published/installed
demo/           this repo's own app: a plain Vite project that depends on
                the kit via "file:.." (not an npm workspace member)
```

(Earlier this was an npm-workspaces monorepo with the kit nested under
`packages/form-builder-kit`. That structure looked reasonable but silently
broke external installs: npm's git-dependency fetcher has no concept of
"install just this one workspace member" — it clones the whole repo and
resolves whatever `package.json` sits at the git root, ignoring any `#path:`
fragment. Collapsing so the repo root **is** the package is what actually
makes `npm install github:...` work, not a workaround for something else.)

## Run the demo locally

```bash
npm install                # builds the kit via its own `prepare` script
npm --prefix demo install  # links the kit in via "file:.." and runs demo
npm --prefix demo run dev
```

Starts the demo app at `http://localhost:5173`, themed with a neutral
placeholder "Staging Forms" brand (violet accent, no logo image, gradient
background) and pre-seeded with an example form (the ITZipper UAT survey,
`demo/src/seeds/itzipperUatSurvey.js`). Re-run `npm install` at the repo
root after changing anything in `src/` — `demo`'s dev server reads the
built `dist/`, not the source directly.

## Using `form-builder-kit` in another project

Install directly from this repo (private, so the consuming machine needs
access):

```bash
npm install github:ljohnson2382/form-builder#claude/forms-like-app-7b6ph8
```

npm clones the repo, installs the kit's own devDependencies, and runs its
`prepare` script (`vite build`) automatically — no need to publish to a
registry or commit `dist/`. (Swap the branch name for whatever's current —
check with `git ls-remote` if unsure.)

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

### Authoring vs. responding

`FormBuilderApp` has two surfaces, and which one you mount matters:

```jsx
// You: full authoring — dashboard, builder, response export.
<FormBuilderApp brand={myBrand} seedForms={myForms} />

// A test participant: that one form, submit only. No dashboard, no editing,
// no way to read anyone else's answers.
<FormBuilderApp brand={myBrand} mode="fill" formId={someFormId} />
```

Mount `mode="fill"` for anything you hand to a respondent. While responses
live in the respondent's own browser this is mostly about intent and
ergonomics — but the moment you swap `responseStore` for a real backend, the
distinction becomes an actual authorization boundary, and **the server has to
enforce it too**. Client-side code can't be what decides who may read other
people's answers. The demo shows both surfaces: `/` for authoring,
`/?mode=fill&formId=<id>` for responding.

### Keeping instances apart

IndexedDB is scoped to the origin, so two mounts on the same origin (say
`/uat` and `/feedback`) would share one set of forms *and one set of collected
responses*. Pass `storageNamespace` to separate them:

```jsx
<FormBuilderApp brand={myBrand} storageNamespace="uat" />
```

### Imported files are validated

Form JSON is arbitrary file content, so it's validated at the import gate
rather than trusted: a file that isn't a form export is rejected with a
specific reason, and anything that is gets normalized to the documented
shape before it's stored. Rating scales are clamped to `MAX_SCALE_POINTS`
so a malformed range can't ask the browser to render a billion buttons.
Screens are additionally wrapped in an error boundary, so one bad record
degrades to an inline error with a way back rather than a blank page.

### Brand config

Every field is optional; omit anything to fall back to the neutral default
(indigo accent, monogram logo, gradient background — see
`src/context/BrandContext.jsx`).

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

See `demo/src/brands/itzipper.js` for a filled-out example (ITZipper's
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

## Importing a form from a markdown doc

The Dashboard's "Import from Markdown" button (`parseMarkdownToForm` in
`utils/markdownImport.js`) turns a markdown survey doc into a form:
`#`/`##` headings become the title/sections, list items become questions,
and simple text patterns infer the answer type — a `[ Pass / Fail ]`
prefix, a `(1-5)`/`(0-10)` range, a `(Yes/No)` marker, or a `(A / B / C)`
option list. There's no standard grammar for "survey written as markdown",
so this is heuristic, not a guaranteed 1:1 conversion — importing always
lands you in the Builder so you can fix any misclassified questions before
using the form.

## What's swappable later

- **Responses**: `submitResponse`/`listResponses`/`exportResponsesToFile`
  (in `utils/responseStore.js`) are the only surface the UI talks to.
  Responses are saved to IndexedDB today; swapping in a real backend later
  means changing this module's internals, not the UI.
- **Forms**: saved to IndexedDB via `formStore.js`, each form its own
  record. Save/open to disk (including a synced cloud folder) uses the File
  System Access API with a download/upload fallback for browsers that don't
  support it (Safari, Firefox).

## Publishing across a subdomain (real backend)

The admin app and a fill-mode mount can be deployed to two different
origins — e.g. the builder at `staging.itzipper.com`, respondents sent to
`forms.itzipper.com` — but two origins share no IndexedDB. For that to work,
both need to point at the same backend instead of the browser's local
storage:

```jsx
<FormBuilderApp
  brand={myBrand}
  apiBaseUrl="https://staging.itzipper.com/api"
  adminToken={import.meta.env.VITE_ADMIN_TOKEN} // admin mount only — never on a fill mount
  fillBaseUrl="https://forms.itzipper.com"        // used to build the "Copy link" URL
/>
```

`apiBaseUrl` switches `formStore`/`responseStore` from IndexedDB to HTTP
calls against that contract (`GET/POST/DELETE /forms`, `GET/POST
/responses`). With no `apiBaseUrl`, nothing here applies — both apps keep
working exactly as they do today, local-only.

### Publish lifecycle

Once a backend is configured, each form on the Dashboard shows its status —
**Draft** (never published), **Published** (the live copy matches your
latest save), or **Unpublished changes** (you've edited since the live copy
went out) — and the actions to go with it: **Publish**/**Republish**, **Copy
link**, **Unpublish** (takes the fill link down; collected responses are
kept), and **Responses** (lists every submission, reusing the same
read-only question rendering as Preview).

### Reference server (`form-builder-kit/server`)

A ready-to-use implementation of that HTTP contract, built on
[Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — storage for
this is deliberately just JSON files (`forms/<id>.json`,
`responses/<formId>.json`), swappable later by changing
`src/server/blobStore.js` alone. Wire it into any Vercel project's `api/`
folder in a few lines (see `demo/api/forms.js` / `demo/api/responses.js`
for the working example this repo deploys):

```js
// api/forms.js
import { createFormsHandler } from 'form-builder-kit/server'

export default createFormsHandler({
  adminToken: process.env.ADMIN_API_TOKEN,
  allowedOrigin: process.env.FILL_APP_ORIGIN,
})
```

```js
// api/responses.js
import { createResponsesHandler } from 'form-builder-kit/server'

export default createResponsesHandler({
  adminToken: process.env.ADMIN_API_TOKEN,
  allowedOrigin: process.env.FILL_APP_ORIGIN,
})
```

**Security note**: publishing a form and reading its responses are gated by
one shared-secret header (`x-admin-token`, checked against
`ADMIN_API_TOKEN`) rather than a real login system — the admin app's own
browser bundle carries this secret (as `VITE_ADMIN_TOKEN`), so it's visible
to anyone who opens devtools on that app. That's a real limitation, fine for
an internal UAT tool, not sufficient once this holds anything sensitive.
Submitting a response has no auth at all, since an anonymous respondent has
no prior relationship with the backend to authenticate.

### `fill/` — the respondent-only deploy

`fill/` (sibling to `demo/`) is a minimal app with one job: mount
`FormBuilderApp` in `fill` mode and nothing else. It has no admin token
anywhere in its build — that's the whole point of it being a separate
deploy from the admin app.

### Deployment runbook (Vercel + Azure DNS)

For a project on Vercel with DNS on Azure DNS Zone (not Vercel-managed), so
attaching a subdomain is a manual DNS record rather than a dashboard click:

1. Push the repo to GitHub. In Vercel, create **project #1** from it with
   root directory `demo/` — this is the admin app.
2. Vercel dashboard → **Storage** → create a Blob store, then add to
   project #1's env vars: the generated `BLOB_READ_WRITE_TOKEN`, a
   generated `ADMIN_API_TOKEN` (any long random string), the same value
   again as `VITE_ADMIN_TOKEN`, and `FILL_APP_ORIGIN=https://forms.itzipper.com`.
3. Create **project #2** from the same repo with root directory `fill/` —
   the respondent app. Env var: `VITE_API_BASE_URL=https://staging.itzipper.com/api`.
4. In each Vercel project, add its custom domain (`staging.itzipper.com` for
   project #1, `forms.itzipper.com` for project #2) — Vercel shows the CNAME
   target to point at.
5. In Azure DNS Zone for `itzipper.com`, add two CNAME records (`staging`,
   `forms`) pointing at those Vercel-provided targets. Vercel auto-verifies
   once DNS propagates and issues TLS certificates for both.

Locally, `vercel dev` (Vercel CLI) runs the `api/` functions so
`VITE_API_BASE_URL=http://localhost:3000/api` works against `demo`/`fill`
running on their own Vite dev ports, without deploying anything.
