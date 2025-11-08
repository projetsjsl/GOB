/**
 * FMP Historical Price Data Proxy
 * Endpoint pour récupérer les données historiques depuis FMP
 * 
 * GET /api/fmp-historical?symbol=AAPL&from=2023-01-01
 */

const FMP_API_KEY = process.env.FMP_API_KEY;

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Méthode non autorisée',
            allowed: ['GET']
        });
    }

    try {
        const { symbol, from } = req.query;

        if (!symbol) {
            return res.status(400).json({
                error: 'Paramètre symbol requis'
            });
        }

        if (!FMP_API_KEY) {
            return res.status(500).json({
                error: 'FMP_API_KEY non configurée'
            });
        }

        // Calculer la date par défaut (1 an si non fournie)
        let fromDate = from;
        if (!fromDate) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fromDate = oneYearAgo.toISOString().split('T')[0];
        }

        // Appel à l'API FMP
        const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${fromDate}&apikey=${FMP_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Erreur lors de la récupération des données FMP',
                status: response.status
            });
        }

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ [FMP Historical] Error:', error);
        return res.status(500).json({
            error: 'Erreur serveur',
            message: error.message
        });
    }
}
