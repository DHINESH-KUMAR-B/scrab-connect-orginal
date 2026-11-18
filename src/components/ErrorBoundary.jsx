import { Component } from 'react'

// Shows the real error on screen instead of a blank page when a page crashes.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="glass mx-auto max-w-2xl space-y-3 p-6">
        <h2 className="text-lg font-bold">Something went wrong on this page</h2>
        <p className="text-sm opacity-80">Copy the message below and send it to get a fix.</p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs">
          {String(this.state.error?.stack || this.state.error)}
        </pre>
        <button type="button" className="btn text-sm" onClick={() => window.location.assign('/')}>
          Go to home
        </button>
      </div>
    )
  }
}
