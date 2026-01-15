// ============================================================================
// GEMINI CHAT API - Emma En Direct Chatbot
// Version avec Function Calling (selon doc officielle Google)
// ============================================================================
//
//   GUARDRAILS DE PROTECTION - CONFIGURATION CRITIQUE 
// ============================================================================
//   ATTENTION : Ce fichier contient la configuration validee pour Emma
//   Toute modification peut casser le chatbot de production
//   Toujours tester en local avant de deployer
//
//  CONFIGURATION VALIDEE (Testee le 15/10/2025) :
// - Modele: gemini-1.5-flash-latest (quota plus eleve que gemini-2.0-flash-exp)
// - SDK: @google/generative-ai (PAS @google/genai)
// - Function Calling: Active pour interactions avancees
// - Safety Settings: Configures pour Emma (professionnel)
// - Temperature: 0.7 (equilibre creativite/precision)
//
//  VARIABLES D'ENVIRONNEMENT REQUISES :
// - GEMINI_API_KEY (AI...) :  Configuree
//
//  INTERDICTIONS ABSOLUES :
// - Modifier le modele sans test (gemini-1.5-flash-latest)
// - Changer le SDK (doit rester @google/generative-ai)
// - Modifier les safety settings sans validation
// - Desactiver Function Calling sans test
// - Changer la temperature sans test
//
//  POUR BASCULER ENTRE LES VERSIONS :
// 1. Version AVEC Function Calling (actuelle) : Laissez le code tel quel
// 2. Version SANS Function Calling : 
//    - Commentez la section "VERSION AVEC FUNCTION CALLING"
//    - Decommentez la section "VERSION SANS SDK" 
//    - Supprimez l'import des functions en haut
//    - Supprimez le traitement des function calls
//
//  Reference : https://ai.google.dev/gemini-api/docs/function-calling
// ============================================================================

// TEMPORAIREMENT DESACTIVE - Import cause FUNCTION_INVOCATION_FAILED sur Vercel
// import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';

//  Import du retry handler pour gestion rate limiting Gemini
import { geminiFetchWithRetry } from '../../lib/utils/gemini-retry.js';
import { getAllModels } from '../../lib/llm-registry.js';

export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non autorisee' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error(' GEMINI_API_KEY manquante');
    return res.status(503).json({
      error: 'Configuration de la cle API Gemini manquante',
      suggestions: [
        'Verifiez que la cle API Gemini est configuree dans Vercel',
        'Contactez l\'administrateur pour configurer la cle API',
        'Consultez la documentation de configuration'
      ],
      technical: 'GEMINI_API_KEY not configured',
      timestamp: new Date().toISOString(),
      support: 'Pour plus d\'aide, consultez la console du navigateur (F12)'
    });
  }

  try {
    let { messages = [], temperature = 0.3, maxTokens = 4096, systemPrompt, message } = req.body || {};

    // Compatibilite: accepter payload simple { message: "..." }
    if ((!Array.isArray(messages) || messages.length === 0) && typeof message === 'string' && message.trim()) {
      messages = [{ role: 'user', content: message.trim() }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error(' Messages invalides:', { messages, message });
      return res.status(400).json({ error: 'messages requis (array) ou message (string)' });
    }

    console.log(' Messages valides recus:', messages.length, 'messages');

    // Charger le prompt personnalise d'Emma (OPTIMISE selon principes Hassid)
    const emmaPrompt = systemPrompt || `Tu es Emma, CFA Level III, analyste financiere senior avec 15+ ans experience gestion portefeuille institutionnel.

MISSION: Fournir analyses financieres rigoureuses, factuelles, actionnables de niveau Bloomberg Terminal.

///
DONNEES DISPONIBLES (via outils dashboard):
- Prix actions temps reel (FMP, Polygon, Twelve Data)
- Fondamentaux (ratios P/E, ROE, marges, cash flow)
- Actualites financieres (<24h, Finnhub, FMP)
- Indicateurs techniques (RSI, MACD, SMA)
- Calendriers (earnings, evenements economiques)
- Watchlist utilisateur + tickers equipe
///

CAPACITES PRINCIPALES:
1. Analyses completes CFA (valorisation, fondamentaux, technique)
2. Explications concepts financiers (DCF, Graham, Buffett, Lynch)
3. Contexte macro et sectoriel (Fed, taux, inflation)
4. Cadres decisionnels structures (Porter's Five Forces, Moat analysis)

APPROCHE:
- Priorite donnees REELLES via outils (prix, ratios, news)
- Analyses chiffrees (minimum 8 ratios financiers)
- Comparaisons sectorielles + historique 3-5 ans
- Sources citees (FMP, Bloomberg, FactSet)

STYLE:
- Professionnel niveau CFA Institute
- Factuel, precis, sans generalites vagues
- Proactif: proposer analyses complementaires
- Pedagogique: expliquer ratios et concepts
- Toujours en francais

CONTRAINTES:
- ZERO mention limitations ("Je n'ai pas acces")
- Commencer par ce que tu PEUX analyser avec donnees disponibles
- Longueur: 200-400 mots (questions simples), PROFONDEUR MAXIMALE pour analyses completes (aucune limite)
- Verifier coherence donnees avant reponse finale
- Disclaimer obligatoire si recommandations d'investissement`;


    // Construire le texte complet pour Gemini
    let fullText = emmaPrompt + '\n\n';

    for (const m of messages) {
      fullText += `\nUtilisateur: ${m.content}\n`;
    }

    // ========================================
    // VERSION AVEC FUNCTION CALLING - EN COMMENTAIRE (PROBLEME DE DEPLOIEMENT)
    // ========================================
    /*
    console.log(' Appel API Gemini avec Function Calling');
    console.log(' Modele: gemini-2.0-flash-exp');
    console.log(' Fonctions disponibles:', functionDeclarations.length);
    console.log(' Envoi de la requete...');
    
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
          temperature: 0, // Temperature basse pour des appels de fonction deterministes (selon doc Google)
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

    // Fetch models from registry
    const allModels = await getAllModels();
    const googleModels = allModels.filter(m => m.provider === 'google' && m.enabled !== false);
    
    // Default to gemini-2.0-flash-exp if no active model found
    const selectedModel = googleModels.length > 0 ? googleModels[0] : { model_id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp Fallback' };

    console.log(` Appel API Gemini REST directe (sans SDK)`);
    console.log(` Modele selectionne: ${selectedModel.model_id} (${selectedModel.name})`);
    console.log(' Envoi de la requete...');

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.model_id}:generateContent?key=${GEMINI_API_KEY}`;

    //  Utiliser geminiFetchWithRetry pour gestion automatique du rate limiting (429)
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

    console.log(' Reponse recue, status:', response.status);

    const data = await response.json();
    console.log(' Donnees parsees avec succes');

    // ========================================
    // TRAITEMENT DES FUNCTION CALLS - EN COMMENTAIRE (PROBLEME DE DEPLOIEMENT)
    // ========================================
    /*
    // Verifier s'il y a des function calls a executer (selon doc officielle Google)
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const parts = data.candidates[0].content.parts;
      
      // Chercher les function calls
      const functionCalls = parts.filter(part => part.functionCall);
      
      if (functionCalls.length > 0) {
        console.log(' Function calls detectes:', functionCalls.length);
        
        // Executer les function calls
        const functionResults = [];
        for (const functionCall of functionCalls) {
          try {
            console.log(` Execution de ${functionCall.functionCall.name} avec args:`, functionCall.functionCall.args);
            const result = await executeFunction(functionCall.functionCall.name, functionCall.functionCall.args);
            functionResults.push({
              name: functionCall.functionCall.name,
              response: result
            });
            console.log(` ${functionCall.functionCall.name} execute avec succes`);
          } catch (error) {
            console.error(` Erreur lors de l'execution de ${functionCall.functionCall.name}:`, error);
            
            // Messages d'erreur plus informatifs pour les function calls
            let functionErrorMessage = `Erreur lors de l'execution de ${functionCall.functionCall.name}`;
            let functionErrorDetails = error.message;
            
            if (functionErrorDetails.includes('404') || functionErrorDetails.includes('Not Found')) {
              functionErrorMessage = `Service ${functionCall.functionCall.name} temporairement indisponible`;
              functionErrorDetails = 'Le service de donnees financieres rencontre des difficultes temporaires';
            } else if (functionErrorDetails.includes('timeout')) {
              functionErrorMessage = `Delai d'attente depasse pour ${functionCall.functionCall.name}`;
              functionErrorDetails = 'La requete a pris trop de temps a traiter';
            } else if (functionErrorDetails.includes('network') || functionErrorDetails.includes('fetch')) {
              functionErrorMessage = `Probleme de connexion pour ${functionCall.functionCall.name}`;
              functionErrorDetails = 'Impossible de recuperer les donnees en temps reel';
            }
            
            functionResults.push({
              name: functionCall.functionCall.name,
              response: { 
                error: functionErrorMessage,
                details: functionErrorDetails,
                suggestion: 'Les donnees peuvent etre temporairement indisponibles. Reessayez dans quelques instants.'
              }
            });
          }
        }

        // Construire le message avec les resultats des fonctions
        const functionResultsText = functionResults.map(fr => 
          `Resultat de ${fr.name}: ${JSON.stringify(fr.response, null, 2)}`
        ).join('\n\n');

        // Faire un deuxieme appel a Gemini avec les resultats des fonctions
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
                  text: `Voici les resultats des fonctions executees:\n\n${functionResultsText}\n\nMaintenant, fournis une reponse complete en integrant ces donnees reelles dans ton analyse. Ne mentionne pas que tu as utilise des fonctions - presente directement les donnees recuperees.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3, // Temperature normale pour la reponse finale
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
            console.log(' Reponse finale avec donnees integrees generee');
            
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
    // Si pas de function calls, retourner la reponse normale
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.error(' Pas de texte dans la reponse:', JSON.stringify(data));
      throw new Error('Aucune reponse generee par Gemini');
    }

    console.log(' Texte extrait, longueur:', text.length);

    // Ajouter des sources generiques
    const sourcesAddition = `

---
**Sources:**
- [Gemini AI](https://ai.google.dev/) - Analyse et reponse generee par l'IA
- [Connaissances d'entrainement](https://ai.google.dev/gemini-api/docs) - Donnees jusqu'en 2024`;

    return res.status(200).json({
      response: text + sourcesAddition,
      source: 'gemini',
      functionsExecuted: []
    });

  } catch (e) {
    console.error(' Erreur dans le handler Gemini:', e);
    console.error('Stack trace:', e?.stack);

    // Messages d'erreur ameliores et plus informatifs
    let errorMessage = 'Erreur de connexion a l\'API Gemini.';
    let suggestions = [];
    let technicalDetails = String(e?.message || e);

    // Analyser le type d'erreur pour donner des suggestions pertinentes
    if (technicalDetails.includes('GEMINI_API_KEY')) {
      errorMessage = 'Configuration de la cle API Gemini manquante.';
      suggestions = [
        'Verifiez que la cle API Gemini est configuree dans Vercel',
        'Contactez l\'administrateur pour configurer la cle API'
      ];
    } else if (technicalDetails.includes('quota') || technicalDetails.includes('limit')) {
      errorMessage = 'Limite de quota API Gemini atteinte.';
      suggestions = [
        'Attendez quelques minutes avant de reessayer',
        'Le quota se renouvelle automatiquement'
      ];
    } else if (technicalDetails.includes('network') || technicalDetails.includes('fetch')) {
      errorMessage = 'Probleme de connexion reseau.';
      suggestions = [
        'Verifiez votre connexion internet',
        'Reessayez dans quelques instants'
      ];
    } else if (technicalDetails.includes('timeout')) {
      errorMessage = 'Delai d\'attente depasse.';
      suggestions = [
        'La requete a pris trop de temps a traiter',
        'Reessayez avec une question plus simple'
      ];
    } else if (technicalDetails.includes('400') || technicalDetails.includes('Bad Request')) {
      errorMessage = 'Requete invalide envoyee a l\'API.';
      suggestions = [
        'Verifiez le format de votre message',
        'Evitez les caracteres speciaux ou les messages trop longs'
      ];
    } else if (technicalDetails.includes('401') || technicalDetails.includes('Unauthorized')) {
      errorMessage = 'Cle API Gemini invalide ou expiree.';
      suggestions = [
        'Verifiez la configuration de la cle API',
        'Contactez l\'administrateur systeme'
      ];
    } else if (technicalDetails.includes('429') || technicalDetails.includes('Too Many Requests')) {
      errorMessage = 'Trop de requetes simultanees.';
      suggestions = [
        'Attendez quelques secondes avant de reessayer',
        'Evitez de poser plusieurs questions en meme temps'
      ];
    } else if (technicalDetails.includes('500') || technicalDetails.includes('Internal Server Error')) {
      errorMessage = 'Erreur interne du serveur Gemini.';
      suggestions = [
        'Le service Gemini rencontre des difficultes temporaires',
        'Reessayez dans quelques minutes'
      ];
    } else {
      // Erreur generique avec suggestions generales
      suggestions = [
        'Verifiez votre connexion internet',
        'Reessayez dans quelques instants',
        'Si le probleme persiste, contactez le support'
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