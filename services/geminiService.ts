import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ModernizedCode, DeploymentConfig, VisionAnalysisResult, VideoAnalysisResult } from "../types";
import { SYSTEM_PROMPT } from "../constants";

export const analyzeSystemVideo = async (videoBase64: string, mimeType: string): Promise<VideoAnalysisResult> => {
  // Fresh instance to use the latest API key from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    // Switching to Flash for multimodal video analysis to provide higher rate limits and lower quota usage
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Observe this legacy system walkthrough video. Act as a systems analyst and extract:
1. Navigation Patterns: How do users move through the legacy UI?
2. UI Components: Identify key screen elements and data tables.
3. Observed Business Rules: Any logic inferred from screen transitions or error messages.
4. Performance Characteristics: Latency or batch-processing indicators visible.

Return JSON in this format:
{
  "navigationPatterns": ["list of strings"],
  "uiComponents": ["list of strings"],
  "observedBusinessRules": "summary string",
  "performanceNotes": "summary string"
}`
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: videoBase64
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          navigationPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          uiComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
          observedBusinessRules: { type: Type.STRING },
          performanceNotes: { type: Type.STRING }
        },
        required: ['navigationPatterns', 'uiComponents', 'observedBusinessRules', 'performanceNotes']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Video analysis failed to return data.");
  return JSON.parse(text);
};

export const analyzeCobolScreenshot = async (imageDataUrl: string): Promise<VisionAnalysisResult> => {
  const base64Data = imageDataUrl.split(',')[1];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Analyze this mainframe screenshot and extract fields, business rules, and COBOL structures. Output JSON.`
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extractedText: { type: Type.STRING },
          fields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                length: { type: Type.STRING }
              },
              required: ['name', 'type', 'length']
            }
          },
          cobolCode: { type: Type.STRING },
          businessLogic: { type: Type.STRING }
        },
        required: ['extractedText', 'fields', 'cobolCode', 'businessLogic']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Vision analysis failed.");
  return JSON.parse(text);
};

export const analyzeCobolCode = async (code: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    // Pro is used for deep logic and bug detection
    model: 'gemini-3-pro-preview',
    contents: { 
      parts: [{ text: `Analyze the following COBOL code for bugs and logic. Output JSON.\n\nCOBOL Code:\n${code}` }] 
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4096 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bugs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING },
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

  const text = response.text;
  if (!text) throw new Error("Analysis failed.");
  return JSON.parse(text);
};

export const transformToSpringBoot = async (code: string, analysis: AnalysisResult): Promise<ModernizedCode> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { 
      parts: [{ text: `Modernize COBOL to Spring Boot. Output JSON array of files.\n\nCode:\n${code}\n\nAnalysis:\n${JSON.stringify(analysis)}` }] 
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 8192 },
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

  const text = response.text;
  if (!text) throw new Error("Transformation failed.");
  return JSON.parse(text);
};

export const generateCloudConfig = async (modernizedCode: ModernizedCode): Promise<DeploymentConfig> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    // Cloud configuration generation is standard and works well on Flash
    model: 'gemini-3-flash-preview',
    contents: { 
      parts: [{ text: `Generate Docker/K8s for these files: ${modernizedCode.files.map(f => f.path).join(', ')}` }] 
    },
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

  const text = response.text;
  if (!text) throw new Error("Cloud config failed.");
  return JSON.parse(text);
};
