/**
 * API Proxy pour récupérer les données complètes d'une compagnie
 * Utilise FMP pour: profile, key-metrics, prix historiques
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

    // Mapping de symboles alternatifs pour les cas spéciaux
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
        'POW': ['POW.TO', 'POW']
    };

    // Fonction pour essayer plusieurs variantes de symboles
    const tryFetchProfile = async (symbolToTry) => {
        try {
            const profileRes = await fetch(`${FMP_BASE}/profile/${symbolToTry}?apikey=${FMP_KEY}`);
            
            // Vérifier le statut HTTP
            if (!profileRes.ok) {
                const errorText = await profileRes.text();
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
        // 1. Essayer d'abord le symbole original
        let profileResult = await tryFetchProfile(cleanSymbol);
        let usedSymbol = cleanSymbol;

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
            
            // Vérifier si c'est un problème de clé API
            const testRes = await fetch(`${FMP_BASE}/profile/AAPL?apikey=${FMP_KEY}`);
            if (!testRes.ok) {
                const testError = await testRes.text();
                if (testError.includes('Invalid API KEY') || testError.includes('API key')) {
                    console.error(`❌ FMP API KEY semble invalide - Vérifiez FMP_API_KEY dans Vercel`);
                    return res.status(500).json({
                        error: 'FMP API key invalid or not configured',
                        message: 'La clé API FMP semble invalide. Vérifiez FMP_API_KEY dans les variables d\'environnement Vercel.',
                        tried: triedSymbols,
                        diagnostic: 'Test avec AAPL a également échoué'
                    });
                }
            }
            
            return res.status(404).json({ 
                error: `Symbol '${cleanSymbol}' not found`,
                tried: triedSymbols,
                message: `Aucune donnée trouvée pour ${cleanSymbol} après avoir essayé ${triedSymbols.length} variante(s). Vérifiez que le symbole est correct.`
            });
        }

        const profile = profileResult.profile;
        usedSymbol = profileResult.usedSymbol;

        // 2. Fetch Key Metrics (Annual) - utiliser le symbole qui a fonctionné
        const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${usedSymbol}?period=annual&limit=20&apikey=${FMP_KEY}`);
        if (!metricsRes.ok) {
            const errorText = await metricsRes.text();
            console.error(`❌ FMP Key Metrics error for ${usedSymbol}: ${metricsRes.status} - ${errorText.substring(0, 200)}`);
            throw new Error(`FMP Metrics error: ${metricsRes.status} ${metricsRes.statusText}`);
        }
        let metricsData = await metricsRes.json();
        
        // Vérifier si c'est un objet d'erreur
        if (metricsData && typeof metricsData === 'object' && !Array.isArray(metricsData)) {
            if (metricsData['Error Message']) {
                console.error(`❌ FMP Key Metrics Error: ${metricsData['Error Message']}`);
                throw new Error(`FMP Key Metrics error: ${metricsData['Error Message']}`);
            }
        }
        
        // Vérifier que c'est un tableau valide
        if (!Array.isArray(metricsData)) {
            console.error(`❌ FMP Key Metrics returned invalid data type for ${usedSymbol}`);
            throw new Error(`FMP Key Metrics returned invalid data`);
        }
        
        if (metricsData.length === 0) {
            console.warn(`⚠️ FMP Key Metrics returned empty array for ${usedSymbol} - continuing with empty data`);
        }

        // Deduplicate metrics by year (keep the one with the latest date if duplicates exist)
        const uniqueMetrics = {};
        metricsData.forEach(metric => {
            const year = new Date(metric.date).getFullYear();
            // If year exists, only replace if this metric is 'newer' or has more data (heuristic)
            // FMP usually returns sorted, but let's be safe.
            // Actually, FMP sometimes returns multiple entries for same year (restated).
            // We'll assume the first one encountered (if sorted desc) or latest date is best.
            if (!uniqueMetrics[year]) {
                uniqueMetrics[year] = metric;
            }
        });
        metricsData = Object.values(uniqueMetrics);

        // 2a. Fetch Dividend History (separate endpoint since key-metrics doesn't include it)
        const dividendRes = await fetch(`${FMP_BASE}/historical-price-full/stock_dividend/${usedSymbol}?apikey=${FMP_KEY}`);
        let dividendsByFiscalYear = {};

        if (dividendRes.ok) {
            const dividendData = await dividendRes.json();

            // Aggregate dividends by fiscal year (ACN fiscal year ends Aug 31)
            // For most companies: fiscal year = calendar year, but we use the metric date as reference
            if (dividendData.historical && dividendData.historical.length > 0) {
                dividendData.historical.forEach(div => {
                    const divDate = new Date(div.date);
                    const divYear = divDate.getFullYear();
                    const divMonth = divDate.getMonth(); // 0-11

                    // Determine fiscal year based on month
                    // For ACN (fiscal ends Aug 31): Sept-Aug = fiscal year
                    // Simplified: if month >= Sept (8), it belongs to next calendar year's fiscal
                    const fiscalYear = divMonth >= 8 ? divYear + 1 : divYear;

                    if (!dividendsByFiscalYear[fiscalYear]) {
                        dividendsByFiscalYear[fiscalYear] = 0;
                    }
                    dividendsByFiscalYear[fiscalYear] += div.dividend || div.adjDividend || 0;
                });

                console.log(`✅ Dividends aggregated for ${usedSymbol} (original: ${cleanSymbol}):`, dividendsByFiscalYear);
            }
        } else {
            console.warn(`⚠️ No dividend data available for ${cleanSymbol}`);
        }

        // 3. Fetch Historical Prices for High/Low
        const priceRes = await fetch(`${FMP_BASE}/historical-price-full/${usedSymbol}?serietype=line&timeseries=1825&apikey=${FMP_KEY}`);
        if (!priceRes.ok) {
            const errorText = await priceRes.text();
            console.error(`❌ FMP Historical Price error for ${usedSymbol}: ${priceRes.status} - ${errorText.substring(0, 200)}`);
            throw new Error(`FMP Price error: ${priceRes.status} ${priceRes.statusText}`);
        }
        const priceData = await priceRes.json();
        
        // Vérifier si c'est un objet d'erreur
        if (priceData && typeof priceData === 'object' && !Array.isArray(priceData) && priceData['Error Message']) {
            console.error(`❌ FMP Historical Price Error: ${priceData['Error Message']}`);
            throw new Error(`FMP Historical Price error: ${priceData['Error Message']}`);
        }
        
        // Vérifier que les données historiques existent
        if (!priceData || !priceData.historical || !Array.isArray(priceData.historical)) {
            console.warn(`⚠️ FMP Historical Price returned invalid data for ${usedSymbol} - continuing with empty price history`);
            priceData.historical = [];
        }

        // 4. Fetch Realtime Quote (Finnhub if available)
        let currentPrice = profile.price || 0;
        if (FINNHUB_KEY) {
            try {
                // Pour Finnhub, utiliser le symbole original ou nettoyer le format
                const finnhubSymbol = cleanSymbol.replace('.', '-');
                const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_KEY}`);
                if (quoteRes.ok) {
                    const quoteData = await quoteRes.json();
                    if (quoteData.c) currentPrice = quoteData.c;
                }
            } catch (e) {
                console.warn('Finnhub quote fetch failed, using FMP price:', e.message);
            }
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
            const dps = dividendsByFiscalYear[year] || 0;

            return {
                year: year,
                priceHigh: parseFloat(high.toFixed(2)),
                priceLow: parseFloat(low.toFixed(2)),
                cashFlowPerShare: parseFloat((metric.operatingCashFlowPerShare || 0).toFixed(2)),
                dividendPerShare: parseFloat(dps.toFixed(2)),
                bookValuePerShare: parseFloat((metric.bookValuePerShare || 0).toFixed(2)),
                earningsPerShare: parseFloat((metric.netIncomePerShare || 0).toFixed(2)),
                isEstimate: false
            };
        }).sort((a, b) => a.year - b.year);

        // 6a. Fetch Beta from Key Metrics (most recent)
        let beta = null;
        if (metricsData && metricsData.length > 0) {
            // Beta est généralement dans les key-metrics les plus récents
            // Essayer aussi dans le profile
            beta = profile.beta || (metricsData[0]?.beta) || null;
            if (beta !== null) {
                beta = parseFloat(beta);
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
        const logoBaseSymbol = usedSymbol.replace('.TO', '').replace('-', '.').replace('_', '.');
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
            beta: beta // Ajouter le beta récupéré
        };

        return res.status(200).json({
            data: annualData.slice(-6), // Keep last 6 years
            info: mappedInfo,
            currentPrice: parseFloat(currentPrice.toFixed(2))
        });

    } catch (error) {
        console.error('Company data fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch company data',
            message: error.message
        });
    }
}
