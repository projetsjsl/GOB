// ============================================================================
// CHATGPT TOOLS API - Function Calling pour Emma
// Version avec OpenAI SDK et Function Calling
// ============================================================================
//
// 🛡️  GUARDRAILS DE PROTECTION - CONFIGURATION CRITIQUE 🛡️
// ============================================================================
// ⚠️  ATTENTION : Ce fichier contient la configuration des outils ChatGPT
// ⚠️  Toute modification peut casser le système de function calling
// ⚠️  Toujours tester en local avant de déployer
//
// ✅ CONFIGURATION VALIDÉE :
// - Modèle: gpt-4o (OpenAI GPT-4 Omni)
// - SDK: openai (v4.0.0+)
// - Function Calling: Activé avec outils financiers
// - Temperature: 0.3 (déterministe pour function calling)
//
// 🔒 VARIABLES D'ENVIRONNEMENT REQUISES :
// - OPENAI_API_KEY (sk-...) : ✅ Configurée
//
// 📚 Référence : https://platform.openai.com/docs/guides/function-calling
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
        'Contactez l\'administrateur pour configurer la clé API'
      ],
      technical: 'OPENAI_API_KEY not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { messages = [], temperature = 0.3, maxTokens = 4096, systemPrompt } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('❌ Messages invalides:', { messages });
      return res.status(400).json({ error: 'messages requis (array)' });
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

    // Définir les outils disponibles pour ChatGPT
    const tools = [
      {
        type: "function",
        function: {
          name: "get_stock_price",
          description: "Obtenir le prix actuel d'une action et ses informations de base",
          parameters: {
            type: "object",
            properties: {
              ticker: {
                type: "string",
                description: "Le symbole boursier de l'action (ex: AAPL, MSFT, TSLA)"
              }
            },
            required: ["ticker"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_financial_data",
          description: "Obtenir les données financières fondamentales d'une entreprise",
          parameters: {
            type: "object",
            properties: {
              ticker: {
                type: "string",
                description: "Le symbole boursier de l'entreprise"
              },
              data_type: {
                type: "string",
                enum: ["fundamentals", "ratios", "earnings", "balance_sheet", "income_statement"],
                description: "Le type de données financières demandées"
              }
            },
            required: ["ticker", "data_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_news",
          description: "Obtenir les actualités financières récentes",
          parameters: {
            type: "object",
            properties: {
              ticker: {
                type: "string",
                description: "Le symbole boursier pour filtrer les actualités (optionnel)"
              },
              limit: {
                type: "integer",
                description: "Nombre maximum d'articles à retourner (défaut: 5)",
                minimum: 1,
                maximum: 20
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "calculate_financial_ratio",
          description: "Calculer des ratios financiers ou effectuer des calculs financiers",
          parameters: {
            type: "object",
            properties: {
              calculation_type: {
                type: "string",
                enum: ["pe_ratio", "pb_ratio", "debt_to_equity", "roe", "roa", "current_ratio", "quick_ratio"],
                description: "Le type de calcul à effectuer"
              },
              values: {
                type: "object",
                description: "Les valeurs nécessaires pour le calcul",
                properties: {
                  price: { type: "number", description: "Prix de l'action" },
                  earnings: { type: "number", description: "Bénéfices par action" },
                  book_value: { type: "number", description: "Valeur comptable par action" },
                  total_debt: { type: "number", description: "Dette totale" },
                  total_equity: { type: "number", description: "Capitaux propres" },
                  net_income: { type: "number", description: "Résultat net" },
                  total_assets: { type: "number", description: "Total des actifs" },
                  current_assets: { type: "number", description: "Actifs courants" },
                  current_liabilities: { type: "number", description: "Passifs courants" },
                  inventory: { type: "number", description: "Inventaire" }
                }
              }
            },
            required: ["calculation_type", "values"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_market_overview",
          description: "Obtenir un aperçu général du marché et des indices principaux",
          parameters: {
            type: "object",
            properties: {
              indices: {
                type: "array",
                items: { type: "string" },
                description: "Liste des indices à inclure (ex: ['SPX', 'NASDAQ', 'DOW'])",
                default: ["SPX", "NASDAQ", "DOW"]
              }
            },
            required: []
          }
        }
      }
    ];

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

    console.log('🔧 Appel API OpenAI ChatGPT avec Function Calling');
    console.log('📦 Modèle: gpt-4o');
    console.log('🛠️ Outils disponibles:', tools.length);
    console.log('📤 Envoi de la requête...');

    // Appel à l'API OpenAI avec function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      tools: tools,
      tool_choice: 'auto', // Laisser ChatGPT décider quand utiliser les outils
      temperature,
      max_tokens: maxTokens,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    console.log('📡 Réponse reçue, status: 200');

    const message = completion.choices[0]?.message;
    
    if (!message) {
      console.error('❌ Pas de message dans la réponse:', JSON.stringify(completion));
      throw new Error('Aucune réponse générée par ChatGPT');
    }

    // Vérifier s'il y a des appels de fonction à exécuter
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('🛠️ Function calls détectés:', message.tool_calls.length);
      
      // Exécuter les function calls
      const toolResults = [];
      for (const toolCall of message.tool_calls) {
        try {
          console.log(`🔧 Exécution de ${toolCall.function.name} avec args:`, toolCall.function.arguments);
          const result = await executeFunction(toolCall.function.name, JSON.parse(toolCall.function.arguments));
          toolResults.push({
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            response: result
          });
          console.log(`✅ ${toolCall.function.name} exécuté avec succès`);
        } catch (error) {
          console.error(`❌ Erreur lors de l'exécution de ${toolCall.function.name}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            response: { 
              error: `Erreur lors de l'exécution de ${toolCall.function.name}`,
              details: error.message
            }
          });
        }
      }

      // Faire un deuxième appel à ChatGPT avec les résultats des fonctions
      const followUpMessages = [
        ...openaiMessages,
        message, // Le message original avec les tool calls
        {
          role: 'tool',
          content: toolResults.map(tr => 
            `Résultat de ${tr.name}: ${JSON.stringify(tr.response, null, 2)}`
          ).join('\n\n'),
          tool_call_id: toolResults[0]?.tool_call_id
        }
      ];

      const followUpCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: followUpMessages,
        temperature: 0.7, // Température normale pour la réponse finale
        max_tokens: maxTokens,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const finalResponse = followUpCompletion.choices[0]?.message?.content || '';
      
      if (!finalResponse) {
        throw new Error('Aucune réponse finale générée par ChatGPT');
      }

      console.log('✅ Réponse finale avec données intégrées générée');
      
      return res.status(200).json({
        response: finalResponse,
        source: 'chatgpt-with-functions',
        model: 'gpt-4o',
        functions_executed: toolResults.map(tr => tr.name),
        usage: followUpCompletion.usage,
        timestamp: new Date().toISOString()
      });
    }

    // Si pas de function calls, retourner la réponse normale
    const text = message.content || '';
    
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
      functions_executed: [],
      usage: completion.usage,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('❌ Erreur dans le handler ChatGPT Tools:', e);
    console.error('Stack trace:', e?.stack);
    
    return res.status(500).json({ 
      error: 'Erreur de connexion à l\'API OpenAI',
      suggestions: [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants',
        'Si le problème persiste, contactez le support'
      ],
      technical: String(e?.message || e),
      timestamp: new Date().toISOString(),
      support: 'Pour plus d\'aide, consultez la console du navigateur (F12)'
    });
  }
}

/**
 * Exécute une fonction basée sur son nom et ses arguments
 */
async function executeFunction(functionName, args) {
  console.log(`🔧 Exécution de la fonction: ${functionName}`, args);

  switch (functionName) {
    case 'get_stock_price':
      return await getStockPrice(args.ticker);
    
    case 'get_financial_data':
      return await getFinancialData(args.ticker, args.data_type);
    
    case 'get_news':
      return await getNews(args.ticker, args.limit);
    
    case 'calculate_financial_ratio':
      return await calculateFinancialRatio(args.calculation_type, args.values);
    
    case 'get_market_overview':
      return await getMarketOverview(args.indices);
    
    default:
      throw new Error(`Fonction inconnue: ${functionName}`);
  }
}

/**
 * Obtenir le prix d'une action (simulation - à remplacer par vraie API)
 */
async function getStockPrice(ticker) {
  // Simulation - à remplacer par un appel à l'API de données financières
  return {
    ticker: ticker.toUpperCase(),
    price: Math.random() * 1000 + 50,
    change: (Math.random() - 0.5) * 20,
    change_percent: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000),
    timestamp: new Date().toISOString(),
    note: "Données simulées - à remplacer par vraie API"
  };
}

/**
 * Obtenir les données financières (simulation - à remplacer par vraie API)
 */
async function getFinancialData(ticker, dataType) {
  // Simulation - à remplacer par un appel à l'API de données financières
  return {
    ticker: ticker.toUpperCase(),
    data_type: dataType,
    data: {
      pe_ratio: Math.random() * 50 + 10,
      pb_ratio: Math.random() * 5 + 1,
      market_cap: Math.random() * 1000000000000,
      revenue: Math.random() * 100000000000,
      net_income: Math.random() * 10000000000
    },
    timestamp: new Date().toISOString(),
    note: "Données simulées - à remplacer par vraie API"
  };
}

/**
 * Obtenir les actualités (simulation - à remplacer par vraie API)
 */
async function getNews(ticker, limit = 5) {
  // Simulation - à remplacer par un appel à l'API d'actualités
  const news = [];
  for (let i = 0; i < limit; i++) {
    news.push({
      title: `Actualité ${i + 1} pour ${ticker || 'le marché'}`,
      summary: `Résumé de l'actualité ${i + 1}`,
      url: `https://example.com/news/${i + 1}`,
      published_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
    });
  }
  
  return {
    ticker: ticker?.toUpperCase() || 'GENERAL',
    articles: news,
    count: news.length,
    timestamp: new Date().toISOString(),
    note: "Données simulées - à remplacer par vraie API"
  };
}

/**
 * Calculer des ratios financiers
 */
async function calculateFinancialRatio(calculationType, values) {
  let result = 0;
  
  switch (calculationType) {
    case 'pe_ratio':
      result = values.price / values.earnings;
      break;
    case 'pb_ratio':
      result = values.price / values.book_value;
      break;
    case 'debt_to_equity':
      result = values.total_debt / values.total_equity;
      break;
    case 'roe':
      result = values.net_income / values.total_equity;
      break;
    case 'roa':
      result = values.net_income / values.total_assets;
      break;
    case 'current_ratio':
      result = values.current_assets / values.current_liabilities;
      break;
    case 'quick_ratio':
      result = (values.current_assets - values.inventory) / values.current_liabilities;
      break;
    default:
      throw new Error(`Type de calcul non supporté: ${calculationType}`);
  }
  
  return {
    calculation_type: calculationType,
    result: Math.round(result * 100) / 100,
    values_used: values,
    timestamp: new Date().toISOString()
  };
}

/**
 * Obtenir un aperçu du marché (simulation - à remplacer par vraie API)
 */
async function getMarketOverview(indices = ['SPX', 'NASDAQ', 'DOW']) {
  // Simulation - à remplacer par un appel à l'API de données de marché
  const marketData = {};
  
  indices.forEach(index => {
    marketData[index] = {
      value: Math.random() * 10000 + 1000,
      change: (Math.random() - 0.5) * 100,
      change_percent: (Math.random() - 0.5) * 5
    };
  });
  
  return {
    indices: marketData,
    timestamp: new Date().toISOString(),
    note: "Données simulées - à remplacer par vraie API"
  };
}