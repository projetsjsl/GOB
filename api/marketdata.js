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
    
    // Suppression de toute donnée de démonstration: pas de valeurs synthétiques
    
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
                    // Yahoo Finance n'expose pas un profil fiable ici: lever une erreur pour éviter du faux contenu
                    throw new Error('Profil non disponible via Yahoo Finance');
                    
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
                case 'news': {
                    // News générales (category=general)
                    const category = params?.category || 'general';
                    url = `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${FINNHUB_API_KEY}`;
                    break;
                }
                case 'company-news': {
                    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const to = new Date().toISOString().split('T')[0];
                    url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
                    break;
                }
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
                case 'calendar/economic': {
                    const from = params?.from;
                    const to = params?.to;
                    const search = new URLSearchParams();
                    if (from) search.append('from', from);
                    if (to) search.append('to', to);
                    search.append('token', FINNHUB_API_KEY);
                    url = `https://finnhub.io/api/v1/calendar/economic?${search.toString()}`;
                    break;
                }
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
    
    if (!hasApiKey) {
        return res.status(503).json({
            error: 'Service indisponible',
            message: 'Aucune clé API configurée. Veuillez configurer au moins une des variables d\'environnement suivantes : FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, ou TWELVE_DATA_API_KEY',
            requiredKeys: ['FINNHUB_API_KEY', 'ALPHA_VANTAGE_API_KEY', 'TWELVE_DATA_API_KEY'],
            symbol,
            endpoint
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
