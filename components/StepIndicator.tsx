
import React from 'react';
import { Terminal, ShieldCheck, Code2, Rocket } from 'lucide-react';
import { useMigration } from '../context/MigrationContext';

const StepIndicator: React.FC = () => {
    const { state } = useMigration();
    const currentStepIndex = ['INPUT', 'ANALYSIS', 'TRANSFORMATION', 'DEPLOYMENT'].indexOf(state.step);

    return (
        <div className="relative flex justify-between items-center max-w-3xl mx-auto px-12 mb-10">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800/50 -z-10 -translate-y-1/2" />
            {[
                { Icon: Terminal, label: 'Ingest' },
                { Icon: ShieldCheck, label: 'Analyze' },
                { Icon: Code2, label: 'Synthesize' },
                { Icon: Rocket, label: 'Deploy' }
            ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 ${i <= currentStepIndex
                            ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_25px_rgba(79,70,229,0.3)] scale-110'
                            : 'bg-slate-900 border-slate-700 opacity-50'
                        }`}>
                        <item.Icon size={22} className={i <= currentStepIndex ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${i <= currentStepIndex ? 'text-indigo-400' : 'text-slate-600'}`}>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default StepIndicator;
