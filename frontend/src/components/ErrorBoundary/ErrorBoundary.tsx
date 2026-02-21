import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorBoundaryState, ErrorBoundaryProps } from "./ErrorBoundary.types";

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Production: replace with proper error reporting (e.g. Sentry)
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary">
          <h2>משהו השתבש</h2>
          <p>אירעה שגיאה בלתי צפויה. אנא נסה שוב.</p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            נסה שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
