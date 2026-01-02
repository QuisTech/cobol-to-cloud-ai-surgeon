
import React from 'react';
import { AnalysisResult } from '../types';
import { AlertCircle, ShieldAlert, Info, Activity, GitBranch } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisDisplayProps {
  analysis: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const data = [
    { name: 'Complexity', value: analysis.complexityScore },
    { name: 'Bugs', value: analysis.bugs.length },
    { name: 'Dependencies', value: analysis.dependencies.length },
  ];

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical': return <ShieldAlert size={16} />;
      case 'warning': return <AlertCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Activity className="text-indigo-400" size={20} /> Code Intelligence Metrics
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : index === 1 ? '#f87171' : '#2dd4bf'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <GitBranch className="text-emerald-400" size={20} /> Logic Flow Architecture
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-emerald-400/50 pl-4">
            "{analysis.logicFlow}"
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.dependencies.map((dep, i) => (
              <span key={i} className="px-2 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-slate-400">
                {dep}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ShieldAlert className="text-red-400" size={20} /> Bug Registry & Security Risks
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {analysis.bugs.map((bug, i) => (
            <div key={i} className={`p-4 rounded-lg border flex flex-col gap-2 ${getSeverityColor(bug.severity)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  {getSeverityIcon(bug.severity)}
                  <span className="capitalize">{bug.severity}</span>
                </div>
                <span className="text-xs opacity-70">Line {bug.line}</span>
              </div>
              <p className="text-sm">{bug.description}</p>
              <div className="mt-2 text-xs pt-2 border-t border-white/10">
                <strong className="block mb-1">Modern Recommendation:</strong>
                {bug.suggestion}
              </div>
            </div>
          ))}
          {analysis.bugs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No immediate bugs detected in the code logic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
