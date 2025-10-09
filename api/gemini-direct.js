// ========================================
// GEMINI DIRECT - Version ultra-simplifiée
// API Route pour Gemini avec données financières directes
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

    const { message, temperature = 0.3, maxTokens = 4096 } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message requis' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY non configurée');
        return res.status(500).json({ error: 'Clé API Gemini non configurée' });
    }

    try {
        console.log('🔧 Gemini Direct - Début');
        console.log('📝 Message:', message.substring(0, 100) + '...');

        // Détecter les questions sur les prix d'actions
        const priceKeywords = /prix|price|valeur|value|action|stock|AAPL|TSLA|MSFT|GOOGL|AMZN|META|NVDA|Apple|Tesla|Microsoft|Google|Amazon|Meta|NVIDIA/i;
        const isPriceQuestion = priceKeywords.test(message);

        let finalMessage = message;

        // Si c'est une question sur les prix, récupérer les données réelles
        if (isPriceQuestion) {
            console.log('💰 Question sur les prix détectée');
            
            // Extraire le symbole
            const symbolMatch = message.match(/(AAPL|TSLA|MSFT|GOOGL|AMZN|META|NVDA|Apple|Tesla|Microsoft|Google|Amazon|Meta|NVIDIA)/i);
            const symbol = symbolMatch ? symbolMatch[1] : 'AAPL';
            
            // Normaliser le symbole
            const symbolMap = {
                'Apple': 'AAPL',
                'Tesla': 'TSLA', 
                'Microsoft': 'MSFT',
                'Google': 'GOOGL',
                'Amazon': 'AMZN',
                'Meta': 'META',
                'NVIDIA': 'NVDA'
            };
            
            const finalSymbol = symbolMap[symbol] || symbol.toUpperCase();
            
            try {
                console.log(`📊 Récupération du prix pour ${finalSymbol}`);
                
                // Utiliser l'API marketdata existante
                const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
                const marketdataUrl = `${baseUrl}/api/marketdata?endpoint=quote&symbol=${finalSymbol}&source=yahoo`;
                
                console.log(`📡 URL Marketdata: ${marketdataUrl}`);
                
                const yahooResponse = await fetch(marketdataUrl);
                const yahooData = await yahooResponse.json();
                
                if (yahooData && !yahooData.error) {
                    const stockInfo = {
                        symbol: finalSymbol,
                        price: yahooData.c || 0,
                        change: yahooData.d || 0,
                        changePercent: yahooData.dp || 0,
                        currency: 'USD',
                        marketCap: yahooData.marketCap || 0,
                        volume: yahooData.volume || 0,
                        high: yahooData.h || 0,
                        low: yahooData.l || 0,
                        open: yahooData.o || 0,
                        previousClose: yahooData.pc || 0
                    };
                    
                    console.log('✅ Données récupérées:', stockInfo);
                    
                    // Créer un message enrichi avec les données réelles
                    finalMessage = `Tu es Emma, Analyste Financière. Réponds de manière directe et concise.

Question: ${message}

DONNÉES FINANCIÈRES ACTUELLES (${new Date().toLocaleDateString('fr-CA')}):
- Symbole: ${stockInfo.symbol}
- Prix actuel: $${stockInfo.price} ${stockInfo.currency}
- Changement: ${stockInfo.change > 0 ? '+' : ''}${stockInfo.change} (${stockInfo.changePercent > 0 ? '+' : ''}${stockInfo.changePercent}%)
- Capitalisation: $${(stockInfo.marketCap / 1000000000).toFixed(1)}B
- Volume: ${stockInfo.volume ? (stockInfo.volume / 1000000).toFixed(1) + 'M' : 'N/A'}

Règles importantes :
- Commence par donner le prix actuel
- Ajoute un bref commentaire sur la performance
- Ne mentionne JAMAIS d'actualités non fournies
- Reste factuel et professionnel
- Réponds en français québécois`;
                } else {
                    console.log('⚠️ Aucune donnée trouvée pour', finalSymbol);
                    finalMessage = `${message}

Note: Je n'ai pas pu récupérer les données financières actuelles pour ${finalSymbol}. Réponds quand même à la question de manière générale.`;
                }
            } catch (error) {
                console.error('❌ Erreur récupération données:', error);
                finalMessage = `${message}

Note: Erreur lors de la récupération des données financières. Réponds quand même à la question.`;
            }
        }

        // Appel à Gemini
        console.log('🤖 Appel à Gemini...');
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: finalMessage
                    }]
                }],
                generationConfig: {
                    temperature: temperature,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: maxTokens,
                    candidateCount: 1
                }
            })
        });

        console.log('📡 Statut Gemini:', geminiResponse.status);

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('❌ Erreur Gemini:', errorText);
            throw new Error(`Erreur Gemini: ${geminiResponse.status}`);
        }

        const data = await geminiResponse.json();
        console.log('📊 Réponse Gemini reçue');

        // Extraire la réponse
        let responseText = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            responseText = data.candidates[0].content.parts[0].text;
        } else {
            console.error('❌ Structure de réponse invalide:', data);
            throw new Error('Structure de réponse invalide');
        }

        console.log('✅ Réponse générée:', responseText.substring(0, 100) + '...');

        return res.status(200).json({
            response: responseText,
            temperature: temperature,
            timestamp: new Date().toISOString(),
            source: 'gemini-direct',
            hasRealData: isPriceQuestion
        });
        
    } catch (error) {
        console.error('❌ Erreur dans gemini-direct:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la génération de la réponse',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
