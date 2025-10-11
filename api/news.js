// API News multi-sources pour les actualités financières
export default async function handler(req, res) {
    const { q, limit = 20, language = 'fr', strict = 'false' } = req.query;
    const isStrict = String(strict).toLowerCase() === 'true';
    
    // Clés API multiples (à configurer dans les variables d'environnement Vercel)
    const NEWSAPI_KEY = process.env.NEWSAPI_KEY || 'YOUR_NEWSAPI_KEY';
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY';
    
    // Générer des actualités de démonstration basées sur les tickers demandés
    const generateDemoNews = (tickers) => {
        const newsTemplates = {
            'CVS': [
                {
                    title: "CVS Health Reports Strong Q3 Earnings",
                    description: "CVS Health Corporation reported better-than-expected third quarter earnings, driven by strong performance in its pharmacy and health services segments.",
                    content: "CVS Health Corporation reported better-than-expected third quarter earnings, driven by strong performance in its pharmacy and health services segments. The company's revenue increased significantly compared to the previous quarter.",
                    sectorAnalysis: "Le secteur de la santé connaît une croissance soutenue avec l'expansion des services de pharmacie et de soins primaires. CVS bénéficie de cette tendance avec son modèle intégré."
                },
                {
                    title: "CVS Expands Healthcare Services Nationwide",
                    description: "CVS Health announces expansion of its healthcare services to reach more communities across the United States.",
                    content: "CVS Health announces expansion of its healthcare services to reach more communities across the United States, focusing on underserved areas.",
                    sectorAnalysis: "L'expansion des services de santé communautaires représente une opportunité majeure pour CVS dans un marché en pleine transformation."
                }
            ],
            'MSFT': [
                {
                    title: "Microsoft Azure Growth Continues in Cloud Market",
                    description: "Microsoft's cloud computing division Azure continues to show strong growth, maintaining its competitive position against AWS and Google Cloud.",
                    content: "Microsoft's cloud computing division Azure continues to show strong growth, maintaining its competitive position against AWS and Google Cloud. The company reported significant revenue increases in its cloud segment.",
                    sectorAnalysis: "Le secteur du cloud computing connaît une croissance explosive avec une demande croissante pour les services d'infrastructure. Microsoft Azure maintient sa position de leader face à la concurrence."
                },
                {
                    title: "Microsoft AI Investments Drive Innovation",
                    description: "Microsoft's continued investments in artificial intelligence are driving innovation across multiple product lines.",
                    content: "Microsoft's continued investments in artificial intelligence are driving innovation across multiple product lines, including Office 365 and Azure services.",
                    sectorAnalysis: "L'intelligence artificielle transforme le secteur technologique. Microsoft positionne ses investissements pour capturer cette opportunité de marché en pleine expansion."
                }
            ],
            'AAPL': [
                {
                    title: "Apple iPhone Sales Exceed Expectations",
                    description: "Apple Inc. reports stronger-than-expected iPhone sales in the latest quarter, driven by demand for the newest models.",
                    content: "Apple Inc. reports stronger-than-expected iPhone sales in the latest quarter, driven by demand for the newest models and strong performance in emerging markets.",
                    sectorAnalysis: "Le secteur de la technologie grand public montre une résilience remarquable. Apple maintient sa position dominante grâce à son écosystème intégré et sa fidélité client."
                },
                {
                    title: "Apple Services Revenue Hits New Record",
                    description: "Apple's services division, including App Store and iCloud, reaches record revenue levels.",
                    content: "Apple's services division, including App Store and iCloud, reaches record revenue levels, showing strong growth in recurring revenue streams.",
                    sectorAnalysis: "La transition vers les services récurrents transforme le modèle économique d'Apple. Cette diversification réduit la dépendance aux ventes de matériel et améliore la prévisibilité des revenus."
                }
            ],
            'GOOGL': [
                {
                    title: "Google Cloud Revenue Surges in Q3",
                    description: "Alphabet's Google Cloud division reports significant revenue growth, competing strongly with AWS and Azure.",
                    content: "Alphabet's Google Cloud division reports significant revenue growth, competing strongly with AWS and Azure in the enterprise cloud market.",
                    sectorAnalysis: "Le marché du cloud computing connaît une consolidation avec trois acteurs majeurs. Google Cloud gagne des parts de marché grâce à ses innovations en IA et ses tarifs compétitifs."
                },
                {
                    title: "Google AI Research Advances Continue",
                    description: "Google's artificial intelligence research team announces breakthrough developments in machine learning.",
                    content: "Google's artificial intelligence research team announces breakthrough developments in machine learning, with potential applications across multiple industries.",
                    sectorAnalysis: "L'intelligence artificielle devient un facteur différenciant clé dans le secteur technologique. Google maintient son leadership en recherche tout en commercialisant ses innovations."
                }
            ],
            'AMZN': [
                {
                    title: "Amazon Web Services Dominates Cloud Market",
                    description: "Amazon's cloud computing arm continues to lead the market with strong revenue growth and new service offerings.",
                    content: "Amazon's cloud computing arm continues to lead the market with strong revenue growth and new service offerings, maintaining its position as the industry leader.",
                    sectorAnalysis: "Amazon Web Services maintient sa position dominante dans le cloud computing grâce à sa large gamme de services et son écosystème intégré. Le secteur continue de croître avec l'adoption massive du cloud."
                },
                {
                    title: "Amazon Prime Membership Growth Accelerates",
                    description: "Amazon reports record growth in Prime membership subscriptions worldwide.",
                    content: "Amazon reports record growth in Prime membership subscriptions worldwide, driven by expanded benefits and faster delivery options.",
                    sectorAnalysis: "Le commerce électronique connaît une transformation avec l'importance croissante des abonnements. Amazon Prime crée un effet de verrouillage client et génère des revenus récurrents stables."
                }
            ],
            'TSLA': [
                {
                    title: "Tesla Vehicle Deliveries Hit Record High",
                    description: "Tesla reports record vehicle deliveries in the latest quarter, exceeding analyst expectations.",
                    content: "Tesla reports record vehicle deliveries in the latest quarter, exceeding analyst expectations and demonstrating strong demand for electric vehicles.",
                    sectorAnalysis: "Le secteur automobile électrique connaît une accélération majeure avec l'adoption croissante des véhicules électriques. Tesla maintient son leadership technologique et sa part de marché dominante."
                },
                {
                    title: "Tesla Energy Storage Business Expands",
                    description: "Tesla's energy storage division shows strong growth with new utility-scale projects.",
                    content: "Tesla's energy storage division shows strong growth with new utility-scale projects, contributing to the company's diversification strategy.",
                    sectorAnalysis: "Le secteur du stockage d'énergie connaît une croissance explosive avec la transition énergétique. Tesla diversifie ses revenus en capturant cette opportunité de marché émergente."
                }
            ],
            'NVDA': [
                {
                    title: "NVIDIA AI Chip Demand Surges",
                    description: "NVIDIA reports unprecedented demand for its AI and data center chips, driven by growing AI adoption.",
                    content: "NVIDIA reports unprecedented demand for its AI and data center chips, driven by growing AI adoption across industries and data centers.",
                    sectorAnalysis: "Le secteur des semi-conducteurs pour l'IA connaît une croissance explosive. NVIDIA domine le marché des puces d'accélération IA avec ses GPU spécialisés et son écosystème logiciel."
                },
                {
                    title: "NVIDIA Gaming Revenue Remains Strong",
                    description: "NVIDIA's gaming division continues to show resilience despite market challenges.",
                    content: "NVIDIA's gaming division continues to show resilience despite market challenges, with strong demand for high-end graphics cards.",
                    sectorAnalysis: "Le marché du gaming reste résilient malgré les défis économiques. NVIDIA maintient sa position dominante grâce à ses innovations technologiques et sa fidélité des gamers."
                }
            ],
            'META': [
                {
                    title: "Meta Reality Labs Investment Continues",
                    description: "Meta Platforms continues significant investment in its Reality Labs division for metaverse development.",
                    content: "Meta Platforms continues significant investment in its Reality Labs division for metaverse development, despite current market conditions.",
                    sectorAnalysis: "Le secteur de la réalité virtuelle et augmentée représente une opportunité à long terme. Meta positionne ses investissements pour capturer cette technologie émergente malgré les défis actuels."
                },
                {
                    title: "Meta Advertising Revenue Shows Recovery",
                    description: "Meta's advertising revenue shows signs of recovery as digital advertising market stabilizes.",
                    content: "Meta's advertising revenue shows signs of recovery as digital advertising market stabilizes, with improved targeting capabilities.",
                    sectorAnalysis: "Le marché de la publicité numérique se stabilise après les perturbations réglementaires. Meta adapte son modèle avec de nouvelles technologies de ciblage et de mesure."
                }
            ]
        };

        const demoNews = [];
        const requestedTickers = q ? q.split(' OR ').map(t => t.trim().toUpperCase()) : ['CVS', 'MSFT'];
        
        requestedTickers.forEach(ticker => {
            if (newsTemplates[ticker]) {
                newsTemplates[ticker].forEach(template => {
                    demoNews.push({
                        ...template,
                        url: `https://example.com/${ticker.toLowerCase()}-news-${Date.now()}`,
                        publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                        source: { name: `${ticker} Financial News` },
                        urlToImage: null
                    });
                });
            }
        });

        // Ajouter des actualités générales si pas assez de contenu spécifique
        if (demoNews.length < 3) {
            demoNews.push({
                title: "Marché Boursier : Signaux Mixtes",
                description: "Le marché boursier affiche des signaux mixtes aujourd'hui avec les actions technologiques en tête des gains tandis que les actions de santé font face à une certaine pression.",
                url: "https://example.com/market-update",
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                source: { name: "Market Watch" },
                urlToImage: null,
                content: "Le marché boursier affiche des signaux mixtes aujourd'hui avec les actions technologiques en tête des gains tandis que les actions de santé font face à une certaine pression.",
                sectorAnalysis: "Le marché financier connaît une volatilité accrue avec des secteurs performants (technologie) et d'autres en difficulté (santé). Cette divergence reflète les défis macroéconomiques actuels."
            });
        }

        return demoNews;
    };

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
        // Mode démo sans clés: générer des actualités synthétiques à partir des tickers
        const requestedTickers = q ? q.split(' OR ').map(t => t.trim().toUpperCase()) : [];
        const defaultTickers = ['CVS', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
        const tickers = requestedTickers.length > 0 ? requestedTickers : defaultTickers;
        const demo = generateDemoNews(tickers).slice(0, limit);
        return res.status(200).json({
            articles: demo,
            totalResults: demo.length,
            query: q || 'finance',
            timestamp: new Date().toISOString(),
            source: 'demo',
            sources: ['demo'],
            message: 'Mode démo activé: aucune clé API configurée',
            strict: isStrict
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
        
        // Limiter au nombre demandé (mais en mode strict, viser au moins 1/article par ticker avant coupe)
        let finalArticles = uniqueNews;
        if (!isStrict) {
            finalArticles = uniqueNews.slice(0, limit);
        }

        // Garantir au moins une actualité par ticker demandé (fallback synthétique)
        const hasForTicker = (t) => finalArticles.some(a => (a.ticker || '').toUpperCase() === t.toUpperCase() || ((a.title + ' ' + a.description).toUpperCase().includes(t.toUpperCase())));
        for (const t of tickers) {
            if (!hasForTicker(t)) {
                finalArticles.push({
                    title: `${t}: aucune actualité spécifique trouvée aujourd'hui` ,
                    description: `Aucune actualité directe trouvée pour ${t}. Voici une note automatique pour indiquer l'absence d'article dédié.`,
                    url: '#',
                    publishedAt: new Date().toISOString(),
                    source: { name: 'Système' },
                    urlToImage: null,
                    content: '',
                    ticker: t
                });
            }
        }
        
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