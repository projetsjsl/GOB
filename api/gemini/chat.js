// ========================================
// /api/gemini/chat - Version REST API directe (SANS SDK)
// ========================================

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

    // Construire le texte complet pour Gemini
    let fullText = emmaPrompt + '\n\n';
    
    for (const m of messages) {
      fullText += `\nUtilisateur: ${m.content}\n`;
    }

    // Appeler l'API Gemini REST directement (sans SDK)
    console.log('🔧 Appel API Gemini REST directe (sans SDK)');
    console.log('📦 Modèle: gemini-2.0-flash-exp');
    console.log('📤 Envoi de la requête...');
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullText }]
        }],
        generationConfig: {
          temperature,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: maxTokens,
          candidateCount: 1
        }
      })
    });

    console.log('📡 Réponse reçue, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API Gemini:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Données parsées avec succès');

    // Extraire le texte de la réponse
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      console.error('❌ Pas de texte dans la réponse:', JSON.stringify(data));
      throw new Error('Aucune réponse générée par Gemini');
    }

    console.log('✅ Texte extrait, longueur:', text.length);
    
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
