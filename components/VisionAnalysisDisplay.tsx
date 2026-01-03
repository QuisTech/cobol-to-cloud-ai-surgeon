
import React from 'react';
import { VisionAnalysisResult } from '../types';
import { Eye, Code, List, FileText, Lightbulb } from 'lucide-react';

interface VisionAnalysisDisplayProps {
  analysis: VisionAnalysisResult | undefined;
}

const VisionAnalysisDisplay: React.FC<VisionAnalysisDisplayProps> = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="bg-slate-800/30 border border-emerald-500/20 rounded-xl p-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg">
      <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-6 border-b border-emerald-500/10 pb-4">
        <Eye size={20} />
        <h3 className="text-sm uppercase tracking-widest">Vision Analysis Intelligence</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extracted Text & Business Logic */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <FileText size={14} /> Extracted UI Text
            </h4>
            <div className="text-sm text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 max-h-40 overflow-y-auto mono leading-relaxed">
              {analysis.extractedText}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-400" /> Inferred Business Rules
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              {analysis.businessLogic}
            </p>
          </div>
        </div>
        
        {/* Identified Fields */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <List size={14} /> Schema Discovery (UI Map)
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {analysis.fields?.map((field, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-700 hover:border-indigo-500/30 transition-colors">
                <span className="text-sm font-medium text-slate-200">{field.name}</span>
                <span className="text-[10px] px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 font-bold uppercase">
                  {field.type} ({field.length})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Generated COBOL Code */}
      {analysis.cobolCode && (
        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Code size={14} /> Generated DATA DIVISION Structure
          </h4>
          <div className="relative group">
             <pre className="text-xs bg-slate-900 p-5 rounded-xl border border-slate-700 overflow-x-auto text-emerald-100/90 mono leading-relaxed shadow-inner">
               <code>{analysis.cobolCode}</code>
             </pre>
             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 font-bold">Generated from Vision</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionAnalysisDisplay;
