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
            this.validateParams(params, ['ticker']);
            
            const ticker = params.ticker.toUpperCase();
            const apiKey = process.env.FMP_API_KEY;
            
            if (!apiKey) {
                throw new Error('FMP_API_KEY not configured');
            }

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
