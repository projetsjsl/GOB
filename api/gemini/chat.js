// ============================================================================
// API Gemini Chat - Endpoint principal pour l'onglet Ask Emma
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

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
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    let response;
    
    if (useFunctionCalling) {
      // Mode avec function calling (accès aux APIs)
      const tools = [
        {
          functionDeclarations: [
            {
              name: "get_market_data",
              description: "Obtenir des données de marché pour un symbole",
              parameters: {
                type: "object",
                properties: {
                  symbol: {
                    type: "string",
                    description: "Symbole de l'action (ex: AAPL, TSLA)"
                  }
                },
                required: ["symbol"]
              }
            },
            {
              name: "get_news",
              description: "Obtenir les dernières nouvelles financières",
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
                  }
                },
                required: ["query"]
              }
            }
          ]
        }
      ];

      response = await model.generateContent([message], { tools });
    } else {
      // Mode standard sans function calling
      response = await model.generateContent([message]);
    }

    const result = await response.response;
    const text = result.text();

    return res.status(200).json({
      success: true,
      response: text,
      model: "gemini-2.0-flash-exp",
      functionCalling: useFunctionCalling,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur Gemini Chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Erreur lors de la génération de la réponse Gemini',
      timestamp: new Date().toISOString()
    });
  }
}