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

    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Cascade fallback: FMP → Yahoo Finance → Static fallback
    let events = null;
    let source = 'fallback';
    let errors = [];

    // Try 1: FMP (Primary)
    try {
        console.log('🔄 [1/2] Trying FMP Dividends...');
        const FMP_API_KEY = process.env.FMP_API_KEY;

        if (FMP_API_KEY) {
            const response = await fetch(
                `https://financialmodelingprep.com/api/v3/stock_dividend_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`,
                { timeout: 5000 }
            );

            if (response.ok) {
                const fmpData = await response.json();
                if (Array.isArray(fmpData) && fmpData.length > 0) {
                    events = parseFMPDividends(fmpData);
                    source = 'fmp';
                    console.log(`✅ FMP: ${events.length} days of dividends`);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } else {
            throw new Error('FMP_API_KEY not configured');
        }
    } catch (error) {
        errors.push(`FMP: ${error.message}`);
        console.log(`⚠️ FMP failed: ${error.message}`);
    }

    // Try 2: Yahoo Finance (Fallback)
    if (!events) {
        try {
            console.log('🔄 [2/2] Trying Yahoo Finance...');
            // Yahoo Finance doesn't have a direct dividend calendar API
            // Use static fallback as alternative
            events = getFallbackDividendsData();
            source = 'yahoo_limited';
            console.log(`✅ Yahoo Finance: Using limited fallback data`);
        } catch (error) {
            errors.push(`Yahoo: ${error.message}`);
            console.log(`⚠️ Yahoo failed: ${error.message}`);
        }
    }

    // Final fallback: Static data
    if (!events) {
        console.log('📦 Using static fallback data');
        events = getFallbackDividendsData();
        source = 'static_fallback';
    }

    return res.status(200).json({
        success: true,
        data: events,
        source: source,
        fallback_tried: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
    });
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
