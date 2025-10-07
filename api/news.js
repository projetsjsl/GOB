// API NewsAPI.ai pour les actualités financières
export default async function handler(req, res) {
    const { q, limit = 20, language = 'fr' } = req.query;
    
    // Clé API NewsAPI.ai (à configurer dans les variables d'environnement Vercel)
    const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'YOUR_NEWSAPI_KEY';
    
    // Données de démonstration si pas de clé API
    const demoNews = [
        {
            title: "CVS Health Reports Strong Q3 Earnings",
            description: "CVS Health Corporation reported better-than-expected third quarter earnings, driven by strong performance in its pharmacy and health services segments.",
            url: "https://example.com/cvs-earnings",
            publishedAt: new Date().toISOString(),
            source: { name: "Financial News" },
            urlToImage: null,
            content: "CVS Health Corporation reported better-than-expected third quarter earnings..."
        },
        {
            title: "Microsoft Azure Growth Continues in Cloud Market",
            description: "Microsoft's cloud computing division Azure continues to show strong growth, maintaining its competitive position against AWS and Google Cloud.",
            url: "https://example.com/microsoft-azure",
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            source: { name: "Tech News" },
            urlToImage: null,
            content: "Microsoft's cloud computing division Azure continues to show strong growth..."
        },
        {
            title: "Stock Market Shows Mixed Signals",
            description: "The stock market showed mixed signals today with technology stocks leading gains while healthcare stocks faced some pressure.",
            url: "https://example.com/market-update",
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            source: { name: "Market Watch" },
            urlToImage: null,
            content: "The stock market showed mixed signals today with technology stocks leading gains..."
        }
    ];

    if (!NEWSAPI_KEY || NEWSAPI_KEY === 'YOUR_NEWSAPI_KEY') {
        // Retourner des données de démonstration
        return res.status(200).json({
            articles: demoNews,
            totalResults: demoNews.length,
            query: q || 'finance',
            timestamp: new Date().toISOString(),
            source: 'demo',
            message: 'Données de démonstration - Configurez NEWSAPI_KEY pour des actualités réelles'
        });
    }

    try {
        // Construire la requête pour NewsAPI.ai selon la documentation
        const query = q || 'finance stock market';
        const url = `https://newsapi.ai/api/v1/article/getArticles`;
        
        // Construire une requête pour chaque ticker spécifique
        const tickers = ['CVS', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
        const tickerQueries = tickers.map(ticker => ({
            keyword: ticker
        }));

        const requestBody = {
            apiKey: NEWSAPI_KEY,
            query: {
                $query: {
                    $and: [
                        {
                            $or: [
                                ...tickerQueries,
                                { conceptUri: "http://en.wikipedia.org/wiki/Finance" },
                                { conceptUri: "http://en.wikipedia.org/wiki/Stock_market" },
                                { conceptUri: "http://en.wikipedia.org/wiki/Investment" },
                                { conceptUri: "http://en.wikipedia.org/wiki/Economics" }
                            ]
                        },
                        {
                            lang: ["eng", "fra"]
                        }
                    ]
                }
            },
            resultType: "articles",
            articlesSortBy: "date",
            articlesCount: limit * 3, // Récupérer plus pour avoir des actualités par ticker
            includeArticleImage: true,
            includeArticleLinks: true
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`NewsAPI.ai error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transformer et filtrer les données selon la structure NewsAPI.ai
        const allArticles = data.articles?.results?.map(article => ({
            title: article.title,
            description: article.body?.substring(0, 200) + '...' || article.title,
            url: article.url,
            publishedAt: article.datePublished,
            source: {
                name: article.source?.title || 'Source inconnue'
            },
            urlToImage: article.image,
            content: article.body
        })) || [];

        // Filtrer et organiser les actualités par ticker
        const financialKeywords = [
            'stock', 'market', 'finance', 'investment', 'trading', 'earnings', 'revenue', 'profit',
            'bourse', 'finance', 'investissement', 'trading', 'bénéfices', 'revenus', 'profit',
            'crypto', 'bitcoin', 'ethereum', 'blockchain', 'economy', 'economic', 'économie'
        ];

        // Grouper les articles par ticker
        const articlesByTicker = {};
        tickers.forEach(ticker => {
            articlesByTicker[ticker] = [];
        });

        allArticles.forEach(article => {
            const text = (article.title + ' ' + article.description).toLowerCase();
            
            // Vérifier si l'article contient des mots-clés financiers
            const isFinancial = financialKeywords.some(keyword => text.includes(keyword));
            
            if (isFinancial) {
                // Assigner l'article au ticker correspondant
                const matchedTicker = tickers.find(ticker => 
                    text.includes(ticker.toLowerCase()) || 
                    text.includes(ticker)
                );
                
                if (matchedTicker) {
                    articlesByTicker[matchedTicker].push(article);
                } else {
                    // Articles généraux financiers
                    if (!articlesByTicker['GENERAL']) {
                        articlesByTicker['GENERAL'] = [];
                    }
                    articlesByTicker['GENERAL'].push(article);
                }
            }
        });

        // Combiner les articles en priorisant les tickers spécifiques
        const articles = [];
        tickers.forEach(ticker => {
            articles.push(...articlesByTicker[ticker].slice(0, 2)); // 2 articles par ticker
        });
        articles.push(...(articlesByTicker['GENERAL'] || []).slice(0, 5)); // 5 articles généraux
        
        // Limiter au nombre demandé
        const finalArticles = articles.slice(0, limit);

        const result = {
            articles: finalArticles,
            totalResults: finalArticles.length,
            query,
            timestamp: new Date().toISOString(),
            source: 'newsapi.ai',
            articlesByTicker: articlesByTicker // Inclure le détail par ticker pour debugging
        };

        res.status(200).json(result);
        
    } catch (error) {
        console.error('Erreur API NewsAPI.ai:', error);
        
        // Fallback vers une requête simplifiée NewsAPI.ai
        try {
            console.log('Tentative avec requête simplifiée...');
            const simpleRequestBody = {
                apiKey: NEWSAPI_KEY,
                query: {
                    $query: {
                        $and: [
                            {
                                $or: [
                                    { keyword: "stock market" },
                                    { keyword: "finance" },
                                    { keyword: "investment" },
                                    { keyword: "trading" },
                                    { keyword: "earnings" }
                                ]
                            },
                            {
                                lang: ["eng", "fra"]
                            }
                        ]
                    }
                },
                resultType: "articles",
                articlesSortBy: "date",
                articlesCount: limit * 2
            };
            
            const fallbackResponse = await fetch('https://newsapi.ai/api/v1/article/getArticles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(simpleRequestBody)
            });
            
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                const articles = fallbackData.articles?.results?.map(article => ({
                    title: article.title,
                    description: article.body?.substring(0, 200) + '...' || article.title,
                    url: article.url,
                    publishedAt: article.datePublished,
                    source: {
                        name: article.source?.title || 'Source inconnue'
                    },
                    urlToImage: article.image,
                    content: article.body
                })) || [];
                
                res.status(200).json({
                    articles,
                    totalResults: articles.length,
                    query: q,
                    timestamp: new Date().toISOString(),
                    source: 'newsapi.ai (fallback)'
                });
                return;
            }
        } catch (fallbackError) {
            console.error('Erreur fallback:', fallbackError);
        }
        
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des actualités',
            details: error.message 
        });
    }
}
