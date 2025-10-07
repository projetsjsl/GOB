// API Finnhub pour données de marché en temps réel
// Documentation: https://finnhub.io/docs/api/quote
export default async function handler(req, res) {
    const { symbol, test } = req.query;
    
    // Récupérer la clé API Finnhub depuis les variables d'environnement
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    
    // Si test de connexion demandé
    if (test === 'true') {
        if (!FINNHUB_API_KEY) {
            return res.status(200).json({
                success: false,
                message: '❌ FINNHUB_API_KEY non configurée',
                configured: false
            });
        }
        
        try {
            // Test avec AAPL (Apple) - valeur sûre
            const testUrl = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`;
            const response = await fetch(testUrl);
            const data = await response.json();
            
            if (data.c && data.c > 0) {
                return res.status(200).json({
                    success: true,
                    message: '✅ Connexion Finnhub réussie',
                    configured: true,
                    testData: data,
                    timestamp: new Date().toISOString()
                });
            } else if (data.error) {
                return res.status(200).json({
                    success: false,
                    message: `❌ Erreur Finnhub: ${data.error}`,
                    configured: true,
                    error: data.error
                });
            } else {
                return res.status(200).json({
                    success: false,
                    message: '❌ Réponse Finnhub invalide',
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
    
    // Mapping des symboles pour Finnhub
    // Note: Finnhub utilise des symboles différents pour les indices
    const symbolMapping = {
        'SPX': '^GSPC',      // S&P 500 Index
        'IXIC': '^IXIC',     // NASDAQ Composite
        'DJI': '^DJI',       // Dow Jones Industrial Average
        'TSX': '^GSPTSE',    // S&P/TSX Composite Index
        'EURUSD': 'OANDA:EUR_USD',  // EUR/USD (Forex)
        'GOLD': 'OANDA:XAU_USD',    // Gold (Forex)
        'OIL': 'OANDA:WTI_USD',     // WTI Crude Oil (Forex)
        'BTCUSD': 'BINANCE:BTCUSDT' // Bitcoin
    };
    
    const finnhubSymbol = symbolMapping[symbol] || symbol;
    
    // Si pas de clé API, retourner des données réalistes
    if (!FINNHUB_API_KEY) {
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: finnhubSymbol,
            originalSymbol: symbol,
            source: 'realistic_demo',
            timestamp: new Date().toISOString(),
            message: '⚠️ FINNHUB_API_KEY non configurée - Données fictives'
        });
    }
    
    try {
        // Appel à l'API Finnhub Quote
        const url = `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`;
        
        console.log(`📡 Appel Finnhub pour ${symbol} (${finnhubSymbol}):`, url.replace(FINNHUB_API_KEY, 'XXX'));
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`📊 Réponse Finnhub pour ${symbol}:`, data);
        
        // Vérifier si les données sont valides
        if (data.c && data.c > 0) {
            const result = {
                c: data.c,          // Current price
                d: data.d,          // Change
                dp: data.dp,        // Percent change
                h: data.h,          // High price of the day
                l: data.l,          // Low price of the day
                o: data.o,          // Open price of the day
                pc: data.pc,        // Previous close price
                t: data.t,          // Timestamp
                symbol: finnhubSymbol,
                originalSymbol: symbol,
                source: 'finnhub',
                timestamp: new Date().toISOString()
            };
            
            return res.status(200).json(result);
        } else if (data.error) {
            console.error(`❌ Erreur Finnhub pour ${symbol}:`, data.error);
            
            // Fallback vers données réalistes
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: finnhubSymbol,
                originalSymbol: symbol,
                source: 'error_fallback',
                timestamp: new Date().toISOString(),
                message: `Erreur Finnhub: ${data.error}`
            });
        } else {
            console.warn(`⚠️ Données Finnhub invalides pour ${symbol}:`, data);
            
            // Fallback vers données réalistes
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: finnhubSymbol,
                originalSymbol: symbol,
                source: 'invalid_response_fallback',
                timestamp: new Date().toISOString(),
                message: 'Réponse Finnhub invalide'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur API Finnhub:', error);
        
        // Fallback vers données réalistes en cas d'erreur
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: finnhubSymbol,
            originalSymbol: symbol,
            source: 'exception_fallback',
            timestamp: new Date().toISOString(),
            message: `Erreur: ${error.message}`
        });
    }
}

// Fonction pour générer des données réalistes basées sur les vraies valeurs actuelles
function generateRealisticData(symbol) {
    const baseData = {
        'SPX': { 
            basePrice: 5563.75, 
            volatility: 0.02,
            name: 'S&P 500'
        },
        'IXIC': { 
            basePrice: 17458.24, 
            volatility: 0.025,
            name: 'NASDAQ'
        },
        'DJI': { 
            basePrice: 40844.09, 
            volatility: 0.015,
            name: 'DOW JONES'
        },
        'TSX': { 
            basePrice: 20123.45, 
            volatility: 0.018,
            name: 'TSX'
        },
        'EURUSD': { 
            basePrice: 1.0844, 
            volatility: 0.001,
            name: 'EUR/USD'
        },
        'GOLD': { 
            basePrice: 2577.50, 
            volatility: 0.01,
            name: 'GOLD'
        },
        'OIL': { 
            basePrice: 68.31, 
            volatility: 0.02,
            name: 'OIL'
        },
        'BTCUSD': { 
            basePrice: 121252.00, 
            volatility: 0.03,
            name: 'BITCOIN'
        }
    };
    
    const config = baseData[symbol] || { basePrice: 100, volatility: 0.02, name: symbol };
    
    // Générer des variations réalistes
    const randomChange = (Math.random() - 0.5) * 2 * config.volatility;
    const newPrice = config.basePrice * (1 + randomChange);
    const change = newPrice - config.basePrice;
    const changePercent = (change / config.basePrice) * 100;
    
    // Générer des données OHLC réalistes
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

