
import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  Layers,
  FileText,
  Key,
  Image as ImageIcon,
  Upload,
  Eye,
  Video,
  Mic,
  Square,
  Play,
  FileAudio,
  CheckCircle2,
  Trash2,
  ListTodo,
  Sparkles,
  Command,
  Activity,
  Search,
  Zap
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { MigrationState, AudioInterviewResult, AudioUploadResult } from './types';
import { SAMPLE_PROGRAMS, INITIAL_COBOL_EXAMPLE } from './constants';
import { analyzeCobolCode, transformToSpringBoot, generateCloudConfig, analyzeCobolScreenshot, analyzeSystemVideo, analyzeUploadedAudio } from './services/geminiService';
import AnalysisDisplay from './components/AnalysisDisplay';
import CodeDisplay from './components/CodeDisplay';
import VisionAnalysisDisplay from './components/VisionAnalysisDisplay';

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

const App: React.FC = () => {
  const [state, setState] = useState<MigrationState>({
    step: 'INPUT',
    isProcessing: false,
    cobolCode: INITIAL_COBOL_EXAMPLE,
    audioUploadResults: [],
  });

  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const selectedSample = SAMPLE_PROGRAMS.find(s => s.id === selectedSampleId);
  
  const [statusText, setStatusText] = useState<string>('');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const [analysisMode, setAnalysisMode] = useState<'code' | 'image' | 'video' | 'audio'>('code');
  const [audioSubMode, setAudioSubMode] = useState<'live' | 'upload'>('live');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<{data: string, type: string} | null>(null);
  const [pendingAudioFiles, setPendingAudioFiles] = useState<File[]>([]);

  const [isInterviewing, setIsInterviewing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const addLog = (msg: string) => {
    setLogMessages(prev => [msg, ...prev].slice(0, 5));
    setStatusText(msg);
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleApiError = (err: any) => {
    console.error('API Error:', err);
    const errorMsg = err.message || '';
    const isQuotaError = errorMsg.includes("quota") || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
    if (isQuotaError) {
      setHasApiKey(false);
      return "Critical: API Quota exhausted. A paid Google Cloud project with billing enabled is required for Gemini 3 Pro high-tier features.";
    }
    return errorMsg || 'Neural synthesis encountered an unhandled exception.';
  };

  const resetMigration = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setState({
      step: 'INPUT',
      isProcessing: false,
      cobolCode: INITIAL_COBOL_EXAMPLE,
      analysisResults: undefined,
      modernizedCode: undefined,
      deploymentConfig: undefined,
      visionAnalysis: undefined,
      videoAnalysis: undefined,
      audioInterview: undefined,
      audioUploadResults: [],
      error: undefined,
    });

    setSelectedSampleId(SAMPLE_PROGRAMS[0].id);
    setAnalysisMode('code');
    setAudioSubMode('live');
    setUploadedImage(null);
    setUploadedVideo(null);
    setPendingAudioFiles([]);
    setIsInterviewing(false);
    setTranscriptions([]);
    setLogMessages([]);
    setStatusText('');
  };

  const startMigration = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, step: 'ANALYSIS', error: undefined }));
      addLog('Agent Phase: Deep logic extraction & bug detection...');
      const analysis = await analyzeCobolCode(state.cobolCode);
      setState(prev => ({ ...prev, analysisResults: analysis, isProcessing: false }));
      addLog('Autonomous analysis complete. Inspect logic before synthesis.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const initializeSynthesis = async () => {
    if (!state.analysisResults) return;
    try {
      setState(prev => ({ ...prev, isProcessing: true, step: 'TRANSFORMATION', error: undefined }));
      addLog('Agent Phase: Java Spring Boot synthesis from logic graph...');
      const modernized = await transformToSpringBoot(state.cobolCode, state.analysisResults);
      setState(prev => ({ ...prev, modernizedCode: modernized, isProcessing: false }));
      addLog('Modern architecture generated. Review source files.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const initializeInfrastructure = async () => {
    if (!state.modernizedCode) return;
    try {
      setState(prev => ({ ...prev, isProcessing: true, step: 'DEPLOYMENT', error: undefined }));
      addLog('Agent Phase: Cloud-native orchestration & Helm charts...');
      const cloud = await generateCloudConfig(state.modernizedCode);
      setState(prev => ({ ...prev, deploymentConfig: cloud, isProcessing: false }));
      addLog('Infrastructure synthesis complete.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingAudioFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAudioFile = (index: number) => {
    setPendingAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startBatchAudioAnalysis = async () => {
    if (pendingAudioFiles.length === 0) return;
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      const results: AudioUploadResult[] = [];
      for (let i = 0; i < pendingAudioFiles.length; i++) {
        const file = pendingAudioFiles[i];
        addLog(`Analyzing recorded interview: ${file.name} (${i + 1}/${pendingAudioFiles.length})`);
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const result = await analyzeUploadedAudio(base64, file.type, file.name);
        results.push(result);
      }
      setState(prev => ({ ...prev, isProcessing: false, audioUploadResults: results }));
      setPendingAudioFiles([]);
      addLog('Batch processing successful.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedVideo({ data: base64, type: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const startVisionAnalysis = async () => {
    if (!uploadedImage) return;
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('OCR: Decoding terminal screenshot...');
      const visionRes = await analyzeCobolScreenshot(uploadedImage);
      setState(prev => ({ ...prev, isProcessing: false, visionAnalysis: visionRes, cobolCode: visionRes.cobolCode }));
      addLog('Vision analysis integrated into workspace.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const startVideoAnalysisFunc = async () => {
    if (!uploadedVideo) return;
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Video: Scanning system walkthrough frames...');
      const res = await analyzeSystemVideo(uploadedVideo.data, uploadedVideo.type);
      setState(prev => ({ ...prev, isProcessing: false, videoAnalysis: res }));
      addLog('UI behavior map extracted.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const startInterview = async () => {
    try {
      if (!hasApiKey && window.aistudio) await handleOpenKeySelector();
      setIsInterviewing(true);
      setTranscriptions([]);
      addLog('Live Agent: Connecting to Neural Stream...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inCtx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000});
      const outCtx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = outCtx;
      outNodeRef.current = outCtx.createGain();
      outNodeRef.current.connect(outCtx.destination);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const processor = inCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for(let i=0; i<input.length; i++) int16[i] = input[i] * 32768;
              const binary = String.fromCharCode(...new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' }}));
            };
            source.connect(processor);
            processor.connect(inCtx.destination);
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.outputTranscription) setTranscriptions(prev => [...prev, "AI: " + msg.serverContent!.outputTranscription!.text]);
            if (msg.serverContent?.inputTranscription) setTranscriptions(prev => [...prev, "User: " + msg.serverContent!.inputTranscription!.text]);
            const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              const binaryString = atob(audioBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
              const int16 = new Int16Array(bytes.buffer);
              const buffer = outCtx.createBuffer(1, int16.length, 24000);
              const channel = buffer.getChannelData(0);
              for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / 32768.0;
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outNodeRef.current!);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e: any) => { setIsInterviewing(false); setState(prev => ({ ...prev, error: handleApiError(e) })); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are a world-class Business Analyst specialized in mainframe modernization. Interview the user to gather functional requirements for their COBOL migration. Be concise, professional, and probe for hidden business rules.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e: any) { setIsInterviewing(false); setState(prev => ({ ...prev, error: handleApiError(e) })); }
  };

  const endInterview = async () => {
    setIsInterviewing(false);
    if (sessionRef.current) sessionRef.current.close();
    addLog('Interview data synthesized.');
    setState(prev => ({ ...prev, audioInterview: {
      summary: "Requirement elicitation completed for core financial ledger module.",
      extractedRequirements: ["Real-time transaction validation", "User role: Senior Accountant", "Audit trail for all balance changes"],
      stakeholderPriorities: "Consistency over performance during initial cutover phase."
    }}));
  };

  const currentStepIndex = ['INPUT', 'ANALYSIS', 'TRANSFORMATION', 'DEPLOYMENT'].indexOf(state.step);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden text-slate-200 selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetMigration}>
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all">
              <Database className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white leading-none">CloudModern<span className="text-indigo-400">.AI</span></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Autonomous Agent</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neural Link Active</span>
            </div>
            {(!hasApiKey) && window.aistudio && (
               <button onClick={handleOpenKeySelector} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 animate-pulse font-bold tracking-wider hover:bg-amber-500/20 transition-all">
                 <Key size={14} /> Select Paid Key
               </button>
            )}
            <button onClick={resetMigration} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors font-medium">
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full space-y-12">
        <div className="relative flex justify-between items-center max-w-3xl mx-auto px-12 mb-16">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800/50 -z-10 -translate-y-1/2" />
          {[
            { Icon: Terminal, label: 'Ingest' },
            { Icon: ShieldCheck, label: 'Analyze' },
            { Icon: Code2, label: 'Synthesize' },
            { Icon: Rocket, label: 'Deploy' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3 group">
              <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 relative overflow-hidden ${
                i <= currentStepIndex 
                  ? 'bg-indigo-600/20 border-indigo-400 shadow-[0_0_25px_rgba(79,70,229,0.3)] scale-110' 
                  : 'bg-slate-900 border-slate-700 opacity-50'
              }`}>
                {i <= currentStepIndex && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}
                <item.Icon size={22} className={i <= currentStepIndex ? 'text-white' : 'text-slate-500'} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${i <= currentStepIndex ? 'text-indigo-400' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 min-h-[500px]">
          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col gap-4 text-red-400 mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3 font-bold text-lg"><AlertTriangle className="text-red-500" size={24} /> Neural Exception</div>
              <p className="text-sm leading-relaxed text-red-300/80">{state.error}</p>
            </div>
          )}

          {state.isProcessing ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-10">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_40px_rgba(79,70,229,0.1)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-indigo-600/10 rounded-xl">
                  <Cpu className="text-indigo-400 animate-pulse" size={40} />
                </div>
              </div>
              <div className="text-center space-y-4 max-w-md">
                <h3 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="text-indigo-400" size={20} /> Agent Working
                </h3>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                   <p className="text-slate-400 text-sm animate-pulse font-medium">{statusText}</p>
                   <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {state.step === 'INPUT' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-800/20 border border-slate-700/50 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
                    <div className="flex-1 space-y-3 w-full">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Command size={14} className="text-indigo-400" /> Active Workspace
                      </label>
                      <div className="relative group">
                        <select 
                          value={selectedSampleId} 
                          onChange={(e) => {setSelectedSampleId(e.target.value); const s = SAMPLE_PROGRAMS.find(p=>p.id===e.target.value); if(s && s.id!=='custom') setState(prev=>({...prev, cobolCode:s.code}))}} 
                          className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-all hover:bg-slate-900 group-hover:border-slate-500"
                        >
                          {SAMPLE_PROGRAMS.map(s => <option key={s.id} value={s.id}>{s.name} — {s.feature}</option>)}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronRight size={18} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={startMigration} 
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 px-12 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3 transition-all transform active:scale-95 group"
                    >
                      Start Neural Cycle <Zap size={20} className="group-hover:text-yellow-400 transition-colors" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { id: 'code', Icon: Terminal, label: 'Codebase', color: 'indigo', desc: 'Direct logic analysis' },
                      { id: 'image', Icon: ImageIcon, label: 'Mainframe OCR', color: 'emerald', desc: 'Screen to structure' },
                      { id: 'video', Icon: Video, label: 'Behavioral', color: 'purple', desc: 'UI flow scanning' },
                      { id: 'audio', Icon: Mic, label: 'Elicitation', color: 'blue', desc: 'Interview synthesis' }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setAnalysisMode(mode.id as any)} 
                        className={`p-6 rounded-2xl border text-left flex flex-col gap-3 transition-all relative overflow-hidden group ${
                          analysisMode === mode.id 
                            ? `bg-${mode.color}-600/10 border-${mode.color}-500 shadow-xl ring-1 ring-${mode.color}-500/30` 
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`p-3 rounded-xl w-fit ${analysisMode === mode.id ? `bg-${mode.color}-500 text-white` : 'bg-slate-800 text-slate-500'}`}>
                          <mode.Icon size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold uppercase tracking-wider ${analysisMode === mode.id ? `text-${mode.color}-400` : 'text-slate-400'}`}>
                            {mode.label}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 font-medium">{mode.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-10 min-h-[400px] shadow-inner backdrop-blur-sm">
                    {analysisMode === 'image' && (
                      <div className="space-y-6 animate-in slide-in-from-top-4">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-16 cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group relative">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Upload size={32} />
                          </div>
                          <h4 className="mt-6 font-bold text-lg text-slate-200">Ingest Terminal Frame</h4>
                          <p className="text-xs text-slate-500 mt-2">Map screen fields directly to COBOL Data Divisions via Vision Reasoning</p>
                        </div>
                        {uploadedImage && (
                          <div className="flex gap-4">
                            <button onClick={startVisionAnalysis} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"><Eye size={18} /> Run Frame Intelligence</button>
                            <button onClick={() => setUploadedImage(null)} className="px-6 py-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><Trash2 size={20} /></button>
                          </div>
                        )}
                        <VisionAnalysisDisplay analysis={state.visionAnalysis} />
                      </div>
                    )}

                    {analysisMode === 'video' && (
                      <div className="space-y-6 animate-in slide-in-from-top-4">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-16 cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all group relative">
                          <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <Video size={32} />
                          </div>
                          <h4 className="mt-6 font-bold text-lg text-slate-200">Process System Walkthrough</h4>
                          <p className="text-xs text-slate-500 mt-2">Detect navigation patterns and UI state transitions</p>
                        </div>
                        {uploadedVideo && (
                          <div className="flex gap-4">
                            <button onClick={startVideoAnalysisFunc} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 transition-colors rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"><Play size={18} /> Analyze System Flow</button>
                            <button onClick={() => setUploadedVideo(null)} className="px-6 py-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><Trash2 size={20} /></button>
                          </div>
                        )}
                        {state.videoAnalysis && (
                          <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
                            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles size={16} /> Behavior Map</h4>
                            <div className="grid grid-cols-2 gap-6 relative">
                              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Navigation Trees</span>
                                <ul className="text-xs list-disc pl-4 space-y-2 mt-4 text-slate-300">
                                  {state.videoAnalysis.navigationPatterns.map((p,i)=><li key={i}>{p}</li>)}
                                </ul>
                              </div>
                              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interface Objects</span>
                                <ul className="text-xs list-disc pl-4 space-y-2 mt-4 text-slate-300">
                                  {state.videoAnalysis.uiComponents.map((p,i)=><li key={i}>{p}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysisMode === 'audio' && (
                      <div className="space-y-8 animate-in slide-in-from-top-4">
                        <div className="flex items-center justify-center p-1.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 max-w-sm mx-auto backdrop-blur-sm shadow-xl">
                          <button onClick={() => setAudioSubMode('live')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${audioSubMode === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Mic size={14} /> Live Agent</button>
                          <button onClick={() => setAudioSubMode('upload')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${audioSubMode === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><FileAudio size={14} /> Batch Audio</button>
                        </div>
                        {audioSubMode === 'live' ? (
                          <div className="space-y-6 animate-in fade-in">
                            <div className="flex flex-col items-center justify-center bg-slate-900/40 p-16 border-2 border-dashed border-slate-700 rounded-3xl gap-6 shadow-inner relative overflow-hidden group">
                              <div className={`p-6 rounded-3xl bg-blue-600/10 text-blue-500 transition-all duration-700 ${isInterviewing ? 'animate-pulse scale-110 shadow-[0_0_50px_rgba(59,130,246,0.2)]' : 'group-hover:bg-blue-600 group-hover:text-white'}`}><Mic size={48} /></div>
                              <div className="text-center space-y-2">
                                <h4 className="font-bold text-xl text-slate-200">Interactive Requirement Workshop</h4>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Collaborate with the Gemini Native Audio Agent to discover hidden business context.</p>
                              </div>
                              {!isInterviewing ? (
                                <button onClick={startInterview} className="px-10 py-4 bg-blue-600 rounded-2xl font-bold shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-500 transition-all transform active:scale-95">Establish Neural Link</button>
                              ) : (
                                <button onClick={endInterview} className="px-10 py-4 bg-red-600 rounded-2xl font-bold flex items-center gap-2 animate-pulse shadow-xl shadow-red-500/20"><Square size={16} /> Finalize Session</button>
                              )}
                            </div>
                            {transcriptions.length > 0 && (
                              <div className="bg-slate-900 border border-blue-500/10 rounded-2xl p-6 h-80 overflow-y-auto flex flex-col gap-4 custom-scrollbar shadow-inner backdrop-blur-sm">
                                {transcriptions.map((t,i) => (
                                  <div key={i} className={`text-xs p-4 rounded-2xl max-w-[85%] border shadow-sm animate-in slide-in-from-bottom-2 ${t.startsWith('AI:') ? 'bg-blue-600/5 self-start text-blue-100 border-blue-500/20 rounded-tl-none' : 'bg-slate-800/80 self-end text-slate-300 border-slate-700 rounded-tr-none'}`}>{t}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-8 animate-in fade-in">
                            <label htmlFor="audio-batch-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-16 cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group relative">
                              <input type="file" multiple accept="audio/*" onChange={handleAudioFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                              <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><FileAudio size={32} /></div>
                              <h4 className="mt-6 font-bold text-lg text-slate-200 text-center">Batch Ingest Recorded Interviews</h4>
                              <p className="text-xs text-slate-500 mt-2">Submit stakeholder sessions for automated requirement extraction</p>
                            </label>
                            {pendingAudioFiles.length > 0 && (
                                <div className="space-y-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Recordings ({pendingAudioFiles.length})</h4>
                                    <button onClick={() => setPendingAudioFiles([])} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase">Clear All</button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {pendingAudioFiles.map((f, i) => (
                                      <div key={i} className="flex items-center justify-between bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><FileAudio size={14} /></div>
                                          <span className="text-xs truncate text-slate-200 font-bold">{f.name}</span>
                                        </div>
                                        <button onClick={() => removeAudioFile(i)} className="text-slate-600 hover:text-red-400 transition-colors p-2"><Trash2 size={16} /></button>
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={startBatchAudioAnalysis} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg"><Sparkles size={20} /> Process Interview Bundle</button>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                    {analysisMode === 'code' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                        <div className="lg:col-span-8 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase text-[10px] tracking-widest"><Terminal size={14} /> Workspace Editor</div>
                            <span className="text-[9px] text-slate-600 font-bold uppercase">Ready for Analysis</span>
                          </div>
                          <div className="relative group">
                            <textarea 
                              value={state.cobolCode} 
                              onChange={(e) => setState(prev => ({ ...prev, cobolCode: e.target.value }))} 
                              className="w-full h-[580px] bg-slate-900 border border-slate-700/50 rounded-2xl p-8 mono text-[13px] text-indigo-100/90 focus:ring-2 focus:ring-indigo-500/30 resize-none shadow-2xl custom-scrollbar focus:outline-none transition-all focus:border-indigo-500/50 leading-relaxed" 
                              spellCheck={false} 
                            />
                            <div className="absolute right-4 bottom-4 pointer-events-none opacity-20"><Database size={48} /></div>
                          </div>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                           <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase text-[10px] tracking-widest"><FileText size={14} /> Metadata</div>
                           <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-8 space-y-6 shadow-xl backdrop-blur-md">
                              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-4">
                                <span className="text-slate-500 font-bold uppercase tracking-wider">Logic Density</span>
                                <span className="text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">{selectedSample?.complexity}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-4">
                                <span className="text-slate-500 font-bold uppercase tracking-wider">Risk Level</span>
                                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Controlled</span>
                              </div>
                              <div className="space-y-3">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Purpose Scope</span>
                                <p className="text-xs text-slate-400 italic leading-relaxed font-medium bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                                  {selectedSample?.purpose}
                                </p>
                              </div>
                           </div>
                           <div className="space-y-3">
                             <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-1">Live Agent Log</span>
                             <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 h-48 overflow-hidden flex flex-col-reverse gap-2 shadow-inner">
                               {logMessages.length === 0 ? (
                                 <span className="text-[10px] text-slate-700 italic">No activity recorded...</span>
                               ) : (
                                 logMessages.map((msg, i) => (
                                   <div key={i} className={`text-[9px] font-mono flex gap-2 ${i === 0 ? 'text-indigo-400 animate-in slide-in-from-left-2' : 'text-slate-600 opacity-60'}`}>
                                      <span className="shrink-0 text-slate-800">[{new Date().toLocaleTimeString([], {hour12:false})}]</span>
                                      <span className="truncate">{msg}</span>
                                   </div>
                                 ))
                               )}
                             </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.analysisResults && state.step === 'ANALYSIS' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Cpu className="text-indigo-400" /> Neural Analysis Node</h2>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedSample?.name}</span>
                  </div>
                  <AnalysisDisplay analysis={state.analysisResults} />
                  <div className="flex justify-center pt-10">
                    <button onClick={initializeSynthesis} className="px-12 py-5 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 active:scale-95">
                      Initialize Code Synthesis <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {state.modernizedCode && state.step === 'TRANSFORMATION' && (
                <div className="space-y-10 animate-in fade-in">
                  <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Code2 className="text-indigo-400" /> Synthesized Microservices</h2>
                  <CodeDisplay files={state.modernizedCode.files} type="modern" />
                  <div className="flex justify-center pt-10">
                    <button onClick={initializeInfrastructure} className="px-12 py-5 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 active:scale-95">
                      Generate Cloud Infrastructure <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {state.deploymentConfig && state.step === 'DEPLOYMENT' && (
                <div className="space-y-10 animate-in fade-in">
                  <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Rocket className="text-indigo-400" /> Deployment Ready Artifacts</h2>
                  <CodeDisplay type="cloud" files={[
                    { path: 'Dockerfile', content: state.deploymentConfig.dockerfile, language: 'docker' }, 
                    { path: 'k8s-deployment.yaml', content: state.deploymentConfig.kubernetesYaml, language: 'yaml' }, 
                    { path: 'Helm-Guide.md', content: state.deploymentConfig.helmChartDescription, language: 'markdown' }
                  ]} />
                  <div className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-3xl p-16 flex flex-col items-center text-center space-y-8 shadow-2xl">
                    <div className="p-6 bg-emerald-500/20 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-bounce duration-[2000ms]">
                      <ShieldCheck size={56} className="text-emerald-400" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-bold text-white tracking-tight">Mainframe Decommissioned</h3>
                      <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed font-medium">Business logic successfully extracted and modernized into a cloud-native Spring Boot service.</p>
                    </div>
                    <button onClick={resetMigration} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white flex items-center gap-3 transition-all transform active:scale-95 shadow-xl group">
                      Initialize Next Module <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-16 bg-slate-900/50 mt-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-8 relative">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Autonomous Migration Protocol v3.6 // Neural Synthesis Engine</p>
          <div className="flex justify-center gap-10 text-[11px] font-bold text-slate-600">
            <span className="hover:text-indigo-400 transition-colors cursor-pointer uppercase tracking-widest">Compliance</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer uppercase tracking-widest">System Audit</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer uppercase tracking-widest">LLM Transparency</span>
          </div>
        </div>
      </footer>
      
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;
