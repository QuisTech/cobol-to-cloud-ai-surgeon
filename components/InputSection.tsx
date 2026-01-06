
import React, { useRef, useState, useEffect } from 'react';
import {
    Command,
    Zap,
    Terminal,
    Image as ImageIcon,
    Video,
    Mic,
    Files,
    FileUp,
    Eraser,
    FileText,
    AlertTriangle,
    Upload,
    X,
    Trash2,
    Play,
    Square,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Code2,
    Rocket
} from 'lucide-react';
import { useMigration } from '../context/MigrationContext';
import { SAMPLE_PROGRAMS } from '../constants';
import VisionAnalysisDisplay from './VisionAnalysisDisplay';
import AnalysisDisplay from './AnalysisDisplay';
import CodeDisplay from './CodeDisplay';
import { GoogleGenAI, Modality } from '@google/genai';

const InputSection: React.FC = () => {
    const {
        state,
        setState,
        selectedSampleId,
        setSelectedSampleId,
        startMigration,
        addLog,
        handleVisionAnalysis,
        handleVideoAnalysis,
        handleAudioBatch,
        initializeSynthesis,
        initializeInfrastructure
    } = useMigration();

    const selectedSample = SAMPLE_PROGRAMS.find(s => s.id === selectedSampleId);

    const [analysisMode, setAnalysisMode] = useState<'code' | 'image' | 'video' | 'audio'>('code');
    const [audioSubMode, setAudioSubMode] = useState<'live' | 'upload'>('live');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedVideo, setUploadedVideo] = useState<{ data: string, type: string, name: string } | null>(null);
    const [pendingAudioFiles, setPendingAudioFiles] = useState<File[]>([]);
    const [isInterviewing, setIsInterviewing] = useState(false);
    const [transcriptions, setTranscriptions] = useState<string[]>([]);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const fileSourceRef = useRef<HTMLInputElement>(null);

    // Audio Refs
    const nextStartTimeRef = useRef(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outNodeRef = useRef<GainNode | null>(null);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const sessionRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (sessionRef.current) {
                try { sessionRef.current.close(); } catch (e) { }
            }
            sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) { } });
        };
    }, []);

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

    const ensureApiKey = async () => {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }
        return true;
    };

    const startInterview = async () => {
        try {
            await ensureApiKey();
            setIsInterviewing(true);
            setTranscriptions([]);
            addLog('Establishing Neural Audio Link...');

            const apiKey = process.env.API_KEY || ''; // Fallback or strict check
            const ai = new GoogleGenAI({ apiKey });

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const inCtx = new AudioContextClass({ sampleRate: 16000 });
            const outCtx = new AudioContextClass({ sampleRate: 24000 });

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
                            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
                            const bytes = new Uint8Array(int16.buffer);
                            let binary = '';
                            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' } }));
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
                    onerror: (e: any) => { setIsInterviewing(false); setState(prev => ({ ...prev, error: e.message || String(e) })); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: 'You are an expert analyst modernizing COBOL. Gather requirements from the user.'
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e: any) {
            setIsInterviewing(false);
            setState(prev => ({ ...prev, error: e.message || String(e) }));
        }
    };

    const renderInputControls = () => (
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
                <button
                    onClick={startMigration}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 px-12 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3 transition-all transform active:scale-95 group"
                >
                    Start Neural Cycle <Zap size={20} className="group-hover:text-yellow-400 transition-colors" />
                </button>
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
                        className={`p-6 rounded-2xl border text-left flex flex-col gap-3 transition-all relative overflow-hidden group ${analysisMode === mode.id
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
                                if (f) {
                                    const r = new FileReader();
                                    r.onloadend = () => {
                                        const result = r.result as string;
                                        setUploadedImage(result);
                                    };
                                    r.readAsDataURL(f);
                                }
                            }}
                        />
                        {!uploadedImage ? (
                            <div
                                onClick={() => imageInputRef.current?.click()}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-20 cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                            >
                                <Upload size={48} className="text-slate-500 group-hover:text-emerald-500 transition-all mb-4" />
                                <h4 className="font-bold text-lg">Screenshot OCR Workspace</h4>
                                <p className="text-xs text-slate-500 mt-2 text-center">Incorporate mainframe frames to auto-discover schema fields</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative group max-w-sm mx-auto">
                                    <img src={uploadedImage} className="rounded-2xl border border-slate-700 shadow-2xl" alt="Source" />
                                    <button
                                        onClick={() => setUploadedImage(null)}
                                        className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-400 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => uploadedImage && handleVisionAnalysis(uploadedImage)}
                                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transform active:scale-95 transition-all"
                                >
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white animate-pulse" /> Synchronize Frame Intelligence</div>
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
                                if (f) {
                                    const r = new FileReader();
                                    r.onloadend = () => {
                                        const content = r.result as string;
                                        const b = content.split(',')[1];
                                        setUploadedVideo({ data: b, type: f.type, name: f.name });
                                    };
                                    r.readAsDataURL(f);
                                }
                            }}
                        />
                        {!uploadedVideo ? (
                            <div
                                onClick={() => videoInputRef.current?.click()}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-20 cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
                            >
                                <Video size={48} className="text-slate-500 group-hover:text-purple-500 mb-4 transition-all" />
                                <h4 className="font-bold text-lg text-center">Behavioral Walkthrough Scan</h4>
                                <p className="text-xs text-slate-500 mt-2">Walkthrough analysis to detect state transitions</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-slate-800/50 p-6 rounded-3xl border border-purple-500/30 flex items-center justify-between shadow-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Video size={24} /></div>
                                        <div>
                                            <h4 className="text-sm font-bold">{uploadedVideo.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-mono uppercase">Staged for Behavioral Analysis</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setUploadedVideo(null)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => uploadedVideo && handleVideoAnalysis(uploadedVideo.data, uploadedVideo.type)}
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
                                            {state.videoAnalysis.navigationPatterns.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Screen Objects</span>
                                        <ul className="text-xs list-disc pl-4 mt-4 space-y-2 text-slate-300 font-medium">
                                            {state.videoAnalysis.uiComponents.map((p, i) => <li key={i}>{p}</li>)}
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
                            <button onClick={() => setAudioSubMode('upload')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${audioSubMode === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><FileText size={14} /> Batch Ingest</button>
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
                                        {transcriptions.map((t, i) => <div key={i} className={`text-xs p-3 rounded-lg border shadow-sm ${t.startsWith('AI:') ? 'bg-blue-600/5 text-blue-200 border-blue-500/10' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{t}</div>)}
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
                                    <div
                                        onClick={() => audioInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-3xl gap-6 shadow-inner hover:border-indigo-500 transition-all group cursor-pointer"
                                    >
                                        <FileText size={64} className="text-indigo-400 group-hover:scale-110 transition-transform mb-4" />
                                        <div className="text-center">
                                            <h4 className="text-xl font-bold">Ingest Recorded Interviews</h4>
                                            <p className="text-xs text-slate-500 mt-2 font-medium">Upload stakeholder sessions for batch requirement analysis</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="bg-slate-800/50 rounded-3xl border border-indigo-500/30 p-8 shadow-2xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Files size={16} /> Staged Stakeholder Data</h4>
                                                <button onClick={() => setPendingAudioFiles([])} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                                                    <Trash2 size={12} /> Clear All
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
                                            onClick={() => handleAudioBatch(pendingAudioFiles)}
                                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transform active:scale-95 transition-all"
                                        >
                                            <Sparkles size={20} /> Process Bundle Synchronization
                                        </button>
                                    </div>
                                )}

                                {state.audioUploadResults && state.audioUploadResults.length > 0 && (
                                    <div className="space-y-6 mt-10">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest">
                                            <FileUp size={14} /> Extracted Stakeholder Requirements
                                        </div>
                                        {state.audioUploadResults.map((res, i) => (
                                            <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4 animate-in fade-in">
                                                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest border-b border-slate-700 pb-2">{res.fileName}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
                                                    <div className="space-y-2">
                                                        <span className="text-slate-500 font-bold uppercase tracking-tighter block mb-1">Key Requirements</span>
                                                        <ul className="list-disc pl-4 text-slate-300 space-y-1">
                                                            {res.requirements.map((r, k) => <li key={k}>{r}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-slate-500 font-bold uppercase tracking-tighter block mb-1">User Stories</span>
                                                        <ul className="list-disc pl-4 text-slate-300 space-y-1">
                                                            {res.userStories.map((r, k) => <li key={k}>{r}</li>)}
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
    );

    const renderAnalysis = () => (
        <div className="space-y-10 animate-in fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
                    <ShieldCheck className="text-indigo-400" /> Neural Analysis Node
                </h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-800 rounded-full">{selectedSample?.name}</span>
            </div>
            {state.analysisResults && <AnalysisDisplay analysis={state.analysisResults} />}
            <div className="flex justify-center pt-10">
                <button onClick={initializeSynthesis} className="px-12 py-5 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 active:scale-95">
                    Synthesize Modern Codebase <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderTransformation = () => (
        <div className="space-y-10 animate-in fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Code2 size={24} className="text-indigo-400" /> Source Tree Synthesis</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20"><Sparkles size={12} /> Ready for Review</div>
            </div>
            {state.modernizedCode && <CodeDisplay files={state.modernizedCode.files} type="modern" />}
            <div className="flex justify-center pt-10">
                <button onClick={initializeInfrastructure} className="px-12 py-5 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 active:scale-95">
                    Execute Cloud Infrastructure Synthesis <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderDeployment = () => (
        <div className="space-y-10 animate-in fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3 tracking-tight"><Rocket className="text-indigo-400" /> Orchestration Artifacts</h2>
            </div>
            {state.deploymentConfig && (
                <CodeDisplay type="cloud" files={[
                    { path: 'Dockerfile', content: state.deploymentConfig.dockerfile, language: 'docker' },
                    { path: 'k8s-deployment.yaml', content: state.deploymentConfig.kubernetesYaml, language: 'yaml' },
                    { path: 'Helm-Guide.md', content: state.deploymentConfig.helmChartDescription, language: 'markdown' }
                ]} />
            )}
        </div>
    );

    if (state.step === 'ANALYSIS') return renderAnalysis();
    if (state.step === 'TRANSFORMATION') return renderTransformation();
    if (state.step === 'DEPLOYMENT') return renderDeployment();
    return renderInputControls();
};

export default InputSection;
