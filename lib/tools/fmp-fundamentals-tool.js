/**
 * FMP Fundamentals Tool
 * Données fondamentales via Financial Modeling Prep
 */

import BaseTool from './base-tool.js';

export default class FMPFundamentalsTool extends BaseTool {
    constructor() {
        super();
        this.name = 'FMP Fundamentals';
        this.description = 'Données fondamentales des entreprises via FMP';
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
                // Récupérer les fundamentals pour TOUS les tickers (limiter à 30 pour éviter trop d'appels API)
                const tickersToFetch = allTickers.slice(0, 30);
                console.log(`📊 Fetching fundamentals for ${tickersToFetch.length} tickers: ${tickersToFetch.join(', ')}`);

                const fundamentalsPromises = tickersToFetch.map(async (ticker) => {
                    const url = `https://financialmodelingprep.com/api/v3/profile/${ticker.toUpperCase()}?apikey=${apiKey}`;
                    try {
                        const response = await this.makeApiCall(url);
                        if (!response || response.length === 0) {
                            return { ticker: ticker.toUpperCase(), data: null, error: 'No data found' };
                        }
                        const company = response[0];
                        return {
                            ticker: ticker.toUpperCase(),
                            data: {
                                company_name: company.companyName,
                                sector: company.sector,
                                industry: company.industry,
                                market_cap: company.mktCap,
                                price: company.price,
                                beta: company.beta,
                                volume_avg: company.volAvg,
                                market_cap_formatted: company.mktCap ? this.formatMarketCap(company.mktCap) : null,
                                description: company.description,
                                website: company.website,
                                ceo: company.ceo,
                                employees: company.fullTimeEmployees,
                                city: company.city,
                                state: company.state,
                                country: company.country,
                                exchange: company.exchangeShortName
                            }
                        };
                    } catch (error) {
                        console.error(`❌ Failed to fetch fundamentals for ${ticker}:`, error.message);
                        return { ticker: ticker.toUpperCase(), data: null, error: error.message };
                    }
                });

                const fundamentalsResults = await Promise.allSettled(fundamentalsPromises);
                const allFundamentals = fundamentalsResults
                    .filter(r => r.status === 'fulfilled' && r.value.data !== null)
                    .map(r => r.value);

                if (allFundamentals.length === 0) {
                    throw new Error('No fundamental data found for any ticker');
                }

                // Formatter les données agrégées
                const formattedData = {
                    tickers: allTickers,
                    tickers_with_data: allFundamentals.map(f => f.ticker),
                    companies_count: allFundamentals.length,
                    fundamentals_by_ticker: allFundamentals.reduce((acc, { ticker, data }) => {
                        acc[ticker] = data;
                        return acc;
                    }, {}),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'company_profile_multi_ticker'
                });

            } else {
                // Logique originale pour un seul ticker
                const ticker = allTickers[0].toUpperCase();

                // Récupération du profil de l'entreprise
                const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${apiKey}`;

                const response = await this.makeApiCall(url);

                if (!response || response.length === 0) {
                    throw new Error(`No fundamental data found for ticker: ${ticker}`);
                }

                const company = response[0];

                const formattedData = {
                    ticker: ticker,
                    company_name: company.companyName,
                    sector: company.sector,
                    industry: company.industry,
                    market_cap: company.mktCap,
                    price: company.price,
                    beta: company.beta,
                    volume_avg: company.volAvg,
                    market_cap_formatted: company.mktCap ? this.formatMarketCap(company.mktCap) : null,
                    description: company.description,
                    website: company.website,
                    ceo: company.ceo,
                    employees: company.fullTimeEmployees,
                    city: company.city,
                    state: company.state,
                    country: company.country,
                    exchange: company.exchangeShortName,
                    is_etf: company.isEtf,
                    is_actively_trading: company.isActivelyTrading
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'company_profile'
                });
            }

        } catch (error) {
            return this.handleError(error);
        }
    }

    formatMarketCap(marketCap) {
        if (marketCap >= 1e12) {
            return `$${(marketCap / 1e12).toFixed(2)}T`;
        } else if (marketCap >= 1e9) {
            return `$${(marketCap / 1e9).toFixed(2)}B`;
        } else if (marketCap >= 1e6) {
            return `$${(marketCap / 1e6).toFixed(2)}M`;
        } else {
            return `$${marketCap.toLocaleString()}`;
        }
    }
}
