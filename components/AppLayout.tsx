
import React from 'react';
import { Database, RefreshCw, Key } from 'lucide-react';
import { useMigration } from '../context/MigrationContext';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { resetMigration, apiKey, setApiKey } = useMigration();

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden text-slate-200 selection:bg-indigo-500/30 font-sans">
            <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={resetMigration}>
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                            <Database className="text-white" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-white">CloudModern<span className="text-indigo-400">.AI</span></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Autonomous Core</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key size={14} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Google API Key (Optional)"
                                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
                            />
                        </div>
                        <button onClick={resetMigration} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors">
                            <RefreshCw size={14} /> System Restart
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full space-y-12">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;
