/**
 * FMP Ticker News Tool
 * Actualités spécifiques à un ticker via Financial Modeling Prep
 */

import BaseTool from './base-tool.js';

export default class FMPTickerNewsTool extends BaseTool {
    constructor() {
        super();
        this.name = 'FMP Ticker News';
        this.description = 'Actualités spécifiques à un ticker via FMP';
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
                // Récupérer les news pour TOUS les tickers (limiter à 5)
                const tickersToFetch = allTickers.slice(0, 5);
                console.log(`📰 Fetching news for ${tickersToFetch.length} tickers: ${tickersToFetch.join(', ')}`);

                const newsPromises = tickersToFetch.map(async (ticker) => {
                    const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker.toUpperCase()}&limit=10&apikey=${apiKey}`;
                    try {
                        const response = await this.makeApiCall(url);
                        if (!response || response.length === 0) {
                            return { ticker: ticker.toUpperCase(), data: [], error: 'No news found' };
                        }
                        const articles = response.slice(0, 5).map(article => ({
                            title: article.title,
                            url: article.url,
                            published_date: article.publishedDate,
                            site: article.site,
                            text: article.text ? article.text.substring(0, 200) : null,
                            symbol: article.symbol
                        }));
                        return {
                            ticker: ticker.toUpperCase(),
                            data: articles
                        };
                    } catch (error) {
                        console.error(`❌ Failed to fetch news for ${ticker}:`, error.message);
                        return { ticker: ticker.toUpperCase(), data: [], error: error.message };
                    }
                });

                const newsResults = await Promise.allSettled(newsPromises);
                const allNews = newsResults
                    .filter(r => r.status === 'fulfilled' && r.value.data.length > 0)
                    .map(r => r.value);

                if (allNews.length === 0) {
                    throw new Error('No news data found for any ticker');
                }

                // Formatter les données agrégées
                const formattedData = {
                    tickers: allTickers,
                    tickers_with_data: allNews.map(n => n.ticker),
                    news_count: allNews.reduce((sum, n) => sum + n.data.length, 0),
                    news_by_ticker: allNews.reduce((acc, { ticker, data }) => {
                        acc[ticker] = data;
                        return acc;
                    }, {}),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'ticker_news_multi_ticker'
                });

            } else {
                // Logique originale pour un seul ticker
                const ticker = allTickers[0].toUpperCase();
                const limit = params.limit || 10;

                // Récupération des actualités pour le ticker
                const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker}&limit=${limit}&apikey=${apiKey}`;

                const response = await this.makeApiCall(url);

                if (!response || response.length === 0) {
                    throw new Error(`No news found for ticker: ${ticker}`);
                }

                const articles = response.map(article => ({
                    title: article.title,
                    url: article.url,
                    published_date: article.publishedDate,
                    site: article.site,
                    text: article.text,
                    symbol: article.symbol,
                    image: article.image
                }));

                const formattedData = {
                    ticker: ticker,
                    articles_count: articles.length,
                    articles: articles
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'ticker_news'
                });
            }

        } catch (error) {
            return this.handleError(error);
        }
    }
}
