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
        console.log('🔄 Récupération du calendrier des earnings depuis FMP...');

        const FMP_API_KEY = process.env.FMP_API_KEY;
        if (!FMP_API_KEY) {
            throw new Error('FMP_API_KEY non configurée');
        }

        // Récupérer les earnings des 7 prochains jours depuis FMP
        const from = new Date().toISOString().split('T')[0];
        const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await fetch(
            `https://financialmodelingprep.com/api/v3/earning_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP FMP: ${response.status}`);
        }

        const fmpData = await response.json();
        console.log('✅ Données FMP récupérées');

        // Convertir le format FMP vers le format attendu
        const events = parseFMPEarnings(fmpData);

        console.log(`📊 ${events.length} jours d'earnings trouvés`);

        return res.status(200).json({
            success: true,
            data: events,
            source: 'fmp',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur:', error);

        // Données de fallback en cas d'erreur
        const fallbackData = getFallbackEarningsData();

        return res.status(200).json({
            success: true,
            data: fallbackData,
            source: 'fallback',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

function parseFMPEarnings(fmpData) {
    // Convertir le format FMP vers le format attendu par le frontend
    const eventsByDate = {};

    fmpData.forEach(item => {
        // Formater la date (ex: "2024-10-17" -> "Wed Oct 17")
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Déterminer l'impact basé sur la market cap
        let impact = 2; // Medium par défaut
        const marketCap = item.marketCap || 0;
        if (marketCap > 500000000000) { // > $500B
            impact = 3; // High
        } else if (marketCap < 50000000000) { // < $50B
            impact = 1; // Low
        }

        // Déterminer le timing
        const time = item.time === 'bmo' ? 'Before Market' :
                     item.time === 'amc' ? 'After Market' :
                     item.time || 'TBD';

        const event = {
            time,
            currency: 'USD',
            impact,
            event: `${item.symbol} Earnings ${item.fiscalDateEnding || ''}`,
            actual: item.eps ? `$${item.eps} EPS` : 'N/A',
            forecast: item.epsEstimated ? `$${item.epsEstimated} EPS` : 'N/A',
            previous: item.revenue ? `$${(item.revenue / 1000000000).toFixed(2)}B Rev` : 'N/A'
        };

        if (!eventsByDate[dateStr]) {
            eventsByDate[dateStr] = {
                date: dateStr,
                events: []
            };
        }

        eventsByDate[dateStr].events.push(event);
    });

    // Convertir l'objet en tableau et trier par date
    return Object.values(eventsByDate).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
}

function getFallbackEarningsData() {
    return [
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
                }
            ]
        }
    ];
}
