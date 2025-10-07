// API Alpha Vantage pour données de marché en temps réel
// Documentation: https://www.alphavantage.co/documentation/
export default async function handler(req, res) {
    const { symbol, test } = req.query;
    
    // Récupérer la clé API Alpha Vantage depuis les variables d'environnement
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    // Si test de connexion demandé
    if (test === 'true') {
        if (!ALPHA_VANTAGE_API_KEY) {
            return res.status(200).json({
                success: false,
                message: '❌ ALPHA_VANTAGE_API_KEY non configurée',
                configured: false
            });
        }
        
        try {
            // Test avec IBM - valeur sûre
            const testUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${ALPHA_VANTAGE_API_KEY}`;
            const response = await fetch(testUrl);
            const data = await response.json();
            
            if (data['Global Quote'] && data['Global Quote']['05. price']) {
                return res.status(200).json({
                    success: true,
                    message: '✅ Connexion Alpha Vantage réussie',
                    configured: true,
                    testData: data,
                    timestamp: new Date().toISOString()
                });
            } else if (data['Error Message']) {
                return res.status(200).json({
                    success: false,
                    message: `❌ Erreur Alpha Vantage: ${data['Error Message']}`,
                    configured: true,
                    error: data['Error Message']
                });
            } else if (data['Note']) {
                return res.status(200).json({
                    success: false,
                    message: '❌ Limite de requêtes Alpha Vantage atteinte',
                    configured: true,
                    error: data['Note']
                });
            } else {
                return res.status(200).json({
                    success: false,
                    message: '❌ Réponse Alpha Vantage invalide',
                    configured: true,
                    data: data
                });
            }
        } catch (error) {
            return res.status(200).json({
                success: false,
                message: `❌ Erreur de connexion: ${error.message}`,
                configured: true,
                error: error.message
            });
        }
    }
    
    // Mapping des symboles pour Alpha Vantage (utilise des ETF pour les indices)
    const symbolMapping = {
        'SPX': 'SPY',           // S&P 500 ETF
        'IXIC': 'QQQ',          // NASDAQ 100 ETF
        'DJI': 'DIA',           // Dow Jones ETF
        'TSX': 'EWC',           // Canada ETF
        'EURUSD': 'EURUSD',     // EUR/USD (nécessite CURRENCY_EXCHANGE_RATE)
        'GOLD': 'GLD',          // Gold ETF
        'OIL': 'USO',           // Oil ETF
        'BTCUSD': 'BTC'         // Bitcoin (nécessite DIGITAL_CURRENCY)
    };
    
    const alphaSymbol = symbolMapping[symbol] || symbol;
    
    // Si pas de clé API, retourner des données réalistes
    if (!ALPHA_VANTAGE_API_KEY) {
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: alphaSymbol,
            originalSymbol: symbol,
            source: 'realistic_demo',
            timestamp: new Date().toISOString(),
            message: '⚠️ ALPHA_VANTAGE_API_KEY non configurée - Données fictives'
        });
    }
    
    try {
        let url;
        let data;
        
        // Cas spécial pour EUR/USD (Currency Exchange)
        if (symbol === 'EURUSD') {
            url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`;
            const response = await fetch(url);
            data = await response.json();
            
            if (data['Realtime Currency Exchange Rate']) {
                const rate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                const prevRate = rate * (1 - 0.0001); // Approximation
                const change = rate - prevRate;
                const changePercent = (change / prevRate) * 100;
                
                return res.status(200).json({
                    c: rate,
                    d: parseFloat(change.toFixed(4)),
                    dp: parseFloat(changePercent.toFixed(2)),
                    h: rate * 1.001,
                    l: rate * 0.999,
                    o: prevRate,
                    pc: prevRate,
                    t: Date.now(),
                    symbol: 'EUR/USD',
                    originalSymbol: symbol,
                    source: 'alpha_vantage',
                    timestamp: new Date().toISOString()
                });
            }
        }
        // Cas spécial pour Bitcoin (Digital Currency)
        else if (symbol === 'BTCUSD') {
            url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`;
            const response = await fetch(url);
            data = await response.json();
            
            if (data['Realtime Currency Exchange Rate']) {
                const rate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                const prevRate = rate * (1 - 0.001); // Approximation
                const change = rate - prevRate;
                const changePercent = (change / prevRate) * 100;
                
                return res.status(200).json({
                    c: rate,
                    d: parseFloat(change.toFixed(2)),
                    dp: parseFloat(changePercent.toFixed(2)),
                    h: rate * 1.02,
                    l: rate * 0.98,
                    o: prevRate,
                    pc: prevRate,
                    t: Date.now(),
                    symbol: 'BTC/USD',
                    originalSymbol: symbol,
                    source: 'alpha_vantage',
                    timestamp: new Date().toISOString()
                });
            }
        }
        // Pour les actions et ETF (Global Quote)
        else {
            url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${alphaSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
            const response = await fetch(url);
            data = await response.json();
            
            console.log(`📡 Appel Alpha Vantage pour ${symbol} (${alphaSymbol})`);
            console.log(`📊 Réponse Alpha Vantage:`, data);
            
            if (data['Global Quote'] && data['Global Quote']['05. price']) {
                const quote = data['Global Quote'];
                
                const result = {
                    c: parseFloat(quote['05. price']),
                    d: parseFloat(quote['09. change']),
                    dp: parseFloat(quote['10. change percent'].replace('%', '')),
                    h: parseFloat(quote['03. high']),
                    l: parseFloat(quote['04. low']),
                    o: parseFloat(quote['02. open']),
                    pc: parseFloat(quote['08. previous close']),
                    t: Date.now(),
                    symbol: alphaSymbol,
                    originalSymbol: symbol,
                    source: 'alpha_vantage',
                    timestamp: new Date().toISOString()
                };
                
                return res.status(200).json(result);
            }
        }
        
        // Si on arrive ici, les données sont invalides
        if (data['Error Message']) {
            console.error(`❌ Erreur Alpha Vantage: ${data['Error Message']}`);
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: alphaSymbol,
                originalSymbol: symbol,
                source: 'error_fallback',
                timestamp: new Date().toISOString(),
                message: `Erreur: ${data['Error Message']}`
            });
        }
        
        if (data['Note']) {
            console.warn(`⚠️ Limite Alpha Vantage: ${data['Note']}`);
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: alphaSymbol,
                originalSymbol: symbol,
                source: 'rate_limit_fallback',
                timestamp: new Date().toISOString(),
                message: 'Limite de requêtes atteinte (25/jour gratuit)'
            });
        }
        
        // Fallback vers données réalistes
        console.warn(`⚠️ Données Alpha Vantage invalides pour ${symbol}`);
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: alphaSymbol,
            originalSymbol: symbol,
            source: 'invalid_response_fallback',
            timestamp: new Date().toISOString(),
            message: 'Réponse invalide'
        });
        
    } catch (error) {
        console.error('❌ Erreur API Alpha Vantage:', error);
        
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: symbolMapping[symbol],
            originalSymbol: symbol,
            source: 'exception_fallback',
            timestamp: new Date().toISOString(),
            message: `Erreur: ${error.message}`
        });
    }
}

// Fonction pour générer des données réalistes
function generateRealisticData(symbol) {
    const baseData = {
        'SPX': { basePrice: 5563.75, volatility: 0.02 },
        'IXIC': { basePrice: 17458.24, volatility: 0.025 },
        'DJI': { basePrice: 40844.09, volatility: 0.015 },
        'TSX': { basePrice: 20123.45, volatility: 0.018 },
        'EURUSD': { basePrice: 1.0844, volatility: 0.001 },
        'GOLD': { basePrice: 2577.50, volatility: 0.01 },
        'OIL': { basePrice: 68.31, volatility: 0.02 },
        'BTCUSD': { basePrice: 121252.00, volatility: 0.03 }
    };
    
    const config = baseData[symbol] || { basePrice: 100, volatility: 0.02 };
    
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
        t: Date.now()
    };
}

