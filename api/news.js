// API News multi-sources pour les actualités financières
export default async function handler(req, res) {
    const { q, limit = 20, language = 'fr', strict = 'false' } = req.query;
    const isStrict = String(strict).toLowerCase() === 'true';
    
    // Clés API multiples (à configurer dans les variables d'environnement Vercel)
    const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'YOUR_NEWSAPI_KEY';
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY';
    
    // Suppression de toute génération d'actualités de démonstration: aucune donnée synthétique

    // Fonction pour récupérer les actualités depuis Finnhub
    const fetchFinnhubNews = async (tickers) => {
        if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') {
            return [];
        }

        try {
            const allNews = [];
            const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const to = new Date().toISOString().split('T')[0];

            const workTickers = isStrict ? tickers : tickers.slice(0, 3);
            const tasks = workTickers.map(async (ticker) => {
                const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) return;
                const data = await response.json();
                const tickerNews = data.slice(0, 3).map(article => ({
                    title: article.headline,
                    description: article.summary || article.headline,
                    url: article.url,
                    publishedAt: new Date(article.datetime * 1000).toISOString(),
                    source: { name: 'Finnhub' },
                    urlToImage: article.image,
                    content: article.summary,
                    ticker: ticker
                }));
                allNews.push(...tickerNews);
            });
            await Promise.allSettled(tasks);
            return allNews;
        } catch (error) {
            console.error('Erreur Finnhub News:', error);
            return [];
        }
    };

    // Fonction pour récupérer les actualités depuis Alpha Vantage
    const fetchAlphaVantageNews = async (tickers) => {
        if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'YOUR_ALPHA_VANTAGE_API_KEY') {
            return [];
        }

        try {
            const allNews = [];
            const workTickers = isStrict ? tickers : tickers.slice(0, 2);
            const tasks = workTickers.map(async (ticker) => {
                const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}&limit=5`;
                const response = await fetch(url);
                if (!response.ok) return;
                const data = await response.json();
                if (data.feed) {
                    const tickerNews = data.feed.map(article => ({
                        title: article.title,
                        description: article.summary,
                        url: article.url,
                        publishedAt: article.time_published,
                        source: { name: article.source },
                        urlToImage: article.banner_image,
                        content: article.summary,
                        ticker: ticker,
                        sentiment: article.overall_sentiment_label
                    }));
                    allNews.push(...tickerNews);
                }
            });
            await Promise.allSettled(tasks);
            return allNews;
        } catch (error) {
            console.error('Erreur Alpha Vantage News:', error);
            return [];
        }
    };

    // Fonction pour récupérer les actualités depuis NewsAPI.ai
    const fetchNewsApiNews = async (tickers, limit) => {
        if (!NEWSAPI_KEY || NEWSAPI_KEY === 'YOUR_NEWSAPI_KEY') {
            return [];
        }

        try {
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
                articlesCount: limit * 3,
                includeArticleImage: true,
                includeArticleLinks: true
            };
            
            const response = await fetch('https://newsapi.ai/api/v1/article/getArticles', {
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
            
            let articles = data.articles?.results?.map(article => {
                const title = article.title || '';
                const desc = article.body || '';
                const lower = (title + ' ' + desc).toLowerCase();
                // Tagger un ticker si détecté dans le titre/description
                const matched = tickers.find(t => lower.includes(t.toLowerCase()));
                return {
                    title,
                    description: desc ? (desc.substring(0, 200) + '...') : title,
                    url: article.url,
                    publishedAt: article.datePublished,
                    source: {
                        name: article.source?.title || 'Source inconnue'
                    },
                    urlToImage: article.image,
                    content: article.body,
                    ticker: matched || undefined
                };
            }) || [];

            if (isStrict) {
                // Filtrer strictement sur tickers (mot entier, insensible à la casse)
                const patterns = tickers.map(t => new RegExp(`(^|[^A-Z0-9])${t}([^A-Z0-9]|$)`, 'i'));
                articles = articles.filter(a => {
                    const text = `${a.title || ''} ${a.description || ''}`;
                    return patterns.some(rx => rx.test(text));
                });
            }

            return articles;
        } catch (error) {
            console.error('Erreur NewsAPI.ai:', error);
            return [];
        }
    };

    // Vérifier si on a au moins une clé API configurée
    const hasApiKey = (NEWSAPI_KEY && NEWSAPI_KEY !== 'YOUR_NEWSAPI_KEY') || 
                     (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') ||
                     (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY');

    if (!hasApiKey) {
        return res.status(503).json({
            error: 'Service indisponible',
            message: 'Aucune clé API configurée. Veuillez configurer au moins une des variables d\'environnement suivantes : NEWSAPI_KEY, FINNHUB_API_KEY, ou ALPHA_VANTAGE_API_KEY',
            requiredKeys: ['NEWSAPI_KEY', 'FINNHUB_API_KEY', 'ALPHA_VANTAGE_API_KEY'],
            query: q || 'finance'
        });
    }

    try {
        // Utiliser les tickers de la requête ou les tickers par défaut
        const requestedTickers = q ? q.split(' OR ').map(t => t.trim().toUpperCase()) : [];
        const defaultTickers = ['CVS', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
        const tickers = requestedTickers.length > 0 ? requestedTickers : defaultTickers;
        
        // Récupérer les actualités depuis toutes les sources disponibles (en parallèle)
        const allNews = [];
        const sources = [];

        const tasks = [];
        if (NEWSAPI_KEY && NEWSAPI_KEY !== 'YOUR_NEWSAPI_KEY') {
            tasks.push(
                fetchNewsApiNews(tickers, limit).then(items => { allNews.push(...items); sources.push('NewsAPI.ai'); }).catch(e => console.error('Erreur NewsAPI.ai:', e))
            );
        }
        if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') {
            tasks.push(
                fetchFinnhubNews(tickers).then(items => { allNews.push(...items); sources.push('Finnhub'); }).catch(e => console.error('Erreur Finnhub News:', e))
            );
        }
        if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') {
            tasks.push(
                fetchAlphaVantageNews(tickers).then(items => { allNews.push(...items); sources.push('Alpha Vantage'); }).catch(e => console.error('Erreur Alpha Vantage News:', e))
            );
        }
        await Promise.allSettled(tasks);
        
        // Si aucune source n'a fonctionné, retourner une erreur
        if (allNews.length === 0) {
            return res.status(503).json({
                error: 'Aucune actualité disponible',
                message: 'Toutes les sources d\'actualités ont échoué. Veuillez réessayer dans quelques instants.',
                sources: sources,
                query: q || 'finance',
                timestamp: new Date().toISOString()
            });
        }
        
        // Dédupliquer les articles basés sur l'URL
        const uniqueNews = [];
        const seenUrls = new Set();
        
        allNews.forEach(article => {
            if (article.url && !seenUrls.has(article.url)) {
                seenUrls.add(article.url);
                uniqueNews.push(article);
            }
        });
        
        // Trier par date de publication (plus récent en premier)
        uniqueNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        // Limiter au nombre demandé (sans ajouter de contenu synthétique)
        const finalArticles = isStrict ? uniqueNews : uniqueNews.slice(0, limit);

        return res.status(200).json({
            articles: finalArticles,
            totalResults: finalArticles.length,
            query: q || 'finance',
            timestamp: new Date().toISOString(),
            source: sources.join(', '),
            sources: sources,
            message: `Actualités récupérées depuis ${sources.join(', ')}`,
            strict: isStrict
        });
        
    } catch (error) {
        console.error('Erreur générale API News:', error);
        return res.status(500).json({
            error: 'Erreur lors de la récupération des actualités',
            message: error.message,
            query: q || 'finance',
            timestamp: new Date().toISOString()
        });
    }
}