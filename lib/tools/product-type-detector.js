/**
 * Product Type Detector - Multi-Source Strategy
 *
 * Uses multiple reliable data sources to detect asset type:
 * 1. FMP ETF-specific endpoint (most reliable for ETFs)
 * 2. Yahoo Finance quoteType field (most reliable for all types)
 * 3. FMP profile data (fallback)
 *
 * This replaces unreliable ticker pattern matching.
 */

import BaseTool from './base-tool.js';

export default class ProductTypeDetector extends BaseTool {
    constructor() {
        super();
        this.name = 'Product Type Detector';
        this.description = 'Multi-source product type detection (ETF, Mutual Fund, Stock, REIT, etc.)';
    }

    async execute(params, context = {}) {
        try {
            const ticker = params.ticker?.toUpperCase();

            if (!ticker) {
                throw new Error('No ticker provided');
            }

            // Strategy 1: Try FMP ETF endpoint (very reliable for ETFs)
            const etfResult = await this._tryFmpEtfEndpoint(ticker);
            if (etfResult) {
                return this.formatResult(etfResult, true, {
                    source: 'fmp_etf_endpoint',
                    data_type: 'product_type',
                    confidence: 'high'
                });
            }

            // Strategy 2: Try Yahoo Finance quoteType (most comprehensive)
            const yahooResult = await this._tryYahooQuoteType(ticker);
            if (yahooResult) {
                return this.formatResult(yahooResult, true, {
                    source: 'yahoo_finance_quotetype',
                    data_type: 'product_type',
                    confidence: 'high'
                });
            }

            // Strategy 3: Fallback to basic detection
            return this.formatResult({
                ticker: ticker,
                product_type: 'Unknown',
                category: 'Unknown',
                framework: 'stock_analysis',  // Default fallback
                message: 'Unable to determine product type from available sources. Using default stock analysis framework.'
            }, true, {
                source: 'fallback',
                data_type: 'product_type',
                confidence: 'low'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Strategy 1: FMP ETF Information Endpoint
     * Endpoint: https://financialmodelingprep.com/api/v3/etf-info/{symbol}?apikey=
     * Returns: Expense ratio, AUM, holdings, etc. (only for ETFs)
     */
    async _tryFmpEtfEndpoint(ticker) {
        const apiKey = process.env.FMP_API_KEY;
        if (!apiKey) return null;

        try {
            const url = `https://financialmodelingprep.com/api/v3/etf-info/${ticker}?apikey=${apiKey}`;
            const response = await this.makeApiCall(url);

            if (response && Array.isArray(response) && response.length > 0) {
                const etfData = response[0];

                return {
                    ticker: ticker,
                    product_type: 'ETF',
                    category: 'Fund',
                    framework: 'etf_analysis',
                    confidence: 'high',
                    metadata: {
                        expense_ratio: etfData.expenseRatio || null,
                        aum: etfData.aum || null,
                        avg_volume: etfData.avgVolume || null,
                        name: etfData.name || ticker
                    }
                };
            }

            return null;
        } catch (error) {
            console.warn(`FMP ETF endpoint failed for ${ticker}:`, error.message);
            return null;
        }
    }

    /**
     * Strategy 2: Yahoo Finance Quote API with quoteType field
     * Endpoint: https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbol}
     * Returns: quoteType field (EQUITY, ETF, MUTUALFUND, etc.)
     */
    async _tryYahooQuoteType(ticker) {
        try {
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;

            // Yahoo Finance requires proper headers to avoid 403
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`Yahoo Finance returned ${response.status} for ${ticker}`);
                return null;
            }

            const data = await response.json();

            if (!data || !data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
                return null;
            }

            const quote = data.quoteResponse.result[0];
            const quoteType = quote.quoteType;

            // Map Yahoo quoteType to our system
            const typeMapping = {
                'EQUITY': { type: 'Common Stock', category: 'Equity', framework: 'stock_analysis' },
                'ETF': { type: 'ETF', category: 'Fund', framework: 'etf_analysis' },
                'MUTUALFUND': { type: 'Mutual Fund', category: 'Fund', framework: 'fund_analysis' },
                'INDEX': { type: 'Index', category: 'Index', framework: 'index_analysis' },
                'OPTION': { type: 'Option', category: 'Derivative', framework: 'option_analysis' },
                'FUTURE': { type: 'Future', category: 'Derivative', framework: 'future_analysis' },
                'CURRENCY': { type: 'Currency/Forex', category: 'Forex', framework: 'forex_analysis' },
                'CRYPTOCURRENCY': { type: 'Cryptocurrency', category: 'Crypto', framework: 'crypto_analysis' }
            };

            const mapping = typeMapping[quoteType] || {
                type: quoteType || 'Unknown',
                category: 'Unknown',
                framework: 'stock_analysis'
            };

            return {
                ticker: ticker,
                product_type: mapping.type,
                category: mapping.category,
                framework: mapping.framework,
                confidence: 'high',
                metadata: {
                    quote_type: quoteType,
                    name: quote.longName || quote.shortName || ticker,
                    exchange: quote.exchange || null,
                    market_cap: quote.marketCap || null
                }
            };

        } catch (error) {
            console.warn(`Yahoo Finance quoteType failed for ${ticker}:`, error.message);
            return null;
        }
    }
}
