/**
 * Earnings Calendar Tool
 * Calendrier des résultats d'entreprises
 */

import BaseTool from './base-tool.js';

export default class EarningsCalendarTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Earnings Calendar';
        this.description = 'Calendrier des résultats d\'entreprises';
    }

    async execute(params, context = {}) {
        try {
            const date = params.date || new Date().toISOString().split('T')[0];
            const apiKey = process.env.FMP_API_KEY;
            
            if (!apiKey) {
                throw new Error('FMP_API_KEY not configured');
            }

            const url = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${date}&to=${date}&apikey=${apiKey}`;
            
            const response = await this.makeApiCall(url);
            
            if (!response || response.length === 0) {
                return this.formatResult({
                    date: date,
                    earnings: [],
                    count: 0,
                    message: 'Aucun résultat d\'entreprise prévu pour cette date'
                }, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'earnings_calendar'
                });
            }

            const formattedData = {
                date: date,
                earnings: response.map(earning => ({
                    symbol: earning.symbol,
                    name: earning.name,
                    eps_estimate: earning.epsEstimate,
                    eps_actual: earning.epsActual,
                    revenue_estimate: earning.revenueEstimate,
                    revenue_actual: earning.revenueActual,
                    time: earning.time,
                    exchange: earning.exchange
                })),
                count: response.length,
                before_market: response.filter(e => e.time === 'Before Market Open').length,
                after_market: response.filter(e => e.time === 'After Market Close').length,
                during_market: response.filter(e => e.time === 'During Market Hours').length
            };

            return this.formatResult(formattedData, true, {
                source: 'financialmodelingprep.com',
                data_type: 'earnings_calendar'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
