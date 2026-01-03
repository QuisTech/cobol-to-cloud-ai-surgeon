
import React, { useState } from 'react';
import { FileCode, Server, Cloud, ChevronRight, Copy, Check, Files } from 'lucide-react';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCopySelected = () => {
    copyToClipboard(selectedFile.content, 'selected');
  };

  const handleCopyAll = () => {
    const allContent = files.map(f => `// --- FILE: ${f.path} ---\n${f.content}\n`).join('\n');
    copyToClipboard(allContent, 'all');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[600px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
      {/* Sidebar Explorer */}
      <div className="w-full lg:w-80 bg-slate-800/80 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between text-indigo-400 font-medium">
          <div className="flex items-center gap-2">
            {type === 'modern' ? <Server size={18} /> : <Cloud size={18} />}
            <span>{type === 'modern' ? 'Source Tree' : 'Infra Config'}</span>
          </div>
          <button
            onClick={handleCopyAll}
            title="Copy all files to clipboard"
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
              copiedId === 'all' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
            }`}
          >
            {copiedId === 'all' ? <Check size={12} /> : <Files size={12} />}
            {copiedId === 'all' ? 'All Copied' : 'Copy All'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {files.map((file) => (
            <div 
              key={file.path}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all relative ${
                selectedFile.path === file.path 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <button
                onClick={() => setSelectedFile(file)}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
              >
                <FileCode size={14} className={selectedFile.path === file.path ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="truncate">{file.path.split('/').pop()}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(file.content, file.path);
                }}
                className={`p-1 rounded hover:bg-slate-600 transition-colors opacity-0 group-hover:opacity-100 ${
                  copiedId === file.path ? 'opacity-100 text-emerald-400' : 'text-slate-500'
                }`}
                title="Quick copy file"
              >
                {copiedId === file.path ? <Check size={14} /> : <Copy size={14} />}
              </button>
              
              {selectedFile.path === file.path && !copiedId && (
                <ChevronRight size={14} className="ml-1 shrink-0 text-indigo-500/50" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
              {selectedFile.language}
            </span>
            <span className="text-xs text-slate-500 mono truncate">{selectedFile.path}</span>
          </div>
          <button 
            onClick={handleCopySelected}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium border ${
              copiedId === 'selected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
            }`}
          >
            {copiedId === 'selected' ? <Check size={14} /> : <Copy size={14} />}
            {copiedId === 'selected' ? 'Copied to Clipboard' : 'Copy File'}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-900 mono text-[13px] leading-relaxed relative custom-scrollbar">
          <pre className="text-indigo-100/90 selection:bg-indigo-500/30">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeDisplay;
