// ========================================
// SERVICE GEMINI POUR EMMA
// ========================================

class EmmaGeminiService {
  constructor() {
    this.apiKey = localStorage.getItem('gemini-api-key') || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.isConnected = false;
  }

  // Sauvegarder la clé API
  saveApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('gemini-api-key', apiKey);
    this.isConnected = !!apiKey;
    return this.isConnected;
  }

  // Tester la connexion
  async testConnection() {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test de connexion - réponds simplement "OK"'
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      this.isConnected = true;
      return { success: true, data };
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  // Générer une réponse avec le prompt personnalisé
  async generateResponse(userMessage, customPrompt = null) {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    // Charger le prompt personnalisé ou utiliser celui par défaut
    const prompt = customPrompt || localStorage.getItem('emma-financial-prompt') || 
      `Tu es Emma, une assistante virtuelle spécialisée en analyse financière. Réponds de manière professionnelle et utile.`;

    const fullPrompt = `${prompt}\n\nQuestion de l'utilisateur: ${userMessage}`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Réponse invalide de l\'API');
      }
    } catch (error) {
      console.error('Erreur Gemini:', error);
      throw error;
    }
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasApiKey: !!this.apiKey
    };
  }

  // Effacer la clé API
  clearApiKey() {
    this.apiKey = '';
    this.isConnected = false;
    localStorage.removeItem('gemini-api-key');
  }
}

// Instance singleton
export const emmaGeminiService = new EmmaGeminiService();
