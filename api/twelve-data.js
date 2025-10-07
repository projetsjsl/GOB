// API Twelve Data pour données de marché en temps réel
// Documentation: https://twelvedata.com/docs
export default async function handler(req, res) {
    const { symbol, test } = req.query;
    
    // Récupérer la clé API Twelve Data depuis les variables d'environnement
    const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
    
    // Si test de connexion demandé
    if (test === 'true') {
        if (!TWELVE_DATA_API_KEY) {
            return res.status(200).json({
                success: false,
                message: '❌ TWELVE_DATA_API_KEY non configurée',
                configured: false
            });
        }
        
        try {
            // Test avec AAPL (Apple) - valeur sûre
            const testUrl = `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${TWELVE_DATA_API_KEY}`;
            const response = await fetch(testUrl);
            const data = await response.json();
            
            if (data.close && !data.error) {
                return res.status(200).json({
                    success: true,
                    message: '✅ Connexion Twelve Data réussie',
                    configured: true,
                    testData: data,
                    timestamp: new Date().toISOString()
                });
            } else if (data.error) {
                return res.status(200).json({
                    success: false,
                    message: `❌ Erreur Twelve Data: ${data.message || data.error}`,
                    configured: true,
                    error: data.message || data.error
                });
            } else {
                return res.status(200).json({
                    success: false,
                    message: '❌ Réponse Twelve Data invalide',
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
    
    // Mapping des symboles pour Twelve Data
    const symbolMapping = {
        'SPX': 'SPX',           // S&P 500 Index
        'IXIC': 'IXIC',         // NASDAQ Composite
        'DJI': 'DJI',           // Dow Jones Industrial Average
        'TSX': 'TSX',           // S&P/TSX Composite Index
        'EURUSD': 'EUR/USD',    // EUR/USD Forex
        'GOLD': 'XAU/USD',      // Gold Forex
        'OIL': 'WTI/USD',       // WTI Crude Oil
        'BTCUSD': 'BTC/USD'     // Bitcoin
    };
    
    const twelveSymbol = symbolMapping[symbol] || symbol;
    
    // Si pas de clé API, retourner des données réalistes
    if (!TWELVE_DATA_API_KEY) {
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: twelveSymbol,
            originalSymbol: symbol,
            source: 'realistic_demo',
            timestamp: new Date().toISOString(),
            message: '⚠️ TWELVE_DATA_API_KEY non configurée - Données fictives'
        });
    }
    
    try {
        // Appel à l'API Twelve Data Quote
        const url = `https://api.twelvedata.com/quote?symbol=${twelveSymbol}&apikey=${TWELVE_DATA_API_KEY}`;
        
        console.log(`📡 Appel Twelve Data pour ${symbol} (${twelveSymbol})`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`📊 Réponse Twelve Data pour ${symbol}:`, data);
        
        // Vérifier si les données sont valides
        if (data.close && !data.error) {
            const close = parseFloat(data.close);
            const previousClose = parseFloat(data.previous_close);
            const change = close - previousClose;
            const changePercent = (change / previousClose) * 100;
            
            const result = {
                c: close,                           // Current price
                d: parseFloat(change.toFixed(2)),   // Change
                dp: parseFloat(changePercent.toFixed(2)), // Percent change
                h: parseFloat(data.high),           // High price of the day
                l: parseFloat(data.low),            // Low price of the day
                o: parseFloat(data.open),           // Open price of the day
                pc: previousClose,                  // Previous close price
                t: Date.now(),                      // Timestamp
                symbol: twelveSymbol,
                originalSymbol: symbol,
                source: 'twelve_data',
                timestamp: new Date().toISOString()
            };
            
            return res.status(200).json(result);
        } else if (data.error) {
            console.error(`❌ Erreur Twelve Data pour ${symbol}:`, data.message || data.error);
            
            // Fallback vers données réalistes
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: twelveSymbol,
                originalSymbol: symbol,
                source: 'error_fallback',
                timestamp: new Date().toISOString(),
                message: `Erreur Twelve Data: ${data.message || data.error}`
            });
        } else {
            console.warn(`⚠️ Données Twelve Data invalides pour ${symbol}:`, data);
            
            // Fallback vers données réalistes
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: twelveSymbol,
                originalSymbol: symbol,
                source: 'invalid_response_fallback',
                timestamp: new Date().toISOString(),
                message: 'Réponse Twelve Data invalide'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur API Twelve Data:', error);
        
        // Fallback vers données réalistes en cas d'erreur
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: twelveSymbol,
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

