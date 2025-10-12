// ========================================
// /api/gemini/chat - Version simplifiée SANS function calling
// ========================================

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
      error: 'Service temporairement indisponible',
      message: 'Configuration Gemini AI en cours. Veuillez réessayer dans quelques instants.',
      technical: 'GEMINI_API_KEY not configured'
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

    // Charger le prompt personnalisé d'Emma
    const emmaPrompt = systemPrompt || `Tu es Emma, une assistante virtuelle spécialisée en analyse financière. Tu es professionnelle, experte et bienveillante.

**Ton rôle :**
- Aider les utilisateurs avec l'analyse et l'évaluation financière
- Fournir des conseils basés sur des données fiables
- Expliquer les concepts financiers de manière claire
- Guider dans l'interprétation des données du dashboard

**Règles IMPORTANTES :**
- Baser tes réponses sur tes connaissances en analyse financière
- Toujours rappeler que pour des conseils personnalisés, il faut consulter un expert qualifié
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

    // Construire le contenu pour Gemini
    const contents = [];
    
    // Ajouter le system prompt
    contents.push({ 
      role: 'user', 
      parts: [{ text: emmaPrompt }] 
    });
    
    // Ajouter les messages de conversation
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ 
        role, 
        parts: [{ text: String(m.content || '') }] 
      });
    }

    // Initialiser Gemini SANS function calling
    console.log('🔧 Initialisation Gemini (version simplifiée sans function calling)');
    console.log('📦 Modèle: gemini-2.0-flash-exp');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
      // PAS de tools pour l'instant
    });
    
    console.log('📤 Envoi de la requête à Gemini...');
    
    const result = await model.generateContent({
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
      console.error('Stack:', err?.stack);
      throw new Error(`Erreur Gemini API: ${err?.message || err}`);
    });

    console.log('✅ Réponse reçue de Gemini');

    const response = result.response;
    const text = response.text();
    
    // Ajouter des sources génériques
    const sourcesAddition = `

---
**Sources:**
• [Gemini AI](https://ai.google.dev/) - Analyse et réponse générée par l'IA
• [Connaissances d'entraînement](https://ai.google.dev/gemini-api/docs) - Données jusqu'en 2024`;

    return res.status(200).json({ 
      response: text + sourcesAddition, 
      source: 'gemini', 
      functionCalled: false 
    });

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
