
import React, { useState } from 'react';
import { FileCode, Server, Cloud, ChevronRight, Copy, Check } from 'lucide-react';

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

interface CodeDisplayProps {
  files: CodeFile[];
  type: 'modern' | 'cloud';
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ files, type }) => {
  const [selectedFile, setSelectedFile] = useState(files[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[600px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
      {/* Sidebar Explorer */}
      <div className="w-full lg:w-72 bg-slate-800/80 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2 text-indigo-400 font-medium">
          {type === 'modern' ? <Server size={18} /> : <Cloud size={18} />}
          <span>{type === 'modern' ? 'Project Explorer' : 'Infrastructure'}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                selectedFile.path === file.path 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <FileCode size={14} className={selectedFile.path === file.path ? 'text-indigo-400' : 'text-slate-500'} />
              <span className="truncate">{file.path.split('/').pop()}</span>
              {selectedFile.path === file.path && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 mono">{selectedFile.path}</span>
          </div>
          <button 
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 flex items-center gap-2 text-xs"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-900 mono text-[13px] leading-relaxed relative">
          <pre className="text-indigo-100/90 selection:bg-indigo-500/30">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeDisplay;
