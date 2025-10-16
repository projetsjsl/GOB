/**
 * API Endpoint pour récupérer les tickers (équipe et watchlist)
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { list } = req.query;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }

        let result = {};

        if (!list || list === 'team') {
            // Récupérer les tickers d'équipe
            const teamResponse = await fetch(`${supabaseUrl}/rest/v1/team_tickers?select=*&order=priority.desc,ticker.asc`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                result.team_tickers = teamData.map(item => item.ticker);
                result.team_count = teamData.length;
            } else {
                // Fallback vers liste hardcodée
                result.team_tickers = [
                    'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                    'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                    'TRP', 'UNH', 'UL', 'VZ', 'WFC'
                ];
                result.team_count = result.team_tickers.length;
                result.team_source = 'fallback';
            }
        }

        if (!list || list === 'watchlist') {
            // Récupérer les tickers de la watchlist
            const watchlistResponse = await fetch(`${supabaseUrl}/rest/v1/watchlist?select=*`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (watchlistResponse.ok) {
                const watchlistData = await watchlistResponse.json();
                result.watchlist_tickers = watchlistData.map(item => item.ticker);
                result.watchlist_count = watchlistData.length;
            } else {
                // Fallback vers liste hardcodée (même que team pour l'instant)
                result.watchlist_tickers = [
                    'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                    'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                    'TRP', 'UNH', 'UL', 'VZ', 'WFC'
                ];
                result.watchlist_count = result.watchlist_tickers.length;
                result.watchlist_source = 'fallback';
            }
        }

        result.timestamp = new Date().toISOString();
        result.success = true;

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Tickers API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            team_tickers: [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ],
            watchlist_tickers: [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ],
            source: 'emergency_fallback'
        });
    }
}
