/**
 * Twelve Data Technical Tool
 * Indicateurs techniques via Twelve Data
 */

import BaseTool from './base-tool.js';

export default class TwelveDataTechnicalTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Twelve Data Technical';
        this.description = 'Indicateurs techniques via Twelve Data';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['ticker']);

            const ticker = params.ticker.toUpperCase();
            const indicator = params.indicator || 'RSI';
            const apiKey = process.env.TWELVE_DATA_API_KEY;

            if (!apiKey) {
                console.log('⚠️ [Twelve Data] API key not configured - skipping technical indicators');
                return this.formatResult({
                    ticker: ticker,
                    indicator: indicator,
                    error: 'API key not configured',
                    note: 'Technical analysis skipped - configure TWELVE_DATA_API_KEY to enable'
                }, false, {
                    source: 'twelvedata.com',
                    data_type: 'technical_indicator'
                });
            }

            const url = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&outputsize=1&apikey=${apiKey}`;

            const response = await this.makeApiCall(url);

            // Vérifier si erreur API (quota dépassé, ticker invalide, etc.)
            if (response.status === 'error' || response.code) {
                console.log(`⚠️ [Twelve Data] API error: ${response.message || response.code}`);
                return this.formatResult({
                    ticker: ticker,
                    indicator: indicator,
                    error: response.message || 'API error',
                    note: 'Technical analysis temporarily unavailable'
                }, false, {
                    source: 'twelvedata.com',
                    data_type: 'technical_indicator'
                });
            }

            if (!response.values || response.values.length === 0) {
                console.log(`⚠️ [Twelve Data] No data returned for ticker: ${ticker}`);
                return this.formatResult({
                    ticker: ticker,
                    indicator: indicator,
                    error: 'No data available',
                    note: 'Technical data not available for this ticker'
                }, false, {
                    source: 'twelvedata.com',
                    data_type: 'technical_indicator'
                });
            }

            const latestData = response.values[0];

            const formattedData = {
                ticker: ticker,
                indicator: indicator,
                value: latestData[indicator.toLowerCase()],
                datetime: latestData.datetime,
                interpretation: this.interpretIndicator(indicator, latestData[indicator.toLowerCase()]),
                metadata: {
                    interval: '1day',
                    source: 'twelvedata.com'
                }
            };

            return this.formatResult(formattedData, true, {
                source: 'twelvedata.com',
                data_type: 'technical_indicator'
            });

        } catch (error) {
            console.log(`⚠️ [Twelve Data] Tool execution failed: ${error.message}`);
            return this.handleError(error);
        }
    }

    interpretIndicator(indicator, value) {
        if (!value) return 'Données non disponibles';
        
        switch (indicator.toUpperCase()) {
            case 'RSI':
                if (value > 70) return 'Survente (potentiel signal de vente)';
                if (value < 30) return 'Survente (potentiel signal d\'achat)';
                return 'Neutre';
            case 'MACD':
                return value > 0 ? 'Signal haussier' : 'Signal baissier';
            case 'SMA':
            case 'EMA':
                return 'Moyenne mobile';
            default:
                return 'Indicateur technique';
        }
    }
}
