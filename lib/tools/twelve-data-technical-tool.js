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
                throw new Error('TWELVE_DATA_API_KEY not configured');
            }

            const url = `https://api.twelvedata.com/technical_indicators?symbol=${ticker}&interval=1day&indicator=${indicator}&apikey=${apiKey}`;
            
            const response = await this.makeApiCall(url);
            
            if (!response.values || response.values.length === 0) {
                throw new Error(`No technical data found for ticker: ${ticker}`);
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
