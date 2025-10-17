/**
 * API Vercel pour le Calendrier Économique Finviz
 * Endpoint: /api/calendar-economic
 */

import { NextResponse } from 'next/server';

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
        console.log('🔄 Récupération du calendrier économique depuis FMP...');

        const FMP_API_KEY = process.env.FMP_API_KEY;
        if (!FMP_API_KEY) {
            throw new Error('FMP_API_KEY non configurée');
        }

        // Récupérer les événements économiques des 7 prochains jours depuis FMP
        const from = new Date().toISOString().split('T')[0];
        const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await fetch(
            `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP FMP: ${response.status}`);
        }

        const fmpData = await response.json();
        console.log('✅ Données FMP récupérées');

        // Convertir le format FMP vers le format attendu
        const events = parseFMPCalendar(fmpData);

        console.log(`📊 ${events.length} jours d'événements trouvés`);

        return res.status(200).json({
            success: true,
            data: events,
            source: 'fmp',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
        
        // Données de fallback en cas d'erreur
        const fallbackData = getFallbackData();
        
        return res.status(200).json({
            success: true,
            data: fallbackData,
            source: 'fallback',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
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
