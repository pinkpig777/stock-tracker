import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 p-4 text-red-900">
          <h1 className="mb-4 text-2xl font-bold">Something went wrong.</h1>
          <p className="mb-2 font-mono text-sm bg-red-100 p-2 rounded">{this.state.error && this.state.error.toString()}</p>
          <details className="whitespace-pre-wrap text-xs text-red-800">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            className="mt-6 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            onClick={() => window.location.href = '/'}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
