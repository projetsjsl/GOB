/**
 * API Endpoint to get both team and watchlist tickers configuration
 * Endpoint: /api/tickers-config
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

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        let teamTickers = [];
        let watchlistTickers = [];

        // Fetch team tickers from unified tickers table
        if (supabaseUrl && supabaseKey) {
            try {
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
                    teamTickers = teamData.map(item => item.ticker);
                    console.log(`✅ Team tickers loaded: ${teamTickers.length}`);
                }
            } catch (error) {
                console.error('⚠️ Error loading team tickers:', error);
            }

            // Fetch watchlist tickers from unified tickers table
            try {
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
                    watchlistTickers = watchlistData.map(item => item.ticker);
                    console.log(`✅ Watchlist tickers loaded: ${watchlistTickers.length}`);
                }
            } catch (error) {
                console.error('⚠️ Error loading watchlist tickers:', error);
            }
        }

        // Fallback to hardcoded tickers if Supabase unavailable
        if (teamTickers.length === 0) {
            teamTickers = [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ];
            console.log('📦 Using fallback team tickers');
        }

        return res.status(200).json({
            success: true,
            team_tickers: teamTickers,
            watchlist_tickers: watchlistTickers,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Tickers Config API Error:', error);

        // Return fallback data even on error
        return res.status(200).json({
            success: true,
            team_tickers: [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ],
            watchlist_tickers: [],
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}
