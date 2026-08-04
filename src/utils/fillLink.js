// Shared by DashboardScreen.jsx and BuilderScreen.jsx — was a private
// function duplicated nowhere else, extracted here so both screens' "here's
// your link" affordances build the exact same URL.
export function fillUrlFor(form, fillBaseUrl) {
  if (fillBaseUrl) return `${fillBaseUrl.replace(/\/$/, '')}?formId=${form.id}`
  // No separate fill deployment configured — fall back to this same app's
  // own query-param fill surface (see demo/src/main.jsx).
  return `${window.location.origin}${window.location.pathname}?mode=fill&formId=${form.id}`
}
