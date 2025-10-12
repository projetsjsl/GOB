// ========================================
// /api/gemini/chat - Function Calling (boucle minimale)
// ========================================

import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY manquante');
    return res.status(503).json({ 
      error: 'Clé API Gemini non configurée',
      message: '⚠️ Emma IA nécessite une clé API Gemini. Configurez GEMINI_API_KEY dans les variables d\'environnement Vercel.',
      helpUrl: 'https://vercel.com/projetsjsl/gob/settings/environment-variables',
      steps: [
        '1. Obtenez une clé gratuite sur https://ai.google.dev/',
        '2. Ajoutez GEMINI_API_KEY dans Vercel',
        '3. Redéployez l\'application'
      ],
      technical: 'GEMINI_API_KEY not configured',
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

    // Utiliser le SDK officiel avec Gemini 1.5 Flash (modèle stable)
    // Note: gemini-2.5-flash causait des erreurs FUNCTION_INVOCATION_FAILED
    console.log('🔧 Initialisation Gemini avec model: gemini-1.5-flash');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: { functionDeclarations } });
    
    console.log('📤 Envoi de la requête à Gemini avec', contents.length, 'messages');
    const initialResult = await model.generateContent({
      contents,
      generationConfig: {
        temperature,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: maxTokens,
        candidateCount: 1
      }
    }).catch(err => {
      console.error('❌ Erreur lors de l\'appel à Gemini:', err?.message || err);
      throw new Error(`Erreur Gemini API: ${err?.message || err}`);
    });
    
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

      return res.status(200).json({ 
        response: text + sourcesAddition, 
        source: 'gemini', 
        functionCalled: false 
      });
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

    const followUpResult = await model.generateContent({
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
    });
    const text = followUpResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || followUpResult?.response?.text || '';

    return res.status(200).json({ response: text, functionCalled: true, functionName: fnName, functionResult: fnResult, source: 'gemini+fc' });
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


