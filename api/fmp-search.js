/**
 * API Proxy pour rechercher des symboles FMP
 * Utilise FMP Premium Search endpoint pour resoudre automatiquement les variantes de symboles
 * 
 * Premium Features:
 * - Recherche intelligente de symboles
 * - Resolution automatique des variantes (BRK.B, BRK-B, BRKB, etc.)
 * - Support multi-bourses (TSX, TSXV, NASDAQ, NYSE, etc.)
 * - Suggestions de symboles similaires
 * 
 * Date: 6 decembre 2025
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

    const { query } = req.query;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    try {
        // Endpoint FMP Search
        const searchRes = await fetch(`${FMP_BASE}/search?query=${encodeURIComponent(query)}&apikey=${FMP_KEY}&limit=20`);

        if (!searchRes.ok) {
            const errorText = await searchRes.text();
            console.error(` FMP Search error: ${searchRes.status} - ${errorText.substring(0, 200)}`);
            return res.status(searchRes.status).json({
                error: 'FMP Search failed',
                message: errorText.substring(0, 200)
            });
        }

        let searchData = await searchRes.json();

        // FMP Search peut retourner directement un tableau OU un objet avec 'results'
        // Normaliser la reponse
        if (Array.isArray(searchData)) {
            // C'est deja un tableau, utiliser directement
        } else if (searchData && typeof searchData === 'object') {
            // Verifier si c'est un objet d'erreur
            if (searchData['Error Message']) {
                console.error(` FMP Search Error: ${searchData['Error Message']}`);
                return res.status(400).json({
                    error: 'FMP Search error',
                    message: searchData['Error Message']
                });
            }
            // Sinon, essayer d'extraire 'results' ou convertir en tableau
            if (Array.isArray(searchData.results)) {
                searchData = searchData.results;
            } else {
                searchData = [];
            }
        } else {
            searchData = [];
        }

        // Filtrer et formater les resultats
        const formattedResults = searchData
            .filter(result => result.symbol && result.name) // Filtrer les resultats invalides
            .map(result => ({
                symbol: result.symbol,
                name: result.name,
                exchange: result.exchangeShortName || result.exchange || '',
                currency: result.currency || 'USD',
                country: result.country || '',
                type: result.type || 'stock', // stock, etf, mutual fund, etc.
                // Score de pertinence (si disponible)
                score: result.score || null
            }))
            .sort((a, b) => {
                // Prioriser les resultats exacts
                const aExact = a.symbol.toUpperCase() === query.toUpperCase();
                const bExact = b.symbol.toUpperCase() === query.toUpperCase();
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Ensuite par score (si disponible)
                if (a.score && b.score) return b.score - a.score;
                
                // Sinon par ordre alphabetique
                return a.symbol.localeCompare(b.symbol);
            });

        console.log(` FMP Search found ${formattedResults.length} results for "${query}"`);

        return res.status(200).json({
            query: query,
            results: formattedResults,
            count: formattedResults.length
        });

    } catch (error) {
        console.error('FMP Search error:', error);
        return res.status(500).json({
            error: 'Failed to search symbols',
            message: error.message
        });
    }
}
