import React from 'react';
import Button from './Button';
import Card from './Card';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="p-4">
        <Card className="border-rose-500/25 bg-rose-500/10">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-200">Something went wrong</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            This page hit an unexpected error.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Try reloading this section. If the problem continues, check the latest API
            response or verify your access settings.
          </p>
          {this.state.error?.message ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-[#09101c] px-4 py-3 text-sm text-white/65">
              {this.state.error.message}
            </p>
          ) : null}
          <div className="mt-5">
            <Button variant="secondary" onClick={this.handleRetry}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
