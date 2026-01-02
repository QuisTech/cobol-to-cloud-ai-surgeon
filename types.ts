
export interface MigrationState {
  step: 'INPUT' | 'ANALYSIS' | 'TRANSFORMATION' | 'DEPLOYMENT';
  isProcessing: boolean;
  cobolCode: string;
  analysisResults?: AnalysisResult;
  modernizedCode?: ModernizedCode;
  deploymentConfig?: DeploymentConfig;
  error?: string;
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

export enum MigrationStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  TRANSFORMING = 'TRANSFORMING',
  PACKAGING = 'PACKAGING',
  COMPLETE = 'COMPLETE'
}
