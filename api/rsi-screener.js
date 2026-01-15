/**
 * RSI SCREENER API ENDPOINT
 * Endpoint Vercel serverless pour le RSI Screener
 *
 * Usage:
 * GET /api/rsi-screener?type=both&markets=US,CA&limit=20
 *
 * Parametres:
 * - type: "oversold" | "overbought" | "both" (defaut: "both")
 * - markets: Liste de marches separes par virgules (defaut: "US")
 * - limit: Nombre max de resultats par categorie (defaut: 20)
 * - market_cap: "large" | "mid" | "all" (defaut: "large")
 */

import { screenByRSI } from './tools/rsi-screener.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Methode non autorisee',
            allowed: ['GET']
        });
    }

    try {
        // Parse query parameters
        const {
            type = 'both',
            markets = 'US',
            limit = '20',
            market_cap = 'large'
        } = req.query;

        // Validate type
        const validTypes = ['oversold', 'overbought', 'both'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Type invalide',
                valid_types: validTypes,
                received: type
            });
        }

        // Parse markets (comma-separated)
        const marketsList = markets.split(',').map(m => m.trim().toUpperCase());

        // Validate markets
        const validMarkets = ['US', 'CA', 'UK', 'FR', 'DE', 'EU'];
        const invalidMarkets = marketsList.filter(m => !validMarkets.includes(m));

        if (invalidMarkets.length > 0) {
            return res.status(400).json({
                error: 'Marches invalides',
                valid_markets: validMarkets,
                invalid_markets: invalidMarkets
            });
        }

        // Parse limit
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                error: 'Limite invalide (doit etre entre 1 et 100)',
                received: limit
            });
        }

        // Validate market_cap
        const validMarketCaps = ['large', 'mid', 'all'];
        if (!validMarketCaps.includes(market_cap)) {
            return res.status(400).json({
                error: 'market_cap invalide',
                valid_values: validMarketCaps,
                received: market_cap
            });
        }

        console.log(` [RSI Screener API] Type: ${type}, Markets: ${marketsList.join(',')}, Limit: ${limitNum}`);

        // Execute screener
        const result = await screenByRSI({
            type,
            markets: marketsList,
            limit: limitNum,
            market_cap
        });

        if (!result.success) {
            return res.status(500).json({
                error: 'Erreur lors du screening',
                details: result.error
            });
        }

        // Return results
        return res.status(200).json({
            success: true,
            ...result,
            api_info: {
                endpoint: '/api/rsi-screener',
                version: '1.0.0',
                documentation: 'Screening RSI multi-marches pour Emma IA'
            }
        });

    } catch (error) {
        console.error(' [RSI Screener API] Error:', error);
        return res.status(500).json({
            error: 'Erreur serveur',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
