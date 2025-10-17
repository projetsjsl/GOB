/**
 * API Vercel pour le Calendrier Économique Finviz
 * Endpoint: /api/calendar-economic
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

    // Cascade fallback: FMP → Twelve Data → Static fallback
    let events = null;
    let source = 'fallback';
    let errors = [];

    // Try 1: FMP (Primary)
    try {
        console.log('🔄 [1/2] Trying FMP...');
        const FMP_API_KEY = process.env.FMP_API_KEY;

        if (FMP_API_KEY) {
            const response = await fetch(
                `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`,
                { timeout: 5000 }
            );

            if (response.ok) {
                const fmpData = await response.json();
                if (Array.isArray(fmpData) && fmpData.length > 0) {
                    events = parseFMPCalendar(fmpData);
                    source = 'fmp';
                    console.log(`✅ FMP: ${events.length} days of events`);
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

    // Try 2: Twelve Data (Fallback)
    if (!events) {
        try {
            console.log('🔄 [2/2] Trying Twelve Data...');
            const TWELVE_API_KEY = process.env.TWELVE_DATA_API_KEY;

            if (TWELVE_API_KEY) {
                const response = await fetch(
                    `https://api.twelvedata.com/economic_calendar?apikey=${TWELVE_API_KEY}`,
                    { timeout: 5000 }
                );

                if (response.ok) {
                    const twelveData = await response.json();
                    if (twelveData.data && Array.isArray(twelveData.data)) {
                        events = parseTwelveDataCalendar(twelveData.data);
                        source = 'twelve_data';
                        console.log(`✅ Twelve Data: ${events.length} days of events`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } else {
                throw new Error('TWELVE_DATA_API_KEY not configured');
            }
        } catch (error) {
            errors.push(`Twelve Data: ${error.message}`);
            console.log(`⚠️ Twelve Data failed: ${error.message}`);
        }
    }

    // Final fallback: Static data
    if (!events) {
        console.log('📦 Using static fallback data');
        events = getFallbackData();
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

function parseFMPCalendar(fmpData) {
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

        // Déterminer l'impact basé sur le nom de l'événement
        let impact = 2; // Medium par défaut
        const eventLower = item.event.toLowerCase();
        if (eventLower.includes('fed') || eventLower.includes('cpi') ||
            eventLower.includes('nfp') || eventLower.includes('gdp') ||
            eventLower.includes('interest rate') || eventLower.includes('unemployment')) {
            impact = 3; // High
        } else if (eventLower.includes('speech') || eventLower.includes('minutes')) {
            impact = 1; // Low
        }

        // Formater l'heure
        const time = item.date ? new Date(item.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) : 'TBD';

        const event = {
            time,
            currency: item.currency || 'USD',
            impact,
            event: item.event,
            actual: item.actual || 'N/A',
            forecast: item.estimate || item.forecast || 'N/A',
            previous: item.previous || 'N/A'
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

function parseTwelveDataCalendar(twelveData) {
    // Convert Twelve Data format to expected frontend format
    const eventsByDate = {};

    twelveData.forEach(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Map importance to impact level
        let impact = 2; // Medium default
        if (item.importance === 'high' || item.importance === '3') {
            impact = 3;
        } else if (item.importance === 'low' || item.importance === '1') {
            impact = 1;
        }

        const time = item.time || 'TBD';

        const event = {
            time,
            currency: item.currency || 'USD',
            impact,
            event: item.event || item.name,
            actual: item.actual || 'N/A',
            forecast: item.forecast || item.estimate || 'N/A',
            previous: item.previous || 'N/A'
        };

        if (!eventsByDate[dateStr]) {
            eventsByDate[dateStr] = {
                date: dateStr,
                events: []
            };
        }

        eventsByDate[dateStr].events.push(event);
    });

    return Object.values(eventsByDate).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
}

function getFallbackData() {
    return [
        {
            date: 'Mon Oct 16',
            events: [
                {
                    time: '08:30 AM',
                    currency: 'USD',
                    impact: 3,
                    event: 'NY Empire State Manufacturing Index',
                    actual: '10.70',
                    forecast: '-1.00',
                    previous: '-8.70'
                },
                {
                    time: '08:30 AM',
                    currency: 'USD',
                    impact: 3,
                    event: 'Inflation Rate MoM',
                    actual: 'N/A',
                    forecast: '0.3%',
                    previous: '0.4%'
                },
                {
                    time: '12:55 PM',
                    currency: 'USD',
                    impact: 1,
                    event: 'Fed Paulson Speech',
                    actual: 'N/A',
                    forecast: 'N/A',
                    previous: 'N/A'
                }
            ]
        }
    ];
}
