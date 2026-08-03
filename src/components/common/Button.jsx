const VARIANTS = {
  // 600 rather than 500: white text on an arbitrary brand's 500 shade often
  // falls short of WCAG AA's 4.5:1 text-contrast minimum (e.g. Tailwind's
  // own blue-500 on white is ~3.7:1) — 600 is dark enough across most hues
  // in the deriveColorScale ramp (colorScale.js) to stay legible.
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-500 hover:shadow-md active:shadow-sm active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50',
  // Fixed black/white rather than brand-derived — a brand's accent color
  // doesn't always produce a legible outline-button shade, so this is a
  // deliberately neutral, always-readable default instead of an
  // algorithmic guess.
  secondary:
    'border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:shadow-md active:shadow-sm active:translate-y-px dark:border-slate-600 dark:bg-slate-800/60 dark:text-white dark:hover:bg-slate-800/80',
  // Destructive actions (Delete, Unpublish) keep a fixed, brand-independent
  // red — a deliberate exception, not an oversight: "this is destructive"
  // should read the same regardless of a form's chosen color.
  danger:
    'border border-red-300 bg-white text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md active:shadow-sm active:translate-y-px dark:border-red-900/50 dark:bg-slate-800/40 dark:text-red-400 dark:hover:bg-red-950/40',
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
