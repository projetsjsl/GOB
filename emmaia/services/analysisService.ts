
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, PersonalityAnalysis } from "../types";
import { MODEL_TEXT_DEFAULT } from "../constants";

// We use a separate lightweight call to analyze the conversation
// without interrupting the main audio stream.
export const analyzePersonality = async (
  history: ChatMessage[], 
  apiKey: string
): Promise<PersonalityAnalysis> => {
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Filter only user and assistant messages, take last 10 for context
  const recentContext = history
    .filter(m => m.role !== 'system')
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'Client' : 'Emma IA'}: ${m.text}`)
    .join('\n');

  if (!recentContext) {
      throw new Error("No context to analyze");
  }

  const prompt = `
    Agis comme un psychologue financier expert. Analyse la conversation suivante entre un client et son assistante financière.
    Déduis-en le profil psychologique du client en temps réel.
    
    Format JSON attendu :
    {
      "riskProfile": "Conservateur" | "Modéré" | "Audacieux" | "Spéculatif",
      "riskScore": number (0-100),
      "emotionalState": string (ex: "Confiant", "Hésitant", "Stressé", "Curieux"),
      "perceivedNeeds": array of strings (max 3 besoins identifiés),
      "keyTraits": array of strings (max 3 traits de personnalité),
      "summary": string (observation courte de 15 mots max sur la dynamique)
    }

    Conversation:
    ${recentContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_DEFAULT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty analysis response");
    
    const data = JSON.parse(text);
    
    return {
      ...data,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Personality Analysis Failed:", error);
    // Return a fallback/neutral state so UI doesn't break
    return {
      riskProfile: 'Modéré',
      riskScore: 50,
      emotionalState: 'Neutre',
      perceivedNeeds: ['Analyse en cours...'],
      keyTraits: ['...'],
      summary: "En attente de données suffisantes.",
      lastUpdated: new Date()
    };
  }
};
