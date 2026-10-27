import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-blue-50 p-6 flex flex-col justify-center items-center font-sans antialiased">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-card border border-blue-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-status-error-bg text-status-error flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="font-heading font-extrabold text-xl text-navy-900">
              Application Error
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed">
              An unexpected error occurred during rendering.
            </p>

            {this.state.error && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-xl text-left text-xs font-mono text-status-error overflow-x-auto max-h-48">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] mt-2 whitespace-pre-wrap text-status-error/80">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-blue-600 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-white border border-blue-200 text-navy-900 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Clear Local Cache & Reset</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
