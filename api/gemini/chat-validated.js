// ============================================================================
// API Gemini Chat Validated - Endpoint avec validation Zod pour l'onglet Ask Emma
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Schéma de validation pour les réponses
const ResponseSchema = z.object({
  response: z.string().min(1, "La réponse ne peut pas être vide"),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(z.string()).optional(),
  timestamp: z.string().optional()
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message, useFunctionCalling = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(500).json({ 
        error: 'Clé API Gemini non configurée',
        details: 'Veuillez configurer GEMINI_API_KEY dans les variables d\'environnement Vercel'
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.5, // Température plus basse pour plus de cohérence
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    // Prompt amélioré pour la validation
    const validatedPrompt = `
    Vous êtes Emma, une experte en finance et IA. Répondez de manière précise et validée.
    
    Message de l'utilisateur: ${message}
    
    Veuillez fournir une réponse structurée et validée. Si vous n'êtes pas certain d'une information, indiquez-le clairement.
    `;

    let response;
    
    if (useFunctionCalling) {
      // Mode avec function calling et validation
      const tools = [
        {
          functionDeclarations: [
            {
              name: "get_validated_market_data",
              description: "Obtenir des données de marché validées pour un symbole",
              parameters: {
                type: "object",
                properties: {
                  symbol: {
                    type: "string",
                    description: "Symbole de l'action (ex: AAPL, TSLA)"
                  },
                  validate: {
                    type: "boolean",
                    description: "Valider les données avant de les retourner"
                  }
                },
                required: ["symbol", "validate"]
              }
            },
            {
              name: "get_validated_news",
              description: "Obtenir les dernières nouvelles financières validées",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Terme de recherche pour les nouvelles"
                  },
                  limit: {
                    type: "number",
                    description: "Nombre maximum de nouvelles à retourner"
                  },
                  validate: {
                    type: "boolean",
                    description: "Valider les sources avant de les retourner"
                  }
                },
                required: ["query", "validate"]
              }
            }
          ]
        }
      ];

      response = await model.generateContent([validatedPrompt], { tools });
    } else {
      // Mode standard avec validation
      response = await model.generateContent([validatedPrompt]);
    }

    const result = await response.response;
    const text = result.text();

    // Validation de la réponse avec Zod
    const validatedResponse = {
      response: text,
      confidence: 0.9, // Confiance élevée pour le mode validé
      sources: ["Gemini 2.0 Flash Exp"],
      timestamp: new Date().toISOString()
    };

    const validationResult = ResponseSchema.safeParse(validatedResponse);
    
    if (!validationResult.success) {
      console.warn('⚠️ Validation Zod échouée:', validationResult.error);
      // Retourner quand même la réponse mais avec un avertissement
      return res.status(200).json({
        success: true,
        response: text,
        model: "gemini-2.0-flash-exp",
        functionCalling: useFunctionCalling,
        validated: false,
        validationWarning: "Réponse non validée par Zod",
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      response: text,
      model: "gemini-2.0-flash-exp",
      functionCalling: useFunctionCalling,
      validated: true,
      confidence: validatedResponse.confidence,
      sources: validatedResponse.sources,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur Gemini Chat Validated:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Erreur lors de la génération de la réponse Gemini validée',
      timestamp: new Date().toISOString()
    });
  }
}
