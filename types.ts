
export interface MigrationState {
  step: 'INPUT' | 'ANALYSIS' | 'TRANSFORMATION' | 'DEPLOYMENT';
  isProcessing: boolean;
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
  requirements: ["req1", "req2"],
  painPoints: ["pain1", "pain2"],
  userStories: ["story1", "story2"],
  businessRules: ["rule1", "rule2"]
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
