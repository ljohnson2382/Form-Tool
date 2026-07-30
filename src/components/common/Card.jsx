export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/40 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
