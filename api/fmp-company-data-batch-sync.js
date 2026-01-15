/**
 * API Batch optimisee pour la synchronisation en masse (3p1)
 * Utilise les batch requests natifs de FMP pour recuperer plusieurs tickers en une seule requete
 * 
 * GET /api/fmp-company-data-batch-sync?symbols=AAPL,MSFT,GOOGL&limit=50
 * 
 * Limites FMP:
 * - Profile: jusqu'a 10-20 symboles par batch (selon plan)
 * - Key Metrics: jusqu'a 10 symboles par batch
 * - Quote: jusqu'a 100 symboles par batch
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

    const { symbols, limit, includeKeyMetrics } = req.query;

    if (!symbols || symbols.trim().length === 0) {
        return res.status(400).json({ error: 'Symbols parameter required (comma-separated)' });
    }
    
    // Par defaut, inclure les key metrics si le parametre n'est pas specifie (pour compatibilite)
    const shouldIncludeKeyMetrics = includeKeyMetrics !== 'false';

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

    // Limiter le nombre total de symboles si specifie
    const maxSymbols = limit ? parseInt(limit) : 50;
    const symbolsToProcess = symbolList.slice(0, maxSymbols);

    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    // Batch sizes selon les limites FMP (conservateur pour eviter rate limiting)
    const PROFILE_BATCH_SIZE = 10;  // Profile supporte generalement 10-20
    const KEY_METRICS_BATCH_SIZE = 10;  // Key metrics plus limite
    const QUOTE_BATCH_SIZE = 50;  // Quote supporte jusqu'a 100

    try {
        console.log(` Batch sync: ${symbolsToProcess.length} tickers`);

        // 1. Recuperer les profiles en batch
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
                    // Rate limiting - attendre et reessayer
                    console.warn(` Rate limit detecte pour profiles batch, attente 2s...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    // Reessayer une fois
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
                
                // Delai entre batches pour eviter rate limiting (ultra-securise: 1.5s)
                if (profileBatches.length > 1 && profileBatches.indexOf(batch) < profileBatches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (error) {
                console.error(` Erreur batch profiles:`, error.message);
            }
        }

        // 2. Recuperer les key metrics individuellement (FMP ne supporte pas les batch requests pour key-metrics)
        // Seulement si includeKeyMetrics est true
        const validSymbols = Object.keys(allProfiles);
        const allKeyMetrics = {};
        let keyMetricsSuccessCount = 0;
        let keyMetricsEmptyCount = 0;
        
        if (shouldIncludeKeyMetrics) {
            console.log(` ${validSymbols.length} symboles avec profile valide - Recuperation key metrics individuellement`);
            
            // Traiter par petits groupes pour eviter le rate limiting
            const CONCURRENT_LIMIT = 3; // Maximum 3 appels simultanes
            for (let i = 0; i < validSymbols.length; i += CONCURRENT_LIMIT) {
                const batch = validSymbols.slice(i, i + CONCURRENT_LIMIT);
            
                // Faire les appels en parallele pour ce petit batch
                const promises = batch.map(async (symbol) => {
                try {
                    const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${symbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
                    
                    if (metricsRes.ok) {
                        const metrics = await metricsRes.json();
                        if (Array.isArray(metrics) && metrics.length > 0) {
                            allKeyMetrics[symbol] = metrics;
                            keyMetricsSuccessCount++;
                            return { symbol, success: true, count: metrics.length };
                        } else {
                            keyMetricsEmptyCount++;
                            return { symbol, success: false, reason: 'Empty array' };
                        }
                    } else if (metricsRes.status === 429) {
                        // Rate limiting - attendre et reessayer une fois
                        console.warn(` Rate limit pour ${symbol}, attente 2s...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const retryRes = await fetch(`${FMP_BASE}/key-metrics/${symbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
                        if (retryRes.ok) {
                            const metrics = await retryRes.json();
                            if (Array.isArray(metrics) && metrics.length > 0) {
                                allKeyMetrics[symbol] = metrics;
                                keyMetricsSuccessCount++;
                                return { symbol, success: true, count: metrics.length };
                            }
                        }
                        keyMetricsEmptyCount++;
                        return { symbol, success: false, reason: `HTTP ${retryRes.status}` };
                    } else {
                        keyMetricsEmptyCount++;
                        return { symbol, success: false, reason: `HTTP ${metricsRes.status}` };
                    }
                } catch (error) {
                    keyMetricsEmptyCount++;
                    return { symbol, success: false, reason: error.message };
                }
                });
                
                const results = await Promise.all(promises);
                const successInBatch = results.filter(r => r.success).length;
                if (successInBatch > 0) {
                    console.log(` Key metrics batch ${Math.floor(i / CONCURRENT_LIMIT) + 1}: ${successInBatch}/${batch.length} succes`);
                }
                
                // Delai entre batches pour eviter rate limiting (ultra-securise: 500ms)
                if (i + CONCURRENT_LIMIT < validSymbols.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            console.log(` Key metrics ignorees (includeKeyMetrics=false)`);
        }
        
        if (shouldIncludeKeyMetrics) {
            console.log(` Key metrics: ${keyMetricsSuccessCount} symboles avec donnees, ${keyMetricsEmptyCount} symboles sans donnees`);
        }

        // 3. Recuperer les quotes en batch (plus grand batch possible)
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
                
                // Delai entre batches (ultra-securise: 1s pour quotes car batch plus grand)
                if (quoteBatches.length > 1 && quoteBatches.indexOf(batch) < quoteBatches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(` Erreur batch quotes:`, error.message);
            }
        }

        // 4. Formater les resultats dans le format attendu par l'application 3p1
        const results = validSymbols.map(symbol => {
            const profile = allProfiles[symbol];
            const metrics = allKeyMetrics[symbol] || [];
            const quote = allQuotes[symbol];

            // Debug: log les metriques recuperees
            if (metrics.length === 0) {
                console.log(`i ${symbol}: Profile OK mais 0 key metrics recuperees`);
            } else {
                console.log(` ${symbol}: ${metrics.length} key metrics recuperees`);
            }

            // Transformer les key metrics en format AnnualData
            // FMP key-metrics utilise 'date' (format YYYY-MM-DD) pas 'calendarYear'
            // IMPORTANT: Utiliser netIncomePerShare pour earningsPerShare (comme dans fmp-company-data.js)
            const data = metrics
                .map(metric => {
                    // Extraire l'annee de la date
                    let year = new Date().getFullYear();
                    if (metric.date) {
                        const dateObj = new Date(metric.date);
                        if (!isNaN(dateObj.getTime())) {
                            year = dateObj.getFullYear();
                        }
                    } else if (metric.calendarYear) {
                        year = metric.calendarYear;
                    }
                    return { ...metric, year };
                })
                .filter(metric => metric.year && metric.year > 1900 && metric.year < 2100) // Filtrer les annees invalides
                .sort((a, b) => b.year - a.year)
                .slice(0, 25) // Limiter a 25 annees
                .map(metric => ({
                    year: metric.year,
                    // IMPORTANT: Utiliser netIncomePerShare (comme dans fmp-company-data.js ligne 554)
                    earningsPerShare: parseFloat(Number(metric.netIncomePerShare || metric.earningsPerShare || 0).toFixed(2)),
                    cashFlowPerShare: parseFloat(Number(metric.operatingCashFlowPerShare || 0).toFixed(2)),
                    bookValuePerShare: parseFloat(Number(metric.bookValuePerShare || 0).toFixed(2)),
                    dividendPerShare: parseFloat(Number(metric.dividendPerShare || 0).toFixed(2)),
                    // Calculer priceHigh a partir de priceToBookRatio si disponible
                    priceHigh: metric.priceToBookRatio && metric.bookValuePerShare && metric.bookValuePerShare > 0 
                        ? parseFloat(Number(metric.bookValuePerShare * metric.priceToBookRatio).toFixed(2))
                        : 0,
                    priceLow: 0, // Pas disponible dans key metrics seul, necessiterait historical prices
                    autoFetched: true
                }))
                .filter(row => row.earningsPerShare > 0 || row.cashFlowPerShare > 0 || row.bookValuePerShare > 0); // Filtrer les lignes completement vides

            // Debug: log si pas de donnees
            if (data.length === 0) {
                if (metrics.length > 0) {
                    console.warn(` ${symbol}: ${metrics.length} metriques mais 0 donnees transformees. Premier metric:`, JSON.stringify(metrics[0]).substring(0, 200));
                } else {
                    console.warn(` ${symbol}: Profile trouve mais aucune key metric disponible. Type: ${profile.type || 'N/A'}, Exchange: ${profile.exchangeShortName || 'N/A'}, Sector: ${profile.sector || 'N/A'}`);
                }
            } else {
                console.log(` ${symbol}: ${data.length} annees de donnees transformees`);
            }

            //  NOUVEAU: Calculer le dividende actuel depuis key metrics
            const currentPrice = quote?.price || profile.price || 0;
            let currentDividend = 0;
            
            if (metrics.length > 0) {
                const mostRecentMetric = metrics[0]; // Le plus recent (premier apres tri)
                
                // 1. Essayer dividendPerShare du metric le plus recent
                if (mostRecentMetric?.dividendPerShare && mostRecentMetric.dividendPerShare > 0) {
                    currentDividend = parseFloat(mostRecentMetric.dividendPerShare);
                }
                // 2. Fallback: Calculer a partir de dividendYield et currentPrice
                else if (mostRecentMetric?.dividendYield && mostRecentMetric.dividendYield > 0 && currentPrice > 0) {
                    // dividendYield est generalement en decimal (0.04 pour 4%)
                    const yieldDecimal = parseFloat(mostRecentMetric.dividendYield);
                    // Si yield est > 1, c'est probablement deja en pourcentage, convertir
                    const yieldPercent = yieldDecimal > 1 ? yieldDecimal : yieldDecimal * 100;
                    if (yieldPercent > 0 && yieldPercent < 50) { // Raisonnable: 0-50%
                        currentDividend = (yieldPercent / 100) * currentPrice;
                    }
                }
            }
            
            // 3. Fallback final: Utiliser le dividende de l'annee la plus recente avec dividende > 0
            if (currentDividend === 0 && data.length > 0) {
                const sortedData = [...data].sort((a, b) => b.year - a.year);
                const mostRecentWithDividend = sortedData.find(d => d.dividendPerShare > 0);
                if (mostRecentWithDividend) {
                    currentDividend = mostRecentWithDividend.dividendPerShare;
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
                    currentPrice: currentPrice,
                    currentDividend: parseFloat(currentDividend.toFixed(4)), //  NOUVEAU: Dividende actuel calcule
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

        console.log(` Batch sync termine: ${successCount} succes (${withDataCount} avec donnees historiques, ${withProfileOnlyCount} profile uniquement), ${errorCount} erreurs`);

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
        console.error(' Batch sync error:', error);
        return res.status(500).json({
            error: 'Failed to fetch batch data',
            message: error.message
        });
    }
}

