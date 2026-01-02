
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ModernizedCode, DeploymentConfig } from "../types";
import { SYSTEM_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeCobolCode = async (code: string): Promise<AnalysisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze the following COBOL code for bugs, complexity, and dependencies. Output the results in strict JSON format. 
    COBOL Code:
    ${code}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bugs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, description: 'critical, warning, or info' },
                description: { type: Type.STRING },
                line: { type: Type.NUMBER },
                suggestion: { type: Type.STRING }
              },
              required: ['severity', 'description', 'line', 'suggestion']
            }
          },
          complexityScore: { type: Type.NUMBER },
          logicFlow: { type: Type.STRING },
          dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['bugs', 'complexityScore', 'logicFlow', 'dependencies']
      }
    }
  });

  return JSON.parse(response.text);
};

export const transformToSpringBoot = async (code: string, analysis: AnalysisResult): Promise<ModernizedCode> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Modernize this COBOL logic into a production-ready Spring Boot 3 application.
    COBOL Logic: ${code}
    Analysis Insights: ${JSON.stringify(analysis)}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING },
                language: { type: Type.STRING }
              },
              required: ['path', 'content', 'language']
            }
          }
        },
        required: ['files']
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateCloudConfig = async (modernizedCode: ModernizedCode): Promise<DeploymentConfig> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate cloud deployment configurations for this Spring Boot application. 
    Code structure: ${modernizedCode.files.map(f => f.path).join(', ')}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dockerfile: { type: Type.STRING },
          kubernetesYaml: { type: Type.STRING },
          helmChartDescription: { type: Type.STRING }
        },
        required: ['dockerfile', 'kubernetesYaml', 'helmChartDescription']
      }
    }
  });

  return JSON.parse(response.text);
};
