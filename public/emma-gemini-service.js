// ========================================
// SERVICE GEMINI POUR EMMA
// ========================================

class EmmaGeminiService {
  constructor() {
    // Priorite : Variable d'environnement Vercel > localStorage
    this.apiKey = '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
    this.isConnected = false;
    this.initializeApiKey();
  }

  // Initialiser la cle API de maniere asynchrone
  async initializeApiKey() {
    this.apiKey = await this.getApiKey();
  }

  // Obtenir la cle API (Vercel env var en priorite)
  async getApiKey() {
    // En production sur Vercel, utiliser la variable d'environnement
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return await this.getVercelApiKey();
    }
    // En developpement ou si pas sur Vercel, utiliser localStorage
    return localStorage.getItem('gemini-api-key') || '';
  }

  // Obtenir la cle API depuis Vercel (via une API route)
  async getVercelApiKey() {
    try {
      // Appeler une API route qui retourne la cle (securise cote serveur)
      const response = await fetch('/api/gemini-key');
      if (response.ok) {
        const data = await response.json();
        return data.apiKey || '';
      }
    } catch (error) {
      console.log('Variable d\'environnement Vercel non disponible, utilisation du localStorage');
    }
    return localStorage.getItem('gemini-api-key') || '';
  }

  // Sauvegarder la cle API
  saveApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('gemini-api-key', apiKey);
    this.isConnected = !!apiKey;
    return this.isConnected;
  }

  // Tester la connexion
  async testConnection() {
    if (!this.apiKey) {
      throw new Error('Cle API Gemini non configuree');
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
              text: 'Test de connexion - reponds simplement "OK"'
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

  // Generer une reponse avec le prompt personnalise
  async generateResponse(userMessage, customPrompt = null) {
    // S'assurer que la cle API est chargee
    if (!this.apiKey) {
      this.apiKey = await this.getApiKey();
    }
    
    if (!this.apiKey) {
      throw new Error('Cle API Gemini non configuree');
    }

    // Charger le prompt personnalise ou utiliser celui par defaut
    const prompt = customPrompt || localStorage.getItem('emma-financial-prompt') || 
      `Tu es Emma, une assistante virtuelle specialisee en analyse financiere. Reponds de maniere professionnelle et utile.`;

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
            temperature: 0.3, // Reduit pour analyses financieres plus precises et coherentes
            topK: 20, // Reduit pour plus de precision dans le vocabulaire financier
            topP: 0.8, // Reduit pour plus de coherence dans les analyses
            maxOutputTokens: 4096, // Maintenu pour analyses detaillees
            candidateCount: 1,
            stopSequences: []
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
        throw new Error('Reponse invalide de l\'API');
      }
    } catch (error) {
      console.error('Erreur Gemini:', error);
      throw error;
    }
  }

  // Generer une reponse via backend Function Calling
  async generateResponseViaBackend(userMessage, history = [], customPrompt = null, cfg = {}) {
    const { temperature = 0.3, maxTokens = 4096 } = cfg;
    const systemPrompt = customPrompt || localStorage.getItem('emma-financial-prompt') ||
      `Tu es Emma, une assistante virtuelle specialisee en analyse financiere. Reponds de maniere professionnelle et utile.`;

    const payload = {
      messages: [
        ...history.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: userMessage }
      ],
      temperature,
      maxTokens,
      systemPrompt
    };

    const r = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`Erreur API backend: ${r.status}`);
    const d = await r.json();
    if (d?.response) return d.response;
    throw new Error('Reponse backend invalide');
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasApiKey: !!this.apiKey
    };
  }

  // Effacer la cle API
  clearApiKey() {
    this.apiKey = '';
    this.isConnected = false;
    localStorage.removeItem('gemini-api-key');
  }
}

// Instance singleton
export const emmaGeminiService = new EmmaGeminiService();
