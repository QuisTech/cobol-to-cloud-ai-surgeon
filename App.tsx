
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
  Trash2,
  Sparkles,
  Command,
  Zap,
  Lock,
  Unlock,
  X,
  Files,
  FileUp,
  FileDown,
  Eraser,
  FlaskConical,
  MonitorPlay,
  Waves
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { MigrationState, AudioUploadResult } from './types';
import { SAMPLE_PROGRAMS, INITIAL_COBOL_EXAMPLE, SAMPLE_AUDIO_BASE64, SAMPLE_VIDEO_BASE64 } from './constants';
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

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileSourceRef = useRef<HTMLInputElement>(null);

  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const selectedSample = SAMPLE_PROGRAMS.find(s => s.id === selectedSampleId);
  
  const [statusText, setStatusText] = useState<string>('');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  const [analysisMode, setAnalysisMode] = useState<'code' | 'image' | 'video' | 'audio'>('code');
  const [audioSubMode, setAudioSubMode] = useState<'live' | 'upload'>('live');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<{data: string, type: string, name: string} | null>(null);
  const [pendingAudioFiles, setPendingAudioFiles] = useState<File[]>([]);

  const [isInterviewing, setIsInterviewing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setLogMessages(prev => [msg, ...prev].slice(0, 15));
    setStatusText(msg);
  };

  /**
   * Comprehensive error handling for common cloud-native and API failure modes.
   */
  const handleApiError = (err: any) => {
    console.error('Migration Engine Failure:', err);
    const errorMsg = err?.message || err?.toString() || '';
    
    // Case 1: Rate limiting or billing issues
    if (errorMsg.includes("quota") || errorMsg.includes("429")) {
      return "Migration Capacity Exhausted: The neural pipeline is saturated. Switch to a paid Google Cloud project or wait for quota reset.";
    }
    
    // Case 2: Nginx / Cloud Run Port issues (Internal Error 500)
    if (errorMsg.includes("Internal error") || errorMsg.includes("500") || errorMsg.includes("nginx")) {
      return "Neural Link Instability: The underlying infrastructure (Nginx/Cloud Run) is experiencing a port binding error or a transient model failure. Please refresh the session.";
    }

    // Case 3: Safety filters or content blocking
    if (errorMsg.includes("safety") || errorMsg.includes("blocked")) {
      return "Logic Shield Triggered: The migration agent refused to process this code block due to security or safety policy violations.";
    }

    return errorMsg || 'Neural synthesis encountered an unhandled exception in the logic core.';
  };

  const ensureApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
    return true;
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
    setUploadedImage(null);
    setUploadedVideo(null);
    setPendingAudioFiles([]);
    setLogMessages([]);
    setStatusText('');
    setSelectedSampleId(SAMPLE_PROGRAMS[0].id);
  };

  const generateSampleScreenshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Retro Mainframe Style
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 768);
      
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillStyle = '#00FF00';
      
      // Header
      ctx.fillText('CICS V4.1  --  PAYROLL MASTER SYSTEM  --  DATE: 2023-11-14  TIME: 09:42:11', 50, 50);
      ctx.fillStyle = '#00CC00';
      ctx.fillText('--------------------------------------------------------------------------------', 50, 80);
      
      // Fields
      const drawField = (label: string, value: string, y: number, isInput = false) => {
        ctx.fillStyle = '#00FF00';
        ctx.fillText(label, 80, y);
        ctx.fillStyle = isInput ? '#FFFFFF' : '#00AA00';
        // Simulate an underscore underline for inputs
        if(isInput) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(300, y - 24, 400, 30);
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(value, 310, y);
      };

      drawField('EMPLOYEE ID:', '88492-AX', 150, true);
      drawField('DEPT CODE:', 'FIN-02', 200, true);
      drawField('PAY GRADE:', 'L-4', 250, false);
      drawField('GROSS SALARY:', '$84,500.00', 300, false);
      drawField('YTD EARNINGS:', '$68,200.50', 350, false);
      drawField('TAX BRACKET:', 'CA-04', 400, false);
      drawField('LAST PROC:', '2023-10-30', 450, false);
      drawField('ERROR CODE:', 'E-99 OVERFLOW', 550); // Intentionally adding an error for analysis
      
      // Footer
      ctx.fillStyle = '#00FF00';
      ctx.fillText('MSG: CRITICAL BATCH FAILURE IN MODULE PY004', 80, 650);
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('PF1=HELP  PF3=EXIT  PF5=REFRESH  PF9=SUBMIT_JOB', 80, 720);
    }
    setUploadedImage(canvas.toDataURL('image/jpeg'));
    addLog('Generated High-Fidelity CICS Screen Sample.');
  };

  const loadSampleAudio = () => {
    // Uses a placeholder valid WAV header base64 to allow end-to-end testing
    const byteCharacters = atob(SAMPLE_AUDIO_BASE64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new File([byteArray], "Stakeholder_Interview_Sample.wav", { type: "audio/wav" });
    setPendingAudioFiles([file]);
    addLog('Sample Interview audio loaded into staging.');
  };

  const generateSampleVideo = async () => {
    addLog('Generating synthetic behavioral video...');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a 30fps stream
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
             const base64 = (reader.result as string).split(',')[1];
             setUploadedVideo({
                 data: base64, 
                 type: 'video/webm', 
                 name: 'simulated_mainframe_session.webm'
             });
             addLog('Synthetic video sample ready for analysis.');
        };
        reader.readAsDataURL(blob);
    };

    mediaRecorder.start();

    // Animate a simple login flow
    let frame = 0;
    const maxFrames = 90; // 3 seconds at 30fps
    
    const animate = () => {
        if (frame >= maxFrames) {
            mediaRecorder.stop();
            return;
        }
        
        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 640, 480);
        ctx.font = '20px monospace';
        ctx.fillStyle = '#00FF00';
        
        ctx.fillText('SYSTEM LOGIN', 50, 50);
        ctx.fillText('USER:', 50, 100);
        
        // Typing animation
        const text = "ADMIN_ROOT";
        const charCount = Math.floor(frame / 5);
        ctx.fillText(text.substring(0, charCount) + (frame % 10 < 5 ? '_' : ''), 120, 100);

        if (frame > 60) {
            ctx.fillStyle = '#FF0000';
            ctx.fillText('ACCESS DENIED: INVALID SECURITY LEVEL', 50, 200);
        }
        
        frame++;
        requestAnimationFrame(animate);
    };
    
    animate();
  };

  const startMigration = async () => {
    if (!state.cobolCode.trim()) {
      setState(prev => ({ ...prev, error: "Source Input Required: Please paste COBOL code or upload a .CBL file before initiating the migration cycle." }));
      return;
    }
    if (state.isProcessing) return;
    try {
      await ensureApiKey();
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Agent Phase: Logic extraction initiated (Gemini 3 Pro)...');
      const analysis = await analyzeCobolCode(state.cobolCode);
      setState(prev => ({ ...prev, analysisResults: analysis, isProcessing: false, step: 'ANALYSIS' }));
      addLog('Logic graph synchronized.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const runAutoPilot = async () => {
    if (!state.cobolCode.trim()) {
      setState(prev => ({ ...prev, error: "Source Input Required: Please paste COBOL code or upload a .CBL file before initiating the migration cycle." }));
      return;
    }
    if (state.isProcessing) return;

    try {
      await ensureApiKey();
      
      // Step 1: Analysis
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Auto-Pilot: Logic extraction (Gemini 3 Pro)...');
      const analysis = await analyzeCobolCode(state.cobolCode);
      setState(prev => ({ ...prev, analysisResults: analysis, step: 'ANALYSIS' }));
      addLog('Auto-Pilot: Logic extracted. Synthesizing...');

      // Step 2: Synthesis
      const modernized = await transformToSpringBoot(state.cobolCode, analysis);
      setState(prev => ({ ...prev, modernizedCode: modernized, step: 'TRANSFORMATION' }));
      addLog('Auto-Pilot: Code synthesized. Generating Infra...');

      // Step 3: Deployment
      const config = await generateCloudConfig(modernized);
      setState(prev => ({ ...prev, deploymentConfig: config, step: 'DEPLOYMENT', isProcessing: false }));
      addLog('Auto-Pilot: Migration Complete.');

    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const initializeSynthesis = async () => {
    if (state.isProcessing || !state.analysisResults) return;
    try {
      await ensureApiKey();
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Agent Phase: Logic synthesis initiated (Gemini 3 Pro)...');
      const modernized = await transformToSpringBoot(state.cobolCode, state.analysisResults);
      setState(prev => ({ ...prev, modernizedCode: modernized, isProcessing: false, step: 'TRANSFORMATION' }));
      addLog('Modernized source tree synthesized.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const initializeInfrastructure = async () => {
    if (state.isProcessing || !state.modernizedCode) return;
    try {
      await ensureApiKey();
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Agent Phase: Infrastructure orchestration (Gemini 3 Flash)...');
      const config = await generateCloudConfig(state.modernizedCode);
      setState(prev => ({ ...prev, deploymentConfig: config, isProcessing: false, step: 'DEPLOYMENT' }));
      addLog('Cloud orchestration artifacts generated.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleAudioBatch = async () => {
    if (pendingAudioFiles.length === 0 || state.isProcessing) return;
    try {
      await ensureApiKey();
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      const results: AudioUploadResult[] = [];
      for (const file of pendingAudioFiles) {
        addLog(`Analyzing: ${file.name}...`);
        const base64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(',')[1]);
          r.readAsDataURL(file);
        });
        const res = await analyzeUploadedAudio(base64, file.type, file.name);
        results.push(res);
      }
      setState(prev => ({ ...prev, isProcessing: false, audioUploadResults: results }));
      setPendingAudioFiles([]);
      addLog('Batch requirement synchronization complete.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleVisionAnalysis = async () => {
    if (!uploadedImage || state.isProcessing) return;
    try {
      await ensureApiKey();
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('OCR: Processing UI layout...');
      const res = await analyzeCobolScreenshot(uploadedImage);
      setState(prev => ({ ...prev, isProcessing: false, visionAnalysis: res, cobolCode: res.cobolCode }));
      addLog('Schema structure mapped from Vision.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleVideoAnalysis = async () => {
    if (!uploadedVideo || state.isProcessing) return;
    try {
      await ensureApiKey();
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Video: Decoding user flow patterns...');
      const res = await analyzeSystemVideo(uploadedVideo.data, uploadedVideo.type);
      setState(prev => ({ ...prev, isProcessing: false, videoAnalysis: res }));
      addLog('Behavioral UI map extracted.');
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleFileSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setState(prev => ({ ...prev, cobolCode: content }));
        setSelectedSampleId('custom');
        addLog(`Imported: ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const startInterview = async () => {
    try {
      await ensureApiKey();
      setIsInterviewing(true);
      setTranscriptions([]);
      addLog('Establishing Neural Audio Link...');
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
              const bytes = new Uint8Array(int16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
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
          systemInstruction: 'You are an expert analyst modernizing COBOL. Gather requirements from the user.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e: any) { setIsInterviewing(false); setState(prev => ({ ...prev, error: handleApiError(e) })); }
  };

  const currentStepIndex = ['INPUT', 'ANALYSIS', 'TRANSFORMATION', 'DEPLOYMENT'].indexOf(state.step);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden text-slate-200 selection:bg-indigo-500/30">
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
          <button onClick={resetMigration} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors">
            <RefreshCw size={14} /> System Restart
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full space-y-12">
        <div className="relative flex justify-between items-center max-w-3xl mx-auto px-12 mb-10">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800/50 -z-10 -translate-y-1/2" />
          {[
            { Icon: Terminal, label: 'Ingest' },
            { Icon: ShieldCheck, label: 'Analyze' },
            { Icon: Code2, label: 'Synthesize' },
            { Icon: Rocket, label: 'Deploy' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 ${
                i <= currentStepIndex 
                  ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_25px_rgba(79,70,229,0.3)] scale-110' 
                  : 'bg-slate-900 border-slate-700 opacity-50'
              }`}>
                <item.Icon size={22} className={i <= currentStepIndex ? 'text-white' : 'text-slate-500'} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${i <= currentStepIndex ? 'text-indigo-400' : 'text-slate-600'}`}>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 min-h-[500px]">
          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col gap-4 text-red-400 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3 font-bold text-lg"><AlertTriangle className="text-red-500" size={24} /> Neural Exception</div>
              <p className="text-sm leading-relaxed">{state.error}</p>
              <button onClick={() => setState(prev => ({...prev, error: undefined}))} className="text-xs font-bold uppercase text-red-400/70 hover:text-red-400 flex items-center gap-1 w-fit">
                <X size={14} /> Clear Alert
              </button>
            </div>
          )}

          {state.isProcessing ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-10">
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
          ) : (
            <>
              {state.step === 'INPUT' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-800/20 border border-slate-700/50 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
                    <div className="flex-1 space-y-3 w-full">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Command size={14} className="text-indigo-400" /> Workspace Module
                      </label>
                      <select 
                        value={selectedSampleId} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSampleId(val);
                          const s = SAMPLE_PROGRAMS.find(p => p.id === val);
                          if (s) {
                            if (s.id === 'custom') {
                              setState(prev => ({ ...prev, cobolCode: '' }));
                              addLog('Custom workspace initialized. Paste or upload your source.');
                            } else {
                              setState(prev => ({ ...prev, cobolCode: s.code }));
                              addLog(`${s.name} loaded into core.`);
                            }
                          }
                        }} 
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none appearance-none cursor-pointer"
                      >
                        {SAMPLE_PROGRAMS.map(s => <option key={s.id} value={s.id}>{s.name} — {s.feature}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <button 
                        onClick={startMigration} 
                        disabled={state.isProcessing}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3 transition-all transform active:scale-95 group"
                      >
                        Start <Zap size={20} className="group-hover:text-yellow-400 transition-colors" />
                      </button>
                      <button 
                        onClick={runAutoPilot} 
                        disabled={state.isProcessing}
                        className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 transition-all transform active:scale-95 group"
                      >
                        Auto-Pilot <Rocket size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { id: 'code', Icon: Terminal, label: 'Source', color: 'indigo', desc: 'Direct logic analysis' },
                      { id: 'image', Icon: ImageIcon, label: 'Vision', color: 'emerald', desc: 'Screen OCR/Mapping' },
                      { id: 'video', Icon: Video, label: 'Behavior', color: 'purple', desc: 'Walkthrough Scan' },
                      { id: 'audio', Icon: Mic, label: 'Interview', color: 'blue', desc: 'Context Synthesis' }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setAnalysisMode(mode.id as any)} 
                        className={`p-6 rounded-2xl border text-left flex flex-col gap-3 transition-all relative overflow-hidden group ${
                          analysisMode === mode.id 
                            ? `bg-slate-800/80 border-indigo-500 shadow-xl ring-1 ring-indigo-500/30` 
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <mode.Icon size={24} className={analysisMode === mode.id ? `text-indigo-400` : 'text-slate-500'} />
                        <div className="flex flex-col">
                           <span className="text-xs font-bold uppercase tracking-wider">{mode.label}</span>
                           <span className="text-[10px] text-slate-500 mt-1">{mode.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 min-h-[400px] shadow-inner backdrop-blur-sm">
                    {analysisMode === 'code' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                        <div className="lg:col-span-8 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase text-[10px] tracking-widest">
                              <Terminal size={14} /> Source Editor
                            </div>
                            <div className="flex items-center gap-2">
                               <input 
                                 type="file" 
                                 ref={fileSourceRef} 
                                 className="hidden" 
                                 accept=".cbl,.cob,.txt"
                                 onChange={handleFileSourceUpload}
                               />
                               <button 
                                 onClick={() => fileSourceRef.current?.click()}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 uppercase transition-colors"
                               >
                                 <FileUp size={12} /> Upload .CBL
                               </button>
                               <button 
                                 onClick={() => setState(prev => ({ ...prev, cobolCode: '' }))}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 rounded-xl text-[10px] font-bold text-slate-300 hover:text-red-400 uppercase transition-colors"
                               >
                                 <Eraser size={12} /> Clear
                               </button>
                            </div>
                          </div>
                          <div className="relative group">
                            <textarea 
                              value={state.cobolCode} 
                              onChange={(e) => setState(prev => ({ ...prev, cobolCode: e.target.value }))} 
                              placeholder={selectedSampleId === 'custom' ? "Paste your legacy COBOL source code here for neural analysis..." : ""}
                              className="w-full h-[550px] bg-slate-900 border border-slate-700/50 rounded-2xl p-8 mono text-[13px] text-indigo-100/90 focus:ring-2 focus:ring-indigo-500/30 resize-none shadow-2xl custom-scrollbar focus:outline-none transition-all leading-relaxed" 
                              spellCheck={false} 
                            />
                            <div className="absolute right-4 bottom-4 pointer-events-none opacity-20"><Database size={48} /></div>
                          </div>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                           <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase text-[10px] tracking-widest"><FileText size={14} /> Metadata</div>
                           <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-8 space-y-6 shadow-xl backdrop-blur-md">
                              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-4">
                                <span className="text-slate-500 font-bold uppercase tracking-wider">Density</span>
                                <span className="text-indigo-400 font-bold">{selectedSample?.complexity}</span>
                              </div>
                              <div className="space-y-3">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Purpose Scope</span>
                                <p className="text-xs text-slate-400 italic leading-relaxed">{selectedSample?.purpose}</p>
                              </div>
                              {selectedSample?.bugNote && (
                                <div className="pt-4 border-t border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <AlertTriangle size={12} className="shrink-0" /> Static Analysis Warning
                                  </span>
                                  <div className="text-[11px] text-red-300/90 font-medium leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/20 shadow-inner">
                                    {selectedSample.bugNote}
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    )}

                    {analysisMode === 'image' && (
                      <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <input 
                          type="file" 
                          ref={imageInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if(f){
                              const r = new FileReader();
                              r.onloadend = () => setUploadedImage(r.result as string);
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                        {!uploadedImage ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div 
                                onClick={() => imageInputRef.current?.click()}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-10 cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group min-h-[300px]"
                             >
                                <Upload size={48} className="text-slate-500 group-hover:text-emerald-500 transition-all mb-4" />
                                <h4 className="font-bold text-lg text-slate-300">Upload Screenshot</h4>
                                <p className="text-xs text-slate-500 mt-2 text-center max-w-[200px]">Ingest 3270/5250 terminal screenshots for direct schema extraction</p>
                             </div>

                             <div 
                                onClick={generateSampleScreenshot}
                                className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/20 to-slate-800 border border-emerald-500/30 rounded-3xl p-10 cursor-pointer hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all group min-h-[300px] relative overflow-hidden"
                             >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                                <div className="p-4 bg-emerald-500/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                                   <FlaskConical size={32} className="text-emerald-400" />
                                </div>
                                <h4 className="font-bold text-lg text-emerald-100">Load CICS Sample</h4>
                                <p className="text-xs text-emerald-400/60 mt-2 text-center max-w-[200px] font-medium">Generate a high-fidelity 'Payroll Master' BMS map for robust analysis testing</p>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="relative group max-w-sm mx-auto">
                               <img src={uploadedImage} className="rounded-2xl border border-slate-700 shadow-2xl" alt="Source" />
                               <button 
                                 onClick={() => setUploadedImage(null)} 
                                 className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-400 transition-colors"
                               >
                                 <X size={16}/>
                               </button>
                            </div>
                            <button 
                              onClick={handleVisionAnalysis} 
                              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transform active:scale-95 transition-all"
                            >
                              <Eye size={20} /> Synchronize Frame Intelligence
                            </button>
                          </div>
                        )}
                        <VisionAnalysisDisplay analysis={state.visionAnalysis} />
                      </div>
                    )}

                    {analysisMode === 'video' && (
                      <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <input 
                          type="file" 
                          ref={videoInputRef} 
                          className="hidden" 
                          accept="video/*" 
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if(f){
                              const r = new FileReader();
                              r.onloadend = () => {
                                const b = (r.result as string).split(',')[1];
                                setUploadedVideo({data: b, type: f.type, name: f.name});
                              };
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                        {!uploadedVideo ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div 
                                onClick={() => videoInputRef.current?.click()}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-10 cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all group min-h-[300px]"
                             >
                                <Video size={48} className="text-slate-500 group-hover:text-purple-500 transition-all mb-4" />
                                <h4 className="font-bold text-lg text-slate-300">Upload Recording</h4>
                                <p className="text-xs text-slate-500 mt-2 text-center max-w-[200px]">Process MP4/WebM user sessions to map state transitions</p>
                             </div>

                             <div 
                                onClick={generateSampleVideo}
                                className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 to-slate-800 border border-purple-500/30 rounded-3xl p-10 cursor-pointer hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all group min-h-[300px] relative overflow-hidden"
                             >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                                <div className="p-4 bg-purple-500/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                                   <MonitorPlay size={32} className="text-purple-400" />
                                </div>
                                <h4 className="font-bold text-lg text-purple-100">Simulate Session</h4>
                                <p className="text-xs text-purple-400/60 mt-2 text-center max-w-[200px] font-medium">Generate a synthetic 'Login & Security Failure' workflow video for behavior scanning</p>
                             </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="bg-slate-800/50 p-6 rounded-3xl border border-purple-500/30 flex items-center justify-between shadow-xl">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Video size={24}/></div>
                                <div>
                                  <h4 className="text-sm font-bold">{uploadedVideo.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-mono uppercase">Staged for Behavioral Analysis</p>
                                </div>
                              </div>
                              <button onClick={() => setUploadedVideo(null)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                                <Trash2 size={18}/>
                              </button>
                            </div>
                            <button 
                              onClick={handleVideoAnalysis} 
                              className="w-full py-5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transform active:scale-95 transition-all"
                            >
                              <Play size={20} /> Execute Behavioral Deep Scan
                            </button>
                          </div>
                        )}
                        {state.videoAnalysis && (
                          <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-8 space-y-6 animate-in fade-in shadow-2xl">
                            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> UI Behavioral Map</h4>
                            <div className="grid grid-cols-2 gap-6">
                               <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Navigation Tree</span>
                                  <ul className="text-xs list-disc pl-4 mt-4 space-y-2 text-slate-300 font-medium">
                                    {state.videoAnalysis.navigationPatterns.map((p,i)=><li key={i}>{p}</li>)}
                                  </ul>
                               </div>
                               <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Screen Objects</span>
                                  <ul className="text-xs list-disc pl-4 mt-4 space-y-2 text-slate-300 font-medium">
                                    {state.videoAnalysis.uiComponents.map((p,i)=><li key={i}>{p}</li>)}
                                  </ul>
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysisMode === 'audio' && (
                       <div className="space-y-8 animate-in slide-in-from-bottom-4">
                          <div className="flex items-center justify-center p-1.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 max-w-sm mx-auto backdrop-blur-md">
                            <button onClick={() => setAudioSubMode('live')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${audioSubMode === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Mic size={14} /> Live Agent</button>
                            <button onClick={() => setAudioSubMode('upload')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${audioSubMode === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><FileAudio size={14} /> Batch Ingest</button>
                          </div>
                          {audioSubMode === 'live' ? (
                            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-3xl gap-6 shadow-inner relative">
                              <div className={`p-6 rounded-3xl bg-blue-600/10 text-blue-500 transition-all duration-700 ${isInterviewing ? 'animate-pulse scale-110 shadow-[0_0_50px_rgba(59,130,246,0.2)]' : ''}`}><Mic size={64} /></div>
                              <div className="text-center space-y-2">
                                <h4 className="text-xl font-bold">Requirement Elicitation Node</h4>
                                <p className="text-xs text-slate-500 max-w-sm">Collaborate with the Native Audio Agent to discover functional context.</p>
                              </div>
                              {!isInterviewing ? (
                                <button onClick={startInterview} className="px-10 py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95">Establish Neural Link</button>
                              ) : (
                                <button onClick={() => setIsInterviewing(false)} className="px-10 py-4 bg-red-600 rounded-2xl font-bold animate-pulse shadow-xl shadow-red-500/20 flex items-center gap-2"><Square size={16} /> Finalize Session</button>
                              )}
                              {transcriptions.length > 0 && (
                                <div className="w-full mt-6 bg-slate-950/50 p-6 rounded-2xl border border-blue-500/10 max-h-48 overflow-y-auto space-y-3 custom-scrollbar">
                                   {transcriptions.map((t,i) => <div key={i} className={`text-xs p-3 rounded-lg border shadow-sm ${t.startsWith('AI:') ? 'bg-blue-600/5 text-blue-200 border-blue-500/10' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{t}</div>)}
                                </div>
                              )}
                            </div>
                          ) : (
                             <div className="space-y-6">
                               <input 
                                 type="file" 
                                 ref={audioInputRef} 
                                 className="hidden" 
                                 multiple 
                                 accept="audio/*" 
                                 onChange={(e) => e.target.files && setPendingAudioFiles(Array.from(e.target.files))}
                               />
                               {pendingAudioFiles.length === 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div 
                                   onClick={() => audioInputRef.current?.click()}
                                   className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-10 cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group min-h-[300px]"
                                 >
                                   <FileAudio size={48} className="text-slate-500 group-hover:text-indigo-400 transition-all mb-4" />
                                   <h4 className="font-bold text-lg text-slate-300">Upload Interviews</h4>
                                   <p className="text-xs text-slate-500 mt-2 text-center max-w-[200px]">Ingest stakeholder audio sessions for batch requirement analysis</p>
                                 </div>

                                 <div 
                                    onClick={loadSampleAudio}
                                    className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/20 to-slate-800 border border-indigo-500/30 rounded-3xl p-10 cursor-pointer hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all group min-h-[300px] relative overflow-hidden"
                                 >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                                    <div className="p-4 bg-indigo-500/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                                       <Waves size={32} className="text-indigo-400" />
                                    </div>
                                    <h4 className="font-bold text-lg text-indigo-100">Load Audio Specimen</h4>
                                    <p className="text-xs text-indigo-400/60 mt-2 text-center max-w-[200px] font-medium">Inject a sample interview clip to demonstrate voice-to-requirement extraction</p>
                                 </div>
                                </div>
                               ) : (
                                 <div className="space-y-6 animate-in fade-in">
                                   <div className="bg-slate-800/50 rounded-3xl border border-indigo-500/30 p-8 shadow-2xl">
                                      <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Files size={16}/> Staged Stakeholder Data</h4>
                                        <button onClick={() => setPendingAudioFiles([])} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                                          <Trash2 size={12}/> Clear All
                                        </button>
                                      </div>
                                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {pendingAudioFiles.map((file, idx) => (
                                          <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                            <span className="text-xs font-mono text-slate-300 truncate">{file.name}</span>
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase shrink-0 ml-4">Staged</span>
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                   <button 
                                     onClick={handleAudioBatch} 
                                     className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transform active:scale-95 transition-all"
                                   >
                                     <Sparkles size={20} /> Process Bundle Synchronization
                                   </button>
                                 </div>
                               )}
                               
                               {state.audioUploadResults && state.audioUploadResults.length > 0 && (
                                 <div className="space-y-6 mt-10">
                                   <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest">
                                      <FileUp size={14}/> Extracted Stakeholder Requirements
                                   </div>
                                   {state.audioUploadResults.map((res, i) => (
                                      <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4 animate-in fade-in">
                                        <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest border-b border-slate-700 pb-2">{res.fileName}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
                                          <div className="space-y-2">
                                            <span className="text-slate-500 font-bold uppercase tracking-tighter block mb-1">Key Requirements</span>
                                            <ul className="list-disc pl-4 text-slate-300 space-y-1">
                                              {res.requirements.map((r,k)=><li key={k}>{r}</li>)}
                                            </ul>
                                          </div>
                                          <div className="space-y-2">
                                            <span className="text-slate-500 font-bold uppercase tracking-tighter block mb-1">User Stories</span>
                                            <ul className="list-disc pl-4 text-slate-300 space-y-1">
                                              {res.userStories.map((r,k)=><li key={k}>{r}</li>)}
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                   ))}
                                 </div>
                               )}
                             </div>
                          )}
                       </div>
                    )}
                  </div>
                </div>
              )}

              {state.analysisResults && state.step === 'ANALYSIS' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
                      <ShieldCheck className="text-indigo-400" /> Neural Analysis Node
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-800 rounded-full">{selectedSample?.name}</span>
                  </div>
                  <AnalysisDisplay analysis={state.analysisResults} />
                  <div className="flex justify-center pt-10">
                    <button onClick={initializeSynthesis} className="px-12 py-5 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 active:scale-95">
                      Synthesize Modern Codebase <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {state.modernizedCode && state.step === 'TRANSFORMATION' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Code2 className="text-indigo-400" /> Source Tree Synthesis</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20"><Sparkles size={12} /> Ready for Review</div>
                  </div>
                  <CodeDisplay files={state.modernizedCode.files} type="modern" />
                  <div className="flex justify-center pt-10">
                    <button onClick={initializeInfrastructure} className="px-12 py-5 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 active:scale-95">
                      Execute Cloud Infrastructure Synthesis <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {state.deploymentConfig && state.step === 'DEPLOYMENT' && (
                <div className="space-y-10 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Rocket className="text-indigo-400" /> Orchestration Artifacts</h2>
                  </div>
                  <CodeDisplay type="cloud" files={[
                    { path: 'Dockerfile', content: state.deploymentConfig.dockerfile, language: 'docker' }, 
                    { path: 'k8s-deployment.yaml', content: state.deploymentConfig.kubernetesYaml, language: 'yaml' }, 
                    { path: 'Helm-Guide.md', content: state.deploymentConfig.helmChartDescription, language: 'markdown' }
                  ]} />
                  <div className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-3xl p-16 flex flex-col items-center text-center space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                    <div className="p-6 bg-emerald-500/20 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-bounce duration-[3000ms]">
                      <ShieldCheck size={56} className="text-emerald-400" />
                    </div>
                    <div className="space-y-4 relative z-10">
                      <h3 className="text-4xl font-bold text-white tracking-tight">Mainframe Decommissioned</h3>
                      <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed font-medium">Core system logic successfully synthesized into a cloud-native Spring Boot service architecture.</p>
                    </div>
                    <button onClick={resetMigration} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white flex items-center gap-3 transition-all transform active:scale-95 shadow-xl group z-10">
                      Initiate New Node Migration <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-16 bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-8">
          <div className="flex justify-center items-center gap-4 text-slate-700">
             <div className="h-px w-20 bg-slate-800" />
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Autonomous Migration Protocol v4.0 // Neural Core</p>
             <div className="h-px w-20 bg-slate-800" />
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;
