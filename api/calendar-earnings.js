/**
 * API Vercel pour le Calendrier des Earnings
 * Endpoint: /api/calendar-earnings
 */

export default async function handler(req, res) {
    // Configuration CORS pour Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('📊 Récupération du calendrier des earnings...');
        
        // Données de démonstration pour les earnings
        const earningsData = [
            {
                date: 'Mon Oct 16',
                events: [
                    {
                        time: 'Before Market',
                        currency: 'USD',
                        impact: 3,
                        event: 'AAPL Earnings Q3 2024',
                        actual: 'N/A',
                        forecast: '$1.25 EPS',
                        previous: '$1.20 EPS'
                    },
                    {
                        time: 'After Market',
                        currency: 'USD',
                        impact: 2,
                        event: 'MSFT Earnings Q3 2024',
                        actual: 'N/A',
                        forecast: '$2.85 EPS',
                        previous: '$2.69 EPS'
                    },
                    {
                        time: 'Before Market',
                        currency: 'USD',
                        impact: 3,
                        event: 'GOOGL Earnings Q3 2024',
                        actual: 'N/A',
                        forecast: '$1.45 EPS',
                        previous: '$1.32 EPS'
                    }
                ]
            },
            {
                date: 'Tue Oct 17',
                events: [
                    {
                        time: 'After Market',
                        currency: 'USD',
                        impact: 2,
                        event: 'TSLA Earnings Q3 2024',
                        actual: 'N/A',
                        forecast: '$0.85 EPS',
                        previous: '$0.78 EPS'
                    },
                    {
                        time: 'Before Market',
                        currency: 'USD',
                        impact: 2,
                        event: 'NFLX Earnings Q3 2024',
                        actual: 'N/A',
                        forecast: '$2.15 EPS',
                        previous: '$2.11 EPS'
                    }
                ]
            }
        ];

        return res.status(200).json({
            success: true,
            data: earningsData,
            source: 'demo',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
}
