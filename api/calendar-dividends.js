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
        console.log('🔄 Récupération du calendrier des dividendes depuis FMP...');

        const FMP_API_KEY = process.env.FMP_API_KEY;
        if (!FMP_API_KEY) {
            throw new Error('FMP_API_KEY non configurée');
        }

        // Récupérer les dividendes des 30 prochains jours depuis FMP
        const from = new Date().toISOString().split('T')[0];
        const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await fetch(
            `https://financialmodelingprep.com/api/v3/stock_dividend_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP FMP: ${response.status}`);
        }

        const fmpData = await response.json();
        console.log('✅ Données FMP récupérées');

        // Convertir le format FMP vers le format attendu
        const events = parseFMPDividends(fmpData);

        console.log(`💰 ${events.length} jours de dividendes trouvés`);

        return res.status(200).json({
            success: true,
            data: events,
            source: 'fmp',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur:', error);

        // Données de fallback en cas d'erreur
        const fallbackData = getFallbackDividendsData();

        return res.status(200).json({
            success: true,
            data: fallbackData,
            source: 'fallback',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}

function parseFMPDividends(fmpData) {
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

        // Déterminer le type d'événement (Ex-Date, Record Date, Pay Date, Declaration Date)
        let eventType = 'Ex-Date'; // Par défaut
        if (item.recordDate && item.date === item.recordDate) {
            eventType = 'Record Date';
        } else if (item.paymentDate && item.date === item.paymentDate) {
            eventType = 'Pay Date';
        } else if (item.declarationDate && item.date === item.declarationDate) {
            eventType = 'Declaration Date';
        }

        // Impact toujours bas pour les dividendes (routine)
        const impact = 1;

        // Calculer le yield si possible
        const yieldStr = item.adjDividend && item.label ?
            ` (Yield ${((item.adjDividend / parseFloat(item.label.split('$')[1]) * 100) || 0).toFixed(2)}%)` : '';

        const event = {
            time: eventType,
            currency: 'USD',
            impact,
            event: `${item.symbol} Dividend${yieldStr}`,
            actual: item.dividend ? `$${item.dividend}` : 'N/A',
            forecast: item.adjDividend ? `$${item.adjDividend}` : 'N/A',
            previous: item.dividend ? `$${item.dividend}` : 'N/A'
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

function getFallbackDividendsData() {
    return [
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
        }
    ];
}
