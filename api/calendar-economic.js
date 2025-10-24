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

    // Cascade fallback: FMP → Alpha Vantage → Twelve Data → Static fallback
    let events = null;
    let source = 'fallback';
    let errors = [];

    // Try 1: FMP (Primary)
    try {
        console.log('🔄 [1/3] Trying FMP...');
        const FMP_API_KEY = process.env.FMP_API_KEY;
        const fmpUrl = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
        console.log(`FMP URL: ${fmpUrl.replace(FMP_API_KEY, 'KEY_HIDDEN')}`);

        if (FMP_API_KEY) {
            const response = await fetch(fmpUrl, { timeout: 5000 });
            console.log(`FMP Response Status: ${response.status}`);

            if (response.ok) {
                const fmpData = await response.json();
                console.log(`FMP Response: ${JSON.stringify(fmpData).substring(0, 200)}`);
                if (Array.isArray(fmpData) && fmpData.length > 0) {
                    events = parseFMPCalendar(fmpData);
                    source = 'fmp';
                    console.log(`✅ FMP: ${events.length} days of events`);
                } else {
                    throw new Error(`Empty or invalid response: ${JSON.stringify(fmpData).substring(0, 100)}`);
                }
            } else {
                const errorText = await response.text();
                console.error(`FMP Error Response: ${errorText.substring(0, 200)}`);
                throw new Error(`HTTP ${response.status}`);
            }
        } else {
            throw new Error('FMP_API_KEY not configured');
        }
    } catch (error) {
        errors.push(`FMP: ${error.message}`);
        console.error(`⚠️ FMP failed: ${error.message}`);
    }

    // Try 2: Alpha Vantage (Fallback)
    if (!events) {
        try {
            console.log('🔄 [2/3] Trying Alpha Vantage...');
            const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
            const avUrl = `https://www.alphavantage.co/query?function=ECONOMIC_CALENDAR&apikey=${ALPHA_VANTAGE_API_KEY}`;
            console.log(`AV Key configured: ${!!ALPHA_VANTAGE_API_KEY}`);

            if (ALPHA_VANTAGE_API_KEY) {
                const response = await fetch(avUrl, { timeout: 5000 });
                console.log(`AV Response Status: ${response.status}`);

                if (response.ok) {
                    const avData = await response.json();
                    console.log(`AV Response: ${JSON.stringify(avData).substring(0, 200)}`);
                    if (avData.data && Array.isArray(avData.data) && avData.data.length > 0) {
                        events = parseAlphaVantageCalendar(avData.data);
                        source = 'alpha_vantage';
                        console.log(`✅ Alpha Vantage: ${events.length} days of events`);
                    } else {
                        throw new Error(`Empty or invalid response: ${JSON.stringify(avData).substring(0, 100)}`);
                    }
                } else {
                    const errorText = await response.text();
                    console.error(`AV Error Response: ${errorText.substring(0, 200)}`);
                    throw new Error(`HTTP ${response.status}`);
                }
            } else {
                throw new Error('ALPHA_VANTAGE_API_KEY not configured');
            }
        } catch (error) {
            errors.push(`Alpha Vantage: ${error.message}`);
            console.error(`⚠️ Alpha Vantage failed: ${error.message}`);
        }
    }

    // Try 3: Twelve Data (Fallback)
    if (!events) {
        try {
            console.log('🔄 [3/3] Trying Twelve Data...');
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

function parseAlphaVantageCalendar(avData) {
    // Convert Alpha Vantage format to expected frontend format
    const eventsByDate = {};
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    avData.forEach(item => {
        const eventDate = new Date(item.date || item.time);

        // Only include events in next 7 days
        if (eventDate >= now && eventDate <= nextWeek) {
            const dateStr = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            // Map importance to impact level
            let impact = 2; // Medium default
            const importance = item.importance || item.impact;
            if (importance === 'High' || importance === '3' || importance === 'high') {
                impact = 3;
            } else if (importance === 'Low' || importance === '1' || importance === 'low') {
                impact = 1;
            }

            const time = eventDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

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
        }
    });

    return Object.values(eventsByDate).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
}

function getFallbackData() {
    // Updated fallback data - current week economic events
    const today = new Date();
    const nextDays = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        nextDays.push({
            date: dateStr,
            events: [
                {
                    time: '08:30 AM',
                    currency: 'USD',
                    impact: 2,
                    event: 'Economic Data Release',
                    actual: 'N/A',
                    forecast: 'N/A',
                    previous: 'N/A'
                }
            ]
        });
    }

    return nextDays;
}
