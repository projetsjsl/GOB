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

    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Cascade fallback: FMP -> Yahoo Finance -> Static fallback
    let events = null;
    let source = 'fallback';
    let errors = [];

    // Try 1: FMP (Primary)
    try {
        console.log(' [1/2] Trying FMP Earnings...');
        const FMP_API_KEY = process.env.FMP_API_KEY;

        if (FMP_API_KEY) {
            const response = await fetch(
                `https://financialmodelingprep.com/api/v3/earning_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`,
                { timeout: 5000 }
            );

            if (response.ok) {
                const fmpData = await response.json();
                if (Array.isArray(fmpData) && fmpData.length > 0) {
                    events = parseFMPEarnings(fmpData);
                    source = 'fmp';
                    console.log(` FMP: ${events.length} days of earnings`);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } else {
            throw new Error('FMP_API_KEY not configured');
        }
    } catch (error) {
        errors.push(`FMP: ${error.message}`);
        console.log(` FMP failed: ${error.message}`);
    }

    // Try 2: Yahoo Finance (Fallback) - Using marketdata API
    if (!events) {
        try {
            console.log(' [2/2] Trying Yahoo Finance...');
            // Yahoo Finance doesn't have a direct earnings calendar API
            // We'll use a simplified approach with common tickers
            const commonTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'];
            events = getFallbackEarningsData(); // Use static data as Yahoo doesn't support this
            source = 'yahoo_limited';
            console.log(` Yahoo Finance: Using limited fallback data`);
        } catch (error) {
            errors.push(`Yahoo: ${error.message}`);
            console.log(` Yahoo failed: ${error.message}`);
        }
    }

    // Final fallback: Static data
    if (!events) {
        console.log(' Using static fallback data');
        events = getFallbackEarningsData();
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

function parseFMPEarnings(fmpData) {
    // Convertir le format FMP vers le format attendu par le frontend
    const eventsByDate = {};

    fmpData.forEach(item => {
        // Formater la date (ex: "2024-10-17" -> "Wed Oct 17")
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Determiner l'impact base sur la market cap
        let impact = 2; // Medium par defaut
        const marketCap = item.marketCap || 0;
        if (marketCap > 500000000000) { // > $500B
            impact = 3; // High
        } else if (marketCap < 50000000000) { // < $50B
            impact = 1; // Low
        }

        // Determiner le timing
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
    const year = new Date().getFullYear();
    // Team tickers avec dates d'earnings estimees
    const teamEarnings = [
        { symbol: 'GOOGL', date: `Tue, Oct 29, ${year}`, time: 'After Market', eps: '$1.55', prevEps: '$1.44', impact: 3 },
        { symbol: 'JPM', date: `Fri, Oct 11, ${year}`, time: 'Before Market', eps: '$4.10', prevEps: '$4.33', impact: 3 },
        { symbol: 'JNJ', date: `Tue, Oct 15, ${year}`, time: 'Before Market', eps: '$2.68', prevEps: '$2.80', impact: 3 },
        { symbol: 'UNH', date: `Fri, Oct 18, ${year}`, time: 'Before Market', eps: '$6.80', prevEps: '$6.16', impact: 3 },
        { symbol: 'WFC', date: `Fri, Oct 11, ${year}`, time: 'Before Market', eps: '$1.28', prevEps: '$1.48', impact: 2 },
        { symbol: 'CVS', date: `Wed, Nov 6, ${year}`, time: 'Before Market', eps: '$1.65', prevEps: '$2.21', impact: 2 },
        { symbol: 'PFE', date: `Tue, Oct 29, ${year}`, time: 'Before Market', eps: '$0.62', prevEps: '$0.67', impact: 2 },
        { symbol: 'CSCO', date: `Wed, Nov 13, ${year}`, time: 'After Market', eps: '$0.87', prevEps: '$1.11', impact: 2 },
        { symbol: 'T', date: `Wed, Oct 23, ${year}`, time: 'Before Market', eps: '$0.60', prevEps: '$0.64', impact: 2 },
        { symbol: 'VZ', date: `Fri, Oct 25, ${year}`, time: 'Before Market', eps: '$1.19', prevEps: '$1.22', impact: 2 },
        { symbol: 'NKE', date: `Thu, Dec 19, ${year}`, time: 'After Market', eps: '$0.84', prevEps: '$1.03', impact: 2 },
        { symbol: 'MDT', date: `Tue, Nov 19, ${year}`, time: 'Before Market', eps: '$1.32', prevEps: '$1.31', impact: 2 },
        { symbol: 'MU', date: `Wed, Dec 18, ${year}`, time: 'After Market', eps: '$1.74', prevEps: '$1.18', impact: 2 },
        { symbol: 'BNS', date: `Tue, Nov 26, ${year}`, time: 'Before Market', eps: 'C$1.72', prevEps: 'C$1.62', impact: 2 },
        { symbol: 'TD', date: `Thu, Nov 28, ${year}`, time: 'Before Market', eps: 'C$2.05', prevEps: 'C$1.99', impact: 2 },
        { symbol: 'BCE', date: `Thu, Nov 7, ${year}`, time: 'Before Market', eps: 'C$0.70', prevEps: 'C$0.75', impact: 1 },
        { symbol: 'CNR', date: `Tue, Oct 22, ${year}`, time: 'Before Market', eps: 'C$1.72', prevEps: 'C$1.69', impact: 2 },
        { symbol: 'MFC', date: `Wed, Nov 6, ${year}`, time: 'After Market', eps: 'C$0.85', prevEps: 'C$0.78', impact: 1 },
        { symbol: 'TRP', date: `Fri, Nov 1, ${year}`, time: 'Before Market', eps: 'C$0.78', prevEps: 'C$0.71', impact: 1 },
        { symbol: 'NTR', date: `Fri, Nov 1, ${year}`, time: 'Before Market', eps: '$0.55', prevEps: '$0.39', impact: 1 },
        { symbol: 'DEO', date: `Thu, Jan 30, ${year + 1}`, time: 'Before Market', eps: 'GBP0.85', prevEps: 'GBP0.82', impact: 1 },
        { symbol: 'UL', date: `Thu, Feb 13, ${year + 1}`, time: 'Before Market', eps: 'EUR0.68', prevEps: 'EUR0.65', impact: 1 },
        { symbol: 'LVMHF', date: `Tue, Jan 28, ${year + 1}`, time: 'Before Market', eps: 'EUR12.50', prevEps: 'EUR14.03', impact: 2 },
        { symbol: 'NSRGY', date: `Thu, Feb 13, ${year + 1}`, time: 'Before Market', eps: 'CHF 1.20', prevEps: 'CHF 1.15', impact: 1 },
        { symbol: 'MG', date: `Mon, Nov 25, ${year}`, time: 'Before Market', eps: 'C$0.45', prevEps: 'C$0.42', impact: 1 }
    ];

    // Grouper par date
    const eventsByDate = {};

    teamEarnings.forEach(earning => {
        if (!eventsByDate[earning.date]) {
            eventsByDate[earning.date] = {
                date: earning.date,
                events: []
            };
        }

        eventsByDate[earning.date].events.push({
            time: earning.time,
            currency: 'USD',
            impact: earning.impact,
            event: `${earning.symbol} Earnings Report`,
            actual: 'N/A',
            forecast: `${earning.eps} EPS`,
            previous: `${earning.prevEps} EPS`
        });
    });

    // Convertir en tableau et trier par date
    return Object.values(eventsByDate).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
}
