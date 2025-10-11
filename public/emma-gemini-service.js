// ========================================
// SERVICE GEMINI POUR EMMA
// ========================================

class EmmaGeminiService {
  constructor() {
    // Priorité : Variable d'environnement Vercel > localStorage
    this.apiKey = '';
    // Aligner le modèle front avec celui du backend pour réduire les erreurs 5xx
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent';
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
    // 1) Essayer d'abord le backend (si clé côté serveur configurée)
    try {
      const r = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          temperature: 0.1,
          maxTokens: 64,
          systemPrompt: 'Réponds uniquement par "OK".'
        })
      });
      if (r.ok) {
        this.isConnected = true;
        return { success: true, mode: 'backend' };
      }
      // Si 500 avec clé manquante, on tentera le direct
      try {
        const d = await r.json();
        if (d?.error && String(d.error).toLowerCase().includes('clé api gemini manquante')) {
          // pass -> on bascule sur le test direct
        } else {
          throw new Error(`Erreur API backend: ${r.status}`);
        }
      } catch (_) {
        // Réponse non JSON -> considérer comme erreur backend générique
        throw new Error(`Erreur API backend: ${r.status}`);
      }
    } catch (backendErr) {
      // Continuer vers le test direct si possible
    }

    // 2) Repli: test direct côté client (nécessite une clé locale)
    if (!this.apiKey) {
      this.apiKey = await this.getApiKey();
    }
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test de connexion - réponds simplement "OK"' }] }]
        })
      });
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data = await response.json();
      this.isConnected = true;
      return { success: true, data, mode: 'direct' };
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  // Générer une réponse avec le prompt personnalisé
  async generateResponse(userMessage, customPrompt = null) {
    // 1) Essayer d'abord via le backend (plus robuste et sécurisé)
    try {
      return await this.generateResponseViaBackend(userMessage, [], customPrompt);
    } catch (backendError) {
      // 2) Repli: appel direct à l'API Gemini si une clé locale est disponible
      // S'assurer que la clé API est chargée
      if (!this.apiKey) {
        this.apiKey = await this.getApiKey();
      }
      if (!this.apiKey) {
        throw backendError; // Pas de clé locale -> remonter l'erreur backend
      }

      // Charger le prompt personnalisé ou utiliser celui par défaut
      const prompt = customPrompt || localStorage.getItem('emma-financial-prompt') || 
        `Tu es Emma, une assistante virtuelle spécialisée en analyse financière. Réponds de manière professionnelle et utile.`;
      const fullPrompt = `${prompt}\n\nQuestion de l'utilisateur: ${userMessage}`;

      try {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 4096,
              candidateCount: 1,
              stopSequences: []
            }
          })
        });
        if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
        const data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        throw new Error('Réponse invalide de l\'API');
      } catch (directError) {
        console.error('Erreur Gemini (direct):', directError);
        throw directError;
      }
    }
  }

  // Générer une réponse via backend Function Calling
  async generateResponseViaBackend(userMessage, history = [], customPrompt = null, cfg = {}) {
    const { temperature = 0.3, maxTokens = 4096 } = cfg;
    const systemPrompt = customPrompt || localStorage.getItem('emma-financial-prompt') ||
      `Tu es Emma, une assistante virtuelle spécialisée en analyse financière. Réponds de manière professionnelle et utile.`;

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
    throw new Error('Réponse backend invalide');
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
