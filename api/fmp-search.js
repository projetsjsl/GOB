/**
 * API Proxy pour la recherche FMP
 * Permet au frontend 3p1 d'accéder à l'API FMP sans exposer la clé
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${FMP_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`FMP API returned ${response.status}`);
        }

        const data = await response.json();

        // Filter for stocks only (exclude indices, crypto, etc)
        const filtered = data.filter(item =>
            item.exchangeShortName &&
            ['NASDAQ', 'NYSE', 'AMEX', 'TSX', 'LSE', 'EURONEXT'].includes(item.exchangeShortName)
        );

        return res.status(200).json(filtered);

    } catch (error) {
        console.error('FMP Search error:', error);
        return res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
}
