// API de données de marché en temps réel - Solution permanente
export default async function handler(req, res) {
    const { symbol } = req.query;
    
    // Clé API Alpha Vantage (gratuite et fiable)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    
    // Mapping des symboles vers Alpha Vantage
    const symbolMapping = {
        'SPX': 'SPY',        // S&P 500 ETF
        'IXIC': 'QQQ',       // NASDAQ ETF
        'DJI': 'DIA',        // Dow Jones ETF
        'TSX': 'EWC',        // Canada ETF
        'EURUSD': 'EURUSD',  // EUR/USD
        'GOLD': 'GLD',       // Gold ETF
        'OIL': 'USO',        // Oil ETF
        'BTCUSD': 'BTC-USD'  // Bitcoin
    };
    
    const alphaSymbol = symbolMapping[symbol] || symbol;
    
    try {
        // Si pas de clé API, utiliser des données réalistes générées
        if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'demo') {
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: alphaSymbol,
                originalSymbol: symbol,
                source: 'realistic_demo',
                timestamp: new Date().toISOString(),
                message: 'Données réalistes - Configurez ALPHA_VANTAGE_API_KEY pour des données réelles'
            });
        }
        
        // Appel à l'API Alpha Vantage
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${alphaSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Global Quote']) {
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
        } else {
            // Fallback vers données réalistes si l'API échoue
            const realisticData = generateRealisticData(symbol);
            return res.status(200).json({
                ...realisticData,
                symbol: alphaSymbol,
                originalSymbol: symbol,
                source: 'fallback_realistic',
                timestamp: new Date().toISOString(),
                message: 'API indisponible, données réalistes utilisées'
            });
        }
        
    } catch (error) {
        console.error('Erreur API de données de marché:', error);
        
        // Fallback vers données réalistes en cas d'erreur
        const realisticData = generateRealisticData(symbol);
        return res.status(200).json({
            ...realisticData,
            symbol: alphaSymbol,
            originalSymbol: symbol,
            source: 'error_fallback',
            timestamp: new Date().toISOString(),
            message: 'Erreur API, données réalistes utilisées'
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
