export interface MigrationState {
  step: 'INPUT' | 'ANALYSIS' | 'TRANSFORMATION' | 'DEPLOYMENT';
  isProcessing: boolean;
  isAutonomous?: boolean;
  cobolCode: string;
  analysisResults?: AnalysisResult;
  modernizedCode?: ModernizedCode;
  deploymentConfig?: DeploymentConfig;
  visionAnalysis?: VisionAnalysisResult;
  videoAnalysis?: VideoAnalysisResult;
  audioInterview?: AudioInterviewResult;
  audioUploadResults?: AudioUploadResult[];
  error?: string;
}

export interface VisionAnalysisResult {
  extractedText: string;
  fields: Array<{
    name: string;
    type: string;
    length: string;
  }>;
  cobolCode: string;
  businessLogic: string;
}

export interface VideoAnalysisResult {
  navigationPatterns: string[];
  uiComponents: string[];
  observedBusinessRules: string;
  performanceNotes: string;
}

export interface AudioInterviewResult {
  summary: string;
  extractedRequirements: string[];
  stakeholderPriorities: string;
}

export interface AudioUploadResult {
  fileName: string;
  transcription: string;
  requirements: string[];
  painPoints: string[];
  userStories: string[];
  businessRules: string[];
}

export interface AnalysisResult {
  bugs: Array<{
    severity: 'critical' | 'warning' | 'info';
    description: string;
    line: number;
    suggestion: string;
  }>;
  complexityScore: number;
  logicFlow: string;
  dependencies: string[];
  reasoning?: string;
}

export interface ModernizedCode {
  files: Array<{
    path: string;
    content: string;
    language: 'java' | 'xml' | 'properties';
  }>;
}

export interface DeploymentConfig {
  dockerfile: string;
  kubernetesYaml: string;
  helmChartDescription: string;
}
