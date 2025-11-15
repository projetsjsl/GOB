/**
 * Yahoo Quote Type Tool
 * Détecte le type de produit financier via Yahoo Finance quoteType
 */

import BaseTool from './base-tool.js';

export default class YahooQuoteTypeTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Yahoo Quote Type';
        this.description = 'Détecte le type de produit financier (ETF, Mutual Fund, Stock, etc.) via Yahoo Finance';
    }

    async execute(params, context = {}) {
        try {
            const ticker = params.ticker?.toUpperCase();

            if (!ticker) {
                throw new Error('No ticker provided');
            }

            // Yahoo Finance Quote API (v7 - no API key required)
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;

            const response = await this.makeApiCall(url);

            if (!response || !response.quoteResponse || !response.quoteResponse.result || response.quoteResponse.result.length === 0) {
                throw new Error(`No data found for ticker: ${ticker}`);
            }

            const quote = response.quoteResponse.result[0];

            // Map Yahoo quoteType to our product types
            const productTypeMapping = {
                'EQUITY': 'Common Stock',
                'ETF': 'ETF',
                'MUTUALFUND': 'Mutual Fund',
                'INDEX': 'Index',
                'OPTION': 'Option',
                'FUTURE': 'Future',
                'CURRENCY': 'Currency/Forex',
                'CRYPTOCURRENCY': 'Cryptocurrency'
            };

            const quoteType = quote.quoteType || 'UNKNOWN';
            const productType = productTypeMapping[quoteType] || quoteType;

            // Determine category and framework
            let category, framework;

            switch (quoteType) {
                case 'ETF':
                    category = 'Fund';
                    framework = 'etf_analysis';
                    break;
                case 'MUTUALFUND':
                    category = 'Fund';
                    framework = 'fund_analysis';
                    break;
                case 'EQUITY':
                    category = 'Equity';
                    framework = 'stock_analysis';
                    break;
                case 'INDEX':
                    category = 'Index';
                    framework = 'index_analysis';
                    break;
                case 'OPTION':
                    category = 'Derivative';
                    framework = 'option_analysis';
                    break;
                case 'FUTURE':
                    category = 'Derivative';
                    framework = 'future_analysis';
                    break;
                case 'CURRENCY':
                    category = 'Forex';
                    framework = 'forex_analysis';
                    break;
                case 'CRYPTOCURRENCY':
                    category = 'Crypto';
                    framework = 'crypto_analysis';
                    break;
                default:
                    category = 'Unknown';
                    framework = 'stock_analysis'; // Default fallback
            }

            const formattedData = {
                ticker: ticker,
                quote_type: quoteType,
                product_type: productType,
                product_category: category,
                analysis_framework: framework,
                company_name: quote.longName || quote.shortName || ticker,
                exchange: quote.exchange || quote.fullExchangeName || 'N/A',
                market_cap: quote.marketCap || null,
                price: quote.regularMarketPrice || null,
                currency: quote.currency || 'USD',
                // Additional useful fields
                raw_data: {
                    quoteType: quoteType,
                    longName: quote.longName,
                    shortName: quote.shortName,
                    exchange: quote.exchange,
                    marketCap: quote.marketCap
                }
            };

            return this.formatResult(formattedData, true, {
                source: 'yahoo_finance',
                data_type: 'quote_type_detection'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }
}
