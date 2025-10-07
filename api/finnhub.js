// API Finnhub pour les données financières
export default async function handler(req, res) {
    const { endpoint, symbol } = req.query;
    
    // Clé API Finnhub (à configurer dans les variables d'environnement Vercel)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
    
    if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') {
        return res.status(500).json({ 
            error: 'Clé API Finnhub non configurée. Veuillez configurer FINNHUB_API_KEY dans les variables d\'environnement Vercel.' 
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