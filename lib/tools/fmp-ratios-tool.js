/**
 * FMP Financial Ratios Tool
 * Ratios financiers complets via Financial Modeling Prep
 */

import BaseTool from './base-tool.js';

export default class FMPRatiosTool extends BaseTool {
    constructor() {
        super();
        this.name = 'FMP Financial Ratios';
        this.description = 'Ratios financiers complets (P/E, P/B, ROE, ROA, Debt/Equity, Current Ratio)';
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

            if (allTickers.length > 1) {
                // Récupérer les ratios pour TOUS les tickers (limiter à 5)
                const tickersToFetch = allTickers.slice(0, 5);
                console.log(`📊 Fetching ratios for ${tickersToFetch.length} tickers: ${tickersToFetch.join(', ')}`);

                const ratiosPromises = tickersToFetch.map(async (ticker) => {
                    const url = `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker.toUpperCase()}?apikey=${apiKey}`;
                    try {
                        const response = await this.makeApiCall(url);
                        if (!response || response.length === 0) {
                            return { ticker: ticker.toUpperCase(), data: null, error: 'No data found' };
                        }
                        const ratios = response[0];
                        return {
                            ticker: ticker.toUpperCase(),
                            data: {
                                pe_ratio: ratios.peRatioTTM,
                                price_to_book: ratios.priceToBookRatioTTM,
                                price_to_sales: ratios.priceToSalesRatioTTM,
                                roe: ratios.returnOnEquityTTM,
                                roa: ratios.returnOnAssetsTTM,
                                debt_to_equity: ratios.debtEquityRatioTTM,
                                current_ratio: ratios.currentRatioTTM,
                                quick_ratio: ratios.quickRatioTTM,
                                gross_profit_margin: ratios.grossProfitMarginTTM,
                                operating_profit_margin: ratios.operatingProfitMarginTTM,
                                net_profit_margin: ratios.netProfitMarginTTM,
                                dividend_yield: ratios.dividendYieldTTM,
                                payout_ratio: ratios.payoutRatioTTM
                            }
                        };
                    } catch (error) {
                        console.error(`❌ Failed to fetch ratios for ${ticker}:`, error.message);
                        return { ticker: ticker.toUpperCase(), data: null, error: error.message };
                    }
                });

                const ratiosResults = await Promise.allSettled(ratiosPromises);
                const allRatios = ratiosResults
                    .filter(r => r.status === 'fulfilled' && r.value.data !== null)
                    .map(r => r.value);

                if (allRatios.length === 0) {
                    throw new Error('No ratio data found for any ticker');
                }

                // Formatter les données agrégées
                const formattedData = {
                    tickers: allTickers,
                    tickers_with_data: allRatios.map(r => r.ticker),
                    ratios_count: allRatios.length,
                    ratios_by_ticker: allRatios.reduce((acc, { ticker, data }) => {
                        acc[ticker] = data;
                        return acc;
                    }, {}),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'financial_ratios_multi_ticker'
                });

            } else {
                // Logique originale pour un seul ticker
                const ticker = allTickers[0].toUpperCase();

                // Récupération des ratios TTM (Trailing Twelve Months)
                const url = `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${apiKey}`;

                const response = await this.makeApiCall(url);

                if (!response || response.length === 0) {
                    throw new Error(`No ratio data found for ticker: ${ticker}`);
                }

                const ratios = response[0];

                const formattedData = {
                    ticker: ticker,
                    pe_ratio: ratios.peRatioTTM,
                    price_to_book: ratios.priceToBookRatioTTM,
                    price_to_sales: ratios.priceToSalesRatioTTM,
                    price_to_cash_flow: ratios.priceCashFlowRatioTTM,
                    roe: ratios.returnOnEquityTTM,
                    roa: ratios.returnOnAssetsTTM,
                    debt_to_equity: ratios.debtEquityRatioTTM,
                    debt_to_assets: ratios.debtRatioTTM,
                    current_ratio: ratios.currentRatioTTM,
                    quick_ratio: ratios.quickRatioTTM,
                    cash_ratio: ratios.cashRatioTTM,
                    gross_profit_margin: ratios.grossProfitMarginTTM,
                    operating_profit_margin: ratios.operatingProfitMarginTTM,
                    net_profit_margin: ratios.netProfitMarginTTM,
                    dividend_yield: ratios.dividendYieldTTM,
                    payout_ratio: ratios.payoutRatioTTM,
                    asset_turnover: ratios.assetTurnoverTTM,
                    inventory_turnover: ratios.inventoryTurnoverTTM
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'financial_ratios_ttm'
                });
            }

        } catch (error) {
            return this.handleError(error);
        }
    }
}
