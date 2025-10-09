// ========================================
// GEMINI FIXED - Version simplifiée qui fonctionne
// API Route pour Gemini avec function calling simplifié
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
        console.error('❌ GEMINI_API_KEY non configurée');
        return res.status(500).json({ error: 'Clé API Gemini non configurée' });
    }

    try {
        console.log('🔧 Gemini Fixed - Début');
        console.log('📝 Message:', message.substring(0, 100) + '...');
        console.log('🌡️ Température:', temperature);

        // Détecter si la question nécessite des données financières
        const needsStockData = /prix|price|action|stock|AAPL|TSLA|MSFT|GOOGL|AMZN|META|NVDA/i.test(message);
        const needsNews = /actualité|news|nouvelle|récent/i.test(message);

        let enhancedMessage = message;

        // Si la question concerne des données financières, ajouter des données réelles
        if (needsStockData) {
            console.log('📊 Détection: Données financières nécessaires');
            
            // Extraire le symbole de la question
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
                console.log(`🔍 Récupération des données pour ${finalSymbol}`);
                
                // Récupérer les données depuis Yahoo Finance
                const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${finalSymbol}`;
                const yahooResponse = await fetch(yahooUrl);
                const yahooData = await yahooResponse.json();
                
                if (yahooData.quoteResponse && yahooData.quoteResponse.result && yahooData.quoteResponse.result[0]) {
                    const quote = yahooData.quoteResponse.result[0];
                    
                    const stockData = {
                        symbol: finalSymbol,
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        changePercent: quote.regularMarketChangePercent,
                        currency: quote.currency || 'USD',
                        marketCap: quote.marketCap,
                        volume: quote.regularMarketVolume,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('✅ Données récupérées:', stockData);
                    
                    // Enrichir le message avec les données réelles
                    enhancedMessage = `${message}

DONNÉES FINANCIÈRES ACTUELLES (${new Date().toLocaleDateString('fr-CA')}):
- Symbole: ${stockData.symbol}
- Prix actuel: $${stockData.price} ${stockData.currency}
- Changement: ${stockData.change > 0 ? '+' : ''}${stockData.change} (${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%)
- Capitalisation: $${(stockData.marketCap / 1000000000).toFixed(1)}B
- Volume: ${stockData.volume ? (stockData.volume / 1000000).toFixed(1) + 'M' : 'N/A'}

Utilise ces données réelles pour répondre à la question.`;
                } else {
                    console.log('⚠️ Aucune donnée trouvée pour', finalSymbol);
                }
            } catch (error) {
                console.error('❌ Erreur récupération données:', error);
            }
        }

        // Si la question concerne des actualités, ajouter des actualités récentes
        if (needsNews) {
            console.log('📰 Détection: Actualités nécessaires');
            
            try {
                const newsUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=AAPL&newsCount=3`;
                const newsResponse = await fetch(newsUrl);
                const newsData = await newsResponse.json();
                
                if (newsData.news && newsData.news.length > 0) {
                    const recentNews = newsData.news.slice(0, 3).map(article => ({
                        title: article.title,
                        summary: article.summary,
                        published: new Date(article.providerPublishTime * 1000).toLocaleDateString('fr-CA')
                    }));
                    
                    console.log('✅ Actualités récupérées:', recentNews.length);
                    
                    enhancedMessage += `

ACTUALITÉS RÉCENTES:
${recentNews.map(news => `- ${news.title} (${news.published})`).join('\n')}

Utilise ces actualités récentes dans ta réponse.`;
                }
            } catch (error) {
                console.error('❌ Erreur récupération actualités:', error);
            }
        }

        // Appel à Gemini avec le message enrichi
        console.log('🤖 Appel à Gemini...');
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: enhancedMessage
                    }]
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
            source: 'gemini-fixed',
            dataUsed: needsStockData || needsNews
        });
        
    } catch (error) {
        console.error('❌ Erreur dans gemini-fixed:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la génération de la réponse',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
