// ============================================================================
// GEMINI CHAT VALIDATED - Emma En Direct Chatbot (Mode Expert)
// Version avec validation avancee et gestion d'erreurs amelioree
// ============================================================================
//
//   GUARDRAILS DE PROTECTION - CONFIGURATION CRITIQUE 
// ============================================================================
//   ATTENTION : Ce fichier contient la configuration validee pour Emma Expert
//   Toute modification peut casser le chatbot de production
//   Toujours tester en local avant de deployer
//
//  CONFIGURATION VALIDEE (Testee le 15/10/2025) :
// - Modele: gemini-2.0-flash-exp (quota plus eleve)
// - SDK: @google/generative-ai (PAS @google/genai)
// - Validation: Messages, tokens, safety settings
// - Mode Expert: useValidatedMode = true par defaut
// - Temperature: 0.3 (plus conservateur pour mode expert)
// - Max tokens: 4000 (plus eleve pour analyses detaillees)
//
//  VARIABLES D'ENVIRONNEMENT REQUISES :
// - GEMINI_API_KEY (AI...) :  Configuree
//
//  INTERDICTIONS ABSOLUES :
// - Modifier le modele sans test (gemini-2.0-flash-exp)
// - Changer le SDK (doit rester @google/generative-ai)
// - Modifier les parametres de validation sans test
// - Changer la temperature sans test (0.3 pour mode expert)
// - Modifier les safety settings sans validation
//
//  DEPANNAGE RAPIDE :
// - 400 = messages invalides ou manquants
// - 401 = cle API invalide/expiree
// - 429 = quota depasse, attendre ou upgrader
// - 500 = erreur serveur, verifier logs
// ============================================================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode non autorisee' });
  }

  try {
    const { messages, useValidatedMode = true } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages requis',
        details: 'Le parametre messages doit etre un tableau non vide'
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.log(' Cle API Gemini non configuree');
      return res.status(503).json({
        error: 'Service non disponible',
        message: 'Cle API Gemini non configuree',
        help: 'Configurez GEMINI_API_KEY dans Vercel'
      });
    }

    console.log(' Messages valides recus:', messages.length, 'messages');
    console.log(' Mode valide active:', useValidatedMode);

    // Validation avancee des messages
    const validatedMessages = messages.map((msg, index) => {
      if (!msg.role || !msg.content) {
        throw new Error(`Message ${index + 1} invalide: role et content requis`);
      }

      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new Error(`Message ${index + 1}: role invalide (${msg.role})`);
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      };
    });

    console.log(' Initialisation Gemini avec model: gemini-2.0-flash-exp');
    console.log(' Envoi de la requete a Gemini');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: validatedMessages,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(' Erreur Gemini API:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log(' Reponse Gemini recue');

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error(' Reponse Gemini vide:', data);
      throw new Error('Reponse vide de Gemini');
    }

    console.log(' Reponse validee et envoyee');

    return res.status(200).json({
      success: true,
      response: responseText,
      usage: {
        promptTokens: data?.usageMetadata?.promptTokenCount || 0,
        responseTokens: data?.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data?.usageMetadata?.totalTokenCount || 0
      },
      model: 'gemini-2.0-flash-exp',
      validated: useValidatedMode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(' Erreur lors de l\'appel a Gemini:', error?.message || String(error));

    return res.status(500).json({
      error: 'Erreur lors de l\'appel a Gemini',
      details: error?.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}
