// ========================================
// /api/gemini/chat - Version avec Function Calling (selon doc officielle Google)
// ========================================

import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';

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

    // Appeler l'API Gemini avec Function Calling (selon doc officielle Google)
    console.log('🔧 Appel API Gemini avec Function Calling');
    console.log('📦 Modèle: gemini-2.0-flash-exp');
    console.log('🛠️ Fonctions disponibles:', functionDeclarations.length);
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
        tools: [{
          functionDeclarations: functionDeclarations
        }],
        generationConfig: {
          temperature: 0, // Température basse pour des appels de fonction déterministes (selon doc Google)
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

    // Vérifier s'il y a des function calls à exécuter (selon doc officielle Google)
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const parts = data.candidates[0].content.parts;
      
      // Chercher les function calls
      const functionCalls = parts.filter(part => part.functionCall);
      
      if (functionCalls.length > 0) {
        console.log('🛠️ Function calls détectés:', functionCalls.length);
        
        // Exécuter les function calls
        const functionResults = [];
        for (const functionCall of functionCalls) {
          try {
            console.log(`🔧 Exécution de ${functionCall.functionCall.name} avec args:`, functionCall.functionCall.args);
            const result = await executeFunction(functionCall.functionCall.name, functionCall.functionCall.args);
            functionResults.push({
              name: functionCall.functionCall.name,
              response: result
            });
            console.log(`✅ ${functionCall.functionCall.name} exécuté avec succès`);
          } catch (error) {
            console.error(`❌ Erreur lors de l'exécution de ${functionCall.functionCall.name}:`, error);
            functionResults.push({
              name: functionCall.functionCall.name,
              response: { error: error.message }
            });
          }
        }

        // Construire le message avec les résultats des fonctions
        const functionResultsText = functionResults.map(fr => 
          `Résultat de ${fr.name}: ${JSON.stringify(fr.response, null, 2)}`
        ).join('\n\n');

        // Faire un deuxième appel à Gemini avec les résultats des fonctions
        const followUpPayload = {
          contents: [
            {
              parts: [
                {
                  text: `${emmaPrompt}\n\n${messages.map(m => `Utilisateur: ${m.content}`).join('\n')}`
                }
              ]
            },
            {
              parts: [
                {
                  text: `Voici les résultats des fonctions exécutées:\n\n${functionResultsText}\n\nMaintenant, fournis une réponse complète en intégrant ces données réelles dans ton analyse. Ne mentionne pas que tu as utilisé des fonctions - présente directement les données récupérées.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3, // Température normale pour la réponse finale
            topK: 20,
            topP: 0.8,
            maxOutputTokens: maxTokens,
            candidateCount: 1
          }
        };

        const followUpResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(followUpPayload)
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          if (followUpData.candidates && followUpData.candidates[0] && followUpData.candidates[0].content) {
            const finalResponse = followUpData.candidates[0].content.parts[0].text;
            console.log('✅ Réponse finale avec données intégrées générée');
            
            return res.status(200).json({
              response: finalResponse,
              source: 'gemini-with-functions',
              functionsExecuted: functionResults.map(fr => fr.name),
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    // Si pas de function calls, retourner la réponse normale
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
      functionsExecuted: []
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
