/**
 * RSI SCREENER TOOL
 * Identifie les opportunites de trading basees sur RSI extremes
 *
 * Scanne les marches internationaux (US, Canada, Europe, etc.) pour:
 * 1. SURVENTE EXTREME: RSI(14) <= 20 ET RSI(5) <= 5
 * 2. SURACHAT EXTREME: RSI(14) >= 80 ET RSI(5) >= 95
 *
 * Architecture:
 * - Multi-marches (US, CA, UK, DE, FR, etc.)
 * - Filtrage par capitalisation (large cap > $10B)
 * - Calcul RSI(14) et RSI(5) via FMP ou Twelve Data
 * - Resultats tries par intensite RSI
 */

/**
 * Recherche d'actions en zones RSI extremes
 * @param {Object} params - Parametres de recherche
 * @param {string} params.type - Type de recherche: "oversold" (survente), "overbought" (surachat), "both" (defaut)
 * @param {number} params.limit - Nombre max de resultats par categorie (defaut: 20)
 * @param {Array<string>} params.markets - Marches a scanner: ["US", "CA", "UK", "FR", "DE"] (defaut: ["US"])
 * @param {string} params.market_cap - Taille minimum: "large" (>$10B), "mid" (>$2B), "all" (defaut: "large")
 * @returns {Promise<Object>} Tickers avec RSI extremes
 */
export async function screenByRSI(params) {
    const {
        type = 'both',
        limit = 20,
        markets = ['US'],
        market_cap = 'large'
    } = params;

    console.log(` [RSI Screener] Type: ${type}, Markets: ${markets.join(',')}, Limit: ${limit}`);

    try {
        // 1. Recuperer liste de tickers par marche
        const tickers = await _getTickersByMarkets(markets, market_cap);

        if (!tickers || tickers.length === 0) {
            return {
                success: false,
                error: 'Aucun ticker trouve pour ces marches',
                oversold: [],
                overbought: []
            };
        }

        console.log(` [RSI Screener] ${tickers.length} tickers a analyser`);

        // 2. Calculer RSI(14) et RSI(5) pour chaque ticker
        const rsiData = await _calculateRSIForTickers(tickers);

        console.log(` [RSI Screener] ${rsiData.length} tickers avec donnees RSI`);

        // 3. Filtrer selon criteres RSI
        const oversold = type === 'oversold' || type === 'both'
            ? _filterOversold(rsiData, limit)
            : [];

        const overbought = type === 'overbought' || type === 'both'
            ? _filterOverbought(rsiData, limit)
            : [];

        console.log(` [RSI Screener] Survente: ${oversold.length}, Surachat: ${overbought.length}`);

        return {
            success: true,
            type,
            markets,
            total_analyzed: tickers.length,
            total_with_data: rsiData.length,
            oversold: {
                count: oversold.length,
                criteria: 'RSI(14) <= 20 ET RSI(5) <= 5',
                stocks: oversold
            },
            overbought: {
                count: overbought.length,
                criteria: 'RSI(14) >= 80 ET RSI(5) >= 95',
                stocks: overbought
            },
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(' [RSI Screener] Error:', error.message);
        return {
            success: false,
            error: error.message,
            oversold: [],
            overbought: []
        };
    }
}

/**
 * Recupere liste de tickers par marches
 */
async function _getTickersByMarkets(markets, market_cap) {
    const FMP_API_KEY = process.env.FMP_API_KEY;

    if (!FMP_API_KEY) {
        throw new Error('FMP_API_KEY not configured');
    }

    const allTickers = [];
    const marketCapMin = market_cap === 'large' ? 10e9 : market_cap === 'mid' ? 2e9 : 0;

    // Mapping des marches vers exchanges FMP
    const marketToExchange = {
        'US': ['NYSE', 'NASDAQ'],
        'CA': ['TSX', 'TSXV'],
        'UK': ['LSE'],
        'FR': ['EURONEXT'],
        'DE': ['XETRA'],
        'EU': ['EURONEXT', 'XETRA']
    };

    for (const market of markets) {
        const exchanges = marketToExchange[market.toUpperCase()] || ['NYSE', 'NASDAQ'];

        for (const exchange of exchanges) {
            try {
                console.log(` [FMP] Fetching tickers from ${exchange}...`);

                // FMP Stock Screener endpoint
                const url = `https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=${marketCapMin}&exchange=${exchange}&limit=100&apikey=${FMP_API_KEY}`;

                const response = await fetch(url);

                if (!response.ok) {
                    console.warn(` [FMP] ${exchange} error: ${response.status}`);
                    continue;
                }

                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    const tickers = data.map(stock => ({
                        symbol: stock.symbol,
                        name: stock.companyName,
                        market: market,
                        exchange: exchange,
                        market_cap: stock.marketCap,
                        sector: stock.sector,
                        price: stock.price
                    }));

                    allTickers.push(...tickers);
                    console.log(` [FMP] ${exchange}: ${tickers.length} tickers`);
                }

                // Rate limiting (300 calls/min pour FMP)
                await _sleep(250);

            } catch (error) {
                console.error(` [FMP] ${exchange} error:`, error.message);
            }
        }
    }

    // Dedupliquer par symbol
    const uniqueTickers = Array.from(
        new Map(allTickers.map(t => [t.symbol, t])).values()
    );

    console.log(` [RSI Screener] ${uniqueTickers.length} tickers uniques recuperes`);

    return uniqueTickers;
}

/**
 * Calcule RSI(14) et RSI(5) pour liste de tickers
 */
async function _calculateRSIForTickers(tickers) {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;

    console.log(` [RSI Calculation] Analyzing ${tickers.length} tickers...`);

    const results = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limits

    for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);

        const batchPromises = batch.map(async (ticker) => {
            try {
                // Try Twelve Data first, fallback to FMP
                let rsi14 = null;
                let rsi5 = null;

                if (TWELVE_DATA_KEY) {
                    const rsiData = await _fetchRSIFromTwelveData(ticker.symbol, TWELVE_DATA_KEY);
                    if (rsiData) {
                        rsi14 = rsiData.rsi14;
                        rsi5 = rsiData.rsi5;
                    }
                }

                // Fallback to FMP if Twelve Data failed
                if ((rsi14 === null || rsi5 === null) && FMP_API_KEY) {
                    const rsiData = await _fetchRSIFromFMP(ticker.symbol, FMP_API_KEY);
                    if (rsiData) {
                        rsi14 = rsiData.rsi14;
                        rsi5 = rsiData.rsi5;
                    }
                }

                // Return data if we have at least one RSI value
                if (rsi14 !== null || rsi5 !== null) {
                    return {
                        ...ticker,
                        rsi14: rsi14 !== null ? parseFloat(rsi14) : null,
                        rsi5: rsi5 !== null ? parseFloat(rsi5) : null
                    };
                }

                return null;

            } catch (error) {
                console.warn(` [RSI] ${ticker.symbol} error:`, error.message);
                return null;
            }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(r => r !== null));

        // Rate limiting
        await _sleep(300);

        // Progress log every 20 tickers
        if ((i + batchSize) % 20 === 0) {
            console.log(` [RSI] Progress: ${Math.min(i + batchSize, tickers.length)}/${tickers.length} (${results.length} with data)`);
        }
    }

    return results;
}

/**
 * Recupere RSI via Twelve Data
 */
async function _fetchRSIFromTwelveData(symbol, apiKey) {
    try {
        // Fetch RSI(14) and RSI(5) in parallel
        const [rsi14Res, rsi5Res] = await Promise.all([
            fetch(`https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1day&time_period=14&outputsize=1&apikey=${apiKey}`),
            fetch(`https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1day&time_period=5&outputsize=1&apikey=${apiKey}`)
        ]);

        const rsi14Data = await rsi14Res.json();
        const rsi5Data = await rsi5Res.json();

        // Check for errors
        if (rsi14Data.status === 'error' || rsi5Data.status === 'error') {
            return null;
        }

        const rsi14 = rsi14Data.values?.[0]?.rsi;
        const rsi5 = rsi5Data.values?.[0]?.rsi;

        if (rsi14 && rsi5) {
            return { rsi14, rsi5 };
        }

        return null;

    } catch (error) {
        return null;
    }
}

/**
 * Recupere RSI via FMP (fallback)
 */
async function _fetchRSIFromFMP(symbol, apiKey) {
    try {
        // FMP Technical Indicators endpoint
        const [rsi14Res, rsi5Res] = await Promise.all([
            fetch(`https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?type=rsi&period=14&apikey=${apiKey}`),
            fetch(`https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?type=rsi&period=5&apikey=${apiKey}`)
        ]);

        const rsi14Data = await rsi14Res.json();
        const rsi5Data = await rsi5Res.json();

        // Extract latest RSI values
        const rsi14 = Array.isArray(rsi14Data) && rsi14Data[0]?.rsi;
        const rsi5 = Array.isArray(rsi5Data) && rsi5Data[0]?.rsi;

        if (rsi14 && rsi5) {
            return { rsi14, rsi5 };
        }

        return null;

    } catch (error) {
        return null;
    }
}

/**
 * Filtre les actions en SURVENTE extreme
 * Criteres: RSI(14) <= 20 ET RSI(5) <= 5
 */
function _filterOversold(rsiData, limit) {
    const filtered = rsiData.filter(stock => {
        return stock.rsi14 !== null &&
               stock.rsi5 !== null &&
               stock.rsi14 <= 20 &&
               stock.rsi5 <= 5;
    });

    // Trier par RSI(5) croissant (plus bas = plus oversold)
    filtered.sort((a, b) => a.rsi5 - b.rsi5);

    return filtered.slice(0, limit).map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        exchange: stock.exchange,
        price: stock.price,
        market_cap: stock.market_cap,
        sector: stock.sector,
        rsi14: stock.rsi14.toFixed(2),
        rsi5: stock.rsi5.toFixed(2),
        signal: 'SURVENTE EXTREME',
        interpretation: `RSI(14)=${stock.rsi14.toFixed(1)} RSI(5)=${stock.rsi5.toFixed(1)} - Potentiel rebond technique`
    }));
}

/**
 * Filtre les actions en SURACHAT extreme
 * Criteres: RSI(14) >= 80 ET RSI(5) >= 95
 */
function _filterOverbought(rsiData, limit) {
    const filtered = rsiData.filter(stock => {
        return stock.rsi14 !== null &&
               stock.rsi5 !== null &&
               stock.rsi14 >= 80 &&
               stock.rsi5 >= 95;
    });

    // Trier par RSI(5) decroissant (plus haut = plus overbought)
    filtered.sort((a, b) => b.rsi5 - a.rsi5);

    return filtered.slice(0, limit).map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        exchange: stock.exchange,
        price: stock.price,
        market_cap: stock.market_cap,
        sector: stock.sector,
        rsi14: stock.rsi14.toFixed(2),
        rsi5: stock.rsi5.toFixed(2),
        signal: 'SURACHAT EXTREME',
        interpretation: `RSI(14)=${stock.rsi14.toFixed(1)} RSI(5)=${stock.rsi5.toFixed(1)} - Potentiel correction`
    }));
}

/**
 * Helper: Sleep function
 */
function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { screenByRSI };
