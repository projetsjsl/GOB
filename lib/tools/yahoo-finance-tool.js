/**
 * Yahoo Finance Tool
 * Données Yahoo Finance (fallback général)
 */

import BaseTool from './base-tool.js';

export default class YahooFinanceTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Yahoo Finance';
        this.description = 'Données Yahoo Finance (fallback général)';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['ticker']);
            
            const ticker = params.ticker.toUpperCase();
            
            // Simulation de données Yahoo Finance (en attendant une vraie implémentation)
            // Dans un vrai projet, on utiliserait une API ou du scraping
            const mockData = this.generateMockYahooData(ticker);
            
            return this.formatResult(mockData, false, {
                source: 'yahoo_finance_mock',
                data_type: 'stock_data',
                note: 'Données simulées - implémentation réelle requise'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }

    generateMockYahooData(ticker) {
        // Génération de données simulées basées sur le ticker
        const basePrice = this.getBasePriceForTicker(ticker);
        const variation = (Math.random() - 0.5) * 0.1; // ±5% de variation
        const currentPrice = basePrice * (1 + variation);
        
        return {
            ticker: ticker,
            price: currentPrice.toFixed(2),
            change: (currentPrice - basePrice).toFixed(2),
            change_percent: (variation * 100).toFixed(2),
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            market_cap: (currentPrice * Math.floor(Math.random() * 1000000000) + 1000000000).toLocaleString(),
            pe_ratio: (Math.random() * 50 + 5).toFixed(2),
            dividend_yield: (Math.random() * 5).toFixed(2),
            high_52w: (basePrice * 1.3).toFixed(2),
            low_52w: (basePrice * 0.7).toFixed(2),
            last_updated: new Date().toISOString(),
            source: 'yahoo_finance_mock'
        };
    }

    getBasePriceForTicker(ticker) {
        // Prix de base approximatifs pour quelques tickers connus
        const basePrices = {
            'AAPL': 150,
            'GOOGL': 2800,
            'MSFT': 300,
            'AMZN': 3200,
            'TSLA': 200,
            'NVDA': 400,
            'META': 300,
            'NFLX': 400,
            'GOOGL': 2800,
            'T': 20,
            'BNS': 60,
            'TD': 80,
            'BCE': 50,
            'CNR': 120,
            'CSCO': 50,
            'CVS': 80,
            'DEO': 150,
            'MDT': 80,
            'JNJ': 160,
            'JPM': 140,
            'LVMHF': 800,
            'MG': 25,
            'MFC': 20,
            'MU': 60,
            'NSRGY': 100,
            'NKE': 100,
            'NTR': 80,
            'PFE': 30,
            'TRP': 50,
            'UNH': 500,
            'UL': 50,
            'VZ': 40,
            'WFC': 40
        };
        
        return basePrices[ticker] || 50; // Prix par défaut
    }
}
