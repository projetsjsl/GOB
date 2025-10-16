/**
 * Finnhub News Tool
 * Actualités financières via Finnhub
 */

import BaseTool from './base-tool.js';

export default class FinnhubNewsTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Finnhub News';
        this.description = 'Actualités financières via Finnhub';
    }

    async execute(params, context = {}) {
        try {
            const ticker = params.ticker ? params.ticker.toUpperCase() : null;
            const apiKey = process.env.FINNHUB_API_KEY;
            
            if (!apiKey) {
                throw new Error('FINNHUB_API_KEY not configured');
            }

            let url;
            if (ticker) {
                // Nouvelles spécifiques à une action
                url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${this.getDateString(-7)}&to=${this.getDateString(0)}&token=${apiKey}`;
            } else {
                // Nouvelles générales du marché
                url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
            }
            
            const response = await this.makeApiCall(url);
            
            if (!response || response.length === 0) {
                throw new Error(`No news found${ticker ? ` for ticker: ${ticker}` : ''}`);
            }

            // Limiter à 10 articles les plus récents
            const recentNews = response.slice(0, 10).map(article => ({
                headline: article.headline,
                summary: article.summary,
                url: article.url,
                source: article.source,
                datetime: new Date(article.datetime * 1000).toISOString(),
                category: article.category,
                id: article.id,
                image: article.image,
                related: article.related
            }));

            const formattedData = {
                ticker: ticker,
                news_count: recentNews.length,
                articles: recentNews,
                last_updated: new Date().toISOString()
            };

            return this.formatResult(formattedData, true, {
                source: 'finnhub.io',
                data_type: 'financial_news'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }

    getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }
}
