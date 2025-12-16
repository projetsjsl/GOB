/**
 * Test Endpoint - Capacités Perplexity Labs
 * Endpoint pour tester les fonctionnalités avancées de Perplexity
 */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

    if (!PERPLEXITY_API_KEY) {
        return res.status(503).json({
            error: 'PERPLEXITY_API_KEY non configurée'
        });
    }

    try {
        // Modèles à tester
        const models = ['sonar', 'sonar-pro', 'sonar-reasoning'];

        const testType = req.query.test || 'availability';

        // TEST 1: Disponibilité des modèles
        if (testType === 'availability') {
            console.log('🔍 Test de disponibilité des modèles...');

            const results = [];

            for (const model of models) {
                try {
                    const response = await fetch('https://api.perplexity.ai/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [{ role: 'user', content: 'Test' }],
                            max_tokens: 10
                        })
                    });

                    if (response.ok) {
                        results.push({
                            model,
                            available: true,
                            status: 'OK'
                        });
                    } else {
                        const error = await response.json().catch(() => ({}));
                        results.push({
                            model,
                            available: false,
                            status: error.error?.message || response.statusText
                        });
                    }
                } catch (error) {
                    results.push({
                        model,
                        available: false,
                        status: error.message
                    });
                }
            }

            return res.status(200).json({
                test: 'availability',
                timestamp: new Date().toISOString(),
                results
            });
        }

        // TEST 2: Requête financière simple
        if (testType === 'financial') {
            console.log('📊 Test de requête financière...');

            const ticker = req.query.ticker || 'AAPL';
            const model = req.query.model || 'sonar';

            const requestBody = {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es Emma, assistante financière experte. Fournis des données précises avec sources.'
                    },
                    {
                        role: 'user',
                        content: `Quel est le prix actuel de ${ticker} et sa variation aujourd'hui? Fournis aussi le volume de trading.`
                    }
                ],
                max_tokens: 500,
                temperature: 0.3,
                search_recency_filter: 'day',
                return_citations: true
            };

            const startTime = Date.now();

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return res.status(response.status).json({
                    error: error,
                    responseTime
                });
            }

            const data = await response.json();

            return res.status(200).json({
                test: 'financial',
                ticker: ticker,
                model: model,
                responseTime,
                content: data.choices[0].message.content,
                citations: data.citations || [],
                usage: data.usage || {},
                timestamp: new Date().toISOString()
            });
        }

        // TEST 3: Requête avec tags d'images
        if (testType === 'images') {
            console.log('🎨 Test de génération de tags d\'images...');

            const ticker = req.query.ticker || 'AAPL';
            const model = req.query.model || 'sonar-pro';

            const requestBody = {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es Emma, assistante financière experte.'
                    },
                    {
                        role: 'user',
                        content: `Analyse la performance de ${ticker} aujourd'hui.

IMPORTANT: Inclus dans ta réponse:
- [CHART:FINVIZ:${ticker}] pour montrer le graphique technique
- [LOGO:${ticker}] pour le logo de l'entreprise
- Des données chiffrées précises (prix, variation, volume)
- Les actualités principales du jour avec sources

Structure ta réponse de manière professionnelle et accessible.`
                    }
                ],
                max_tokens: 1500,
                temperature: 0.5,
                search_recency_filter: 'day',
                return_citations: true,
                return_images: true
            };

            const startTime = Date.now();

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return res.status(response.status).json({
                    error: error,
                    responseTime
                });
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Détecter les tags d'images dans la réponse
            const imageTags = content.match(/\[(CHART|LOGO|SCREENSHOT):[^\]]+\]/g) || [];

            return res.status(200).json({
                test: 'images',
                ticker: ticker,
                model: model,
                responseTime,
                content: content,
                imageTags: imageTags,
                citations: data.citations || [],
                images: data.images || [],
                usage: data.usage || {},
                timestamp: new Date().toISOString()
            });
        }

        // TEST 4: Comparaison de modèles
        if (testType === 'compare') {
            console.log('⚖️  Test de comparaison de modèles...');

            const ticker = req.query.ticker || 'AAPL';
            const prompt = `Analyse brièvement ${ticker}: prix actuel, variation, et une actualité principale.`;

            const results = [];

            for (const model of ['sonar', 'sonar-pro']) {
                try {
                    const requestBody = {
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: 'Tu es Emma, assistante financière experte.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        max_tokens: 500,
                        temperature: 0.5,
                        search_recency_filter: 'day',
                        return_citations: true
                    };

                    const startTime = Date.now();

                    const response = await fetch('https://api.perplexity.ai/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });

                    const responseTime = Date.now() - startTime;

                    if (response.ok) {
                        const data = await response.json();
                        results.push({
                            model,
                            success: true,
                            responseTime,
                            content: data.choices[0].message.content,
                            citations: data.citations?.length || 0,
                            tokens: data.usage?.total_tokens || 0
                        });
                    } else {
                        const error = await response.json().catch(() => ({}));
                        results.push({
                            model,
                            success: false,
                            error: error.error?.message || response.statusText
                        });
                    }
                } catch (error) {
                    results.push({
                        model,
                        success: false,
                        error: error.message
                    });
                }

                // Pause pour éviter rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return res.status(200).json({
                test: 'compare',
                ticker: ticker,
                results,
                timestamp: new Date().toISOString()
            });
        }

        // Par défaut: info sur les tests disponibles
        return res.status(200).json({
            message: 'Perplexity Labs Test Endpoint',
            availableTests: {
                availability: '/api/test-perplexity-labs?test=availability - Teste la disponibilité des modèles',
                financial: '/api/test-perplexity-labs?test=financial&ticker=AAPL&model=sonar - Requête financière simple',
                images: '/api/test-perplexity-labs?test=images&ticker=AAPL - Test de génération de tags d\'images',
                compare: '/api/test-perplexity-labs?test=compare&ticker=AAPL - Compare les modèles sonar et sonar-pro'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
        return res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
