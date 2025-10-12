// ========================================
// /api/gemini/chat-validated - Function Calling avec validation en 3 étapes
// ========================================

import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ========================================
// CONSTANTES DE CONFIGURATION
// ========================================
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 25000;

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    console.error('❌ Clé API Gemini manquante');
    return res.status(500).json({ 
      error: 'Clé API Gemini manquante',
      details: 'Configurez GEMINI_API_KEY',
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
      return res.status(400).json({ error: 'Messages requis' });
    }

    // Construire le contenu pour Gemini
    const contents = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    }
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: String(m.content || '') }] });
    }

    // Utiliser le SDK officiel avec modèle stable
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Modèle stable
      tools: [ { functionDeclarations } ]
    });
    
    // ÉTAPE 1: Analyse initiale et décision d'appel de fonction avec retry
    let initialResult;
    let lastError = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${MAX_RETRIES}`);
        
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
        
        console.log('✅ Appel initial réussi');
        break;
        
      } catch (err) {
        lastError = err;
        console.error(`❌ Erreur tentative ${attempt}/${MAX_RETRIES}:`, err.message);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await sleep(delay);
        } else {
          return res.status(502).json({ 
            error: 'Erreur Gemini API',
            details: err.message,
            attempts: MAX_RETRIES,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    if (!initialResult) {
      return res.status(502).json({ 
        error: 'Impossible de contacter Gemini',
        details: String(lastError?.message || 'Erreur inconnue'),
        timestamp: new Date().toISOString()
      });
    }
    const initialData = initialResult.response;

    // Détecter un éventuel function call
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

      return res.status(200).json({ 
        response: text + sourcesAddition, 
        source: 'gemini', 
        functionCalled: false,
        validationSteps: ['Étape 1: Analyse directe - Pas d\'appel API nécessaire']
      });
    }

    // ÉTAPE 2: Exécution de la fonction avec retry et fallback
    const fnName = fc.functionCall.name;
    const fnArgs = fc.functionCall.args || {};
    let fnResult;
    let validationSteps = [`Étape 1: Décision d'appel API - ${fnName}(${JSON.stringify(fnArgs)})`];
    
    try {
      // Tentative principale
      fnResult = await executeFunction(fnName, fnArgs);
      validationSteps.push(`Étape 2a: Appel API réussi - ${fnName}`);
      
      // ÉTAPE 3: Validation des données reçues
      const validationResult = await validateApiData(fnName, fnResult, model, temperature);
      validationSteps.push(`Étape 2b: Validation des données - ${validationResult.status}`);
      
      if (validationResult.needsRetry) {
        // Retry avec source alternative si disponible
        validationSteps.push(`Étape 2c: Retry avec source alternative`);
        try {
          const retryResult = await executeFunctionWithFallback(fnName, fnArgs);
          fnResult = retryResult;
          validationSteps.push(`Étape 2d: Retry réussi`);
        } catch (retryError) {
          validationSteps.push(`Étape 2e: Retry échoué - ${retryError.message}`);
        }
      }
      
    } catch (e) {
      fnResult = { error: String(e?.message || e) };
      validationSteps.push(`Étape 2: Erreur API - ${e.message}`);
    }

    // ÉTAPE 4: Génération de la réponse finale avec validation et sources
    const finalPrompt = `Tu es Emma, assistante financière experte. Tu viens de recevoir des données d'API. 

DONNÉES REÇUES:
${JSON.stringify(fnResult, null, 2)}

ÉTAPES DE VALIDATION:
${validationSteps.join('\n')}

INSTRUCTIONS:
1. Analyse la qualité et la cohérence des données reçues
2. Si les données semblent incomplètes ou suspectes, mentionne-le
3. Fournis une analyse professionnelle basée sur ces données
4. Si des données manquent, suggère des sources alternatives
5. Adapte ton style selon la température configurée (${temperature})
6. IMPORTANT: À la fin de ta réponse, ajoute toujours une section "Sources:" avec des liens cliquables vers les sources utilisées

FORMAT DES SOURCES (à ajouter à la fin):
---
**Sources:**
• [Nom de la source](URL) - Description de ce qui a été récupéré
• [Autre source](URL) - Description

Question originale: ${messages[messages.length - 1]?.content || 'N/A'}`;

    // Follow-up avec retry
    let followUpResult;
    let followUpError = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Follow-up tentative ${attempt}/${MAX_RETRIES}`);
        
        followUpResult = await fetchWithTimeout(
          model.generateContent({
            contents: [
              ...contents,
              { role: 'model', parts: [fc] },
              { role: 'user', parts: [{ functionResponse: { name: fnName, response: fnResult } }] },
              { role: 'user', parts: [{ text: finalPrompt }] }
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
        console.error(`❌ Erreur follow-up tentative ${attempt}/${MAX_RETRIES}:`, err.message);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await sleep(delay);
        } else {
          return res.status(502).json({ 
            error: 'Erreur lors du follow-up',
            details: err.message,
            attempts: MAX_RETRIES,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    if (!followUpResult) {
      return res.status(502).json({ 
        error: 'Impossible de compléter le follow-up',
        details: String(followUpError?.message || 'Erreur inconnue'),
        timestamp: new Date().toISOString()
      });
    }
    
    const text = followUpResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || followUpResult?.response?.text || '';
    
    return res.status(200).json({ 
      response: text, 
      source: 'gemini-validated', 
      functionCalled: true,
      functionName: fnName,
      functionArgs: fnArgs,
      apiData: fnResult,
      validationSteps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API Gemini validée:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Fonction de validation des données API
async function validateApiData(functionName, data, model, temperature) {
  const validationPrompt = `Tu es un validateur de données financières. Analyse les données suivantes et détermine si elles sont complètes et cohérentes.

FONCTION: ${functionName}
DONNÉES: ${JSON.stringify(data, null, 2)}

CRITÈRES DE VALIDATION:
- Les données sont-elles complètes pour la fonction demandée ?
- Les valeurs numériques sont-elles cohérentes ?
- Y a-t-il des erreurs évidentes dans les données ?
- Les données sont-elles récentes et pertinentes ?

Réponds UNIQUEMENT avec un JSON:
{
  "status": "valid|invalid|incomplete",
  "confidence": 0.0-1.0,
  "issues": ["liste des problèmes détectés"],
  "needsRetry": true|false,
  "suggestedSources": ["sources alternatives recommandées"]
}`;

  try {
    const validationResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: validationPrompt }] }],
      generationConfig: {
        temperature: 0.1, // Température basse pour validation précise
        topK: 10,
        topP: 0.5,
        maxOutputTokens: 500,
        candidateCount: 1
      }
    });
    
    const validationText = validationResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Essayer de parser le JSON de validation
    try {
      const validation = JSON.parse(validationText);
      return validation;
    } catch (parseError) {
      // Fallback si le parsing échoue
      return {
        status: 'unknown',
        confidence: 0.5,
        issues: ['Impossible de valider automatiquement'],
        needsRetry: false,
        suggestedSources: []
      };
    }
  } catch (error) {
    return {
      status: 'error',
      confidence: 0.0,
      issues: [`Erreur de validation: ${error.message}`],
      needsRetry: false,
      suggestedSources: []
    };
  }
}

// Fonction d'exécution avec fallback
async function executeFunctionWithFallback(name, args) {
  // Pour l'instant, on utilise la même fonction mais on pourrait ajouter des sources alternatives
  // Par exemple, si Yahoo Finance échoue, essayer Alpha Vantage, puis Finnhub
  return await executeFunction(name, args);
}
