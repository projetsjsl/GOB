/**
 * Twelve Data Technical Tool
 * Indicateurs techniques via Twelve Data avec fallback FMP
 */

import BaseTool from './base-tool.js';

export default class TwelveDataTechnicalTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Twelve Data Technical';
        this.description = 'Indicateurs techniques via Twelve Data avec fallback FMP';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['ticker']);

            const ticker = params.ticker.toUpperCase();
            const indicator = (params.indicator || 'RSI').toUpperCase();
            const apiKey = process.env.TWELVE_DATA_API_KEY;

            if (!apiKey) {
                console.log('⚠️ [Twelve Data] API key not configured - trying FMP fallback');
                return await this._tryFmpFallback(ticker, indicator, context);
            }

            // ✅ FIX: Use correct indicator-specific endpoint
            const indicatorEndpoint = indicator.toLowerCase();
            const url = `https://api.twelvedata.com/${indicatorEndpoint}?symbol=${ticker}&interval=1day&outputsize=1&time_period=14&apikey=${apiKey}`;

            console.log(`📊 [Twelve Data] Fetching ${indicator} for ${ticker}...`);
            const response = await this.makeApiCall(url);

            // Check for API errors
            if (response.status === 'error' || response.code) {
                console.log(`⚠️ [Twelve Data] API error: ${response.message || response.code}`);

                // ✅ FIX: Try FMP fallback for technical indicators
                console.log(`🔄 [Twelve Data] Trying FMP fallback for ${ticker}...`);
                return await this._tryFmpFallback(ticker, indicator, context);
            }

            // Check for empty response
            if (!response.values || response.values.length === 0) {
                console.log(`⚠️ [Twelve Data] No data returned for ${ticker}`);
                return await this._tryFmpFallback(ticker, indicator, context);
            }

            const latestData = response.values[0];
            const value = latestData.value || latestData[indicatorEndpoint];

            if (!value) {
                console.log(`⚠️ [Twelve Data] No ${indicator} value in response`);
                return await this._tryFmpFallback(ticker, indicator, context);
            }

            console.log(`✅ [Twelve Data] ${indicator} for ${ticker}: ${value}`);

            const formattedData = {
                ticker: ticker,
                indicator: indicator,
                value: parseFloat(value),
                datetime: latestData.datetime,
                interpretation: this.interpretIndicator(indicator, parseFloat(value)),
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

            // ✅ FIX: Try FMP fallback on exception
            try {
                return await this._tryFmpFallback(params.ticker, params.indicator || 'RSI', context);
            } catch (fallbackError) {
                return this.handleError(error);
            }
        }
    }

    /**
     * ✅ NEW: FMP fallback for technical indicators
     */
    async _tryFmpFallback(ticker, indicator, context) {
        try {
            const baseUrl = process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'https://gob.vercel.app';

            // FMP technical indicators endpoint
            const indicatorType = indicator.toLowerCase();
            const url = `${baseUrl}/api/fmp?endpoint=technical_indicator&symbol=${ticker}&type=${indicatorType}&period=14&interval=daily`;

            console.log(`🔄 [FMP Fallback] Fetching ${indicator} for ${ticker}...`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`FMP API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('No FMP data available');
            }

            const latestData = data[0];
            const value = latestData[indicatorType] || latestData.value;

            if (!value) {
                throw new Error(`No ${indicator} value in FMP response`);
            }

            console.log(`✅ [FMP Fallback] ${indicator} for ${ticker}: ${value}`);

            const formattedData = {
                ticker: ticker,
                indicator: indicator,
                value: parseFloat(value),
                datetime: latestData.date,
                interpretation: this.interpretIndicator(indicator, parseFloat(value)),
                metadata: {
                    interval: 'daily',
                    source: 'fmp (fallback)',
                    note: 'Twelve Data unavailable, using FMP'
                }
            };

            return this.formatResult(formattedData, true, {
                source: 'financialmodelingprep.com',
                data_type: 'technical_indicator'
            });

        } catch (error) {
            console.log(`❌ [FMP Fallback] Failed: ${error.message}`);

            // Final fallback: return graceful error with helpful message
            return this.formatResult({
                ticker: ticker,
                indicator: indicator,
                error: 'Technical data temporarily unavailable',
                note: `Impossible d'obtenir ${indicator} pour ${ticker}. Les deux sources (Twelve Data et FMP) sont indisponibles. Vérifiez le ticker ou réessayez plus tard.`,
                attempted_sources: ['twelvedata.com', 'financialmodelingprep.com']
            }, false, {
                source: 'multiple',
                data_type: 'technical_indicator'
            });
        }
    }

    interpretIndicator(indicator, value) {
        if (!value) return 'Données non disponibles';

        switch (indicator.toUpperCase()) {
            case 'RSI':
                if (value > 70) return 'Surachat (potentiel signal de vente)';
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
