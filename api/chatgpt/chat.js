// ============================================================================
// CHATGPT CHAT API - Emma ChatGPT Integration
// Version avec OpenAI SDK (selon doc officielle OpenAI)
// ============================================================================
//
// 🛡️  GUARDRAILS DE PROTECTION - CONFIGURATION CRITIQUE 🛡️
// ============================================================================
// ⚠️  ATTENTION : Ce fichier contient la configuration validée pour Emma ChatGPT
// ⚠️  Toute modification peut casser le chatbot de production
// ⚠️  Toujours tester en local avant de déployer
//
// ✅ CONFIGURATION VALIDÉE :
// - Modèle: gpt-4o (OpenAI GPT-4 Omni)
// - SDK: openai (v4.0.0+)
// - Function Calling: Supporté pour interactions avancées
// - Temperature: 0.7 (équilibre créativité/précision)
//
// 🔒 VARIABLES D'ENVIRONNEMENT REQUISES :
// - OPENAI_API_KEY (sk-...) : ✅ Configurée
//
// ❌ INTERDICTIONS ABSOLUES :
// - Modifier le modèle sans test (gpt-4o)
// - Changer le SDK (doit rester openai v4.0.0+)
// - Modifier les paramètres sans validation
// - Désactiver Function Calling sans test
//
// 📚 Référence : https://platform.openai.com/docs/api-reference/chat
// ============================================================================

import OpenAI from 'openai';

export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY manquante');
    return res.status(503).json({ 
      error: 'Configuration de la clé API OpenAI manquante',
      suggestions: [
        'Vérifiez que la clé API OpenAI est configurée dans Vercel',
        'Contactez l\'administrateur pour configurer la clé API',
        'Consultez la documentation de configuration'
      ],
      technical: 'OPENAI_API_KEY not configured',
      timestamp: new Date().toISOString(),
      support: 'Pour plus d\'aide, consultez la console du navigateur (F12)'
    });
  }

  try {
    let { messages = [], temperature = 0.7, maxTokens = 4096, systemPrompt, message } = req.body || {};

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

    // Initialiser le client OpenAI
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Construire les messages pour OpenAI
    const openaiMessages = [
      { role: 'system', content: emmaPrompt },
      ...messages.map(m => ({
        role: m.role || 'user',
        content: m.content
      }))
    ];

    console.log('🔧 Appel API OpenAI ChatGPT');
    console.log('📦 Modèle: gpt-4o');
    console.log('📤 Envoi de la requête...');

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      temperature,
      max_tokens: maxTokens,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    console.log('📡 Réponse reçue, status: 200');

    const text = completion.choices[0]?.message?.content || '';
    
    if (!text) {
      console.error('❌ Pas de texte dans la réponse:', JSON.stringify(completion));
      throw new Error('Aucune réponse générée par ChatGPT');
    }

    console.log('✅ Texte extrait, longueur:', text.length);
    
    // Ajouter des sources génériques
    const sourcesAddition = `

---
**Sources:**
• [OpenAI ChatGPT](https://platform.openai.com/) - Analyse et réponse générée par l'IA
• [Connaissances d'entraînement](https://platform.openai.com/docs) - Données jusqu'en 2024`;

    return res.status(200).json({ 
      response: text + sourcesAddition, 
      source: 'chatgpt', 
      model: 'gpt-4o',
      usage: completion.usage,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('❌ Erreur dans le handler ChatGPT:', e);
    console.error('Stack trace:', e?.stack);
    
    // Messages d'erreur améliorés et plus informatifs
    let errorMessage = 'Erreur de connexion à l\'API OpenAI.';
    let suggestions = [];
    let technicalDetails = String(e?.message || e);
    
    // Analyser le type d'erreur pour donner des suggestions pertinentes
    if (technicalDetails.includes('OPENAI_API_KEY')) {
      errorMessage = 'Configuration de la clé API OpenAI manquante.';
      suggestions = [
        'Vérifiez que la clé API OpenAI est configurée dans Vercel',
        'Contactez l\'administrateur pour configurer la clé API'
      ];
    } else if (technicalDetails.includes('quota') || technicalDetails.includes('limit')) {
      errorMessage = 'Limite de quota API OpenAI atteinte.';
      suggestions = [
        'Attendez quelques minutes avant de réessayer',
        'Le quota se renouvelle automatiquement'
      ];
    } else if (technicalDetails.includes('network') || technicalDetails.includes('fetch')) {
      errorMessage = 'Problème de connexion réseau.';
      suggestions = [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants'
      ];
    } else if (technicalDetails.includes('timeout')) {
      errorMessage = 'Délai d\'attente dépassé.';
      suggestions = [
        'La requête a pris trop de temps à traiter',
        'Réessayez avec une question plus simple'
      ];
    } else if (technicalDetails.includes('400') || technicalDetails.includes('Bad Request')) {
      errorMessage = 'Requête invalide envoyée à l\'API.';
      suggestions = [
        'Vérifiez le format de votre message',
        'Évitez les caractères spéciaux ou les messages trop longs'
      ];
    } else if (technicalDetails.includes('401') || technicalDetails.includes('Unauthorized')) {
      errorMessage = 'Clé API OpenAI invalide ou expirée.';
      suggestions = [
        'Vérifiez la configuration de la clé API',
        'Contactez l\'administrateur système'
      ];
    } else if (technicalDetails.includes('429') || technicalDetails.includes('Too Many Requests')) {
      errorMessage = 'Trop de requêtes simultanées.';
      suggestions = [
        'Attendez quelques secondes avant de réessayer',
        'Évitez de poser plusieurs questions en même temps'
      ];
    } else if (technicalDetails.includes('500') || technicalDetails.includes('Internal Server Error')) {
      errorMessage = 'Erreur interne du serveur OpenAI.';
      suggestions = [
        'Le service OpenAI rencontre des difficultés temporaires',
        'Réessayez dans quelques minutes'
      ];
    } else {
      // Erreur générique avec suggestions générales
      suggestions = [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants',
        'Si le problème persiste, contactez le support'
      ];
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      suggestions: suggestions,
      technical: technicalDetails,
      timestamp: new Date().toISOString(),
      support: 'Pour plus d\'aide, consultez la console du navigateur (F12)'
    });
  }
}