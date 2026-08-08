import { Component, type ErrorInfo, type ReactNode } from "react";
import { ENV } from "../../config/config";
import { Button } from "../../utils/Button/Button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (ENV.NODE_ENV !== "production") {
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
          <Button onClick={this.handleReset}>
            נסה שוב
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
