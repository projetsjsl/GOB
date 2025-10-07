// API Unifiée - Essaie plusieurs sources dans l'ordre
// 1. Twelve Data (meilleure couverture)
// 2. Finnhub (bon pour actions et crypto)
// 3. Alpha Vantage (bon pour ETF)
// 4. Fallback vers données réalistes

export default async function handler(req, res) {
    const { symbol, test } = req.query;
    
    // Si test de connexion pour toutes les APIs
    if (test === 'true') {
        const results = {
            twelve_data: await testAPI('twelve_data'),
            finnhub: await testAPI('finnhub'),
            alpha_vantage: await testAPI('alpha_vantage')
        };
        
        const anySuccess = Object.values(results).some(r => r.success);
        
        return res.status(200).json({
            success: anySuccess,
            message: anySuccess 
                ? '✅ Au moins une API est configurée' 
                : '❌ Aucune API n\'est configurée',
            apis: results,
            timestamp: new Date().toISOString()
        });
    }
    
    // Essayer les APIs dans l'ordre
    const apis = [
        { name: 'twelve_data', endpoint: '/api/twelve-data' },
        { name: 'finnhub', endpoint: '/api/finnhub-market-data' },
        { name: 'alpha_vantage', endpoint: '/api/alpha-vantage' }
    ];
    
    for (const api of apis) {
        try {
            const baseUrl = req.headers.host?.includes('localhost') 
                ? 'http://localhost:3000' 
                : `https://${req.headers.host}`;
            
            const response = await fetch(`${baseUrl}${api.endpoint}?symbol=${symbol}`);
            const data = await response.json();
            
            // Si on a des vraies données (pas un fallback)
            if (data.source && !data.source.includes('fallback') && !data.source.includes('demo')) {
                console.log(`✅ Données obtenues via ${api.name} pour ${symbol}`);
                return res.status(200).json({
                    ...data,
                    api_used: api.name
                });
            }
        } catch (error) {
            console.log(`❌ Échec ${api.name} pour ${symbol}:`, error.message);
            continue;
        }
    }
    
    // Si toutes les APIs ont échoué, utiliser les données réalistes
    console.log(`⚠️ Toutes les APIs ont échoué pour ${symbol}, utilisation de données réalistes`);
    const realisticData = generateRealisticData(symbol);
    return res.status(200).json({
        ...realisticData,
        source: 'realistic_fallback',
        api_used: 'none',
        timestamp: new Date().toISOString(),
        message: 'Aucune API configurée - Données fictives'
    });
}

// Fonction pour tester une API
async function testAPI(apiName) {
    try {
        let testUrl;
        const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;
        const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
        const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
        
        switch (apiName) {
            case 'twelve_data':
                if (!TWELVE_DATA_KEY) {
                    return { success: false, message: 'Clé API non configurée', configured: false };
                }
                testUrl = `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${TWELVE_DATA_KEY}`;
                const td = await fetch(testUrl);
                const tdData = await td.json();
                return {
                    success: tdData.close && !tdData.error,
                    message: tdData.error ? tdData.message : '✅ Connecté',
                    configured: true
                };
                
            case 'finnhub':
                if (!FINNHUB_KEY) {
                    return { success: false, message: 'Clé API non configurée', configured: false };
                }
                testUrl = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_KEY}`;
                const fh = await fetch(testUrl);
                const fhData = await fh.json();
                return {
                    success: fhData.c && fhData.c > 0,
                    message: fhData.error ? fhData.error : '✅ Connecté',
                    configured: true
                };
                
            case 'alpha_vantage':
                if (!ALPHA_VANTAGE_KEY) {
                    return { success: false, message: 'Clé API non configurée', configured: false };
                }
                testUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${ALPHA_VANTAGE_KEY}`;
                const av = await fetch(testUrl);
                const avData = await av.json();
                return {
                    success: avData['Global Quote'] && avData['Global Quote']['05. price'],
                    message: avData['Error Message'] || avData['Note'] || '✅ Connecté',
                    configured: true
                };
                
            default:
                return { success: false, message: 'API inconnue', configured: false };
        }
    } catch (error) {
        return {
            success: false,
            message: error.message,
            configured: true
        };
    }
}

// Fonction pour générer des données réalistes
function generateRealisticData(symbol) {
    const baseData = {
        'SPX': { basePrice: 5563.75, volatility: 0.02, name: 'S&P 500' },
        'IXIC': { basePrice: 17458.24, volatility: 0.025, name: 'NASDAQ' },
        'DJI': { basePrice: 40844.09, volatility: 0.015, name: 'DOW JONES' },
        'TSX': { basePrice: 20123.45, volatility: 0.018, name: 'TSX' },
        'EURUSD': { basePrice: 1.0844, volatility: 0.001, name: 'EUR/USD' },
        'GOLD': { basePrice: 2577.50, volatility: 0.01, name: 'GOLD' },
        'OIL': { basePrice: 68.31, volatility: 0.02, name: 'OIL' },
        'BTCUSD': { basePrice: 121252.00, volatility: 0.03, name: 'BITCOIN' }
    };
    
    const config = baseData[symbol] || { basePrice: 100, volatility: 0.02, name: symbol };
    
    const randomChange = (Math.random() - 0.5) * 2 * config.volatility;
    const newPrice = config.basePrice * (1 + randomChange);
    const change = newPrice - config.basePrice;
    const changePercent = (change / config.basePrice) * 100;
    
    const high = newPrice * (1 + Math.random() * 0.01);
    const low = newPrice * (1 - Math.random() * 0.01);
    const open = config.basePrice * (1 + (Math.random() - 0.5) * 0.005);
    
    return {
        c: parseFloat(newPrice.toFixed(2)),
        d: parseFloat(change.toFixed(2)),
        dp: parseFloat(changePercent.toFixed(2)),
        h: parseFloat(high.toFixed(2)),
        l: parseFloat(low.toFixed(2)),
        o: parseFloat(open.toFixed(2)),
        pc: parseFloat(config.basePrice.toFixed(2)),
        t: Date.now(),
        symbol: config.name,
        originalSymbol: symbol
    };
}

