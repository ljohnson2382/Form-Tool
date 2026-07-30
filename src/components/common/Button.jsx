const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/60',
  danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-800/40 dark:text-red-400 dark:hover:bg-red-950/40',
  ghost: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
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
