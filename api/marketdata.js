// ========================================
// API MARKET DATA UNIFIÉE
// Finnhub + Alpha Vantage + Yahoo Finance (yfinance)
// ========================================

export default async function handler(req, res) {
    const { endpoint, symbol, limit = 10, source = 'auto' } = req.query;
    
    // Clés API multiples (à configurer dans les variables d'environnement Vercel)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY';
    const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || 'YOUR_TWELVE_DATA_API_KEY';
    
    // Données de démonstration étendues si pas de clé API
    const demoData = {
        'SPX': { c: 4567.89, d: 38.75, dp: 0.85, h: 4580.12, l: 4550.23, o: 4560.45, pc: 4529.14, t: Date.now() },
        'IXIC': { c: 14234.56, d: 175.23, dp: 1.23, h: 14280.45, l: 14150.67, o: 14200.12, pc: 14059.33, t: Date.now() },
        'DJI': { c: 34567.89, d: -156.78, dp: -0.45, h: 34750.12, l: 34500.45, o: 34650.67, pc: 34724.67, t: Date.now() },
        'TSX': { c: 20123.45, d: 134.56, dp: 0.67, h: 20180.23, l: 20050.12, o: 20100.34, pc: 19988.89, t: Date.now() },
        'EURUSD': { c: 1.0845, d: 0.0013, dp: 0.12, h: 1.0856, l: 1.0823, o: 1.0834, pc: 1.0832, t: Date.now() },
        'GOLD': { c: 2034.50, d: -6.89, dp: -0.34, h: 2045.67, l: 2025.34, o: 2038.45, pc: 2041.39, t: Date.now() },
        'OIL': { c: 78.45, d: 1.23, dp: 1.56, h: 79.12, l: 77.89, o: 78.12, pc: 77.22, t: Date.now() },
        'BTCUSD': { c: 43567.89, d: 998.45, dp: 2.34, h: 44123.45, l: 42890.12, o: 43234.56, pc: 42569.44, t: Date.now() },
        'CVS': { 
            c: 78.45, d: 1.23, dp: 1.59, h: 79.12, l: 77.89, o: 78.12, pc: 77.22, t: Date.now(),
            profile: {
                name: 'CVS Health Corporation',
                country: 'US',
                industry: 'Healthcare Services',
                weburl: 'https://www.cvshealth.com',
                logo: 'https://logo.clearbit.com/cvshealth.com',
                marketCapitalization: 100000000000,
                shareOutstanding: 1300000000,
                ticker: 'CVS'
            }
        },
        'MSFT': { 
            c: 378.85, d: -2.15, dp: -0.56, h: 381.20, l: 377.45, o: 380.00, pc: 381.00, t: Date.now(),
            profile: {
                name: 'Microsoft Corporation',
                country: 'US',
                industry: 'Software',
                weburl: 'https://www.microsoft.com',
                logo: 'https://logo.clearbit.com/microsoft.com',
                marketCapitalization: 2800000000000,
                shareOutstanding: 7400000000,
                ticker: 'MSFT'
            }
        },
        'AAPL': { 
            c: 175.43, d: 0.87, dp: 0.50, h: 176.20, l: 174.89, o: 175.10, pc: 174.56, t: Date.now(),
            profile: {
                name: 'Apple Inc.',
                country: 'US',
                industry: 'Technology Hardware',
                weburl: 'https://www.apple.com',
                logo: 'https://logo.clearbit.com/apple.com',
                marketCapitalization: 2700000000000,
                shareOutstanding: 15500000000,
                ticker: 'AAPL'
            }
        }
    };
    
    // Fonction pour récupérer les données depuis Yahoo Finance (yfinance)
    const fetchYahooFinance = async (symbol, endpoint) => {
        try {
            // Utiliser l'API Yahoo Finance non-officielle
            const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
            
            switch (endpoint) {
                case 'quote':
                    const response = await fetch(`${baseUrl}/${symbol}`);
                    if (!response.ok) throw new Error(`Yahoo Finance error: ${response.status}`);
                    
                    const data = await response.json();
                    const result = data.chart.result[0];
                    const meta = result.meta;
                    const quote = result.indicators.quote[0];
                    
                    return {
                        c: meta.regularMarketPrice,
                        d: meta.regularMarketPrice - meta.previousClose,
                        dp: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                        h: meta.regularMarketDayHigh,
                        l: meta.regularMarketDayLow,
                        o: meta.regularMarketOpen,
                        pc: meta.previousClose,
                        t: meta.regularMarketTime * 1000
                    };
                    
                case 'profile':
                    // Yahoo Finance ne fournit pas de profil détaillé via cette API
                    // Retourner des données basiques
                    return {
                        name: `${symbol} Corporation`,
                        country: 'US',
                        industry: 'Technology',
                        weburl: `https://finance.yahoo.com/quote/${symbol}`,
                        logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
                        marketCapitalization: 100000000000,
                        shareOutstanding: 1000000000,
                        ticker: symbol
                    };
                    
                default:
                    throw new Error(`Endpoint ${endpoint} non supporté par Yahoo Finance`);
            }
        } catch (error) {
            console.error('Erreur Yahoo Finance:', error);
            throw error;
        }
    };

    // Fonction pour récupérer depuis Twelve Data
    const fetchTwelveData = async (symbol, endpoint) => {
        if (!TWELVE_DATA_API_KEY || TWELVE_DATA_API_KEY === 'YOUR_TWELVE_DATA_API_KEY') {
            throw new Error('Clé API Twelve Data non configurée');
        }
        try {
            switch (endpoint) {
                case 'quote': {
                    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`;
                    const r = await fetch(url);
                    if (!r.ok) throw new Error(`Twelve Data error: ${r.status}`);
                    const d = await r.json();
                    if (d && d.price) {
                        const price = parseFloat(d.price);
                        const prev = parseFloat(d.previous_close);
                        const change = parseFloat(d.change);
                        const percent = parseFloat(d.percent_change);
                        return {
                            c: price,
                            d: Number.isFinite(change) ? change : (Number.isFinite(price) && Number.isFinite(prev) ? price - prev : null),
                            dp: Number.isFinite(percent) ? percent : (Number.isFinite(price) && Number.isFinite(prev) ? ((price - prev) / prev) * 100 : null),
                            h: parseFloat(d.high),
                            l: parseFloat(d.low),
                            o: parseFloat(d.open),
                            pc: prev,
                            t: Date.now()
                        };
                    }
                    throw new Error('Réponse Twelve Data invalide');
                }
                default:
                    throw new Error(`Endpoint ${endpoint} non supporté par Twelve Data`);
            }
        } catch (error) {
            console.error('Erreur Twelve Data:', error);
            throw error;
        }
    };
    
    // Fonction pour récupérer les données depuis Alpha Vantage
    const fetchAlphaVantage = async (symbol, endpoint) => {
        if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'YOUR_ALPHA_VANTAGE_API_KEY') {
            throw new Error('Clé API Alpha Vantage non configurée');
        }
        
        try {
            let url;
            
            switch (endpoint) {
                case 'quote':
                    url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                    break;
                case 'profile':
                    url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                    break;
                case 'fundamentals':
                    url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                    break;
                default:
                    throw new Error(`Endpoint ${endpoint} non supporté par Alpha Vantage`);
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Alpha Vantage error: ${response.status}`);
            
            const data = await response.json();
            
            if (endpoint === 'quote') {
                const quote = data['Global Quote'];
                return {
                    c: parseFloat(quote['05. price']),
                    d: parseFloat(quote['09. change']),
                    dp: parseFloat(quote['10. change percent'].replace('%', '')),
                    h: parseFloat(quote['03. high']),
                    l: parseFloat(quote['04. low']),
                    o: parseFloat(quote['02. open']),
                    pc: parseFloat(quote['08. previous close']),
                    t: Date.now()
                };
            } else if (endpoint === 'profile') {
                return {
                    name: data.Name,
                    country: data.Country,
                    industry: data.Industry,
                    weburl: data.Website,
                    logo: `https://logo.clearbit.com/${data.Website?.replace('https://', '').replace('http://', '')}`,
                    marketCapitalization: parseFloat(data.MarketCapitalization) || 0,
                    shareOutstanding: parseFloat(data.SharesOutstanding) || 0,
                    ticker: data.Symbol
                };
            } else if (endpoint === 'fundamentals') {
                const parse = (v) => {
                    if (v === undefined || v === null || v === '') return null;
                    const n = parseFloat(String(v).replace('%', ''));
                    return Number.isFinite(n) ? n : null;
                };
                return {
                    symbol: data.Symbol,
                    peRatio: parse(data.PERatio),
                    pegRatio: parse(data.PEGRatio),
                    evToEbitda: parse(data.EVToEBITDA),
                    roeTTM: parse(data.ReturnOnEquityTTM),
                    profitMargin: parse(data.ProfitMargin),
                    operatingMarginTTM: parse(data.OperatingMarginTTM),
                    epsTTM: parse(data.EPSTTM),
                    dividendYield: parse(data.DividendYield),
                    revenueTTM: parse(data.RevenueTTM),
                    grossMarginTTM: parse(data.GrossProfitTTM),
                    marketCapitalization: parse(data.MarketCapitalization),
                    sector: data.Sector || null,
                    industry: data.Industry || null
                };
            }
        } catch (error) {
            console.error('Erreur Alpha Vantage:', error);
            throw error;
        }
    };
    
    // Fonction pour récupérer les données depuis Finnhub
    const fetchFinnhub = async (symbol, endpoint) => {
        if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') {
            throw new Error('Clé API Finnhub non configurée');
        }
        
        try {
            let url;
            
            switch (endpoint) {
                case 'quote':
                    url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'profile':
                    url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'news':
                    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const to = new Date().toISOString().split('T')[0];
                    url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'recommendation':
                    url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'peers':
                    url = `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'earnings':
                    url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'insider-transactions':
                    url = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'financials':
                    url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'candles':
                    const toTimestamp = Math.floor(Date.now() / 1000);
                    const fromTimestamp = toTimestamp - (30 * 24 * 60 * 60); // 30 jours
                    url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_API_KEY}`;
                    break;
                case 'search':
                    url = `https://finnhub.io/api/v1/search?q=${symbol}&token=${FINNHUB_API_KEY}`;
                    break;
                default:
                    throw new Error(`Endpoint ${endpoint} non supporté par Finnhub`);
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Finnhub API error: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Erreur Finnhub:', error);
            throw error;
        }
    };
    
    // Fonction pour choisir automatiquement la meilleure source
    const selectBestSource = (endpoint) => {
        const sources = [];
        
        // Priorité selon l'endpoint
        switch (endpoint) {
            case 'quote':
                // Ordre: Yahoo (gratuit) > Twelve Data > Finnhub > Alpha
                sources.push('yahoo');
                if (TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY !== 'YOUR_TWELVE_DATA_API_KEY') sources.push('twelve');
                if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') sources.push('finnhub');
                if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') sources.push('alpha');
                break;
            case 'profile':
                // Alpha Vantage excellent pour les profils d'entreprise
                if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') sources.push('alpha');
                if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') sources.push('finnhub');
                sources.push('yahoo');
                break;
            case 'fundamentals':
                // Fundamentals via Alpha Vantage en priorité
                if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') sources.push('alpha');
                // Fallback quote providers (pour éviter vide)
                if (TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY !== 'YOUR_TWELVE_DATA_API_KEY') sources.push('twelve');
                if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') sources.push('finnhub');
                sources.push('yahoo');
                break;
            default:
                // Pour les autres endpoints, privilégier Finnhub
                if (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') sources.push('finnhub');
                if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') sources.push('alpha');
                sources.push('yahoo');
        }
        
        return sources;
    };
    
    // Vérifier si on a au moins une source configurée
    const hasApiKey = (FINNHUB_API_KEY && FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY') || 
                     (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') ||
                     (TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY !== 'YOUR_TWELVE_DATA_API_KEY');
    
    if (!hasApiKey && source === 'auto') {
        // Retourner des données de démonstration selon l'endpoint
        let demoResult;
        
        switch (endpoint) {
            case 'profile':
                demoResult = demoData[symbol]?.profile || {
                    name: `${symbol} Corporation`,
                    country: 'US',
                    industry: 'Technology',
                    weburl: `https://www.${symbol.toLowerCase()}.com`,
                    logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
                    marketCapitalization: 100000000000,
                    shareOutstanding: 1000000000,
                    ticker: symbol
                };
                break;
            case 'news':
                demoResult = [
                    {
                        category: 'general',
                        datetime: Date.now() - 3600000,
                        headline: `${symbol} Reports Strong Quarterly Results`,
                        id: 1,
                        image: '',
                        related: symbol,
                        source: 'Demo News',
                        summary: `Demo news article for ${symbol} showing strong performance in the latest quarter.`,
                        url: `https://example.com/${symbol.toLowerCase()}-news-1`
                    },
                    {
                        category: 'general',
                        datetime: Date.now() - 7200000,
                        headline: `${symbol} Announces New Strategic Initiative`,
                        id: 2,
                        image: '',
                        related: symbol,
                        source: 'Demo News',
                        summary: `Demo news article for ${symbol} announcing new strategic initiatives.`,
                        url: `https://example.com/${symbol.toLowerCase()}-news-2`
                    }
                ];
                break;
            case 'recommendation':
                demoResult = [
                    {
                        symbol: symbol,
                        date: new Date().toISOString().split('T')[0],
                        period: '0m',
                        strongBuy: 5,
                        buy: 8,
                        hold: 3,
                        sell: 1,
                        strongSell: 0
                    }
                ];
                break;
            default:
                demoResult = demoData[symbol] || {
                    c: 100.00, d: 0.50, dp: 0.50, h: 101.00, l: 99.50, o: 100.50, pc: 99.50, t: Date.now()
                };
        }
        
        return res.status(200).json({
            ...(Array.isArray(demoResult) ? {} : demoResult),
            data: Array.isArray(demoResult) ? demoResult : undefined,
            symbol,
            endpoint,
            source: 'demo',
            timestamp: new Date().toISOString(),
            message: 'Données de démonstration - Configurez au moins une clé API (FINNHUB_API_KEY ou ALPHA_VANTAGE_API_KEY) pour des données réelles'
        });
    }

    try {
        let result;
        let usedSource = source;
        
        // Si source auto, choisir la meilleure source
        if (source === 'auto') {
            const sources = selectBestSource(endpoint);
            usedSource = sources[0];
        }
        
        // Essayer la source demandée
        try {
            switch (usedSource) {
                case 'yahoo':
                    result = await fetchYahooFinance(symbol, endpoint);
                    break;
                case 'alpha':
                    result = await fetchAlphaVantage(symbol, endpoint);
                    break;
                case 'finnhub':
                    result = await fetchFinnhub(symbol, endpoint);
                    break;
                case 'twelve':
                    result = await fetchTwelveData(symbol, endpoint);
                    break;
                default:
                    throw new Error(`Source ${usedSource} non supportée`);
            }
        } catch (error) {
            // Si la source demandée échoue et que c'est auto, essayer les autres
            if (source === 'auto') {
                const sources = selectBestSource(endpoint);
                let fallbackSuccess = false;
                
                for (const fallbackSource of sources.slice(1)) {
                    try {
                        switch (fallbackSource) {
                            case 'yahoo':
                                result = await fetchYahooFinance(symbol, endpoint);
                                usedSource = 'yahoo';
                                fallbackSuccess = true;
                                break;
                            case 'alpha':
                                result = await fetchAlphaVantage(symbol, endpoint);
                                usedSource = 'alpha';
                                fallbackSuccess = true;
                                break;
                            case 'finnhub':
                                result = await fetchFinnhub(symbol, endpoint);
                                usedSource = 'finnhub';
                                fallbackSuccess = true;
                                break;
                            case 'twelve':
                                result = await fetchTwelveData(symbol, endpoint);
                                usedSource = 'twelve';
                                fallbackSuccess = true;
                                break;
                        }
                        if (fallbackSuccess) break;
                    } catch (fallbackError) {
                        console.error(`Fallback ${fallbackSource} échoué:`, fallbackError);
                        continue;
                    }
                }
                
                if (!fallbackSuccess) {
                    throw error; // Re-lancer l'erreur originale si tous les fallbacks échouent
                }
            } else {
                throw error; // Re-lancer l'erreur si source spécifique demandée
            }
        }
        
        // Ajouter des métadonnées
        const response = {
            ...result,
            symbol,
            endpoint,
            source: usedSource,
            timestamp: new Date().toISOString(),
            availableSources: ['yahoo', 'alpha', 'finnhub']
        };

        res.status(200).json(response);
        
    } catch (error) {
        console.error('Erreur API Market Data:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des données de marché',
            details: error.message,
            symbol,
            endpoint,
            requestedSource: source,
            availableSources: ['yahoo', 'alpha', 'finnhub']
        });
    }
}
