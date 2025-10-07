// API Finnhub reprogrammée avec les bons symboles et structure
export default async function handler(req, res) {
    const { endpoint, symbol, limit = 10 } = req.query;
    
    // Clé API Finnhub (à configurer dans les variables d'environnement Vercel)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
    
    // Symboles corrects pour Finnhub (selon leur documentation)
    const marketSymbols = {
        'SPX': '^GSPC',      // S&P 500 Index
        'IXIC': '^IXIC',     // NASDAQ Composite
        'DJI': '^DJI',       // Dow Jones Industrial Average
        'TSX': '^GSPTSE',    // S&P/TSX Composite Index
        'EURUSD': 'EURUSD=X', // EUR/USD Currency Pair
        'GOLD': 'GC=F',      // Gold Futures
        'OIL': 'CL=F',       // Crude Oil Futures
        'BTCUSD': 'BTC-USD'  // Bitcoin USD
    };
    
    // Données de démonstration réalistes si pas de clé API
    const demoData = {
        '^GSPC': { c: 4567.89, d: 38.75, dp: 0.85, h: 4580.12, l: 4550.23, o: 4560.45, pc: 4529.14, t: Date.now() },
        '^IXIC': { c: 14234.56, d: 175.23, dp: 1.23, h: 14280.45, l: 14150.67, o: 14200.12, pc: 14059.33, t: Date.now() },
        '^DJI': { c: 34567.89, d: -156.78, dp: -0.45, h: 34750.12, l: 34500.45, o: 34650.67, pc: 34724.67, t: Date.now() },
        '^GSPTSE': { c: 20123.45, d: 134.56, dp: 0.67, h: 20180.23, l: 20050.12, o: 20100.34, pc: 19988.89, t: Date.now() },
        'EURUSD=X': { c: 1.0845, d: 0.0013, dp: 0.12, h: 1.0856, l: 1.0823, o: 1.0834, pc: 1.0832, t: Date.now() },
        'GC=F': { c: 2034.50, d: -6.89, dp: -0.34, h: 2045.67, l: 2025.34, o: 2038.45, pc: 2041.39, t: Date.now() },
        'CL=F': { c: 78.45, d: 1.23, dp: 1.56, h: 79.12, l: 77.89, o: 78.12, pc: 77.22, t: Date.now() },
        'BTC-USD': { c: 43567.89, d: 998.45, dp: 2.34, h: 44123.45, l: 42890.12, o: 43234.56, pc: 42569.44, t: Date.now() }
    };
    
    // Convertir le symbole court en symbole Finnhub
    const finnhubSymbol = marketSymbols[symbol] || symbol;
    
    if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') {
        // Retourner des données de démonstration selon l'endpoint
        let demoResult;
        
        switch (endpoint) {
            case 'profile':
                demoResult = {
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
                // Utiliser les données de démonstration avec le bon symbole
                demoResult = demoData[finnhubSymbol] || {
                    c: 100.00, d: 0.50, dp: 0.50, h: 101.00, l: 99.50, o: 100.50, pc: 99.50, t: Date.now()
                };
        }
        
        return res.status(200).json({
            ...(Array.isArray(demoResult) ? {} : demoResult),
            data: Array.isArray(demoResult) ? demoResult : undefined,
            symbol: finnhubSymbol,
            originalSymbol: symbol,
            endpoint,
            timestamp: new Date().toISOString(),
            source: 'demo',
            message: 'Données de démonstration - Configurez FINNHUB_API_KEY pour des données réelles'
        });
    }

    try {
        let url;
        
        switch (endpoint) {
            case 'quote':
                url = `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'profile':
                url = `https://finnhub.io/api/v1/stock/profile2?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'news':
                const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const to = new Date().toISOString().split('T')[0];
                url = `https://finnhub.io/api/v1/company-news?symbol=${finnhubSymbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
                break;
            case 'recommendation':
                url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'peers':
                url = `https://finnhub.io/api/v1/stock/peers?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'earnings':
                url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'insider-transactions':
                url = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'financials':
                url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            case 'candles':
                const toTimestamp = Math.floor(Date.now() / 1000);
                const fromTimestamp = toTimestamp - (30 * 24 * 60 * 60); // 30 jours
                url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=D&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_API_KEY}`;
                break;
            case 'search':
                url = `https://finnhub.io/api/v1/search?q=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
                break;
            default:
                return res.status(400).json({ 
                    error: 'Endpoint non supporté',
                    supportedEndpoints: [
                        'quote', 'profile', 'news', 'recommendation', 
                        'peers', 'earnings', 'insider-transactions', 
                        'financials', 'candles', 'search'
                    ]
                });
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Ajouter des métadonnées
        const result = {
            ...data,
            symbol: finnhubSymbol,
            originalSymbol: symbol,
            endpoint,
            timestamp: new Date().toISOString(),
            source: 'finnhub'
        };

        res.status(200).json(result);
        
    } catch (error) {
        console.error('Erreur API Finnhub:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des données Finnhub',
            details: error.message 
        });
    }
}