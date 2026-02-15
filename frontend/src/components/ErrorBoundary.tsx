import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Made optional to use our default
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // This is helpful for your OJT documentation/debugging
    console.error("Uncaught Lucky Boba UI Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Return custom fallback if provided, otherwise our consistent UI
      return this.props.fallback || <ErrorFallback />;
    }

    return this.props.children;
  }
}