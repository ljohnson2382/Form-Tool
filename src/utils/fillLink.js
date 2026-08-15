// Shared by DashboardScreen.jsx and BuilderScreen.jsx — was a private
// function duplicated nowhere else, extracted here so both screens' "here's
// your link" affordances build the exact same URL.
export function fillUrlFor(form, fillBaseUrl) {
  if (fillBaseUrl) return `${fillBaseUrl.replace(/\/$/, '')}?formId=${form.id}`
  // No separate fill deployment configured — fall back to this same app's
  // own query-param fill surface. Always root "/", never
  // window.location.pathname: this runs *inside* the admin app (Dashboard/
  // Builder generating a "copy link"), and a project that gates its admin
  // app behind its own path (e.g. /admin, restricted by auth) must not have
  // that path leak into a link handed to a respondent — the fill surface is
  // a fundamentally different, unauthenticated audience.
  return `${window.location.origin}/?mode=fill&formId=${form.id}`
}
