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
        console.log('🔄 Récupération du calendrier économique depuis Finviz...');
        
        // Headers pour éviter d'être bloqué
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };

        // Récupérer les données depuis Finviz
        const response = await fetch('https://finviz.com/calendar.ashx', {
            headers,
            timeout: 30000
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const htmlContent = await response.text();
        console.log('✅ Données Finviz récupérées');

        // Parser le HTML pour extraire les événements
        const events = parseFinvizCalendar(htmlContent);
        
        console.log(`📊 ${events.length} jours d'événements trouvés`);

        return res.status(200).json({
            success: true,
            data: events,
            source: 'finviz.com',
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

function parseFinvizCalendar(htmlContent) {
    // Parser simple pour extraire les événements du calendrier Finviz
    const events = [];
    
    // Rechercher les lignes avec des heures
    const timePattern = /(\d{1,2}:\d{2}\s+(AM|PM))/g;
    const lines = htmlContent.split('\n');
    
    let currentDate = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Détecter les lignes de date
        if (line.match(/[A-Za-z]{3}\s+\d{1,2}/)) {
            currentDate = line.trim();
            continue;
        }
        
        // Détecter les événements avec heures
        const timeMatch = line.match(timePattern);
        if (timeMatch && currentDate) {
            const time = timeMatch[0];
            
            // Extraire le nom de l'événement (simplifié)
            const eventMatch = line.match(/>\s*\d{1,2}:\d{2}\s+(AM|PM)\s+(.+?)(?:\s+\d|$)/);
            if (eventMatch) {
                const eventName = eventMatch[2].trim();
                
                // Éviter les doublons et lignes de navigation
                if (!eventName.includes('Release') && !eventName.includes('Home')) {
                    // Déterminer la devise
                    let currency = 'USD';
                    if (eventName.includes('Eurozone') || eventName.includes('ECB')) {
                        currency = 'EUR';
                    } else if (eventName.includes('Bank of England') || eventName.includes('BoE')) {
                        currency = 'GBP';
                    }
                    
                    // Déterminer l'impact
                    let impact = 2; // Medium par défaut
                    if (eventName.includes('Fed') || eventName.includes('CPI') || eventName.includes('NFP')) {
                        impact = 3; // High
                    }
                    
                    // Ajouter l'événement
                    const existingDay = events.find(day => day.date === currentDate);
                    if (existingDay) {
                        existingDay.events.push({
                            time,
                            currency,
                            impact,
                            event: eventName,
                            actual: 'N/A',
                            forecast: 'N/A',
                            previous: 'N/A'
                        });
                    } else {
                        events.push({
                            date: currentDate,
                            events: [{
                                time,
                                currency,
                                impact,
                                event: eventName,
                                actual: 'N/A',
                                forecast: 'N/A',
                                previous: 'N/A'
                            }]
                        });
                    }
                }
            }
        }
    }
    
    return events;
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
