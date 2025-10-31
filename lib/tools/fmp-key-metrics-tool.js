/**
 * FMP Key Metrics Tool
 * Métriques clés d'entreprise via Financial Modeling Prep
 */

import BaseTool from './base-tool.js';

export default class FMPKeyMetricsTool extends BaseTool {
    constructor() {
        super();
        this.name = 'FMP Key Metrics';
        this.description = 'Métriques clés d\'entreprise (Revenue, Net Income, EPS, Free Cash Flow, Market Cap)';
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
                // Récupérer les métriques pour TOUS les tickers (limiter à 5)
                const tickersToFetch = allTickers.slice(0, 5);
                console.log(`📊 Fetching key metrics for ${tickersToFetch.length} tickers: ${tickersToFetch.join(', ')}`);

                const metricsPromises = tickersToFetch.map(async (ticker) => {
                    const url = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker.toUpperCase()}?apikey=${apiKey}`;
                    try {
                        const response = await this.makeApiCall(url);
                        if (!response || response.length === 0) {
                            return { ticker: ticker.toUpperCase(), data: null, error: 'No data found' };
                        }
                        const metrics = response[0];
                        return {
                            ticker: ticker.toUpperCase(),
                            data: {
                                market_cap: metrics.marketCapTTM,
                                revenue: metrics.revenuePerShareTTM,
                                net_income_per_share: metrics.netIncomePerShareTTM,
                                operating_cash_flow_per_share: metrics.operatingCashFlowPerShareTTM,
                                free_cash_flow_per_share: metrics.freeCashFlowPerShareTTM,
                                book_value_per_share: metrics.bookValuePerShareTTM,
                                tangible_book_value_per_share: metrics.tangibleBookValuePerShareTTM,
                                enterprise_value: metrics.enterpriseValueTTM,
                                ev_to_sales: metrics.evToSalesTTM,
                                ev_to_ebitda: metrics.evToOperatingCashFlowTTM,
                                earnings_yield: metrics.earningsYieldTTM,
                                free_cash_flow_yield: metrics.freeCashFlowYieldTTM,
                                debt_to_market_cap: metrics.debtToMarketCapTTM
                            }
                        };
                    } catch (error) {
                        console.error(`❌ Failed to fetch key metrics for ${ticker}:`, error.message);
                        return { ticker: ticker.toUpperCase(), data: null, error: error.message };
                    }
                });

                const metricsResults = await Promise.allSettled(metricsPromises);
                const allMetrics = metricsResults
                    .filter(r => r.status === 'fulfilled' && r.value.data !== null)
                    .map(r => r.value);

                if (allMetrics.length === 0) {
                    throw new Error('No key metrics data found for any ticker');
                }

                // Formatter les données agrégées
                const formattedData = {
                    tickers: allTickers,
                    tickers_with_data: allMetrics.map(m => m.ticker),
                    metrics_count: allMetrics.length,
                    metrics_by_ticker: allMetrics.reduce((acc, { ticker, data }) => {
                        acc[ticker] = data;
                        return acc;
                    }, {}),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'key_metrics_multi_ticker'
                });

            } else {
                // Logique originale pour un seul ticker
                const ticker = allTickers[0].toUpperCase();

                // Récupération des métriques clés TTM
                const url = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${apiKey}`;

                const response = await this.makeApiCall(url);

                if (!response || response.length === 0) {
                    throw new Error(`No key metrics data found for ticker: ${ticker}`);
                }

                const metrics = response[0];

                const formattedData = {
                    ticker: ticker,
                    market_cap: metrics.marketCapTTM,
                    revenue_per_share: metrics.revenuePerShareTTM,
                    net_income_per_share: metrics.netIncomePerShareTTM,
                    operating_cash_flow_per_share: metrics.operatingCashFlowPerShareTTM,
                    free_cash_flow_per_share: metrics.freeCashFlowPerShareTTM,
                    cash_per_share: metrics.cashPerShareTTM,
                    book_value_per_share: metrics.bookValuePerShareTTM,
                    tangible_book_value_per_share: metrics.tangibleBookValuePerShareTTM,
                    shareholders_equity_per_share: metrics.shareholdersEquityPerShareTTM,
                    interest_debt_per_share: metrics.interestDebtPerShareTTM,
                    enterprise_value: metrics.enterpriseValueTTM,
                    price_to_sales: metrics.priceToSalesRatioTTM,
                    pocf_ratio: metrics.pocfratioTTM,
                    pfcf_ratio: metrics.pfcfRatioTTM,
                    pb_ratio: metrics.pbRatioTTM,
                    ptb_ratio: metrics.ptbRatioTTM,
                    ev_to_sales: metrics.evToSalesTTM,
                    ev_to_operating_cash_flow: metrics.evToOperatingCashFlowTTM,
                    ev_to_free_cash_flow: metrics.evToFreeCashFlowTTM,
                    earnings_yield: metrics.earningsYieldTTM,
                    free_cash_flow_yield: metrics.freeCashFlowYieldTTM,
                    debt_to_equity: metrics.debtToEquityTTM,
                    debt_to_assets: metrics.debtToAssetsTTM,
                    net_debt_to_ebitda: metrics.netDebtToEBITDATTM,
                    current_ratio: metrics.currentRatioTTM,
                    interest_coverage: metrics.interestCoverageTTM,
                    income_quality: metrics.incomeQualityTTM,
                    dividend_yield: metrics.dividendYieldTTM,
                    payout_ratio: metrics.payoutRatioTTM,
                    sales_general_and_admin_to_revenue: metrics.salesGeneralAndAdministrativeToRevenueTTM,
                    research_and_development_to_revenue: metrics.researchAndDdevelopementToRevenueTTM,
                    intangibles_to_total_assets: metrics.intangiblesToTotalAssetsTTM,
                    capex_to_operating_cash_flow: metrics.capexToOperatingCashFlowTTM,
                    capex_to_revenue: metrics.capexToRevenueTTM,
                    capex_to_depreciation: metrics.capexToDepreciationTTM,
                    stock_based_compensation_to_revenue: metrics.stockBasedCompensationToRevenueTTM,
                    graham_number: metrics.grahamNumberTTM,
                    roic: metrics.roicTTM,
                    return_on_tangible_assets: metrics.returnOnTangibleAssetsTTM,
                    graham_net_net: metrics.grahamNetNetTTM,
                    working_capital: metrics.workingCapitalTTM,
                    tangible_asset_value: metrics.tangibleAssetValueTTM,
                    net_current_asset_value: metrics.netCurrentAssetValueTTM,
                    invested_capital: metrics.investedCapitalTTM,
                    average_receivables: metrics.averageReceivablesTTM,
                    average_payables: metrics.averagePayablesTTM,
                    average_inventory: metrics.averageInventoryTTM,
                    days_sales_outstanding: metrics.daysSalesOutstandingTTM,
                    days_payables_outstanding: metrics.daysPayablesOutstandingTTM,
                    days_of_inventory_on_hand: metrics.daysOfInventoryOnHandTTM,
                    receivables_turnover: metrics.receivablesTurnoverTTM,
                    payables_turnover: metrics.payablesTurnoverTTM,
                    inventory_turnover: metrics.inventoryTurnoverTTM,
                    roe: metrics.roeTTM,
                    capex_per_share: metrics.capexPerShareTTM
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'key_metrics_ttm'
                });
            }

        } catch (error) {
            return this.handleError(error);
        }
    }
}
