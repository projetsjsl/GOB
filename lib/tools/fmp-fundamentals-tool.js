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
                // Récupérer les fundamentals pour TOUS les tickers (limiter à 5 pour éviter trop d'appels API)
                const tickersToFetch = allTickers.slice(0, 5);
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

                // Detect product type
                const productType = this._detectProductType(company, ticker);

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
                    is_actively_trading: company.isActivelyTrading,
                    product_type: productType.type,
                    product_category: productType.category,
                    analysis_framework: productType.framework
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

    /**
     * Detect product type based on ticker and company data
     * Returns: { type, category, framework }
     */
    _detectProductType(company, ticker) {
        // ETF detection
        if (company.isEtf === true) {
            return {
                type: 'ETF',
                category: 'Fund',
                framework: 'etf_analysis'
            };
        }

        // Mutual fund detection (based on ticker patterns and company name)
        const tickerUpper = ticker.toUpperCase();
        const nameUpper = (company.companyName || '').toUpperCase();

        // Common mutual fund ticker patterns
        const mutualFundPatterns = [
            /X$/,           // Many mutual funds end with X
            /XX$/,          // e.g., AMAXX, VFIAX
            /IX$/,          // Institutional class
            /AX$/,          // A class shares
            /CX$/,          // C class shares
            /FUND/,         // Name contains "FUND"
            /MUTUAL/        // Name contains "MUTUAL"
        ];

        const isMutualFund = mutualFundPatterns.some(pattern => {
            return pattern.test(tickerUpper) || pattern.test(nameUpper);
        });

        if (isMutualFund || nameUpper.includes('FUND')) {
            return {
                type: 'Mutual Fund',
                category: 'Fund',
                framework: 'fund_analysis'
            };
        }

        // Bond/Fixed Income detection
        if (nameUpper.includes('BOND') || nameUpper.includes('TREASURY') ||
            nameUpper.includes('NOTE') || nameUpper.includes('DEBT')) {
            return {
                type: 'Bond/Fixed Income',
                category: 'Fixed Income',
                framework: 'bond_analysis'
            };
        }

        // Preferred Stock detection
        if (tickerUpper.includes('-P') || nameUpper.includes('PREFERRED')) {
            return {
                type: 'Preferred Stock',
                category: 'Equity',
                framework: 'preferred_stock_analysis'
            };
        }

        // REIT detection
        if (company.industry === 'REIT' || nameUpper.includes('REIT') ||
            nameUpper.includes('REAL ESTATE INVESTMENT')) {
            return {
                type: 'REIT',
                category: 'Real Estate',
                framework: 'reit_analysis'
            };
        }

        // ADR detection (American Depositary Receipt)
        if (tickerUpper.endsWith('ADR') || nameUpper.includes('ADR') ||
            nameUpper.includes('DEPOSITARY')) {
            return {
                type: 'ADR',
                category: 'Equity',
                framework: 'stock_analysis'
            };
        }

        // Default: Common Stock
        return {
            type: 'Common Stock',
            category: 'Equity',
            framework: 'stock_analysis'
        };
    }
}
