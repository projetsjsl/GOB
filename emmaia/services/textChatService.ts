
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ContextItem, TextModel } from "../types";
import { MODEL_FLASH, MODEL_PRO } from "../constants";

export class TextChatService {
  private ai: GoogleGenAI;
  private history: ChatMessage[] = [];
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async sendMessage(
    text: string, 
    model: TextModel, 
    systemInstruction: string,
    onStream?: (text: string) => void
  ): Promise<{ response: string, contextItems: ContextItem[] }> {
    
    // Add user message to history
    this.history.push({
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    });

    const contextItems: ContextItem[] = [];
    let fullResponseText = "";

    try {
      // Prepare context from history
      const historyContext = this.history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      const prompt = `${systemInstruction}\n\nHistorique:\n${historyContext}\n\nUser: ${text}`;

      // Try primary model
      try {
         const response = await this.ai.models.generateContent({
             model: model,
             contents: prompt
         });
         fullResponseText = response.text || "";
      } catch (e) {
         console.warn(`Model ${model} failed, trying fallback to ${MODEL_PRO}`);
         if (model === MODEL_FLASH) {
             const response = await this.ai.models.generateContent({
                 model: MODEL_PRO,
                 contents: prompt
             });
             fullResponseText = response.text || "";
         } else {
             throw e;
         }
      }

      // Parse Context JSON
      const jsonMatch = fullResponseText.match(/###VISUAL_JSON_START###([\s\S]*?)###VISUAL_JSON_END###/);
      if (jsonMatch && jsonMatch[1]) {
          try {
              const data = JSON.parse(jsonMatch[1]);
              if (data.title) {
                  contextItems.push({
                      id: Date.now().toString() + '_ctx',
                      type: data.type,
                      title: data.title,
                      topic: data.topic || "Général",
                      content: data.data?.summary || data.content || JSON.stringify(data.data),
                      url: data.url,
                      timestamp: new Date(),
                      metadata: { ...data, verificationStatus: data.verificationStatus }
                  });
              }
          } catch (e) {
              console.error("Failed to parse Visual Context JSON", e);
          }
      }

      // Clean response
      const cleanText = fullResponseText.replace(/###VISUAL_JSON_START###[\s\S]*?###VISUAL_JSON_END###/g, '').trim();

      this.history.push({
          id: Date.now().toString(),
          role: 'assistant',
          text: cleanText,
          timestamp: new Date()
      });

      return { response: cleanText, contextItems };

    } catch (error: any) {
        console.error("TextChatService Error:", error);
        throw new Error(error.message || "Erreur de génération");
    }
  }

  getHistory() {
      return this.history;
  }

  clearHistory() {
      this.history = [];
  }
}
