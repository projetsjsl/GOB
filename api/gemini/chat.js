// ============================================================================
// GEMINI CHAT API - Emma En Direct Chatbot
// Version avec Function Calling (selon doc officielle Google)
// ============================================================================
//
// 🛡️  GUARDRAILS DE PROTECTION - CONFIGURATION CRITIQUE 🛡️
// ============================================================================
// ⚠️  ATTENTION : Ce fichier contient la configuration validée pour Emma
// ⚠️  Toute modification peut casser le chatbot de production
// ⚠️  Toujours tester en local avant de déployer
//
// ✅ CONFIGURATION VALIDÉE (Testée le 15/10/2025) :
// - Modèle: gemini-2.0-flash-exp (PAS gemini-1.5-flash)
// - SDK: @google/generative-ai (PAS @google/genai)
// - Function Calling: Activé pour interactions avancées
// - Safety Settings: Configurés pour Emma (professionnel)
// - Temperature: 0.7 (équilibre créativité/précision)
//
// 🔒 VARIABLES D'ENVIRONNEMENT REQUISES :
// - GEMINI_API_KEY (AI...) : ✅ Configurée
//
// ❌ INTERDICTIONS ABSOLUES :
// - Modifier le modèle sans test (gemini-2.0-flash-exp)
// - Changer le SDK (doit rester @google/generative-ai)
// - Modifier les safety settings sans validation
// - Désactiver Function Calling sans test
// - Changer la température sans test
//
// 🔄 POUR BASCULER ENTRE LES VERSIONS :
// 1. Version AVEC Function Calling (actuelle) : Laissez le code tel quel
// 2. Version SANS Function Calling : 
//    - Commentez la section "VERSION AVEC FUNCTION CALLING"
//    - Décommentez la section "VERSION SANS SDK" 
//    - Supprimez l'import des functions en haut
//    - Supprimez le traitement des function calls
//
// 📚 Référence : https://ai.google.dev/gemini-api/docs/function-calling
// ============================================================================

// TEMPORAIREMENT DÉSACTIVÉ - Import cause FUNCTION_INVOCATION_FAILED sur Vercel
// import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';

// ✅ Import du retry handler pour gestion rate limiting Gemini
import { geminiFetchWithRetry } from '../../lib/utils/gemini-retry.js';

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
      error: 'Configuration de la clé API Gemini manquante',
      suggestions: [
        'Vérifiez que la clé API Gemini est configurée dans Vercel',
        'Contactez l\'administrateur pour configurer la clé API',
        'Consultez la documentation de configuration'
      ],
      technical: 'GEMINI_API_KEY not configured',
      timestamp: new Date().toISOString(),
      support: 'Pour plus d\'aide, consultez la console du navigateur (F12)'
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
    const emmaPrompt = systemPrompt || `Tu es Emma, analyste financière CFA experte et assistante virtuelle d'élite. Tu es professionnelle, proactive et orientée solution.

🚨 RÈGLE ABSOLUE: ZÉRO MENTION DE LIMITATIONS
❌ STRICTEMENT INTERDIT: "Je dois vous informer...", "Je n'ai pas accès...", "Je ne peux pas...", "Limitation technique...", etc.
✅ OBLIGATOIRE: Commence TOUJOURS par ce que tu PEUX faire avec les données et connaissances disponibles.

**Ton rôle (PROACTIF) :**
- Analyser et interpréter les données financières avec expertise CFA
- Expliquer les concepts financiers de manière claire et approfondie
- Fournir des cadres d'analyse structurés (DCF, analyse fondamentale, Value Investing)
- Proposer des méthodologies d'analyse professionnelles
- Offrir des perspectives et insights basés sur tes connaissances

**Ton approche :**
✅ Utilise toutes tes connaissances financières et économiques pour fournir des analyses complètes
✅ Fournis du contexte sectoriel, historique, et macroéconomique
✅ Explique les ratios, métriques, et concepts avec exemples concrets
✅ Propose des cadres d'analyse (Buffett, Lynch, Graham) avec applications pratiques
✅ Analyse les tendances, patterns, et facteurs de valorisation
✅ Suggère des questions de suivi pertinentes pour approfondir l'analyse

**Ton style de communication :**
- Professionnelle et experte (niveau CFA/gestionnaire de portefeuille)
- Précise et factuelle avec données chiffrées quand possible
- Proactive: cherche des solutions et angles d'analyse
- Pédagogique: explique clairement les concepts complexes
- Réponds toujours en français

**Contexte du dashboard GOB :**
L'utilisateur utilise un dashboard financier JSL AI avec accès aux données de marché temps réel, actualités, et outils d'analyse avancés.

**Exemple de réponse appropriée :**
Utilisateur : "Quel est le prix d'Apple ?"
Emma : "Pour les données temps réel d'Apple (AAPL), consulte l'onglet 'Stocks & News' du dashboard qui affiche les prix en direct.

Pendant ce temps, voici ce que je peux t'apporter sur Apple:

📊 CONTEXTE D'ANALYSE:
Apple se négocie typiquement avec une prime de valorisation vs le secteur tech (P/E autour de 28-32x vs secteur 22-25x), justifiée par:
• Moat exceptionnel (ecosystème iOS, brand power, switching costs)
• Marges supérieures (25-30% net margin vs 15-20% secteur)
• Génération de FCF massive (90-100B$/an)
• Croissance services à haute marge (15-20% revenus, margins 70%+)

💡 POINTS D'ANALYSE CLÉS:
- Valorisation: Comparer P/E actuel vs moyenne historique 5 ans
- Croissance: Revenus services vs hardware mix
- Rentabilité: Marges vs concurrents (Samsung, Google)
- Cash: Programme rachats d'actions (impact EPS)

Veux-tu que j'approfondisse un aspect spécifique (valorisation, moat analysis, ou comparaison sectorielle) ?"`;


    // Construire le texte complet pour Gemini
    let fullText = emmaPrompt + '\n\n';
    
    for (const m of messages) {
      fullText += `\nUtilisateur: ${m.content}\n`;
    }

    // ========================================
    // VERSION AVEC FUNCTION CALLING - EN COMMENTAIRE (PROBLÈME DE DÉPLOIEMENT)
    // ========================================
    /*
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
    */

    // ========================================
    // VERSION SANS SDK (SANS FUNCTION CALLING) - ACTUELLE // OK
    // ========================================
    console.log('🔧 Appel API Gemini REST directe (sans SDK)');
    console.log('📦 Modèle: gemini-2.0-flash-exp');
    console.log('📤 Envoi de la requête...');

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    // ✅ Utiliser geminiFetchWithRetry pour gestion automatique du rate limiting (429)
    const response = await geminiFetchWithRetry(apiUrl, {
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
    }, {
      maxRetries: 4,
      baseDelay: 1000,
      logRetries: true
    });

    console.log('📡 Réponse reçue, status:', response.status);

    const data = await response.json();
    console.log('✅ Données parsées avec succès');

    // ========================================
    // TRAITEMENT DES FUNCTION CALLS - EN COMMENTAIRE (PROBLÈME DE DÉPLOIEMENT)
    // ========================================
    /*
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
            
            // Messages d'erreur plus informatifs pour les function calls
            let functionErrorMessage = `Erreur lors de l'exécution de ${functionCall.functionCall.name}`;
            let functionErrorDetails = error.message;
            
            if (functionErrorDetails.includes('404') || functionErrorDetails.includes('Not Found')) {
              functionErrorMessage = `Service ${functionCall.functionCall.name} temporairement indisponible`;
              functionErrorDetails = 'Le service de données financières rencontre des difficultés temporaires';
            } else if (functionErrorDetails.includes('timeout')) {
              functionErrorMessage = `Délai d'attente dépassé pour ${functionCall.functionCall.name}`;
              functionErrorDetails = 'La requête a pris trop de temps à traiter';
            } else if (functionErrorDetails.includes('network') || functionErrorDetails.includes('fetch')) {
              functionErrorMessage = `Problème de connexion pour ${functionCall.functionCall.name}`;
              functionErrorDetails = 'Impossible de récupérer les données en temps réel';
            }
            
            functionResults.push({
              name: functionCall.functionCall.name,
              response: { 
                error: functionErrorMessage,
                details: functionErrorDetails,
                suggestion: 'Les données peuvent être temporairement indisponibles. Réessayez dans quelques instants.'
              }
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
    */

    // ========================================
    // VERSION SIMPLE SANS FUNCTION CALLS (FALLBACK)
    // ========================================
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
    
    // Messages d'erreur améliorés et plus informatifs
    let errorMessage = 'Erreur de connexion à l\'API Gemini.';
    let suggestions = [];
    let technicalDetails = String(e?.message || e);
    
    // Analyser le type d'erreur pour donner des suggestions pertinentes
    if (technicalDetails.includes('GEMINI_API_KEY')) {
      errorMessage = 'Configuration de la clé API Gemini manquante.';
      suggestions = [
        'Vérifiez que la clé API Gemini est configurée dans Vercel',
        'Contactez l\'administrateur pour configurer la clé API'
      ];
    } else if (technicalDetails.includes('quota') || technicalDetails.includes('limit')) {
      errorMessage = 'Limite de quota API Gemini atteinte.';
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
      errorMessage = 'Clé API Gemini invalide ou expirée.';
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
      errorMessage = 'Erreur interne du serveur Gemini.';
      suggestions = [
        'Le service Gemini rencontre des difficultés temporaires',
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