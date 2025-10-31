/**
 * FMP Stock Quote Tool
 * Prix et quotes en temps réel via Financial Modeling Prep
 */

import BaseTool from './base-tool.js';

export default class FMPQuoteTool extends BaseTool {
    constructor() {
        super();
        this.name = 'FMP Stock Quote';
        this.description = 'Prix et quotes en temps réel via FMP';
    }

    async execute(params, context = {}) {
        try {
            const apiKey = process.env.FMP_API_KEY;

            if (!apiKey) {
                throw new Error('FMP_API_KEY not configured');
            }

            // Gérer plusieurs tickers si all_tickers est fourni
            const allTickers = params.all_tickers || (params.ticker ? [params.ticker] : null);

            if (!allTickers || allTickers.length === 0) {
                throw new Error('No ticker provided');
            }

            // FMP permet de passer plusieurs tickers en une seule requête (séparés par virgules)
            const tickersString = allTickers.slice(0, 5).map(t => t.toUpperCase()).join(',');
            console.log(`📈 Fetching quotes for: ${tickersString}`);

            const url = `https://financialmodelingprep.com/api/v3/quote/${tickersString}?apikey=${apiKey}`;
            const response = await this.makeApiCall(url);

            if (!response || response.length === 0) {
                throw new Error(`No quote data found for tickers: ${tickersString}`);
            }

            // Si un seul ticker, retourner format simple
            if (allTickers.length === 1) {
                const quote = response[0];
                const formattedData = {
                    ticker: quote.symbol,
                    price: quote.price,
                    change: quote.change,
                    change_percent: quote.changesPercentage,
                    day_low: quote.dayLow,
                    day_high: quote.dayHigh,
                    year_low: quote.yearLow,
                    year_high: quote.yearHigh,
                    market_cap: quote.marketCap,
                    volume: quote.volume,
                    avg_volume: quote.avgVolume,
                    open: quote.open,
                    previous_close: quote.previousClose,
                    eps: quote.eps,
                    pe: quote.pe,
                    earnings_announcement: quote.earningsAnnouncement,
                    shares_outstanding: quote.sharesOutstanding,
                    timestamp: quote.timestamp
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'real_time_quote'
                });
            } else {
                // Plusieurs tickers - retourner format agrégé
                const quotes = response.map(quote => ({
                    ticker: quote.symbol,
                    price: quote.price,
                    change: quote.change,
                    change_percent: quote.changesPercentage,
                    day_low: quote.dayLow,
                    day_high: quote.dayHigh,
                    volume: quote.volume,
                    market_cap: quote.marketCap,
                    pe: quote.pe
                }));

                const formattedData = {
                    tickers: allTickers,
                    quotes_count: quotes.length,
                    quotes_by_ticker: quotes.reduce((acc, quote) => {
                        acc[quote.ticker] = quote;
                        return acc;
                    }, {}),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'real_time_quote_multi_ticker'
                });
            }

        } catch (error) {
            return this.handleError(error);
        }
    }
}
