
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children?: ReactNode;
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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-red-500/30 rounded-3xl p-10 max-w-md w-full shadow-2xl text-center space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-500" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Critical System Failure</h2>
                        <p className="text-slate-400">The application encountered an unexpected error in the neural rendering pipeline.</p>
                        <div className="bg-slate-950 p-4 rounded-xl text-left overflow-auto max-h-40 border border-slate-700">
                            <code className="text-red-400 text-xs font-mono">{this.state.error?.toString()}</code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25"
                        >
                            <RefreshCw size={18} /> Reboot System
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
