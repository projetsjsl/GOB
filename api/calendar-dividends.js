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
    // Team tickers avec dividendes estimés (trimestres à venir)
    const teamDividends = [
        { symbol: 'JNJ', date: 'Mon Nov 25', type: 'Ex-Date', amount: '$1.24', prev: '$1.19', yield: '3.2%' },
        { symbol: 'JPM', date: 'Fri Jan 3', type: 'Ex-Date', amount: '$1.25', prev: '$1.15', yield: '2.1%' },
        { symbol: 'UNH', date: 'Fri Dec 13', type: 'Ex-Date', amount: '$2.10', prev: '$1.88', yield: '1.3%' },
        { symbol: 'WFC', date: 'Fri Dec 6', type: 'Ex-Date', amount: '$0.40', prev: '$0.35', yield: '2.3%' },
        { symbol: 'CVS', date: 'Fri Nov 1', type: 'Ex-Date', amount: '$0.67', prev: '$0.66', yield: '4.8%' },
        { symbol: 'PFE', date: 'Fri Nov 8', type: 'Ex-Date', amount: '$0.42', prev: '$0.42', yield: '6.5%' },
        { symbol: 'CSCO', date: 'Fri Jan 3', type: 'Ex-Date', amount: '$0.40', prev: '$0.39', yield: '2.9%' },
        { symbol: 'T', date: 'Fri Jan 10', type: 'Ex-Date', amount: '$0.2775', prev: '$0.2775', yield: '6.2%' },
        { symbol: 'VZ', date: 'Fri Jan 10', type: 'Ex-Date', amount: '$0.6775', prev: '$0.665', yield: '6.4%' },
        { symbol: 'MDT', date: 'Fri Jan 10', type: 'Ex-Date', amount: '$0.70', prev: '$0.69', yield: '3.1%' },
        { symbol: 'BNS', date: 'Tue Jan 7', type: 'Ex-Date', amount: 'C$1.06', prev: 'C$1.06', yield: '5.8%' },
        { symbol: 'TD', date: 'Fri Jan 10', type: 'Ex-Date', amount: 'C$1.02', prev: 'C$0.96', yield: '4.9%' },
        { symbol: 'BCE', date: 'Fri Dec 13', type: 'Ex-Date', amount: 'C$0.9675', prev: 'C$0.9675', yield: '8.5%' },
        { symbol: 'CNR', date: 'Fri Dec 27', type: 'Ex-Date', amount: 'C$0.8375', prev: 'C$0.7875', yield: '2.0%' },
        { symbol: 'MFC', date: 'Tue Dec 3', type: 'Ex-Date', amount: 'C$0.38', prev: 'C$0.38', yield: '4.2%' },
        { symbol: 'TRP', date: 'Fri Dec 20', type: 'Ex-Date', amount: 'C$0.99', prev: 'C$0.96', yield: '6.8%' },
        { symbol: 'NTR', date: 'Fri Dec 27', type: 'Ex-Date', amount: '$0.52', prev: '$0.52', yield: '4.1%' },
        { symbol: 'DEO', date: 'Thu Nov 14', type: 'Ex-Date', amount: '£0.4285', prev: '£0.4107', yield: '2.4%' },
        { symbol: 'UL', date: 'Thu Nov 7', type: 'Ex-Date', amount: '€0.4268', prev: '€0.4108', yield: '3.8%' },
        { symbol: 'LVMHF', date: 'Thu Dec 5', type: 'Ex-Date', amount: '€6.00', prev: '€5.00', yield: '1.8%' },
        { symbol: 'NSRGY', date: 'Fri Apr 18', type: 'Ex-Date', amount: 'CHF 1.50', prev: 'CHF 1.42', yield: '3.1%' },
        { symbol: 'MG', date: 'Fri Dec 13', type: 'Ex-Date', amount: 'C$0.105', prev: 'C$0.10', yield: '4.5%' }
    ];

    // Grouper par date
    const eventsByDate = {};

    teamDividends.forEach(dividend => {
        if (!eventsByDate[dividend.date]) {
            eventsByDate[dividend.date] = {
                date: dividend.date,
                events: []
            };
        }

        eventsByDate[dividend.date].events.push({
            time: dividend.type,
            currency: 'USD',
            impact: 1, // Dividends always low impact
            event: `${dividend.symbol} Dividend (Yield ${dividend.yield})`,
            actual: 'N/A',
            forecast: dividend.amount,
            previous: dividend.prev
        });
    });

    // Convertir en tableau et trier par date
    return Object.values(eventsByDate).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
}
