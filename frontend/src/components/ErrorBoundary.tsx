import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[]; // When these change, the boundary resets
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
  };

  // Reset the boundary when resetKeys change (e.g., route changes)
  public static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (state.hasError && props.resetKeys) {
      return { hasError: false, error: null, errorInfo: null };
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Lucky Boba UI Error:', error, errorInfo);
    
    // Call optional onError prop (useful for error reporting services)
    this.props.onError?.(error, errorInfo);

    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // If component errored too many times, show a harder reset option
      if (this.state.errorCount >= 3) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6ff] p-6">
            <div className="bg-white rounded-[2rem] shadow-xl border border-red-100 p-10 max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#be2525" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-[#3b2063] font-black uppercase text-lg tracking-tight">Persistent Error Detected</h2>
              <p className="text-zinc-500 text-sm">This component has failed multiple times. A full page reload is recommended.</p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <summary className="text-xs font-black text-zinc-400 uppercase cursor-pointer">Error Details (Dev)</summary>
                  <pre className="text-[10px] text-red-500 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-[#3b2063] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      }

      // Default: use ErrorFallback with retry capability
      return (
        <ErrorFallback
          onRetry={this.handleReset}
          errorMessage={
            import.meta.env.DEV && this.state.error
              ? this.state.error.message
              : undefined
          }
        />
      );
    }

    return this.props.children;
  }
}
