/**
 * Polygon Stock Price Tool
 * Récupère les prix en temps réel via Polygon.io
 */

import BaseTool from './base-tool.js';

export default class PolygonStockPriceTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Polygon Stock Price';
        this.description = 'Prix en temps réel des actions via Polygon.io';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['ticker']);
            
            const ticker = params.ticker.toUpperCase();
            const apiKey = process.env.POLYGON_API_KEY;
            
            if (!apiKey) {
                throw new Error('POLYGON_API_KEY not configured');
            }

            // Récupération du prix précédent (plus fiable que real-time pour le plan gratuit)
            const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apikey=${apiKey}`;
            
            const response = await this.makeApiCall(url);
            
            if (!response.results || response.results.length === 0) {
                throw new Error(`No data found for ticker: ${ticker}`);
            }

            const result = response.results[0];
            
            const formattedData = {
                ticker: ticker,
                price: result.c,
                open: result.o,
                high: result.h,
                low: result.l,
                volume: result.v,
                previous_close: result.c,
                change: result.c - result.o,
                change_percent: ((result.c - result.o) / result.o * 100).toFixed(2),
                timestamp: new Date(result.t).toISOString(),
                market_status: 'closed' // Polygon prev data is always previous day
            };

            return this.formatResult(formattedData, true, {
                source: 'polygon.io',
                data_type: 'previous_close'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
