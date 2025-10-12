// ========================================
// SERVICE GEMINI POUR EMMA
// ========================================

class EmmaGeminiService {
  constructor() {
    // Priorité : Variable d'environnement Vercel > localStorage
    this.apiKey = '';
    // Aligner le modèle front avec celui du backend (modèle stable)
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    this.isConnected = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
    this.requestTimeout = 25000; // 25 secondes
    this.initializeApiKey();
  }

  // Sleep helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fetch avec timeout
  async fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Timeout - La requête a pris trop de temps');
      }
      throw error;
    }
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

  // Tester la connexion avec retry
  async testConnection() {
    let lastError = null;
    
    // 1) Essayer d'abord le backend avec retry
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Test connexion backend - Tentative ${attempt}/${this.maxRetries}`);
        
        const r = await this.fetchWithTimeout('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'ping' }],
            temperature: 0.1,
            maxTokens: 64,
            systemPrompt: 'Réponds uniquement par "OK".'
          })
        }, this.requestTimeout);
        
        if (r.ok) {
          this.isConnected = true;
          console.log('✅ Connexion backend réussie');
          return { success: true, mode: 'backend' };
        }
        
        // Analyser l'erreur
        try {
          const d = await r.json();
          if (d?.error && String(d.error).toLowerCase().includes('clé api gemini manquante')) {
            // Clé manquante côté serveur, on essaie le mode direct
            break;
          }
          lastError = new Error(d.details || d.error || `Erreur ${r.status}`);
        } catch (_) {
          lastError = new Error(`Erreur API backend: ${r.status}`);
        }
        
        // Retry si pas la dernière tentative
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await this.sleep(delay);
        }
        
      } catch (backendErr) {
        lastError = backendErr;
        console.error(`❌ Erreur backend tentative ${attempt}:`, backendErr.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // 2) Repli: test direct côté client avec retry
    if (!this.apiKey) {
      this.apiKey = await this.getApiKey();
    }
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée sur le serveur ni en local. Veuillez configurer une clé API.');
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Test connexion directe - Tentative ${attempt}/${this.maxRetries}`);
        
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Test de connexion - réponds simplement "OK"' }] }]
            })
          },
          this.requestTimeout
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur API: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        this.isConnected = true;
        console.log('✅ Connexion directe réussie');
        return { success: true, data, mode: 'direct' };
        
      } catch (error) {
        console.error(`❌ Erreur connexion directe tentative ${attempt}:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await this.sleep(delay);
        } else {
          this.isConnected = false;
          throw new Error(`Échec après ${this.maxRetries} tentatives: ${error.message}`);
        }
      }
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

  // Générer une réponse via backend Function Calling avec retry
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

    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Génération réponse - Tentative ${attempt}/${this.maxRetries}`);
        
        const r = await this.fetchWithTimeout('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, this.requestTimeout);
        
        if (!r.ok) {
          const errorData = await r.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Erreur ${r.status}`);
        }
        
        const d = await r.json();
        if (d?.response) {
          console.log('✅ Réponse générée avec succès');
          return d.response;
        }
        
        throw new Error('Réponse backend invalide ou vide');
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Erreur tentative ${attempt}:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
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
