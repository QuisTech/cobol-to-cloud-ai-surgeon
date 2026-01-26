import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ModernizedCode, DeploymentConfig, VisionAnalysisResult, VideoAnalysisResult, AudioUploadResult } from "../types";
import { SYSTEM_PROMPT } from "../constants";
import { getApiKey } from "../utils/apiKey";

/**
 * Robustly strips markdown code blocks from model responses before parsing.
 * Essential for preventing syntax errors in automated AI pipelines.
 */
const cleanJsonOutput = (text: string): string => {
  if (!text) return "";
  return text.replace(/```json\n?|```/g, "").trim();
};

export const analyzeUploadedAudio = async (base64Audio: string, mimeType: string, fileName: string): Promise<AudioUploadResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `You are a specialist Business Analyst. Analyze this recorded user interview about a legacy COBOL system migration. 
Perform the following:
1. Provide a verbatim transcription.
2. Extract functional requirements.
3. Identify pain points.
4. Generate Agile User Stories.
5. List specific business rules.

Return the result as a strict JSON object.`
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          userStories: { type: Type.ARRAY, items: { type: Type.STRING } },
          businessRules: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['transcription', 'requirements', 'painPoints', 'userStories', 'businessRules']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Neural output was empty.");
  return { ...JSON.parse(cleanJsonOutput(text)), fileName };
};

export const analyzeSystemVideo = async (videoBase64: string, mimeType: string): Promise<VideoAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Observe this legacy system walkthrough video. Act as a systems analyst and extract logic. Output JSON.`
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
  if (!text) throw new Error("Neural output was empty.");
  return JSON.parse(cleanJsonOutput(text));
};

export const analyzeCobolScreenshot = async (imageDataUrl: string): Promise<VisionAnalysisResult> => {
  const base64Data = imageDataUrl.split(',')[1];
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Analyze this mainframe screenshot and extract fields. Output JSON.`
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
  if (!text) throw new Error("Neural output was empty.");
  return JSON.parse(cleanJsonOutput(text));
};

export const analyzeCobolCode = async (code: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
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
          dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING }
        },
        required: ['bugs', 'complexityScore', 'logicFlow', 'dependencies', 'reasoning']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Neural output was empty.");
  return JSON.parse(cleanJsonOutput(text));
};

export const transformToSpringBoot = async (code: string, analysis: AnalysisResult): Promise<ModernizedCode> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
  if (!text) throw new Error("Neural output was empty.");
  return JSON.parse(cleanJsonOutput(text));
};

export const generateCloudConfig = async (modernizedCode: ModernizedCode): Promise<DeploymentConfig> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [{ text: `Generate Docker/K8s for these files. Output JSON.` }]
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
  if (!text) throw new Error("Neural output was empty.");
  return JSON.parse(cleanJsonOutput(text));
};