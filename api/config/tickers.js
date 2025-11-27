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

        // Si Supabase n'est pas configuré, retourner directement le fallback
        if (!supabaseUrl || !supabaseKey) {
            console.warn('⚠️ Supabase configuration missing - using fallback tickers');
            const fallbackTickers = [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ];
            return res.status(200).json({
                success: true,
                timestamp: new Date().toISOString(),
                team_tickers: fallbackTickers,
                team_count: fallbackTickers.length,
                team_source: 'fallback',
                watchlist_tickers: fallbackTickers,
                watchlist_count: fallbackTickers.length,
                watchlist_source: 'fallback',
                source: 'fallback_no_config'
            });
        }

        let result = {};

        if (!list || list === 'team') {
            // Récupérer les tickers d'équipe depuis la table unifiée `tickers` avec source='team' ou 'both'
            const teamResponse = await fetch(
                `${supabaseUrl}/rest/v1/tickers?select=ticker&is_active=eq.true&or=(source.eq.team,source.eq.both)&order=priority.desc,ticker.asc`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                }
            );

            if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                result.team_tickers = teamData.map(item => item.ticker);
                result.team_count = teamData.length;
                result.team_source = 'supabase';
            } else {
                console.warn(`⚠️ Team tickers Supabase error: ${teamResponse.status}`);
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
            // Récupérer les tickers de watchlist depuis la table unifiée `tickers` avec source='watchlist' ou 'both'
            // Note: user_id est NULL pour les watchlists globales, ou spécifique pour les watchlists utilisateur
            const watchlistResponse = await fetch(
                `${supabaseUrl}/rest/v1/tickers?select=ticker&is_active=eq.true&or=(source.eq.watchlist,source.eq.both)&order=ticker.asc`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                }
            );

            if (watchlistResponse.ok) {
                const watchlistData = await watchlistResponse.json();
                result.watchlist_tickers = watchlistData.map(item => item.ticker);
                result.watchlist_count = watchlistData.length;
                result.watchlist_source = 'supabase';
            } else {
                console.warn(`⚠️ Watchlist Supabase error: ${watchlistResponse.status}`);
                // Fallback vers liste hardcodée
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
