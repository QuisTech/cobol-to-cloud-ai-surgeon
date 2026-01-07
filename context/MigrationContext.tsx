import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MigrationState, AudioUploadResult } from '../types';
import { INITIAL_COBOL_EXAMPLE, SAMPLE_PROGRAMS } from '../constants';
import {
  analyzeCobolCode,
  transformToSpringBoot,
  generateCloudConfig,
  analyzeUploadedAudio,
  analyzeCobolScreenshot,
  analyzeSystemVideo,
} from '../services/geminiService';

interface MigrationContextType {
  state: MigrationState;
  setState: React.Dispatch<React.SetStateAction<MigrationState>>;
  startAutonomousMode: () => Promise<void>;
  selectedSampleId: string;
  setSelectedSampleId: (id: string) => void;
  resetMigration: () => void;
  startMigration: () => Promise<void>;
  initializeSynthesis: () => Promise<void>;
  initializeInfrastructure: () => Promise<void>;
  handleAudioBatch: (files: File[]) => Promise<void>;
  handleVisionAnalysis: (image: string) => Promise<void>;
  handleVideoAnalysis: (videoData: string, videoType: string) => Promise<void>;
  addLog: (msg: string) => void;
  logMessages: string[];
  statusText: string;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const MigrationContext = createContext<MigrationContextType | undefined>(undefined);

export const MigrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MigrationState>({
    step: 'INPUT',
    isProcessing: false,
    isAutonomous: false,
    cobolCode: INITIAL_COBOL_EXAMPLE,
    audioUploadResults: [],
  });

  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [statusText, setStatusText] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');

  const addLog = (msg: string) => {
    setLogMessages((prev) => [msg, ...prev].slice(0, 15));
    setStatusText(msg);
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

  const handleApiError = (err: unknown) => {
    console.error('Migration Engine Failure:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);

    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      return 'Migration Capacity Exhausted: The neural pipeline is saturated. Switch to a paid Google Cloud project or wait for quota reset.';
    }
    if (
      errorMsg.includes('Internal error') ||
      errorMsg.includes('500') ||
      errorMsg.includes('nginx')
    ) {
      return 'Neural Link Instability: The underlying infrastructure (Nginx/Cloud Run) is experiencing a port binding error or a transient model failure. Please refresh the session.';
    }
    if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
      return 'Logic Shield Triggered: The migration agent refused to process this code block due to security or safety policy violations.';
    }
    return errorMsg || 'Neural synthesis encountered an unhandled exception in the logic core.';
  };

  const resetMigration = () => {
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
    setLogMessages([]);
    setStatusText('');
    setSelectedSampleId(SAMPLE_PROGRAMS[0].id);
  };

  const startMigration = async () => {
    if (!state.cobolCode.trim()) {
      setState((prev) => ({
        ...prev,
        error:
          'Source Input Required: Please paste COBOL code or upload a .CBL file before initiating the migration cycle.',
      }));
      return;
    }
    if (state.isProcessing) return;
    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Agent Phase: Logic extraction initiated (Gemini 3 Pro)...');
      const analysis = await analyzeCobolCode(state.cobolCode, apiKey);
      setState((prev) => ({
        ...prev,
        analysisResults: analysis,
        isProcessing: false,
        step: 'ANALYSIS',
      }));
      addLog('Logic graph synchronized.');
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const initializeSynthesis = async () => {
    if (state.isProcessing || !state.analysisResults) return;
    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Agent Phase: Logic synthesis initiated (Gemini 3 Pro)...');
      const modernized = await transformToSpringBoot(
        state.cobolCode,
        state.analysisResults,
        apiKey,
      );
      setState((prev) => ({
        ...prev,
        modernizedCode: modernized,
        isProcessing: false,
        step: 'TRANSFORMATION',
      }));
      addLog('Modernized source tree synthesized.');
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const initializeInfrastructure = async () => {
    if (state.isProcessing || !state.modernizedCode) return;
    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Agent Phase: Infrastructure orchestration (Gemini 3 Flash)...');
      const config = await generateCloudConfig(state.modernizedCode, apiKey);
      setState((prev) => ({
        ...prev,
        deploymentConfig: config,
        isProcessing: false,
        step: 'DEPLOYMENT',
      }));
      addLog('Cloud orchestration artifacts generated.');
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleAudioBatch = async (files: File[]) => {
    if (files.length === 0 || state.isProcessing) return;
    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));
      const results: AudioUploadResult[] = [];
      for (const file of files) {
        addLog(`Analyzing: ${file.name}...`);
        const base64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(',')[1]);
          r.readAsDataURL(file);
        });
        const res = await analyzeUploadedAudio(base64, file.type, file.name, apiKey);
        results.push(res);
      }
      setState((prev) => ({ ...prev, isProcessing: false, audioUploadResults: results }));
      addLog('Batch requirement synchronization complete.');
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleVisionAnalysis = async (image: string) => {
    if (state.isProcessing) return;
    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('OCR: Processing UI layout...');
      const res = await analyzeCobolScreenshot(image, apiKey);
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        visionAnalysis: res,
        cobolCode: res.cobolCode,
      }));
      addLog('Schema structure mapped from Vision.');
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const handleVideoAnalysis = async (videoData: string, videoType: string) => {
    if (state.isProcessing) return;
    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));
      addLog('Video: Decoding user flow patterns...');
      const res = await analyzeSystemVideo(videoData, videoType, apiKey);
      setState((prev) => ({ ...prev, isProcessing: false, videoAnalysis: res }));
      addLog('Behavioral UI map extracted.');
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, isProcessing: false, error: handleApiError(err) }));
    }
  };

  const startAutonomousMode = async () => {
    if (!state.cobolCode.trim()) {
      setState((prev) => ({ ...prev, error: 'Source Input Required for Autonomous Mode' }));
      return;
    }
    if (state.isProcessing) return;

    try {
      await ensureApiKey();
      setState((prev) => ({ ...prev, isProcessing: true, isAutonomous: true, error: undefined }));

      // Step 1: Analysis
      addLog('AUTONOMOUS: Initiating Neural Cycle...');
      addLog('AUTONOMOUS: Analyzing Logic Graph...');
      const analysis = await analyzeCobolCode(state.cobolCode, apiKey);
      setState((prev) => ({ ...prev, analysisResults: analysis, step: 'ANALYSIS' }));

      // Step 2: Synthesis
      addLog('AUTONOMOUS: Synthesizing Modern Architecture...');
      await new Promise((r) => setTimeout(r, 1500)); // Pacing for UX
      const modernized = await transformToSpringBoot(state.cobolCode, analysis, apiKey);
      setState((prev) => ({ ...prev, modernizedCode: modernized, step: 'TRANSFORMATION' }));

      // Step 3: Deployment
      addLog('AUTONOMOUS: Orchestrating Cloud Artifacts...');
      await new Promise((r) => setTimeout(r, 1500));
      const config = await generateCloudConfig(modernized, apiKey);
      setState((prev) => ({
        ...prev,
        deploymentConfig: config,
        step: 'DEPLOYMENT',
        isProcessing: false,
        isAutonomous: false,
      }));
      addLog('AUTONOMOUS: Mission Complete. System Online.');
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        isAutonomous: false,
        error: handleApiError(err),
      }));
    }
  };

  return (
    <MigrationContext.Provider
      value={{
        state,
        setState,
        selectedSampleId,
        setSelectedSampleId,
        resetMigration,
        startMigration,
        startAutonomousMode,
        initializeSynthesis,
        initializeInfrastructure,
        handleAudioBatch,
        handleVisionAnalysis,
        handleVideoAnalysis,
        addLog,
        logMessages,
        statusText,
        apiKey,
        setApiKey,
      }}
    >
      {children}
    </MigrationContext.Provider>
  );
};

export const useMigration = () => {
  const context = useContext(MigrationContext);
  if (context === undefined) {
    throw new Error('useMigration must be used within a MigrationProvider');
  }
  return context;
};
