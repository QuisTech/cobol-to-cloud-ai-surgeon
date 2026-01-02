
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cpu, 
  ArrowRight, 
  Terminal, 
  RefreshCw, 
  ShieldCheck, 
  Rocket, 
  Code2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { MigrationState, MigrationStatus } from './types';
import { INITIAL_COBOL_EXAMPLE } from './constants';
import { analyzeCobolCode, transformToSpringBoot, generateCloudConfig } from './services/geminiService';
import AnalysisDisplay from './components/AnalysisDisplay';
import CodeDisplay from './components/CodeDisplay';

const App: React.FC = () => {
  const [state, setState] = useState<MigrationState>({
    step: 'INPUT',
    isProcessing: false,
    cobolCode: INITIAL_COBOL_EXAMPLE,
  });

  const [statusText, setStatusText] = useState<string>('');

  const startMigration = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, step: 'ANALYSIS' }));
      setStatusText('Initializing Neural Analysis Agent...');
      
      const analysis = await analyzeCobolCode(state.cobolCode);
      setState(prev => ({ ...prev, analysisResults: analysis }));
      setStatusText('Synthesizing Modern Spring Boot Architecture...');

      const modernized = await transformToSpringBoot(state.cobolCode, analysis);
      setState(prev => ({ ...prev, modernizedCode: modernized, step: 'TRANSFORMATION' }));
      setStatusText('Generating Cloud-Native Infrastructure...');

      const cloud = await generateCloudConfig(modernized);
      setState(prev => ({ ...prev, deploymentConfig: cloud, step: 'DEPLOYMENT', isProcessing: false }));
      
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isProcessing: false, error: 'Migration failed. Ensure API Key is valid and code is valid COBOL.' }));
    }
  };

  const resetMigration = () => {
    setState({
      step: 'INPUT',
      isProcessing: false,
      cobolCode: INITIAL_COBOL_EXAMPLE,
    });
  };

  const currentStepIndex = ['INPUT', 'ANALYSIS', 'TRANSFORMATION', 'DEPLOYMENT'].indexOf(state.step);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Navigation / Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={resetMigration}>
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Database className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CloudModern<span className="text-indigo-400">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <span className={state.step === 'INPUT' ? 'text-indigo-400' : ''}>1. Source Code</span>
            <ChevronRight size={14} />
            <span className={state.step === 'ANALYSIS' ? 'text-indigo-400' : ''}>2. Analysis</span>
            <ChevronRight size={14} />
            <span className={state.step === 'TRANSFORMATION' ? 'text-indigo-400' : ''}>3. Modernize</span>
            <ChevronRight size={14} />
            <span className={state.step === 'DEPLOYMENT' ? 'text-indigo-400' : ''}>4. Cloud</span>
          </div>
          <button 
            onClick={resetMigration}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-xs hover:bg-slate-800 transition-colors text-slate-300"
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {/* Hero / State Header */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent">
            Automated Mainframe Modernization
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Deconstruct legacy COBOL logic, fix silent bugs, and redeploy as containerized Spring Boot microservices in seconds.
          </p>
        </section>

        {/* Step Indicator */}
        <div className="relative flex justify-between items-center max-w-2xl mx-auto px-8">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -z-10 -translate-y-1/2" />
          {[Terminal, ShieldCheck, Code2, Rocket].map((Icon, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                i <= currentStepIndex 
                ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.5)]' 
                : 'bg-slate-900 border-slate-700'
              }`}
            >
              <Icon size={18} className={i <= currentStepIndex ? 'text-white' : 'text-slate-500'} />
            </div>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="mt-12 min-h-[500px]">
          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 mb-8 animate-in fade-in slide-in-from-top-4">
              <AlertTriangle size={20} />
              <p>{state.error}</p>
            </div>
          )}

          {state.isProcessing ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Agent Operating...</h3>
                <p className="text-slate-400 animate-pulse">{statusText}</p>
              </div>
            </div>
          ) : (
            <>
              {state.step === 'INPUT' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                      <Terminal size={20} />
                      <h2>Source COBOL Implementation</h2>
                    </div>
                    <textarea
                      value={state.cobolCode}
                      onChange={(e) => setState(prev => ({ ...prev, cobolCode: e.target.value }))}
                      className="w-full h-[400px] bg-slate-900 border border-slate-700 rounded-xl p-6 mono text-indigo-100/80 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all custom-scrollbar resize-none shadow-2xl"
                      placeholder="Paste your legacy COBOL code here..."
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={startMigration}
                        className="group bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-3 transition-all transform active:scale-95"
                      >
                        Launch Migration Agent
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 space-y-6 h-full flex flex-col justify-center">
                      <div className="space-y-2">
                        <div className="p-3 bg-indigo-500/10 rounded-lg w-fit">
                          <ShieldCheck className="text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold">Secure Synthesis</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Our LLM-driven migration engine uses Gemini 3 Pro to perform static analysis, detecting buffer overflows, Y2K vulnerabilities, and logic flaws before refactoring.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-emerald-500/10 rounded-lg w-fit">
                          <Rocket className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold">Cloud-Native Target</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Generated microservices are built on Spring Boot 3 with high-performance Java 21 features, ready for Kubernetes or Serverless deployment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {state.analysisResults && state.step === 'ANALYSIS' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <AnalysisDisplay analysis={state.analysisResults} />
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, step: 'TRANSFORMATION' }))}
                      className="px-8 py-3 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2"
                    >
                      Confirm & Modernize Code <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {state.modernizedCode && state.step === 'TRANSFORMATION' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Code2 className="text-indigo-400" />
                      Modern Java Microservice
                    </h2>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Spring Boot 3.2</span>
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Java 21</span>
                    </div>
                  </div>
                  <CodeDisplay files={state.modernizedCode.files} type="modern" />
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, step: 'DEPLOYMENT' }))}
                      className="px-8 py-3 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2"
                    >
                      Configure Cloud Deployment <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {state.deploymentConfig && state.step === 'DEPLOYMENT' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Rocket className="text-indigo-400" />
                      Infrastructure as Code
                    </h2>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Docker</span>
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Kubernetes</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    <CodeDisplay 
                      type="cloud"
                      files={[
                        { path: 'Dockerfile', content: state.deploymentConfig.dockerfile, language: 'docker' },
                        { path: 'k8s-deployment.yaml', content: state.deploymentConfig.kubernetesYaml, language: 'yaml' }
                      ]} 
                    />
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                      <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                        <ShieldCheck size={20} /> Modernization Complete
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        The agent has successfully refactored the legacy COBOL logic into a modular Spring Boot system. 
                        Security vulnerabilities identified in the source have been mitigated through modern programming paradigms.
                      </p>
                      <button 
                        onClick={resetMigration}
                        className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium underline flex items-center gap-1"
                      >
                        Start New Migration Process
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-10 bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-slate-500 text-sm">
            Powered by Gemini 3 Pro Reasoning & Flash Multimodality.
          </p>
          <div className="flex justify-center gap-6 text-slate-600">
            <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Security Standards</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">API References</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
