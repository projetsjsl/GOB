// API de statut pour vérifier l'état de toutes les APIs
export default async function handler(req, res) {
    const { test = false } = req.query;
    
    // Configuration des APIs
    const apis = {
        finnhub: {
            name: 'Finnhub',
            key: process.env.FINNHUB_API_KEY,
            baseUrl: 'https://finnhub.io/api/v1',
            testUrl: 'https://finnhub.io/api/v1/quote?symbol=AAPL&token=',
            status: 'unknown',
            responseTime: 0,
            error: null,
            lastCheck: null
        },
        newsapi: {
            name: 'NewsAPI.ai',
            key: process.env.NEWSAPI_KEY,
            baseUrl: 'https://newsapi.ai/api/v1',
            testUrl: 'https://newsapi.ai/api/v1/article/getArticles',
            status: 'unknown',
            responseTime: 0,
            error: null,
            lastCheck: null
        },
        alphaVantage: {
            name: 'Alpha Vantage',
            key: process.env.ALPHA_VANTAGE_API_KEY,
            baseUrl: 'https://www.alphavantage.co/query',
            testUrl: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=',
            status: 'unknown',
            responseTime: 0,
            error: null,
            lastCheck: null
        },
        claude: {
            name: 'Claude AI',
            key: process.env.ANTHROPIC_API_KEY,
            baseUrl: 'https://api.anthropic.com',
            testUrl: 'https://api.anthropic.com/v1/messages',
            status: 'unknown',
            responseTime: 0,
            error: null,
            lastCheck: null
        },
        github: {
            name: 'GitHub API',
            key: process.env.GITHUB_TOKEN,
            baseUrl: 'https://api.github.com',
            testUrl: 'https://api.github.com/user',
            status: 'unknown',
            responseTime: 0,
            error: null,
            lastCheck: null
        }
    };

    // Fonction pour tester une API
    const testApi = async (apiName, apiConfig) => {
        const startTime = Date.now();
        
        try {
            // Vérifier si la clé API est configurée
            if (!apiConfig.key || apiConfig.key.includes('YOUR_') || apiConfig.key.includes('_KEY')) {
                return {
                    status: 'not_configured',
                    responseTime: 0,
                    error: 'Clé API non configurée',
                    lastCheck: new Date().toISOString()
                };
            }

            let response;
            
            switch (apiName) {
                case 'finnhub':
                    response = await fetch(`${apiConfig.testUrl}${apiConfig.key}`);
                    break;
                    
                case 'newsapi':
                    response = await fetch(apiConfig.testUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            apiKey: apiConfig.key,
                            query: { $query: { keyword: 'finance' } },
                            resultType: 'articles',
                            articlesCount: 1
                        })
                    });
                    break;
                    
                case 'alphaVantage':
                    response = await fetch(`${apiConfig.testUrl}${apiConfig.key}`);
                    break;
                    
                case 'claude':
                    response = await fetch(apiConfig.testUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiConfig.key,
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            max_tokens: 10,
                            messages: [{ role: 'user', content: 'test' }]
                        })
                    });
                    break;
                    
                case 'github':
                    response = await fetch(apiConfig.testUrl, {
                        headers: { 'Authorization': `token ${apiConfig.key}` }
                    });
                    break;
                    
                default:
                    throw new Error('API non reconnue');
            }

            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                return {
                    status: 'working',
                    responseTime,
                    error: null,
                    lastCheck: new Date().toISOString()
                };
            } else {
                return {
                    status: 'error',
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    lastCheck: new Date().toISOString()
                };
            }
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'error',
                responseTime,
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    };

    try {
        if (test === 'true') {
            // Tester toutes les APIs
            const testResults = {};
            
            for (const [apiName, apiConfig] of Object.entries(apis)) {
                console.log(`Test de l'API ${apiName}...`);
                const result = await testApi(apiName, apiConfig);
                testResults[apiName] = { ...apiConfig, ...result };
            }
            
            return res.status(200).json({
                apis: testResults,
                timestamp: new Date().toISOString(),
                testMode: true,
                summary: {
                    total: Object.keys(apis).length,
                    working: Object.values(testResults).filter(api => api.status === 'working').length,
                    notConfigured: Object.values(testResults).filter(api => api.status === 'not_configured').length,
                    errors: Object.values(testResults).filter(api => api.status === 'error').length
                }
            });
        } else {
            // Retourner le statut sans test
            const statusResults = {};
            
            for (const [apiName, apiConfig] of Object.entries(apis)) {
                statusResults[apiName] = {
                    name: apiConfig.name,
                    configured: !!(apiConfig.key && !apiConfig.key.includes('YOUR_') && !apiConfig.key.includes('_KEY')),
                    status: 'unknown',
                    lastCheck: null
                };
            }
            
            return res.status(200).json({
                apis: statusResults,
                timestamp: new Date().toISOString(),
                testMode: false,
                message: 'Utilisez ?test=true pour tester les APIs',
                instructions: {
                    finnhub: 'Configurez FINNHUB_API_KEY pour les données financières',
                    newsapi: 'Configurez NEWSAPI_KEY pour les actualités',
                    alphaVantage: 'Configurez ALPHA_VANTAGE_API_KEY pour les données alternatives',
                    claude: 'Configurez ANTHROPIC_API_KEY pour l\'analyse IA',
                    github: 'Configurez GITHUB_TOKEN pour la mise à jour des fichiers'
                }
            });
        }
        
    } catch (error) {
        console.error('Erreur API Status:', error);
        res.status(500).json({
            error: 'Erreur lors de la vérification du statut des APIs',
            details: error.message
        });
    }
}
