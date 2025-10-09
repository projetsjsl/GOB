// ========================================
// SERVICE GEMINI POUR EMMA
// ========================================

class EmmaGeminiService {
  constructor() {
    // Priorité : Variable d'environnement Vercel > localStorage
    this.apiKey = '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
    this.isConnected = false;
    this.initializeApiKey();
  }

  // Initialiser la clé API de manière asynchrone
  async initializeApiKey() {
    this.apiKey = await this.getApiKey();
  }

  // Obtenir la clé API (Vercel env var en priorité)
  async getApiKey() {
    // En production sur Vercel, utiliser la variable d'environnement
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return await this.getVercelApiKey();
    }
    // En développement ou si pas sur Vercel, utiliser localStorage
    return localStorage.getItem('gemini-api-key') || '';
  }

  // Obtenir la clé API depuis Vercel (via une API route)
  async getVercelApiKey() {
    try {
      // Appeler une API route qui retourne la clé (sécurisé côté serveur)
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
    // S'assurer que la clé API est chargée
    if (!this.apiKey) {
      this.apiKey = await this.getApiKey();
    }
    
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
            temperature: 0.3, // Réduit pour analyses financières plus précises et cohérentes
            topK: 20, // Réduit pour plus de précision dans le vocabulaire financier
            topP: 0.8, // Réduit pour plus de cohérence dans les analyses
            maxOutputTokens: 4096, // Maintenu pour analyses détaillées
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
