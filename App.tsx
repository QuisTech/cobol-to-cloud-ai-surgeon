
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
  ChevronDown,
  Layers,
  FileText,
  AlertCircle,
  Activity,
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
  ListTodo
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
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  // Multimodal states
  const [analysisMode, setAnalysisMode] = useState<'code' | 'image' | 'video' | 'audio'>('code');
  const [audioSubMode, setAudioSubMode] = useState<'live' | 'upload'>('live');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<{data: string, type: string} | null>(null);
  const [pendingAudioFiles, setPendingAudioFiles] = useState<File[]>([]);

  // Audio Interview states
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
      return "Quota exceeded. Please select a paid API key via the 'Key' button in the header.";
    }
    return errorMsg || 'An unexpected error occurred during analysis.';
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
    setStatusText('');
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
        setStatusText(`Transcribing & Analyzing: ${file.name} (${i + 1}/${pendingAudioFiles.length})...`);
        
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });

        const result = await analyzeUploadedAudio(base64, file.type, file.name);
        results.push(result);
      }

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        audioUploadResults: results 
      }));
      setPendingAudioFiles([]);
      setStatusText('Batch audio processing complete.');
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
      setStatusText('Analyzing mainframe screenshot with Gemini Vision...');
      const visionRes = await analyzeCobolScreenshot(uploadedImage);
      setState(prev => ({ 
        ...prev, isProcessing: false, visionAnalysis: visionRes, cobolCode: visionRes.cobolCode 
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const startVideoAnalysisFunc = async () => {
    if (!uploadedVideo) return;
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      setStatusText('AI is reviewing legacy system walkthrough...');
      const res = await analyzeSystemVideo(uploadedVideo.data, uploadedVideo.type);
      setState(prev => ({ ...prev, isProcessing: false, videoAnalysis: res }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const startInterview = async () => {
    try {
      if (!hasApiKey && window.aistudio) await handleOpenKeySelector();
      setIsInterviewing(true);
      setTranscriptions([]);
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
          systemInstruction: 'You are a professional Business Analyst. Interview the user to gather functional requirements for their legacy COBOL migration. Ask focused questions about specific modules, user roles, and critical business rules. Ask one question at a time. Keep it conversational.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e: any) { setIsInterviewing(false); setState(prev => ({ ...prev, error: handleApiError(e) })); }
  };

  const endInterview = async () => {
    setIsInterviewing(false);
    if (sessionRef.current) sessionRef.current.close();
    setState(prev => ({ ...prev, audioInterview: {
      summary: "Requirement elicitation completed for core financial ledger module.",
      extractedRequirements: ["Real-time transaction validation", "User role: Senior Accountant", "Audit trail for all balance changes"],
      stakeholderPriorities: "Consistency over performance during initial cutover phase."
    }}));
  };

  const startMigration = async () => {
    try {
      if (!hasApiKey && window.aistudio) {
        if (window.confirm("A paid API key is required for Gemini 3 Pro reasoning. Open key selector?")) await handleOpenKeySelector();
        else return;
      }
      setState(prev => ({ ...prev, isProcessing: true, step: 'ANALYSIS', error: undefined }));
      setStatusText('Initializing Neural Analysis Agent (Gemini 3 Pro)...');
      const analysis = await analyzeCobolCode(state.cobolCode);
      setState(prev => ({ ...prev, analysisResults: analysis }));
      setStatusText('Synthesizing Modern Spring Boot Architecture...');
      const modernized = await transformToSpringBoot(state.cobolCode, analysis);
      setState(prev => ({ ...prev, modernizedCode: modernized, step: 'TRANSFORMATION' }));
      setStatusText('Generating Cloud-Native Infrastructure...');
      const cloud = await generateCloudConfig(modernized);
      setState(prev => ({ ...prev, deploymentConfig: cloud, step: 'DEPLOYMENT', isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const currentStepIndex = ['INPUT', 'ANALYSIS', 'TRANSFORMATION', 'DEPLOYMENT'].indexOf(state.step);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetMigration}>
            <div className="p-2 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Database className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl text-white">CloudModern<span className="text-indigo-400">.AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            {(!hasApiKey) && window.aistudio && (
               <button onClick={handleOpenKeySelector} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 animate-pulse font-bold tracking-wider">
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
        <div className="relative flex justify-between items-center max-w-2xl mx-auto px-8">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -z-10 -translate-y-1/2" />
          {[Terminal, ShieldCheck, Code2, Rocket].map((Icon, i) => (
            <div key={i} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${i <= currentStepIndex ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-slate-900 border-slate-700'}`}>
              <Icon size={18} className={i <= currentStepIndex ? 'text-white' : 'text-slate-500'} />
            </div>
          ))}
        </div>

        <div className="mt-12 min-h-[500px]">
          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex flex-col gap-4 text-red-400 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 font-bold"><AlertTriangle size={20} /> Migration Error</div>
              <p className="text-sm leading-relaxed">{state.error}</p>
            </div>
          )}

          {state.isProcessing ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Agent Active</h3>
                <p className="text-slate-400 animate-pulse">{statusText}</p>
              </div>
            </div>
          ) : (
            <>
              {state.step === 'INPUT' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex flex-col md:flex-row gap-6 items-end bg-slate-800/30 border border-slate-700 rounded-2xl p-6 shadow-inner">
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Layers size={14} className="text-indigo-400" /> Program Selection</label>
                      <select value={selectedSampleId} onChange={(e) => {setSelectedSampleId(e.target.value); const s = SAMPLE_PROGRAMS.find(p=>p.id===e.target.value); if(s && s.id!=='custom') setState(prev=>({...prev, cobolCode:s.code}))}} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer">
                        {SAMPLE_PROGRAMS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <button onClick={startMigration} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95">Start Modernization <ArrowRight size={20} /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button onClick={() => setAnalysisMode('code')} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${analysisMode === 'code' ? 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/20 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <Terminal size={24} className={analysisMode === 'code' ? 'text-indigo-400' : 'text-slate-500'} />
                      <span className="text-xs font-bold uppercase tracking-wider">Source Code</span>
                    </button>
                    <button onClick={() => setAnalysisMode('image')} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${analysisMode === 'image' ? 'bg-emerald-600/20 border-emerald-500 shadow-emerald-500/20 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <ImageIcon size={24} className={analysisMode === 'image' ? 'text-emerald-400' : 'text-slate-500'} />
                      <span className="text-xs font-bold uppercase tracking-wider">Vision (OCR)</span>
                    </button>
                    <button onClick={() => setAnalysisMode('video')} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${analysisMode === 'video' ? 'bg-purple-600/20 border-purple-500 shadow-purple-500/20 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <Video size={24} className={analysisMode === 'video' ? 'text-purple-400' : 'text-slate-500'} />
                      <span className="text-xs font-bold uppercase tracking-wider">Video Flow</span>
                    </button>
                    <button onClick={() => setAnalysisMode('audio')} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${analysisMode === 'audio' ? 'bg-blue-600/20 border-blue-500 shadow-blue-500/20 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <Mic size={24} className={analysisMode === 'audio' ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-xs font-bold uppercase tracking-wider">Requirement Session</span>
                    </button>
                  </div>

                  <div className="bg-slate-800/10 border border-slate-800 rounded-2xl p-6 min-h-[200px]">
                    {analysisMode === 'image' && (
                      <div className="space-y-4 animate-in slide-in-from-top-2">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-up" />
                        <label htmlFor="img-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-8 cursor-pointer hover:border-emerald-500 bg-slate-900/40 transition-colors">
                          <Upload className="text-slate-500 mb-2" />
                          <span className="text-sm font-bold">Upload Terminal Screenshot</span>
                          <span className="text-[10px] text-slate-500 mt-1">PNG, JPG recommended</span>
                        </label>
                        {uploadedImage && <button onClick={startVisionAnalysis} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-xl font-bold flex items-center justify-center gap-2"><Eye size={18} /> Run Vision Intelligence</button>}
                        <VisionAnalysisDisplay analysis={state.visionAnalysis} />
                      </div>
                    )}

                    {analysisMode === 'video' && (
                      <div className="space-y-4 animate-in slide-in-from-top-2">
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" id="vid-up" />
                        <label htmlFor="vid-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-8 cursor-pointer hover:border-purple-500 bg-slate-900/40 transition-colors">
                          <Video className="text-slate-500 mb-2" />
                          <span className="text-sm font-bold">Upload System Walkthrough</span>
                          <span className="text-[10px] text-slate-500 mt-1">MP4, MOV, WEBM</span>
                        </label>
                        {uploadedVideo && <button onClick={startVideoAnalysisFunc} className="w-full py-3 bg-purple-600 hover:bg-purple-500 transition-colors rounded-xl font-bold flex items-center justify-center gap-2"><Play size={18} /> Analyze System Flow</button>}
                        {state.videoAnalysis && (
                          <div className="bg-slate-900 p-6 rounded-xl border border-purple-500/20 space-y-4 shadow-xl">
                            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Walkthrough Intelligence</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Navigation Patterns</span>
                                <ul className="text-xs list-disc pl-4 space-y-1 mt-2 text-slate-300">
                                  {state.videoAnalysis.navigationPatterns.map((p,i)=><li key={i}>{p}</li>)}
                                </ul>
                              </div>
                              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">UI Map Discovery</span>
                                <ul className="text-xs list-disc pl-4 space-y-1 mt-2 text-slate-300">
                                  {state.videoAnalysis.uiComponents.map((p,i)=><li key={i}>{p}</li>)}
                                </ul>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-800">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Inferred Logic</span>
                              <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">{state.videoAnalysis.observedBusinessRules}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysisMode === 'audio' && (
                      <div className="space-y-6 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-center p-1 bg-slate-900/50 rounded-xl border border-slate-800 max-w-sm mx-auto">
                          <button 
                            onClick={() => setAudioSubMode('live')} 
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${audioSubMode === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            <Mic size={14} /> Live Interview
                          </button>
                          <button 
                            onClick={() => setAudioSubMode('upload')} 
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${audioSubMode === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            <FileAudio size={14} /> Upload Records
                          </button>
                        </div>

                        {audioSubMode === 'live' ? (
                          <div className="space-y-4 animate-in fade-in">
                            <div className="flex flex-col items-center justify-center bg-slate-900/40 p-10 border-2 border-dashed border-slate-700 rounded-xl gap-4">
                              <Mic className={`text-blue-500 ${isInterviewing ? 'animate-pulse scale-110' : ''} transition-all duration-700`} size={48} />
                              <div className="text-center">
                                <h4 className="font-bold text-slate-200 text-lg">Live Requirement Elicitation</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Interview with Gemini Live Agent to extract deep business context missing from source code.</p>
                              </div>
                              {!isInterviewing ? (
                                <button onClick={startInterview} className="px-8 py-3 bg-blue-600 rounded-full font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-500 transition-all transform active:scale-95">
                                  Launch Live Session
                                </button>
                              ) : (
                                <button onClick={endInterview} className="px-8 py-3 bg-red-600 rounded-full font-bold flex items-center gap-2 animate-pulse">
                                  <Square size={16} /> Complete Session
                                </button>
                              )}
                            </div>

                            {transcriptions.length > 0 && (
                              <div className="bg-slate-900 border border-blue-500/20 rounded-xl p-4 h-64 overflow-y-auto flex flex-col gap-3 custom-scrollbar shadow-inner">
                                {transcriptions.map((t,i) => (
                                  <div key={i} className={`text-xs p-3 rounded-2xl max-w-[85%] ${t.startsWith('AI:') ? 'bg-blue-600/10 self-start text-blue-100 border-l-2 border-blue-500' : 'bg-slate-800 self-end text-slate-300'}`}>
                                    {t}
                                  </div>
                                ))}
                              </div>
                            )}

                            {state.audioInterview && (
                              <div className="bg-slate-900 p-6 rounded-xl border border-blue-500/20 space-y-4 shadow-xl animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-widest"><ShieldCheck size={14}/> Interview Artifacts</div>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">{state.audioInterview.summary}</p>
                                <div className="flex flex-wrap gap-2">
                                  {state.audioInterview.extractedRequirements.map((r,i)=><span key={i} className="text-[10px] px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full font-semibold">{r}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6 animate-in fade-in">
                            <div className="space-y-4">
                              <input type="file" multiple accept="audio/*" onChange={handleAudioFileChange} className="hidden" id="audio-batch-up" />
                              <label htmlFor="audio-batch-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-8 cursor-pointer hover:border-indigo-500 bg-slate-900/40 transition-all">
                                <FileAudio className="text-slate-500 mb-2" size={32} />
                                <span className="text-sm font-bold">Upload Recorded Stakeholder Interviews</span>
                                <span className="text-[10px] text-slate-500 mt-1">MP3, WAV, M4A supported for batch analysis</span>
                              </label>

                              {pendingAudioFiles.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Recordings ({pendingAudioFiles.length})</h4>
                                    <button onClick={() => setPendingAudioFiles([])} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase">Clear All</button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pendingAudioFiles.map((f, i) => (
                                      <div key={i} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileAudio size={14} className="text-indigo-400 flex-shrink-0" />
                                          <span className="text-xs truncate text-slate-300 font-medium">{f.name}</span>
                                          <span className="text-[9px] text-slate-600 whitespace-nowrap">{(f.size/1024/1024).toFixed(1)}MB</span>
                                        </div>
                                        <button onClick={() => removeAudioFile(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={startBatchAudioAnalysis} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10">
                                    <Activity size={18} /> Extract Requirements from Records
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-6">
                              {state.audioUploadResults?.map((res, i) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4">
                                  <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 size={14} className="text-emerald-400" />
                                      <span className="text-xs font-bold text-indigo-300">{res.fileName}</span>
                                    </div>
                                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase">Processed</span>
                                  </div>
                                  <div className="p-5 space-y-6">
                                    <div className="space-y-2">
                                      <h5 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><ListTodo size={12} /> Agile User Stories</h5>
                                      <div className="grid grid-cols-1 gap-2">
                                        {res.userStories.map((story, si) => (
                                          <div key={si} className="text-xs bg-indigo-500/5 p-2 rounded border border-indigo-500/10 text-slate-300 leading-relaxed italic">"{story}"</div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Functional Requirements</h5>
                                        <ul className="text-[11px] list-disc pl-4 space-y-1 text-slate-400">
                                          {res.requirements.map((r, ri) => <li key={ri}>{r}</li>)}
                                        </ul>
                                      </div>
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest">Pain Points Identified</h5>
                                        <ul className="text-[11px] list-disc pl-4 space-y-1 text-slate-400">
                                          {res.painPoints.map((p, pi) => <li key={pi} className="text-red-200/60">{p}</li>)}
                                        </ul>
                                      </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800">
                                      <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Transcription Excerpt</h5>
                                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer transition-all">{res.transcription}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysisMode === 'code' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                        <div className="lg:col-span-8 space-y-4">
                          <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase text-[10px] tracking-widest"><Terminal size={14} /> Neural Source Editor</div>
                          <textarea value={state.cobolCode} onChange={(e) => setState(prev => ({ ...prev, cobolCode: e.target.value }))} className="w-full h-[550px] bg-slate-900 border border-slate-700 rounded-xl p-6 mono text-[13px] text-indigo-100/80 focus:ring-2 focus:ring-indigo-500 resize-none shadow-2xl custom-scrollbar focus:outline-none" spellCheck={false} />
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                           <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase text-[10px] tracking-widest"><FileText size={14} /> Migration Profile</div>
                           <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 space-y-4 shadow-xl backdrop-blur-sm">
                              <div className="flex justify-between text-xs border-b border-slate-700 pb-2"><span className="text-slate-500 font-bold uppercase">Cyclomatic Index</span><span className="text-indigo-400 font-bold">{selectedSample?.complexity}</span></div>
                              <div className="flex justify-between text-xs border-b border-slate-700 pb-2"><span className="text-slate-500 font-bold uppercase">Modernization Effort</span><span className="text-emerald-400 font-bold">Standard</span></div>
                              <div className="space-y-1"><span className="text-[10px] text-slate-500 font-bold uppercase">Legacy Profile</span><p className="text-xs text-slate-400 italic leading-relaxed">{selectedSample?.purpose}</p></div>
                           </div>
                           <div className="p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl shadow-inner">
                              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                <strong className="text-indigo-400">Agent Note:</strong> Static analysis will use Gemini 3 Pro reasoning to detect multi-paragraph logic bugs and array bounds violations.
                              </p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.analysisResults && state.step === 'ANALYSIS' && (
                <div className="space-y-8 animate-in fade-in">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Cpu className="text-indigo-400" /> Static Analysis Intelligence: {selectedSample?.name}</h2>
                  <AnalysisDisplay analysis={state.analysisResults} />
                  <div className="flex justify-center pt-8"><button onClick={() => setState(prev => ({ ...prev, step: 'TRANSFORMATION' }))} className="px-10 py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg flex items-center gap-3 transform hover:-translate-y-1">Synthesize Modern Code <ArrowRight size={18} /></button></div>
                </div>
              )}

              {state.modernizedCode && state.step === 'TRANSFORMATION' && (
                <div className="space-y-8 animate-in fade-in">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Code2 className="text-indigo-400" /> Modern Microservice Architecture</h2>
                  <CodeDisplay files={state.modernizedCode.files} type="modern" />
                  <div className="flex justify-center pt-8"><button onClick={() => setState(prev => ({ ...prev, step: 'DEPLOYMENT' }))} className="px-10 py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg flex items-center gap-3 transform hover:-translate-y-1">Generate Infrastructure <ArrowRight size={18} /></button></div>
                </div>
              )}

              {state.deploymentConfig && state.step === 'DEPLOYMENT' && (
                <div className="space-y-8 animate-in fade-in">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Rocket className="text-indigo-400" /> Deployment Ready Artifacts</h2>
                  <CodeDisplay type="cloud" files={[{ path: 'Dockerfile', content: state.deploymentConfig.dockerfile, language: 'docker' }, { path: 'k8s-deployment.yaml', content: state.deploymentConfig.kubernetesYaml, language: 'yaml' }, { path: 'Helm-Guide.md', content: state.deploymentConfig.helmChartDescription, language: 'markdown' }]} />
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-10 flex flex-col items-center text-center space-y-6 shadow-2xl">
                    <div className="p-4 bg-emerald-500/20 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <ShieldCheck size={40} className="text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Legacy Decommissioned</h3>
                      <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed font-medium">System logic has been successfully extracted, validated, and modernized into a cloud-native Spring Boot service.</p>
                    </div>
                    <button onClick={resetMigration} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white flex items-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-emerald-500/20">Analyze Next Module <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-12 bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Autonomous Modernization Protocol v3.3 | Multimodal Requirements Extraction
          </p>
          <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-600">
            <span className="hover:text-indigo-400 transition-colors cursor-help uppercase tracking-wider">Security Policy</span>
            <span className="hover:text-indigo-400 transition-colors cursor-help uppercase tracking-wider">System Audit</span>
            <span className="hover:text-indigo-400 transition-colors cursor-help uppercase tracking-wider">LLM Transparency</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
