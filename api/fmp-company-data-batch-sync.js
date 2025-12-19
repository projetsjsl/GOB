/**
 * API Batch optimisée pour la synchronisation en masse (3p1)
 * Utilise les batch requests natifs de FMP pour récupérer plusieurs tickers en une seule requête
 * 
 * GET /api/fmp-company-data-batch-sync?symbols=AAPL,MSFT,GOOGL&limit=50
 * 
 * Limites FMP:
 * - Profile: jusqu'à 10-20 symboles par batch (selon plan)
 * - Key Metrics: jusqu'à 10 symboles par batch
 * - Quote: jusqu'à 100 symboles par batch
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbols, limit } = req.query;

    if (!symbols || symbols.trim().length === 0) {
        return res.status(400).json({ error: 'Symbols parameter required (comma-separated)' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    // Parse symbols
    const symbolList = symbols.split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
    
    if (symbolList.length === 0) {
        return res.status(400).json({ error: 'No valid symbols provided' });
    }

    // Limiter le nombre total de symboles si spécifié
    const maxSymbols = limit ? parseInt(limit) : 50;
    const symbolsToProcess = symbolList.slice(0, maxSymbols);

    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    // Batch sizes selon les limites FMP (conservateur pour éviter rate limiting)
    const PROFILE_BATCH_SIZE = 10;  // Profile supporte généralement 10-20
    const KEY_METRICS_BATCH_SIZE = 10;  // Key metrics plus limité
    const QUOTE_BATCH_SIZE = 50;  // Quote supporte jusqu'à 100

    try {
        console.log(`📦 Batch sync: ${symbolsToProcess.length} tickers`);

        // 1. Récupérer les profiles en batch
        const profileBatches = [];
        for (let i = 0; i < symbolsToProcess.length; i += PROFILE_BATCH_SIZE) {
            profileBatches.push(symbolsToProcess.slice(i, i + PROFILE_BATCH_SIZE));
        }

        const allProfiles = {};
        for (const batch of profileBatches) {
            try {
                const symbolString = batch.join(',');
                const profileRes = await fetch(`${FMP_BASE}/profile/${symbolString}?apikey=${FMP_KEY}`);
                
                if (profileRes.ok) {
                    const profiles = await profileRes.json();
                    if (Array.isArray(profiles)) {
                        profiles.forEach(profile => {
                            if (profile && profile.symbol) {
                                allProfiles[profile.symbol.toUpperCase()] = profile;
                            }
                        });
                    }
                } else if (profileRes.status === 429) {
                    // Rate limiting - attendre et réessayer
                    console.warn(`⏳ Rate limit détecté pour profiles batch, attente 2s...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    // Réessayer une fois
                    const retryRes = await fetch(`${FMP_BASE}/profile/${symbolString}?apikey=${FMP_KEY}`);
                    if (retryRes.ok) {
                        const profiles = await retryRes.json();
                        if (Array.isArray(profiles)) {
                            profiles.forEach(profile => {
                                if (profile && profile.symbol) {
                                    allProfiles[profile.symbol.toUpperCase()] = profile;
                                }
                            });
                        }
                    }
                }
                
                // Délai entre batches pour éviter rate limiting (ultra-sécurisé: 1.5s)
                if (profileBatches.length > 1 && profileBatches.indexOf(batch) < profileBatches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (error) {
                console.error(`❌ Erreur batch profiles:`, error.message);
            }
        }

        // 2. Récupérer les key metrics en batch (seulement pour les symboles qui ont un profile)
        const validSymbols = Object.keys(allProfiles);
        console.log(`📊 ${validSymbols.length} symboles avec profile valide`);
        
        const keyMetricsBatches = [];
        for (let i = 0; i < validSymbols.length; i += KEY_METRICS_BATCH_SIZE) {
            keyMetricsBatches.push(validSymbols.slice(i, i + KEY_METRICS_BATCH_SIZE));
        }

        const allKeyMetrics = {};
        let keyMetricsSuccessCount = 0;
        let keyMetricsEmptyCount = 0;
        
        for (const batch of keyMetricsBatches) {
            try {
                const symbolString = batch.join(',');
                const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${symbolString}?period=annual&limit=30&apikey=${FMP_KEY}`);
                
                if (metricsRes.ok) {
                    const metrics = await metricsRes.json();
                    if (Array.isArray(metrics)) {
                        // Grouper les métriques par symbole
                        const metricsBySymbol = {};
                        metrics.forEach(metric => {
                            if (metric && metric.symbol) {
                                const symbol = metric.symbol.toUpperCase();
                                if (!metricsBySymbol[symbol]) {
                                    metricsBySymbol[symbol] = [];
                                }
                                metricsBySymbol[symbol].push(metric);
                            }
                        });
                        
                        // Ajouter au résultat global
                        Object.keys(metricsBySymbol).forEach(symbol => {
                            allKeyMetrics[symbol] = metricsBySymbol[symbol];
                            keyMetricsSuccessCount++;
                        });
                        
                        // Compter les symboles sans métriques
                        batch.forEach(symbol => {
                            if (!metricsBySymbol[symbol.toUpperCase()]) {
                                keyMetricsEmptyCount++;
                                console.warn(`⚠️ ${symbol}: Profile trouvé mais aucune key metric disponible`);
                            }
                        });
                        
                        console.log(`✅ Key metrics batch: ${batch.length} symboles, ${metrics.length} métriques récupérées (${Object.keys(metricsBySymbol).length} symboles avec données)`);
                    } else {
                        console.warn(`⚠️ Key metrics batch: réponse non-array pour ${batch.join(',')} (status: ${metricsRes.status})`);
                        // Si la réponse n'est pas un array, tous les symboles du batch n'ont pas de métriques
                        keyMetricsEmptyCount += batch.length;
                    }
                } else if (metricsRes.status === 429) {
                    // Rate limiting - attendre et réessayer
                    console.warn(`⏳ Rate limit détecté pour key metrics batch, attente 3s...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    // Réessayer une fois
                    const retryRes = await fetch(`${FMP_BASE}/key-metrics/${symbolString}?period=annual&limit=30&apikey=${FMP_KEY}`);
                    if (retryRes.ok) {
                        const metrics = await retryRes.json();
                        if (Array.isArray(metrics)) {
                            metrics.forEach(metric => {
                                if (metric && metric.symbol) {
                                    const symbol = metric.symbol.toUpperCase();
                                    if (!allKeyMetrics[symbol]) {
                                        allKeyMetrics[symbol] = [];
                                    }
                                    allKeyMetrics[symbol].push(metric);
                                    keyMetricsSuccessCount++;
                                }
                            });
                        }
                    }
                } else {
                    console.warn(`⚠️ Key metrics batch échoué: ${metricsRes.status} pour ${batch.join(',')}`);
                    keyMetricsEmptyCount += batch.length;
                }
                
                // Délai entre batches (ultra-sécurisé: 1.5s)
                if (keyMetricsBatches.length > 1 && keyMetricsBatches.indexOf(batch) < keyMetricsBatches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (error) {
                console.error(`❌ Erreur batch key metrics:`, error.message);
                keyMetricsEmptyCount += batch.length;
            }
        }
        
        console.log(`📊 Key metrics: ${keyMetricsSuccessCount} symboles avec données, ${keyMetricsEmptyCount} symboles sans données`);

        // 3. Récupérer les quotes en batch (plus grand batch possible)
        const quoteBatches = [];
        for (let i = 0; i < validSymbols.length; i += QUOTE_BATCH_SIZE) {
            quoteBatches.push(validSymbols.slice(i, i + QUOTE_BATCH_SIZE));
        }

        const allQuotes = {};
        for (const batch of quoteBatches) {
            try {
                const symbolString = batch.join(',');
                const quoteRes = await fetch(`${FMP_BASE}/quote/${symbolString}?apikey=${FMP_KEY}`);
                
                if (quoteRes.ok) {
                    const quotes = await quoteRes.json();
                    if (Array.isArray(quotes)) {
                        quotes.forEach(quote => {
                            if (quote && quote.symbol) {
                                allQuotes[quote.symbol.toUpperCase()] = quote;
                            }
                        });
                    }
                }
                
                // Délai entre batches (ultra-sécurisé: 1s pour quotes car batch plus grand)
                if (quoteBatches.length > 1 && quoteBatches.indexOf(batch) < quoteBatches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`❌ Erreur batch quotes:`, error.message);
            }
        }

        // 4. Formater les résultats dans le format attendu par l'application 3p1
        const results = validSymbols.map(symbol => {
            const profile = allProfiles[symbol];
            const metrics = allKeyMetrics[symbol] || [];
            const quote = allQuotes[symbol];

            // Transformer les key metrics en format AnnualData
            // FMP key-metrics utilise 'date' (format YYYY-MM-DD) pas 'calendarYear'
            const data = metrics
                .map(metric => {
                    // Extraire l'année de la date
                    let year = new Date().getFullYear();
                    if (metric.date) {
                        year = new Date(metric.date).getFullYear();
                    } else if (metric.calendarYear) {
                        year = metric.calendarYear;
                    }
                    return { ...metric, year };
                })
                .sort((a, b) => b.year - a.year)
                .slice(0, 25) // Limiter à 25 années
                .map(metric => ({
                    year: metric.year,
                    earningsPerShare: metric.earningsPerShare || metric.netIncomePerShare || 0,
                    cashFlowPerShare: metric.operatingCashFlowPerShare || 0,
                    bookValuePerShare: metric.bookValuePerShare || 0,
                    dividendPerShare: metric.dividendPerShare || 0,
                    priceHigh: metric.priceToBookRatio && metric.bookValuePerShare ? (metric.bookValuePerShare * metric.priceToBookRatio) : 0,
                    priceLow: 0, // Pas disponible dans key metrics seul, nécessiterait historical prices
                    autoFetched: true
                }));

            // Debug: log si pas de données
            if (data.length === 0) {
                if (metrics.length > 0) {
                    console.warn(`⚠️ ${symbol}: ${metrics.length} métriques mais 0 données transformées. Premier metric:`, metrics[0]);
                } else {
                    console.warn(`⚠️ ${symbol}: Profile trouvé mais aucune key metric disponible. Type: ${profile.type || 'N/A'}, Exchange: ${profile.exchangeShortName || 'N/A'}`);
                }
            }

            return {
                symbol,
                success: true,
                data: {
                    data: data,
                    info: {
                        symbol: profile.symbol || symbol,
                        name: profile.companyName || profile.name || '',
                        sector: profile.sector || '',
                        industry: profile.industry || '',
                        exchange: profile.exchangeShortName || '',
                        currency: profile.currency || 'USD',
                        country: profile.country || '',
                        website: profile.website || '',
                        description: profile.description || '',
                        ceo: profile.ceo || '',
                        employees: profile.fullTimeEmployees || 0,
                        marketCap: profile.mktCap || 0,
                        image: profile.image || ''
                    },
                    currentPrice: quote?.price || profile.price || 0,
                    financials: [],
                    analysisData: null
                }
            };
        });

        // Ajouter les symboles qui n'ont pas de profile (introuvables)
        const foundSymbols = new Set(validSymbols);
        const notFoundSymbols = symbolsToProcess.filter(s => !foundSymbols.has(s));
        
        notFoundSymbols.forEach(symbol => {
            results.push({
                symbol,
                success: false,
                error: `Symbole '${symbol}' introuvable dans FMP`,
                data: null
            });
        });

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        const withDataCount = results.filter(r => r.success && r.data && r.data.data && r.data.data.length > 0).length;
        const withProfileOnlyCount = results.filter(r => r.success && r.data && (!r.data.data || r.data.data.length === 0)).length;

        console.log(`✅ Batch sync terminé: ${successCount} succès (${withDataCount} avec données historiques, ${withProfileOnlyCount} profile uniquement), ${errorCount} erreurs`);

        return res.status(200).json({
            success: true,
            results: results,
            stats: {
                total: symbolsToProcess.length,
                success: successCount,
                errors: errorCount
            }
        });

    } catch (error) {
        console.error('❌ Batch sync error:', error);
        return res.status(500).json({
            error: 'Failed to fetch batch data',
            message: error.message
        });
    }
}

