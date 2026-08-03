import { Component } from 'react'

// A render-time throw in React unmounts the whole tree, so without a boundary
// one bad record blanks the entire page. That's especially bad here because
// forms are persisted before they're rendered — a crash would repeat on every
// reload, leaving no UI to remove the record that caused it. This keeps the
// failure contained to the current screen and offers a way back.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prevProps) {
    // Navigating elsewhere should clear a stale error rather than trapping the
    // user on the failure screen.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <h2 className="mb-1 text-lg font-semibold text-red-800 dark:text-red-300">This screen couldn’t be displayed</h2>
        <p className="mb-3 text-sm text-red-700 dark:text-red-400">
          Something in this form’s stored data couldn’t be rendered. Your other forms are unaffected.
        </p>
        <pre className="mb-4 overflow-x-auto rounded-lg bg-white/70 p-3 text-xs text-red-900 dark:bg-slate-900/60 dark:text-red-300">
          {String(error?.message ?? error)}
        </pre>
        {this.props.onReset && (
          <button
            type="button"
            onClick={this.props.onReset}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Back to safety
          </button>
        )}
      </div>
    )
  }
}
