/**
 * API Vercel pour le Calendrier des Dividendes
 * Endpoint: /api/calendar-dividends
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
        console.log('💰 Récupération du calendrier des dividendes...');
        
        // Données de démonstration pour les dividendes
        const dividendsData = [
            {
                date: 'Mon Oct 16',
                events: [
                    {
                        time: 'Ex-Date',
                        currency: 'USD',
                        impact: 1,
                        event: 'JNJ Dividend Payment',
                        actual: 'N/A',
                        forecast: '$1.13',
                        previous: '$1.13'
                    },
                    {
                        time: 'Pay Date',
                        currency: 'USD',
                        impact: 1,
                        event: 'PG Dividend Payment',
                        actual: 'N/A',
                        forecast: '$0.94',
                        previous: '$0.94'
                    }
                ]
            },
            {
                date: 'Tue Oct 17',
                events: [
                    {
                        time: 'Ex-Date',
                        currency: 'USD',
                        impact: 1,
                        event: 'KO Dividend Payment',
                        actual: 'N/A',
                        forecast: '$0.46',
                        previous: '$0.46'
                    },
                    {
                        time: 'Pay Date',
                        currency: 'USD',
                        impact: 1,
                        event: 'PEP Dividend Payment',
                        actual: 'N/A',
                        forecast: '$1.15',
                        previous: '$1.15'
                    }
                ]
            }
        ];

        return res.status(200).json({
            success: true,
            data: dividendsData,
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
