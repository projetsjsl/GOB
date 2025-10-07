// API Finnhub pour les données financières
export default async function handler(req, res) {
    const { endpoint, symbol } = req.query;
    
    // Clé API Finnhub (à configurer dans les variables d'environnement Vercel)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
    
    // Données de démonstration si pas de clé API
    const demoData = {
        'CVS': { c: 78.45, d: 1.23, dp: 1.59, h: 79.12, l: 77.89, o: 78.12, pc: 77.22, t: Date.now() },
        'MSFT': { c: 378.85, d: -2.15, dp: -0.56, h: 381.20, l: 377.45, o: 380.00, pc: 381.00, t: Date.now() },
        'AAPL': { c: 175.43, d: 0.87, dp: 0.50, h: 176.20, l: 174.89, o: 175.10, pc: 174.56, t: Date.now() }
    };
    
    if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') {
        // Retourner des données de démonstration
        const demoResult = demoData[symbol] || {
            c: 100.00, d: 0.50, dp: 0.50, h: 101.00, l: 99.50, o: 100.50, pc: 99.50, t: Date.now()
        };
        
        return res.status(200).json({
            ...demoResult,
            symbol,
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
            default:
                return res.status(400).json({ error: 'Endpoint non supporté' });
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Ajouter des métadonnées
        const result = {
            ...data,
            symbol,
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