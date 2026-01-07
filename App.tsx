
import React from 'react';
import { Cpu, Sparkles, AlertTriangle, X } from 'lucide-react';
import { MigrationProvider, useMigration } from './context/MigrationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppLayout from './components/AppLayout';
import StepIndicator from './components/StepIndicator';
import InputSection from './components/InputSection';

// Declare global types that might be missing in strict mode if they were in the old App.tsx
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}

const MigrationApp: React.FC = () => {
  const { state, setState, statusText } = useMigration();

  // Render loading state globally if processing
  if (state.isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-10 min-h-screen">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin shadow-2xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-indigo-600/10 rounded-xl">
            <Cpu className="text-indigo-400 animate-pulse" size={40} />
          </div>
        </div>
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <Sparkles size={24} className="text-indigo-400" /> Agent Processing
          </h3>
          <p className="text-slate-400 text-sm animate-pulse font-mono bg-slate-900/50 p-3 rounded-lg border border-slate-800">{statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <StepIndicator />
      <div className="mt-8 min-h-[500px]">
        {state.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col gap-4 text-red-400 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 font-bold text-lg"><AlertTriangle className="text-red-500" size={24} /> Neural Exception</div>
            <p className="text-sm leading-relaxed">{state.error}</p>
            <button onClick={() => setState(prev => ({ ...prev, error: undefined }))} className="text-xs font-bold uppercase text-red-400/70 hover:text-red-400 flex items-center gap-1 w-fit">
              <X size={14} /> Clear Alert
            </button>
          </div>
        )}
        <InputSection />
      </div>
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <MigrationProvider>
        <MigrationApp />
      </MigrationProvider>
    </ErrorBoundary>
  );
};

export default App;