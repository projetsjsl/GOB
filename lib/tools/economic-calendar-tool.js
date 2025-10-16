/**
 * Economic Calendar Tool
 * Calendrier économique et événements macro
 */

import BaseTool from './base-tool.js';

export default class EconomicCalendarTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Economic Calendar';
        this.description = 'Calendrier économique et événements macro';
    }

    async execute(params, context = {}) {
        try {
            const date = params.date || new Date().toISOString().split('T')[0];
            const apiKey = process.env.FMP_API_KEY;
            
            if (!apiKey) {
                throw new Error('FMP_API_KEY not configured');
            }

            const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${date}&to=${date}&apikey=${apiKey}`;
            
            const response = await this.makeApiCall(url);
            
            if (!response || response.length === 0) {
                return this.formatResult({
                    date: date,
                    events: [],
                    count: 0,
                    message: 'Aucun événement économique prévu pour cette date'
                }, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'economic_calendar'
                });
            }

            const formattedData = {
                date: date,
                events: response.map(event => ({
                    country: event.country,
                    event: event.event,
                    actual: event.actual,
                    estimate: event.estimate,
                    previous: event.previous,
                    impact: event.impact,
                    time: event.time,
                    currency: event.currency
                })),
                count: response.length,
                high_impact_events: response.filter(e => e.impact === 'High').length,
                medium_impact_events: response.filter(e => e.impact === 'Medium').length,
                low_impact_events: response.filter(e => e.impact === 'Low').length
            };

            return this.formatResult(formattedData, true, {
                source: 'financialmodelingprep.com',
                data_type: 'economic_calendar'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
