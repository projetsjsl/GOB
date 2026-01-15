/**
 * API Batch pour recuperer les donnees de plusieurs compagnies en une seule requete
 * Optimise les appels FMP en traitant plusieurs tickers en parallele
 * 
 * GET /api/fmp-company-data-batch?symbols=AAPL,MSFT,GOOGL
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

    const { symbols } = req.query;

    if (!symbols || symbols.trim().length === 0) {
        return res.status(400).json({ error: 'Symbols parameter required (comma-separated)' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    // Parse symbols
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    
    if (symbolList.length === 0) {
        return res.status(400).json({ error: 'No valid symbols provided' });
    }

    // Limiter a 10 symboles par requete pour eviter les timeouts
    const MAX_BATCH_SIZE = 10;
    if (symbolList.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
            error: `Too many symbols. Maximum ${MAX_BATCH_SIZE} symbols per request.`,
            provided: symbolList.length
        });
    }

    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    try {
        // Pour chaque symbole, appeler l'API fmp-company-data existante
        // On utilise Promise.allSettled pour gerer les erreurs individuellement
        const results = await Promise.allSettled(
            symbolList.map(async (symbol) => {
                try {
                    // Appeler l'API interne fmp-company-data
                    const internalResponse = await fetch(
                        `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/fmp-company-data?symbol=${encodeURIComponent(symbol)}`,
                        {
                            headers: {
                                'User-Agent': 'GOB-Batch-Sync'
                            }
                        }
                    );

                    if (!internalResponse.ok) {
                        const errorData = await internalResponse.json().catch(() => ({}));
                        return {
                            symbol,
                            success: false,
                            error: errorData.error || errorData.message || `HTTP ${internalResponse.status}`,
                            data: null
                        };
                    }

                    const data = await internalResponse.json();
                    return {
                        symbol,
                        success: true,
                        data: data
                    };
                } catch (error) {
                    return {
                        symbol,
                        success: false,
                        error: error.message,
                        data: null
                    };
                }
            })
        );

        // Formater les resultats
        const formattedResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    symbol: symbolList[index],
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                    data: null
                };
            }
        });

        // Statistiques
        const successCount = formattedResults.filter(r => r.success).length;
        const errorCount = formattedResults.filter(r => !r.success).length;

        return res.status(200).json({
            success: true,
            results: formattedResults,
            stats: {
                total: symbolList.length,
                success: successCount,
                errors: errorCount
            }
        });

    } catch (error) {
        console.error('Batch fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch batch data',
            message: error.message
        });
    }
}

