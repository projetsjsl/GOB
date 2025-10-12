// ========================================
// /api/gemini/chat - Function Calling (boucle minimale)
// ========================================

import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ========================================
// CONSTANTES DE CONFIGURATION
// ========================================
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Délai entre les tentatives
const REQUEST_TIMEOUT_MS = 25000; // Timeout pour chaque requête
const CIRCUIT_BREAKER_THRESHOLD = 5; // Nombre d'échecs avant d'ouvrir le circuit
const CIRCUIT_BREAKER_RESET_MS = 60000; // Temps avant de réessayer après ouverture du circuit

// État du circuit breaker
let circuitBreakerState = {
  failures: 0,
  isOpen: false,
  lastFailureTime: 0
};

// Cache simple pour éviter les appels répétés
const responseCache = new Map();
const CACHE_TTL_MS = 30000; // 30 secondes

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Vérifier l'état du circuit breaker
function checkCircuitBreaker() {
  if (!circuitBreakerState.isOpen) return true;
  
  const timeSinceFailure = Date.now() - circuitBreakerState.lastFailureTime;
  if (timeSinceFailure > CIRCUIT_BREAKER_RESET_MS) {
    console.log('🔄 Circuit breaker réinitialisé');
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failures = 0;
    return true;
  }
  
  return false;
}

// Enregistrer un échec
function recordFailure() {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    console.error('⛔ Circuit breaker ouvert - trop d\'échecs consécutifs');
  }
}

// Enregistrer un succès
function recordSuccess() {
  circuitBreakerState.failures = Math.max(0, circuitBreakerState.failures - 1);
}

// Générer une clé de cache
function getCacheKey(messages, temperature, maxTokens) {
  return JSON.stringify({ messages: messages.slice(-2), temperature, maxTokens });
}

// Vérifier le cache
function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  
  return cached.response;
}

// Mettre en cache une réponse
function cacheResponse(cacheKey, response) {
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });
  
  // Nettoyer les vieilles entrées
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}

// Wrapper avec timeout
async function fetchWithTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout dépassé')), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('❌ Clé API Gemini manquante dans les variables d\'environnement');
    return res.status(500).json({ 
      error: 'Clé API Gemini manquante',
      details: 'Configurez la variable d\'environnement GEMINI_API_KEY',
      timestamp: new Date().toISOString()
    });
  }

  // Vérifier le circuit breaker
  if (!checkCircuitBreaker()) {
    console.error('⛔ Circuit breaker ouvert - service temporairement indisponible');
    return res.status(503).json({ 
      error: 'Service temporairement indisponible',
      details: 'Trop d\'erreurs consécutives. Réessayez dans quelques instants.',
      retryAfter: Math.ceil((CIRCUIT_BREAKER_RESET_MS - (Date.now() - circuitBreakerState.lastFailureTime)) / 1000),
      timestamp: new Date().toISOString()
    });
  }

  try {
    let { messages = [], temperature = 0.3, maxTokens = 4096, systemPrompt, message } = req.body || {};

    // Compatibilité: accepter payload simple { message: "..." }
    if ((!Array.isArray(messages) || messages.length === 0) && typeof message === 'string' && message.trim()) {
      messages = [{ role: 'user', content: message.trim() }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('❌ Messages invalides:', { messages, message });
      return res.status(400).json({ error: 'messages requis (array) ou message (string)' });
    }

    console.log('✅ Messages valides reçus:', messages.length, 'messages');

    // Convertir messages UI -> contents Gemini
    const contents = [];
    // Charger le prompt personnalisé d'Emma depuis le profil financier
    const emmaPrompt = systemPrompt || `Tu es Emma, une assistante virtuelle spécialisée en analyse financière. Tu es professionnelle, experte et bienveillante.

**Ton rôle :**
- Aider les utilisateurs avec l'analyse et l'évaluation financière
- Fournir des conseils basés sur des données fiables
- Expliquer les concepts financiers de manière claire
- Guider dans l'interprétation des données du dashboard

**Règles IMPORTANTES :**
- Utilise TOUJOURS les fonctions disponibles pour extraire des données réelles (prix, news, etc.)
- N'utilise JAMAIS de chiffres "à titre d'exemple" ou fictifs
- Si une donnée est indisponible, explique-le clairement et propose une alternative
- Toujours rappeler que pour des conseils personnalisés, il faut consulter un expert qualifié
- Baser tes réponses sur les données disponibles dans le dashboard
- Être transparent sur les limites de tes conseils

**Ton style de communication :**
- Professionnelle mais accessible
- Précise et factuelle
- Encourageante et rassurante
- Réponds toujours en français

**Contexte du dashboard :**
L'utilisateur utilise un dashboard financier avec :
- Cours d'actions en temps réel
- Analyses Seeking Alpha
- Actualités financières
- Graphiques et métriques`;
    contents.push({ role: 'user', parts: [{ text: emmaPrompt }] });
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: String(m.content || '') }] });
    }

    // Vérifier le cache
    const cacheKey = getCacheKey(messages, temperature, maxTokens);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      console.log('✅ Réponse servie depuis le cache');
      return res.status(200).json({ ...cachedResponse, cached: true });
    }

    // Utiliser le SDK officiel avec modèle stable
    console.log('🔧 Initialisation Gemini avec model: gemini-1.5-flash (stable)');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Modèle stable au lieu de l'expérimental
      // Format attendu par le SDK: tableau d'outils
      tools: [ { functionDeclarations } ]
    });
    
    console.log('📤 Envoi de la requête à Gemini avec', contents.length, 'messages');
    let initialResult;
    let lastError = null;
    
    // Mécanisme de retry avec backoff exponentiel
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${MAX_RETRIES}`);
        
        // Appel avec timeout
        initialResult = await fetchWithTimeout(
          model.generateContent({
            contents,
            generationConfig: {
              temperature,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: maxTokens,
              candidateCount: 1
            }
          }),
          REQUEST_TIMEOUT_MS
        );
        
        // Succès !
        recordSuccess();
        console.log('✅ Appel Gemini réussi');
        break;
        
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || err);
        console.error(`❌ Erreur tentative ${attempt}/${MAX_RETRIES}:`, msg);
        
        // Erreurs non-récupérables
        const lower = msg.toLowerCase();
        if (lower.includes('api key') && lower.includes('not valid')) {
          recordFailure();
          return res.status(401).json({ 
            error: 'Clé API invalide',
            details: msg,
            timestamp: new Date().toISOString()
          });
        }
        if (lower.includes('permission') || lower.includes('forbidden')) {
          recordFailure();
          return res.status(403).json({ 
            error: 'Permission refusée',
            details: msg,
            timestamp: new Date().toISOString()
          });
        }
        
        // Erreurs récupérables avec retry
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Backoff exponentiel
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await sleep(delay);
        } else {
          // Dernière tentative échouée
          recordFailure();
          const status = lower.includes('quota') || lower.includes('rate limit') ? 429 : 502;
          return res.status(status).json({ 
            error: 'Erreur Gemini API après plusieurs tentatives',
            details: msg,
            attempts: MAX_RETRIES,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    if (!initialResult) {
      recordFailure();
      return res.status(502).json({ 
        error: 'Impossible de contacter l\'API Gemini',
        details: String(lastError?.message || 'Erreur inconnue'),
        timestamp: new Date().toISOString()
      });
    }
    
    const initialData = initialResult.response;
    console.log('✅ Réponse reçue de Gemini');

    // Détecter un éventuel function call
    // Le SDK renvoie un objet response; on récupère les parts et potentiels functionCall
    const candidateParts = initialData.candidates?.[0]?.content?.parts || initialData.parts || [];
    const fc = candidateParts.find(p => p?.functionCall && p.functionCall.name);

    if (!fc) {
      // Pas de function call: renvoyer le texte avec sources génériques
      const text = candidateParts?.[0]?.text || initialData.text || '';
      
      // Ajouter des sources génériques pour les réponses sans API
      const sourcesAddition = `

---
**Sources:**
• [Gemini AI](https://ai.google.dev/) - Analyse et réponse générée par l'IA
• [Connaissances d'entraînement](https://ai.google.dev/gemini-api/docs) - Données d'entraînement jusqu'en 2024`;

      const responseData = { 
        response: text + sourcesAddition, 
        source: 'gemini', 
        functionCalled: false,
        timestamp: new Date().toISOString()
      };
      
      // Mettre en cache
      cacheResponse(cacheKey, responseData);
      
      return res.status(200).json(responseData);
    }

    // Exécuter la fonction demandée
    const fnName = fc.functionCall.name;
    const fnArgs = fc.functionCall.args || {};
    let fnResult;
    try {
      fnResult = await executeFunction(fnName, fnArgs);
    } catch (e) {
      fnResult = { error: String(e?.message || e) };
    }

    // Envoyer le résultat de fonction à Gemini pour finaliser la réponse avec sources
    const sourcesPrompt = `IMPORTANT: À la fin de ta réponse, ajoute toujours une section "Sources:" avec des liens cliquables vers les sources utilisées.

DONNÉES REÇUES AVEC SOURCES:
${JSON.stringify(fnResult, null, 2)}

FORMAT DES SOURCES (à ajouter à la fin):
---
**Sources:**
• [Nom de la source](URL) - Description de ce qui a été récupéré
• [Autre source](URL) - Description

Utilise les sources fournies dans les données reçues pour créer des liens appropriés. Si des sources sont fournies dans les données, utilise-les. Sinon, suggère des sources génériques appropriées.`;

    let followUpResult;
    let followUpError = null;
    
    // Retry pour le follow-up aussi
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Follow-up tentative ${attempt}/${MAX_RETRIES}`);
        
        followUpResult = await fetchWithTimeout(
          model.generateContent({
            contents: [
              ...contents,
              { role: 'model', parts: [fc] },
              { role: 'user', parts: [{ functionResponse: { name: fnName, response: fnResult } }] },
              { role: 'user', parts: [{ text: sourcesPrompt }] }
            ],
            generationConfig: {
              temperature,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: maxTokens,
              candidateCount: 1
            }
          }),
          REQUEST_TIMEOUT_MS
        );
        
        console.log('✅ Follow-up réussi');
        break;
        
      } catch (err) {
        followUpError = err;
        const msg = String(err?.message || err);
        console.error(`❌ Erreur follow-up tentative ${attempt}/${MAX_RETRIES}:`, msg);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await sleep(delay);
        } else {
          recordFailure();
          const lower = msg.toLowerCase();
          const status = lower.includes('quota') || lower.includes('rate limit') ? 429 : 502;
          return res.status(status).json({ 
            error: 'Erreur lors du follow-up Gemini',
            details: msg,
            attempts: MAX_RETRIES,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    if (!followUpResult) {
      recordFailure();
      return res.status(502).json({ 
        error: 'Impossible de compléter le follow-up',
        details: String(followUpError?.message || 'Erreur inconnue'),
        timestamp: new Date().toISOString()
      });
    }
    const text = followUpResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || followUpResult?.response?.text || '';
    
    // Valider la réponse
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ Réponse vide reçue de Gemini');
      return res.status(500).json({ 
        error: 'Réponse vide de Gemini',
        details: 'L\'API a retourné une réponse vide',
        timestamp: new Date().toISOString()
      });
    }

    const responseData = { 
      response: text, 
      functionCalled: true, 
      functionName: fnName, 
      functionResult: fnResult, 
      source: 'gemini+fc',
      timestamp: new Date().toISOString()
    };
    
    // Mettre en cache
    cacheResponse(cacheKey, responseData);
    
    return res.status(200).json(responseData);
  } catch (e) {
    console.error('❌ Erreur dans le handler Gemini:', e);
    console.error('Stack trace:', e?.stack);
    return res.status(500).json({ 
      error: 'Erreur serveur Gemini', 
      details: String(e?.message || e),
      timestamp: new Date().toISOString()
    });
  }
}


