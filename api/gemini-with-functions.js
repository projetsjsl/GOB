// ========================================
// GEMINI WITH FUNCTION CALLING
// API Route pour Gemini avec appels de fonctions financières
// ========================================

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { message, temperature = 0.3 } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message requis' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Clé API Gemini non configurée' });
    }

    try {
        console.log('🔧 Début de la requête Gemini avec Function Calling');
        console.log('📝 Message:', message);
        console.log('🌡️ Température:', temperature);
        
        // Définir les fonctions disponibles pour Gemini
        const functionDeclarations = [
            {
                name: "get_stock_price",
                description: "Obtient le prix actuel en temps réel d'une action boursière",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "Le symbole boursier (ticker) de l'action, par exemple AAPL pour Apple, TSLA pour Tesla, MSFT pour Microsoft"
                        }
                    },
                    required: ["symbol"]
                }
            },
            {
                name: "get_financial_news",
                description: "Récupère les actualités financières récentes concernant une entreprise ou un symbole boursier",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Le nom de l'entreprise ou le symbole boursier pour lequel récupérer les actualités"
                        },
                        limit: {
                            type: "integer",
                            description: "Nombre d'articles à récupérer (par défaut 5)",
                            default: 5
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_market_data",
                description: "Récupère des données de marché détaillées incluant capitalisation, PE ratio, dividendes, etc.",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "Le symbole boursier de l'action"
                        }
                    },
                    required: ["symbol"]
                }
            }
        ];

        // Fonction pour exécuter les appels de fonction
        const executeFunction = async (functionName, args) => {
            console.log(`🔧 Exécution de la fonction: ${functionName}`, args);
            
            switch (functionName) {
                case "get_stock_price":
                    return await getStockPrice(args.symbol);
                
                case "get_financial_news":
                    return await getFinancialNews(args.query, args.limit || 5);
                
                case "get_market_data":
                    return await getMarketData(args.symbol);
                
                default:
                    return { error: `Fonction inconnue: ${functionName}` };
            }
        };

        // Fonction pour obtenir le prix d'une action
        const getStockPrice = async (symbol) => {
            try {
                console.log(`🔍 Récupération du prix pour ${symbol}`);
                
                // Utiliser notre API marketdata existante
                const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
                const url = `${baseUrl}/api/marketdata?endpoint=quote&symbol=${symbol}&source=yahoo`;
                
                console.log(`📡 URL: ${url}`);
                
                const response = await fetch(url);
                const data = await response.json();
                
                console.log(`📊 Données reçues:`, data);
                
                if (data.error) {
                    return { error: data.error };
                }
                
                return {
                    symbol: symbol,
                    price: data.c || 0,
                    change: data.d || 0,
                    changePercent: data.dp || 0,
                    currency: "USD",
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                console.error(`❌ Erreur getStockPrice:`, error);
                return { error: error.message };
            }
        };

        // Fonction pour obtenir les actualités financières
        const getFinancialNews = async (query, limit) => {
            try {
                // Utiliser notre API news existante
                const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/news?q=${encodeURIComponent(query)}&limit=${limit}`);
                const data = await response.json();
                
                if (data.error) {
                    return { error: data.error };
                }
                
                return {
                    query: query,
                    articles: data.articles.map(article => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        publishedAt: article.publishedAt,
                        source: article.source?.name || 'Unknown'
                    }))
                };
            } catch (error) {
                return { error: error.message };
            }
        };

        // Fonction pour obtenir les données de marché
        const getMarketData = async (symbol) => {
            try {
                // Utiliser notre API marketdata existante pour le profil
                const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/marketdata?endpoint=profile&symbol=${symbol}&source=auto`);
                const data = await response.json();
                
                if (data.error) {
                    return { error: data.error };
                }
                
                return {
                    symbol: symbol,
                    name: data.name,
                    industry: data.industry,
                    country: data.country,
                    marketCap: data.marketCapitalization,
                    shareOutstanding: data.shareOutstanding,
                    website: data.weburl,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                return { error: error.message };
            }
        };

        // Appel initial à Gemini avec les fonctions
        let geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                tools: [{
                    function_declarations: functionDeclarations
                }],
                generationConfig: {
                    temperature: temperature,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 4096,
                    candidateCount: 1
                }
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Erreur Gemini: ${geminiResponse.status}`);
        }

        let responseData = await geminiResponse.json();
        
        // Gérer les appels de fonction
        while (responseData.candidates && 
               responseData.candidates[0] && 
               responseData.candidates[0].content && 
               responseData.candidates[0].content.parts && 
               responseData.candidates[0].content.parts[0] && 
               responseData.candidates[0].content.parts[0].functionCall) {
            
            const functionCall = responseData.candidates[0].content.parts[0].functionCall;
            const functionName = functionCall.name;
            const functionArgs = functionCall.args;
            
            console.log(`🔧 Gemini appelle: ${functionName}`, functionArgs);
            
            // Exécuter la fonction
            const functionResult = await executeFunction(functionName, functionArgs);
            
            console.log(`✅ Résultat:`, functionResult);
            
            // Renvoyer le résultat à Gemini
            geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            functionResponse: {
                                name: functionName,
                                response: functionResult
                            }
                        }]
                    }],
                    tools: [{
                        function_declarations: functionDeclarations
                    }],
                    generationConfig: {
                        temperature: temperature,
                        topK: 20,
                        topP: 0.8,
                        maxOutputTokens: 4096,
                        candidateCount: 1
                    }
                })
            });
            
            if (!geminiResponse.ok) {
                throw new Error(`Erreur Gemini: ${geminiResponse.status}`);
            }
            
            responseData = await geminiResponse.json();
        }
        
        // Extraire la réponse finale
        let finalResponse = '';
        if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
            const content = responseData.candidates[0].content;
            if (content.parts && content.parts[0] && content.parts[0].text) {
                finalResponse = content.parts[0].text;
            }
        }
        
        if (!finalResponse) {
            throw new Error('Réponse invalide de Gemini');
        }
        
        return res.status(200).json({
            response: finalResponse,
            temperature: temperature,
            timestamp: new Date().toISOString(),
            source: 'gemini-with-functions'
        });
        
    } catch (error) {
        console.error('Erreur Gemini avec fonctions:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la génération de la réponse',
            details: error.message 
        });
    }
}
