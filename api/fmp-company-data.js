/**
 * API Proxy pour récupérer les données complètes d'une compagnie
 * Utilise FMP Premium pour: profile, key-metrics, prix historiques
 * 
 * Premium Features:
 * - Historique étendu: 20 ans (7300 jours) au lieu de 5 ans
 * - Key Metrics: 30 années au lieu de 20
 * - Annual Data: 15 dernières années au lieu de 6
 * 
 * Date: 6 décembre 2025
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

    const { symbol } = req.query;

    if (!symbol || symbol.trim().length === 0) {
        return res.status(400).json({ error: 'Symbol parameter required' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;
    const FINNHUB_KEY = process.env.FINNHUB_API_KEY || process.env.FINNHUB_TOKEN;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    const cleanSymbol = symbol.toUpperCase();
    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    // Mapping de symboles alternatifs pour les cas spéciaux (fallback si Search échoue)
    const symbolVariants = {
        'BRK.B': ['BRK-B', 'BRK.B', 'BRKB'],
        'BBD.B': ['BBD-B', 'BBD.B', 'BBD-B.TO', 'BBD.TO'],
        'GIB.A': ['GIB-A', 'GIB.A', 'GIB-A.TO', 'GIB.TO'],
        'ATD.B': ['ATD-B', 'ATD.B', 'ATD-B.TO', 'ATD.TO'],
        'TECK.B': ['TECK-B', 'TECK.B', 'TECK-B.TO', 'TECK.TO'],
        'RCI.B': ['RCI-B', 'RCI.B', 'RCI-B.TO', 'RCI.TO', 'RCI'],
        'MRU': ['MRU.TO', 'MRU'],
        'ABX': ['ABX.TO', 'ABX', 'GOLD'], // Barrick Gold peut être GOLD maintenant
        'IFC': ['IFC.TO', 'IFC'],
        'GWO': ['GWO.TO', 'GWO'],
        'EMA': ['EMA.TO', 'EMA'],
        'CCA': ['CCA.TO', 'CCA'],
        'POW': ['POW.TO', 'POW'],
        'REI.TO': ['REI-UN.TO', 'REI.TO', 'REI-UN'],
        'REI': ['REI-UN.TO', 'REI.TO', 'REI-UN'],
        // Autres REITs/Units Canadiens
        'SRU.TO': ['SRU-UN.TO'], 'SRU': ['SRU-UN.TO'],
        'AP.TO': ['AP-UN.TO'], 'AP': ['AP-UN.TO'],
        'CAR.TO': ['CAR-UN.TO'], 'CAR': ['CAR-UN.TO'],
        'DIR.TO': ['DIR-UN.TO'], 'DIR': ['DIR-UN.TO'],
        'GRT.TO': ['GRT-UN.TO'], 'GRT': ['GRT-UN.TO'],
        'CSH.TO': ['CSH-UN.TO'], 'CSH': ['CSH-UN.TO'],
        'CHP.TO': ['CHP-UN.TO'], 'CHP': ['CHP-UN.TO'],
        'BIP.TO': ['BIP-UN.TO'], 'BIP': ['BIP-UN.TO'],
        'BEP.TO': ['BEP-UN.TO'], 'BEP': ['BEP-UN.TO'],
        'HR.TO': ['HR-UN.TO'], 'HR': ['HR-UN.TO'],
        'KMP.TO': ['KMP-UN.TO'], 'KMP': ['KMP-UN.TO'],
        'NWH.TO': ['NWH-UN.TO'], 'NWH': ['NWH-UN.TO']
    };

    // Fonction pour utiliser FMP Search Premium pour résoudre automatiquement les symboles
    const searchSymbol = async (symbolToSearch) => {
        try {
            // Utiliser l'endpoint Search Premium si disponible
            const searchRes = await fetch(`${FMP_BASE}/search?query=${encodeURIComponent(symbolToSearch)}&apikey=${FMP_KEY}&limit=10`);
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (Array.isArray(searchData) && searchData.length > 0) {
                    // Trouver le meilleur match (exact ou le premier résultat)
                    const exactMatch = searchData.find(r => r.symbol.toUpperCase() === symbolToSearch.toUpperCase());
                    const bestMatch = exactMatch || searchData[0];
                    if (bestMatch && bestMatch.symbol) {
                        console.log(`✅ FMP Search found "${bestMatch.symbol}" for query "${symbolToSearch}"`);
                        return bestMatch.symbol;
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ FMP Search failed for ${symbolToSearch}, using fallback:`, error.message);
        }
        return null;
    };

    // Fonction pour essayer plusieurs variantes de symboles
    const tryFetchProfile = async (symbolToTry, retryCount = 0) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 5000; // 5 secondes (augmenté pour éviter les cascades de 429)
        
        try {
            const profileRes = await fetch(`${FMP_BASE}/profile/${symbolToTry}?apikey=${FMP_KEY}`);
            
            // Vérifier le statut HTTP
            if (!profileRes.ok) {
                const errorText = await profileRes.text();
                
                // Gestion du rate limiting (429) avec retry
                if (profileRes.status === 429 && retryCount < MAX_RETRIES) {
                    const retryAfter = profileRes.headers.get('Retry-After') || RETRY_DELAY * (retryCount + 1);
                    console.warn(`⏳ Rate limit atteint pour ${symbolToTry}, retry dans ${retryAfter}ms (tentative ${retryCount + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter)));
                    return tryFetchProfile(symbolToTry, retryCount + 1);
                }
                
                console.warn(`⚠️ FMP Profile HTTP error for ${symbolToTry}: ${profileRes.status} - ${errorText.substring(0, 200)}`);
                
                // Si c'est une erreur d'API key invalide, on veut le savoir
                if (profileRes.status === 401 || profileRes.status === 403) {
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson['Error Message'] && errorJson['Error Message'].includes('Invalid API KEY')) {
                            console.error(`❌ FMP API KEY INVALIDE - Vérifiez FMP_API_KEY dans Vercel`);
                        }
                    } catch (e) {
                        // Ignore parse error
                    }
                }
                
                // Si c'est un rate limit après tous les retries, retourner une erreur spéciale
                if (profileRes.status === 429) {
                    throw new Error(`Rate limit FMP atteint pour ${symbolToTry} après ${MAX_RETRIES} tentatives`);
                }
                
                return null;
            }
            
            const profileData = await profileRes.json();
            
            // Vérifier si c'est un objet d'erreur FMP
            if (profileData && typeof profileData === 'object' && !Array.isArray(profileData)) {
                if (profileData['Error Message']) {
                    console.warn(`⚠️ FMP Error for ${symbolToTry}: ${profileData['Error Message']}`);
                    return null;
                }
            }
            
            // Vérifier si c'est un tableau vide ou invalide
            if (!profileData || !Array.isArray(profileData) || profileData.length === 0) {
                console.warn(`⚠️ FMP Profile returned empty/invalid data for ${symbolToTry}`);
                return null;
            }
            
            // Vérifier que le profil a des données valides
            const profile = profileData[0];
            if (!profile || !profile.symbol) {
                console.warn(`⚠️ FMP Profile data invalid for ${symbolToTry}`);
                return null;
            }
            
            console.log(`✅ FMP Profile found for ${symbolToTry} (actual symbol: ${profile.symbol})`);
            return { profile, usedSymbol: symbolToTry };
        } catch (error) {
            console.error(`❌ Error fetching FMP profile for ${symbolToTry}:`, error.message);
            return null;
        }
    };

    try {
        // 0. OPTIMIZATION: Skip FMP Search for simple symbols to reduce API calls during bulk sync
        // Simple symbols (no dots, dashes, or special chars) should work directly with profile lookup
        const isSimpleSymbol = /^[A-Z]{1,5}$/.test(cleanSymbol);
        
        let profileResult = null;
        let usedSymbol = cleanSymbol;
        
        if (isSimpleSymbol) {
            // 1a. For simple symbols, try direct profile lookup first (faster, less API calls)
            profileResult = await tryFetchProfile(cleanSymbol);
        } else {
            // 1b. For complex symbols (like .TO, .B, etc.), use Search API to resolve
            let resolvedSymbol = await searchSymbol(cleanSymbol);
            let searchSymbolToTry = resolvedSymbol || cleanSymbol;
            profileResult = await tryFetchProfile(searchSymbolToTry);
            usedSymbol = searchSymbolToTry;
        }

        // 2. Si échec et qu'on a des variantes, les essayer
        if (!profileResult && symbolVariants[cleanSymbol]) {
            for (const variant of symbolVariants[cleanSymbol]) {
                profileResult = await tryFetchProfile(variant);
                if (profileResult) {
                    usedSymbol = variant;
                    break;
                }
            }
        }

        // 3. Si toujours échec, essayer avec .TO pour les symboles canadiens
        if (!profileResult && (cleanSymbol.includes('.B') || cleanSymbol.includes('.A'))) {
            // Essayer avec tiret + .TO
            const tsxSymbol1 = cleanSymbol.replace('.', '-') + '.TO';
            profileResult = await tryFetchProfile(tsxSymbol1);
            if (profileResult) {
                usedSymbol = tsxSymbol1;
            } else {
                // Essayer avec point + .TO
                const tsxSymbol2 = cleanSymbol + '.TO';
                profileResult = await tryFetchProfile(tsxSymbol2);
                if (profileResult) {
                    usedSymbol = tsxSymbol2;
                }
            }
        }

        // 4. Si toujours échec, essayer sans le suffixe de classe
        if (!profileResult && (cleanSymbol.includes('.B') || cleanSymbol.includes('.A'))) {
            const baseSymbol = cleanSymbol.split('.')[0];
            // Essayer base seul
            profileResult = await tryFetchProfile(baseSymbol);
            if (profileResult) {
                usedSymbol = baseSymbol;
            } else {
                // Essayer base + .TO
                profileResult = await tryFetchProfile(baseSymbol + '.TO');
                if (profileResult) {
                    usedSymbol = baseSymbol + '.TO';
                }
            }
        }

        // 5. Pour les symboles sans suffixe, essayer .TO si pas déjà fait
        if (!profileResult && !cleanSymbol.includes('.') && !cleanSymbol.endsWith('.TO')) {
            profileResult = await tryFetchProfile(cleanSymbol + '.TO');
            if (profileResult) {
                usedSymbol = cleanSymbol + '.TO';
            }
        }

        if (!profileResult) {
            const triedSymbols = [cleanSymbol, ...(symbolVariants[cleanSymbol] || [])];
            console.error(`❌ Symbol '${cleanSymbol}' not found after trying: ${triedSymbols.join(', ')}`);
            
            // Vérifier si c'est un problème de clé API en testant avec un ticker connu
            let apiKeyValid = true;
            try {
                const testRes = await fetch(`${FMP_BASE}/profile/AAPL?apikey=${FMP_KEY}`);
                if (!testRes.ok) {
                    const testError = await testRes.text();
                    if (testError.includes('Invalid API KEY') || testError.includes('API key')) {
                        apiKeyValid = false;
                        console.error(`❌ FMP API KEY semble invalide - Vérifiez FMP_API_KEY dans Vercel`);
                        return res.status(500).json({
                            error: 'FMP API key invalid or not configured',
                            message: 'La clé API FMP semble invalide. Vérifiez FMP_API_KEY dans les variables d\'environnement Vercel.',
                            tried: triedSymbols,
                            diagnostic: 'Test avec AAPL a également échoué'
                        });
                    }
                    // Si AAPL échoue mais ce n'est pas une erreur de clé, c'est peut-être un rate limit
                    if (testRes.status === 429) {
                        console.error(`⚠️ Rate limiting détecté lors du test avec AAPL - FMP peut être surchargé`);
                        return res.status(429).json({
                            error: 'Rate limit FMP',
                            message: `Rate limiting détecté. Veuillez réessayer dans quelques instants.`,
                            tried: triedSymbols,
                            diagnostic: 'Test avec AAPL a également échoué avec 429'
                        });
                    }
                } else {
                    const testData = await testRes.json();
                    if (testData && Array.isArray(testData) && testData.length > 0) {
                        console.log(`✅ Test API réussi avec AAPL - La clé API fonctionne`);
                    }
                }
            } catch (testError) {
                console.error(`❌ Erreur lors du test API avec AAPL:`, testError.message);
            }
            
            return res.status(404).json({ 
                error: `Symbol '${cleanSymbol}' not found`,
                tried: triedSymbols,
                message: `Aucune donnée trouvée pour ${cleanSymbol} après avoir essayé ${triedSymbols.length} variante(s). Vérifiez que le symbole est correct et disponible dans FMP.`,
                apiKeyValid: apiKeyValid
            });
        }

        const profile = profileResult.profile;
        usedSymbol = profileResult.usedSymbol;



        // PARALLEL FETCHING: Fetch all independent data sources concurrently
        // 2. Key Metrics - Strategic: Fetch full 30 years history for database archival
        // 3. Dividends
        // 4. Historical Prices - Strategic: Fetch full 20 years (7300 days) for database archival
        // 5. Realtime Quote (Finnhub)
        // 6. Financial Statements (Income, Balance, Cash Flow) - Strategic: Deep data ingestion
        
        const keyMetricsPromise = fetch(`${FMP_BASE}/key-metrics/${usedSymbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
        const dividendPromise = fetch(`${FMP_BASE}/historical-price-full/stock_dividend/${usedSymbol}?apikey=${FMP_KEY}`);
        
        // Strategic: Fetch full history (20 years) so Supabase becomes a complete historical warehouse
        const pricePromise = fetch(`${FMP_BASE}/historical-price-full/${usedSymbol}?serietype=line&timeseries=7300&apikey=${FMP_KEY}`);
        
        // Financial Statements - Deep History (30 years annual, 20 years quarterly)
        const incomeStatementAnnualPromise = fetch(`${FMP_BASE}/income-statement/${usedSymbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
        const balanceSheetAnnualPromise = fetch(`${FMP_BASE}/balance-sheet-statement/${usedSymbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
        const cashFlowAnnualPromise = fetch(`${FMP_BASE}/cash-flow-statement/${usedSymbol}?period=annual&limit=30&apikey=${FMP_KEY}`);
        
        const incomeStatementQuarterlyPromise = fetch(`${FMP_BASE}/income-statement/${usedSymbol}?period=quarter&limit=80&apikey=${FMP_KEY}`);
        const balanceSheetQuarterlyPromise = fetch(`${FMP_BASE}/balance-sheet-statement/${usedSymbol}?period=quarter&limit=80&apikey=${FMP_KEY}`);
        const cashFlowQuarterlyPromise = fetch(`${FMP_BASE}/cash-flow-statement/${usedSymbol}?period=quarter&limit=80&apikey=${FMP_KEY}`);
        
        // Premium Data - Strategic Analysis
        const analystEstimatesPromise = fetch(`${FMP_BASE}/analyst-estimates/${usedSymbol}?limit=30&apikey=${FMP_KEY}`);
        const insiderTradingPromise = fetch(`${FMP_BASE}/insider-trading/${usedSymbol}?limit=100&apikey=${FMP_KEY}`);
        const institutionalHoldersPromise = fetch(`${FMP_BASE}/institutional-holder/${usedSymbol}?apikey=${FMP_KEY}`);
        const earningsSurprisesPromise = fetch(`${FMP_BASE}/earnings-surprises/${usedSymbol}?limit=50&apikey=${FMP_KEY}`);

        let quotePromise = Promise.resolve(null);
        if (FINNHUB_KEY) {
            const finnhubSymbol = cleanSymbol.replace('.', '-');
            quotePromise = fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_KEY}`).catch(e => null);
        }

        // Wait for all requests to complete
        // Wait for all requests to complete (ROBUSTNESS: Use allSettled so one failure doesn't crash everything)
        // Order must match the array destructuring below
        const promises = [
            keyMetricsPromise, dividendPromise, pricePromise, quotePromise,
            incomeStatementAnnualPromise, balanceSheetAnnualPromise, cashFlowAnnualPromise,
            incomeStatementQuarterlyPromise, balanceSheetQuarterlyPromise, cashFlowQuarterlyPromise,
            analystEstimatesPromise, insiderTradingPromise, institutionalHoldersPromise, earningsSurprisesPromise
        ];

        const results = await Promise.allSettled(promises);
        
        // Helper to extract value safely
        const getRes = (index) => results[index].status === 'fulfilled' ? results[index].value : { ok: false };
        
        const metricsRes = getRes(0);
        const dividendRes = getRes(1);
        const priceRes = getRes(2);
        const quoteResRaw = getRes(3);
        
        const incomeAnnualRes = getRes(4);
        const balanceAnnualRes = getRes(5);
        const cashAnnualRes = getRes(6);
        
        const incomeQuarterlyRes = getRes(7);
        const balanceQuarterlyRes = getRes(8);
        const cashQuarterlyRes = getRes(9);
        
        const analystRes = getRes(10);
        const insiderRes = getRes(11);
        const instHolderRes = getRes(12);
        const surprisesRes = getRes(13);

        // Log specific failures for debugging (optional)
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.warn(`⚠️ Promise ${i} rejected for ${usedSymbol}:`, r.reason);
            }
        });

        // --- PROCESS KEY METRICS (non-fatal - continue with empty if fails) ---
        let metricsData = [];
        try {
            if (metricsRes.ok) {
                const metricsJson = await metricsRes.json();
                
                // Check for error object
                if (metricsJson && typeof metricsJson === 'object' && !Array.isArray(metricsJson)) {
                    if (metricsJson['Error Message']) {
                        console.warn(`⚠️ FMP Key Metrics Error (limit=30): ${metricsJson['Error Message']}`);
                    }
                } else if (Array.isArray(metricsJson)) {
                    metricsData = metricsJson;
                }
            } else {
                console.warn(`⚠️ FMP Key Metrics HTTP ${metricsRes.status} for ${usedSymbol} (limit=30)`);
            }
        } catch (metricsError) {
            console.warn(`⚠️ FMP Key Metrics parse error for ${usedSymbol}: ${metricsError.message}`);
        }
        
        // RETRY STRATEGY: If full history failed or returned empty (common for heavy symbols on weak connections), try lighter fetch
        if (metricsData.length === 0) {
            console.log(`⚠️ Retrying Key Metrics for ${usedSymbol} with limit=15 (intermediate fallback)...`);
            try {
                const retryRes = await fetch(`${FMP_BASE}/key-metrics/${usedSymbol}?period=annual&limit=15&apikey=${FMP_KEY}`);
                if (retryRes.ok) {
                    const retryJson = await retryRes.json();
                    if (Array.isArray(retryJson) && retryJson.length > 0) {
                        metricsData = retryJson;
                        console.log(`✅ Recovered ${metricsData.length} records for ${usedSymbol} using limit=15`);
                    }
                }
            } catch (e) {
                console.warn(`❌ Intermediate retry failed for ${usedSymbol}:`, e.message);
            }
        }

        if (metricsData.length === 0) {
            console.log(`⚠️ Retrying Key Metrics for ${usedSymbol} with limit=5 (final fallback)...`);
            try {
                const retryRes = await fetch(`${FMP_BASE}/key-metrics/${usedSymbol}?period=annual&limit=5&apikey=${FMP_KEY}`);
                if (retryRes.ok) {
                    const retryJson = await retryRes.json();
                    if (Array.isArray(retryJson) && retryJson.length > 0) {
                        metricsData = retryJson;
                        console.log(`✅ Recovered ${metricsData.length} records for ${usedSymbol} using limit=5`);
                    }
                }
            } catch (e) {
                console.error(`❌ Retry failed for ${usedSymbol}:`, e);
            }
        }
        
        if (metricsData.length === 0) {
            console.warn(`⚠️ No Key Metrics data for ${usedSymbol} - profile data will still be returned`);
        }

        // Deduplicate metrics
        const uniqueMetrics = {};
        metricsData.forEach(metric => {
            const year = new Date(metric.date).getFullYear();
            if (!uniqueMetrics[year]) {
                uniqueMetrics[year] = metric;
            }
        });
        metricsData = Object.values(uniqueMetrics);

        // --- PROCESS DIVIDENDS ---
        let dividendsByFiscalYear = {};
        
        if (dividendRes.ok) {
            const dividendData = await dividendRes.json();
            if (dividendData && dividendData.historical) {
                dividendData.historical.forEach(div => {
                    const mkDate = new Date(div.date);
                    const fiscalYear = mkDate.getFullYear();
                    
                    if (!dividendsByFiscalYear[fiscalYear]) {
                        dividendsByFiscalYear[fiscalYear] = 0;
                    }
                    dividendsByFiscalYear[fiscalYear] += div.dividend || div.adjDividend || 0;
                });
                console.log(`✅ Dividends aggregated for ${usedSymbol}:`, dividendsByFiscalYear);
            }
        } else {
            console.warn(`⚠️ No dividend data available for ${cleanSymbol}`);
        }

        // --- PROCESS PRICES ---
        // --- PROCESS PRICES ---
        if (!priceRes.ok) {
            // Non-fatal error: Log and proceed with empty prices
            try {
               const errorText = await priceRes.text();
               console.warn(`⚠️ FMP Historical Price warning for ${usedSymbol}: ${priceRes.status} - ${errorText.substring(0, 200)} (continuing without price history)`);
            } catch (e) {
               console.warn(`⚠️ FMP Historical Price warning for ${usedSymbol}: ${priceRes.status} (continuing without price history)`);
            }
        }
        
        let priceData = { historical: [] };
        try {
            if (priceRes.ok) {
                const json = await priceRes.json();
                if (json && typeof json === 'object' && !Array.isArray(json) && json['Error Message']) {
                     console.warn(`⚠️ FMP Historical Price API returned error: ${json['Error Message']}`);
                } else if (json) {
                    priceData = json;
                }
            }
        } catch (priceParseError) {
            console.warn(`⚠️ FMP Historical Price JSON parse error: ${priceParseError.message}`);
        }
        
        if (!priceData || !priceData.historical || !Array.isArray(priceData.historical)) {
            // Already initialized to { historical: [] } above, but ensuring deep safety
            if (!priceData) priceData = {};
            if (!priceData.historical) priceData.historical = [];
        }

        // --- PROCESS QUOTE ---
        let currentPrice = profile.price || 0;
        if (quoteResRaw && quoteResRaw.ok) {
            try {
                const quoteData = await quoteResRaw.json();
                if (quoteData.c) currentPrice = quoteData.c;
            } catch (e) {
                console.warn('Finnhub quote parse error:', e.message);
            }
        }
        
        // ROBUSTNESS: If currentPrice is still 0, use the most recent historical close
        if ((!currentPrice || currentPrice === 0) && priceData && priceData.historical && priceData.historical.length > 0) {
            currentPrice = priceData.historical[0].close;
            console.log(`⚠️ Used latest historical closing price (${currentPrice}) as current price fallback`);
        }

        // 5. Process prices by year
        const pricesByYear = {};
        if (priceData.historical) {
            priceData.historical.forEach(day => {
                const year = new Date(day.date).getFullYear();
                if (!pricesByYear[year]) pricesByYear[year] = { high: 0, low: 999999 };

                const val = day.close;
                if (val > pricesByYear[year].high) pricesByYear[year].high = val;
                if (val < pricesByYear[year].low) pricesByYear[year].low = val;
            });
        }

        // 6. Map Metrics to AnnualData
        const annualData = metricsData.map(metric => {
            const year = new Date(metric.date).getFullYear();
            const priceStats = pricesByYear[year] || { high: 0, low: 0 };

            const high = priceStats.high > 0 ? priceStats.high : (metric.revenuePerShare * 20 || 0);
            const low = priceStats.low < 999999 && priceStats.low > 0 ? priceStats.low : (high * 0.5);

            // Use aggregated dividend data by fiscal year
            let dps = dividendsByFiscalYear[year] || 0;
            
            // ROBUSTNESS: Fallback if stock_dividend endpoint returned 0/empty
            // 1. Try metric.dividendPerShare (if available in FMP response)
            if (dps === 0 && metric.dividendPerShare) {
                dps = metric.dividendPerShare;
            }
            
            // 2. Try Dividend Yield * Average Price (Most reliable fallback for EIX etc.)
            // metric.dividendYield is typically decimal (e.g. 0.04 for 4%)
            if (dps === 0 && metric.dividendYield && metric.dividendYield > 0) {
                const avgPrice = (high + low) / 2;
                if (avgPrice > 0) {
                    dps = metric.dividendYield * avgPrice;
                }
            }

            return {
                year: year,
                priceHigh: parseFloat(Number(high).toFixed(2)),
                priceLow: parseFloat(Number(low).toFixed(2)),
                cashFlowPerShare: parseFloat(Number(metric.operatingCashFlowPerShare || 0).toFixed(2)),
                dividendPerShare: parseFloat(Number(dps).toFixed(2)),
                bookValuePerShare: parseFloat(Number(metric.bookValuePerShare || 0).toFixed(2)),
                earningsPerShare: parseFloat(Number(metric.netIncomePerShare || 0).toFixed(2)),
                isEstimate: false
            };
        }).sort((a, b) => a.year - b.year);

        // --- PROCESS FINANCIAL STATEMENTS & ANALYSIS DATA ---
        const getJsonSafe = async (res) => {
            if (!res || !res.ok) return [];
            try { return await res.json(); } catch (e) { return []; }
        };

        const incomeAnnual = await getJsonSafe(incomeAnnualRes);
        const balanceAnnual = await getJsonSafe(balanceAnnualRes);
        const cashAnnual = await getJsonSafe(cashAnnualRes);
        
        const incomeQuarterly = await getJsonSafe(incomeQuarterlyRes);
        const balanceQuarterly = await getJsonSafe(balanceQuarterlyRes);
        const cashQuarterly = await getJsonSafe(cashQuarterlyRes);
        
        const analystEstimates = await getJsonSafe(analystRes);
        const insiderTrading = await getJsonSafe(insiderRes);
        const institutionalHolders = await getJsonSafe(instHolderRes);
        const earningsSurprises = await getJsonSafe(surprisesRes);

        // 6a. Fetch Beta, ROE, ROA, and Current Dividend from Key Metrics (most recent)
        let beta = null;
        let roe = null;
        let roa = null;
        let currentDividendFromMetrics = null; // ✅ NOUVEAU: Dividende actuel depuis key metrics
        if (metricsData && metricsData.length > 0) {
            const mostRecentMetric = metricsData[0]; // Le plus récent (premier après tri)
            
            // Beta est généralement dans les key-metrics les plus récents
            // Essayer aussi dans le profile
            beta = profile.beta || mostRecentMetric?.beta || null;
            if (beta !== null) {
                beta = parseFloat(beta);
            }
            
            // ROE (Return on Equity) - généralement en pourcentage dans FMP
            roe = mostRecentMetric?.roe || mostRecentMetric?.returnOnEquity || null;
            if (roe !== null && roe !== undefined) {
                roe = parseFloat(roe);
                // Si ROE est déjà en pourcentage (0-100), le garder tel quel
                // Si ROE est en décimal (0-1), le convertir en pourcentage
                if (Math.abs(roe) <= 1 && roe !== 0) {
                    roe = roe * 100;
                }
            }
            
            // ROA (Return on Assets) - généralement en pourcentage dans FMP
            roa = mostRecentMetric?.roa || mostRecentMetric?.returnOnAssets || null;
            if (roa !== null && roa !== undefined) {
                roa = parseFloat(roa);
                // Si ROA est déjà en pourcentage (0-100), le garder tel quel
                // Si ROA est en décimal (0-1), le convertir en pourcentage
                if (Math.abs(roa) <= 1 && roa !== 0) {
                    roa = roa * 100;
                }
            }
            
            // ✅ NOUVEAU: Récupérer le dividende actuel depuis key metrics
            // 1. Essayer dividendPerShare du metric le plus récent
            if (mostRecentMetric?.dividendPerShare && mostRecentMetric.dividendPerShare > 0) {
                currentDividendFromMetrics = parseFloat(mostRecentMetric.dividendPerShare);
            }
            // 2. Fallback: Calculer à partir de dividendYield et currentPrice
            else if (mostRecentMetric?.dividendYield && mostRecentMetric.dividendYield > 0 && currentPrice > 0) {
                // dividendYield est généralement en décimal (0.04 pour 4%)
                const yieldDecimal = parseFloat(mostRecentMetric.dividendYield);
                // Si yield est > 1, c'est probablement déjà en pourcentage, convertir
                const yieldPercent = yieldDecimal > 1 ? yieldDecimal : yieldDecimal * 100;
                if (yieldPercent > 0 && yieldPercent < 50) { // Raisonnable: 0-50%
                    currentDividendFromMetrics = (yieldPercent / 100) * currentPrice;
                    console.log(`✅ Calculé currentDividend depuis dividendYield (${yieldPercent.toFixed(2)}%): ${currentDividendFromMetrics.toFixed(4)}`);
                }
            }
        }

        // 7. Helper function to determine preferred symbol
        const getPreferredSymbol = (profile) => {
            const country = profile.country || '';
            const exchange = profile.exchangeShortName || '';
            const symbol = cleanSymbol;
            
            // Pour les titres canadiens, prioriser le symbole TSX
            if (country === 'CA' || exchange === 'TSX' || exchange === 'TSXV') {
                // Si le symbole actuel n'est pas sur TSX, chercher le symbole TSX
                // Pour l'instant, on garde le symbole actuel mais on pourrait chercher l'équivalent TSX
                return symbol;
            }
            
            // Pour les titres européens ou asiatiques, prioriser l'ADR sur bourse US
            const europeanCountries = ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CH', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'IE', 'PT'];
            const asianCountries = ['JP', 'CN', 'KR', 'TW', 'HK', 'SG', 'IN', 'AU', 'NZ'];
            
            if (europeanCountries.includes(country) || asianCountries.includes(country)) {
                // Si le symbole actuel est déjà sur une bourse US (NASDAQ, NYSE, etc.), on le garde
                if (['NASDAQ', 'NYSE', 'AMEX'].includes(exchange)) {
                    return symbol;
                }
                // Sinon, on pourrait chercher l'ADR, mais pour l'instant on garde le symbole actuel
                return symbol;
            }
            
            return symbol;
        };

        // 8. Info Object avec toutes les informations
        // Générer plusieurs URLs de logo possibles pour le fallback
        // FMP Premium: Essayer d'abord l'URL standard, puis les variantes
        const logoBaseSymbol = usedSymbol.replace('.TO', '').replace('-', '.').replace('_', '.');
        // Utiliser l'image du profil si disponible, sinon construire l'URL
        const logoUrl = profile.image 
            ? profile.image 
            : `https://financialmodelingprep.com/image-stock/${logoBaseSymbol}.png`;
        
        // Helper function to format market cap
        const formatMarketCap = (mktCap) => {
            if (!mktCap || mktCap === 0) return 'N/A';
            if (mktCap >= 1000000000000) return (mktCap / 1000000000000).toFixed(2) + 'T';
            if (mktCap >= 1000000000) return (mktCap / 1000000000).toFixed(2) + 'B';
            if (mktCap >= 1000000) return (mktCap / 1000000).toFixed(2) + 'M';
            return mktCap.toFixed(0);
        };

        const mappedInfo = {
            symbol: cleanSymbol,
            name: profile.companyName,
            sector: profile.sector,
            securityRank: 'N/A', // À mettre à jour manuellement ou via ValueLine
            marketCap: profile.mktCap ? formatMarketCap(profile.mktCap) : 'N/A',
            logo: logoUrl,
            country: profile.country || '',
            exchange: profile.exchangeShortName || profile.exchange || '',
            currency: profile.currency || 'USD',
            preferredSymbol: cleanSymbol, // Garder le symbole original demandé
            actualSymbol: usedSymbol, // Le symbole réellement utilisé par FMP
            logoSymbol: logoBaseSymbol, // Symbole à utiliser pour les logos (sans .TO, avec format standard)
            beta: beta, // Ajouter le beta récupéré
            roe: roe, // Return on Equity (en pourcentage)
            roa: roa // Return on Assets (en pourcentage)
        };

        // ✅ NOUVEAU: Calculer le dividende actuel pour l'inclure dans la réponse
        // 1. Utiliser le dividende depuis key metrics si disponible
        let finalCurrentDividend = currentDividendFromMetrics;
        
        // 2. Fallback: Utiliser le dividende de l'année la plus récente avec dividende > 0
        if (!finalCurrentDividend || finalCurrentDividend === 0) {
            const sortedAnnualData = [...annualData].sort((a, b) => b.year - a.year);
            const mostRecentWithDividend = sortedAnnualData.find(d => d.dividendPerShare > 0);
            if (mostRecentWithDividend) {
                finalCurrentDividend = mostRecentWithDividend.dividendPerShare;
            }
        }
        
        // 3. Fallback final: Calculer à partir du yield moyen historique si disponible
        if (!finalCurrentDividend || finalCurrentDividend === 0) {
            const yearsWithDividend = annualData.filter(d => d.dividendPerShare > 0 && d.priceHigh > 0);
            if (yearsWithDividend.length > 0 && currentPrice > 0) {
                const avgYield = yearsWithDividend.reduce((sum, d) => {
                    const divYield = (d.dividendPerShare / d.priceHigh) * 100;
                    return sum + divYield;
                }, 0) / yearsWithDividend.length;
                
                // Si le yield moyen est raisonnable (0.1% à 20%), utiliser pour estimer le dividende actuel
                if (avgYield > 0.1 && avgYield < 20) {
                    finalCurrentDividend = (avgYield / 100) * currentPrice;
                    console.log(`ℹ️ ${usedSymbol}: Dividende estimé à partir du yield moyen historique (${avgYield.toFixed(2)}%): ${finalCurrentDividend.toFixed(4)}`);
                }
            }
        }
        
        // 4. Si toujours 0, laisser 0 (pas de dividende)
        if (!finalCurrentDividend || finalCurrentDividend < 0) {
            finalCurrentDividend = 0;
        }

        return res.status(200).json({
            data: annualData, // Strategic: Return full available history (up to 30 years) for archival
            financials: {
                income: { annual: incomeAnnual, quarterly: incomeQuarterly },
                balance: { annual: balanceAnnual, quarterly: balanceQuarterly },
                cash: { annual: cashAnnual, quarterly: cashQuarterly }
            },
            analysisData: {
                analystEstimates,
                insiderTrading,
                institutionalHolders,
                earningsSurprises
            },
            info: mappedInfo,
            currentPrice: parseFloat(currentPrice.toFixed(2)),
            currentDividend: parseFloat(finalCurrentDividend.toFixed(4)) // ✅ NOUVEAU: Dividende actuel calculé
        });

    } catch (error) {
        console.error('Company data fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch company data',
            message: error.message
        });
    }
}
