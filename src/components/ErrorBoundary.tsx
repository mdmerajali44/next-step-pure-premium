import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-100">একটি সমস্যা দেখা দিয়েছে</h1>
            <p className="text-sm text-slate-400">
              অ্যাপ্লিকেশনে একটি অপ্রত্যাশিত সমস্যা হয়েছে। দয়া করে পেজটি রিলোড দিন।
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono bg-slate-950 p-3 rounded-xl text-red-300 text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition shadow-lg cursor-pointer"
            >
              পেজ রিলোড দিন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
