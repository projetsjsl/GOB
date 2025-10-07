// API NewsAPI.ai pour les actualités financières
export default async function handler(req, res) {
    const { q, limit = 20, language = 'fr' } = req.query;
    
    // Clé API NewsAPI.ai (à configurer dans les variables d'environnement Vercel)
    const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'YOUR_NEWSAPI_KEY';
    
    if (!NEWSAPI_KEY || NEWSAPI_KEY === 'YOUR_NEWSAPI_KEY') {
        return res.status(500).json({ 
            error: 'Clé API NewsAPI.ai non configurée. Veuillez configurer NEWSAPI_KEY dans les variables d\'environnement Vercel.' 
        });
    }

    try {
        // Construire la requête pour NewsAPI.ai
        const query = q || 'finance stock market';
        const url = `https://newsapi.ai/api/v1/article/getArticles?apiKey=${NEWSAPI_KEY}&query=${encodeURIComponent(query)}&lang=${language}&max=${limit}&sortBy=date`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`NewsAPI.ai error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transformer les données pour correspondre au format attendu
        const articles = data.articles?.map(article => ({
            title: article.title,
            description: article.body?.substring(0, 200) + '...' || article.title,
            url: article.url,
            publishedAt: article.datePublished,
            source: {
                name: article.source?.name || 'Source inconnue'
            },
            urlToImage: article.image,
            content: article.body
        })) || [];

        const result = {
            articles,
            totalResults: articles.length,
            query,
            timestamp: new Date().toISOString(),
            source: 'newsapi.ai'
        };

        res.status(200).json(result);
        
    } catch (error) {
        console.error('Erreur API NewsAPI.ai:', error);
        
        // Fallback vers une API gratuite si NewsAPI.ai échoue
        try {
            const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q || 'finance')}&language=${language}&pageSize=${limit}&apiKey=${process.env.NEWSAPI_ORG_KEY || 'demo'}`;
            const fallbackResponse = await fetch(fallbackUrl);
            
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                res.status(200).json({
                    articles: fallbackData.articles || [],
                    totalResults: fallbackData.totalResults || 0,
                    query: q,
                    timestamp: new Date().toISOString(),
                    source: 'newsapi.org (fallback)'
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
