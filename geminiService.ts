
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, SystemScores, AIInsights, InputSource } from "./types";
import { SYSTEM_PROMPT } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Pre-processes files or text to extract core metrics needed for deterministic scoring.
 */
export const extractProfileMetrics = async (profile: UserProfile): Promise<NonNullable<UserProfile['detected_metrics']>> => {
  const contentToAnalyze = profile.input_sources.map(s => `Source: ${s.label}\nContent: ${s.content}`).join('\n\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract the following details from this career profile context. 
    If not explicitly found, make a reasonable inference based on common patterns.
    
    Context:
    ${contentToAnalyze}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          projects: { type: Type.ARRAY, items: { type: Type.STRING } },
          internships: { type: Type.ARRAY, items: { type: Type.STRING } },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["skills", "projects", "internships", "certifications", "interests"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Parses image data using Gemini Vision to extract text content.
 */
export const extractTextFromImage = async (base64Data: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data.split(',')[1] || base64Data,
        },
      },
      { text: "Extract all text from this image as cleanly as possible. Focus on career details, skills, and experience." },
    ],
  });
  return response.text || "";
};

/**
 * Main reasoning engine call.
 */
export const getAIInsights = async (
  profile: UserProfile,
  targetRole: string,
  scores: SystemScores
): Promise<AIInsights> => {
  // Construct the exact input JSON structure expected by the Master System Prompt
  const input = {
    user_profile: {
      name: profile.name,
      education: profile.education,
      input_sources: profile.input_sources.map(s => ({
        type: s.type,
        label: s.label,
        filename: s.filename,
        content: s.content
      }))
    },
    target_role: targetRole,
    system_scores: scores
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: JSON.stringify(input),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text) as AIInsights;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to fetch AI career insights. Please check your connection.");
  }
};
