const VARIANTS = {
  // 600 rather than 500: white text on an arbitrary brand's 500 shade often
  // falls short of WCAG AA's 4.5:1 text-contrast minimum (e.g. Tailwind's
  // own blue-500 on white is ~3.7:1) — 600 is dark enough across most hues
  // in the deriveColorScale ramp (colorScale.js) to stay legible.
  primary: 'bg-brand-600 text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
  // brand-secondary (styles.css) falls back to the auto-derived 700 shade
  // unless a brand sets its own "Secondary button color" in BrandEditor —
  // some accent hues don't produce a legible auto-derived shade, so this
  // gives an explicit override instead of only an algorithmic guess.
  secondary:
    'border border-brand-secondary/30 bg-white text-brand-secondary hover:bg-brand-secondary/10 dark:border-brand-900/40 dark:bg-slate-800/40 dark:text-brand-300 dark:hover:bg-slate-800/60',
  // Destructive actions (Delete, Unpublish) keep a fixed, brand-independent
  // red — a deliberate exception, not an oversight: "this is destructive"
  // should read the same regardless of a form's chosen color.
  danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-800/40 dark:text-red-400 dark:hover:bg-red-950/40',
  ghost: 'text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'w-full px-4 py-3 text-sm',
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-lg font-semibold transition ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
