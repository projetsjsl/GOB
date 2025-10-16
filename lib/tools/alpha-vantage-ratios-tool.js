/**
 * Alpha Vantage Ratios Tool
 * Ratios financiers via Alpha Vantage
 */

import BaseTool from './base-tool.js';

export default class AlphaVantageRatiosTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Alpha Vantage Ratios';
        this.description = 'Ratios financiers via Alpha Vantage';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['ticker']);
            
            const ticker = params.ticker.toUpperCase();
            const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
            
            if (!apiKey) {
                throw new Error('ALPHA_VANTAGE_API_KEY not configured');
            }

            // Récupération des ratios financiers
            const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
            
            const response = await this.makeApiCall(url);
            
            if (!response || response['Error Message']) {
                throw new Error(`No ratio data found for ticker: ${ticker}`);
            }

            const formattedData = {
                ticker: ticker,
                ratios: {
                    pe_ratio: response.PERatio,
                    peg_ratio: response.PEGRatio,
                    price_to_book: response.PriceToBookRatio,
                    price_to_sales: response.PriceToSalesRatioTTM,
                    price_to_cash_flow: response.PriceToCashFlowRatio,
                    ev_to_revenue: response.EVToRevenue,
                    ev_to_ebitda: response.EVToEBITDA,
                    return_on_equity: response.ReturnOnEquityTTM,
                    return_on_assets: response.ReturnOnAssetsTTM,
                    profit_margin: response.ProfitMargin,
                    operating_margin: response.OperatingMarginTTM,
                    gross_profit_margin: response.GrossProfitTTM,
                    debt_to_equity: response.DebtToEquity,
                    current_ratio: response.CurrentRatio,
                    quick_ratio: response.QuickRatio,
                    dividend_yield: response.DividendYield,
                    dividend_per_share: response.DividendPerShare,
                    payout_ratio: response.PayoutRatio
                },
                company_info: {
                    name: response.Name,
                    sector: response.Sector,
                    industry: response.Industry,
                    market_cap: response.MarketCapitalization,
                    beta: response.Beta,
                    eps: response.EPS,
                    revenue_ttm: response.RevenueTTM,
                    gross_profit_ttm: response.GrossProfitTTM,
                    quarterly_earnings_growth: response.QuarterlyEarningsGrowthYOY,
                    quarterly_revenue_growth: response.QuarterlyRevenueGrowthYOY,
                    analyst_target_price: response.AnalystTargetPrice,
                    fifty_two_week_high: response['52WeekHigh'],
                    fifty_two_week_low: response['52WeekLow']
                }
            };

            return this.formatResult(formattedData, true, {
                source: 'alphavantage.co',
                data_type: 'financial_ratios'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
