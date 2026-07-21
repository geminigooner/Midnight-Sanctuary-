import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleClearData = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear data', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0d0d0d] text-[#e6e8e6] p-6 text-center">
          <div className="max-w-md w-full bg-[#111111] border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="text-xl font-medium text-[#f4e8d3]">Application Error</h2>
            <p className="text-[#a5a5a5] text-sm mb-2">
              The application encountered an unexpected error. If this happens continuously, it might be caused by a corrupted conversation state.
            </p>
            <div className="bg-black/50 p-3 rounded-lg w-full text-left overflow-auto max-h-32 mb-2 text-xs font-mono text-red-400/80">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors text-[#f4e8d3]"
              >
                Reload App
              </button>
              <button
                onClick={this.handleClearData}
                className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                Clear Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
