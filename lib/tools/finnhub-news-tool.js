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
            const apiKey = process.env.FINNHUB_API_KEY;

            if (!apiKey) {
                throw new Error('FINNHUB_API_KEY not configured');
            }

            // Gérer plusieurs tickers si all_tickers est fourni
            const allTickers = params.all_tickers || (params.ticker ? [params.ticker] : null);

            if (allTickers && allTickers.length > 1) {
                // Récupérer les news pour TOUS les tickers (limiter à 5 tickers pour éviter trop d'appels API)
                const tickersToFetch = allTickers.slice(0, 5);
                console.log(`📰 Fetching news for ${tickersToFetch.length} tickers: ${tickersToFetch.join(', ')}`);

                const newsPromises = tickersToFetch.map(async (ticker) => {
                    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker.toUpperCase()}&from=${this.getDateString(-7)}&to=${this.getDateString(0)}&token=${apiKey}`;
                    try {
                        const response = await this.makeApiCall(url);
                        return {
                            ticker: ticker.toUpperCase(),
                            news: response ? response.slice(0, 3) : [] // Limiter à 3 articles par ticker
                        };
                    } catch (error) {
                        console.error(`❌ Failed to fetch news for ${ticker}:`, error.message);
                        return { ticker: ticker.toUpperCase(), news: [], error: error.message };
                    }
                });

                const newsResults = await Promise.allSettled(newsPromises);
                const allNews = newsResults
                    .filter(r => r.status === 'fulfilled' && r.value.news.length > 0)
                    .map(r => r.value);

                if (allNews.length === 0) {
                    throw new Error('No news found for any ticker');
                }

                // Formatter les données agrégées
                const formattedData = {
                    tickers: allTickers,
                    tickers_with_news: allNews.map(n => n.ticker),
                    total_news_count: allNews.reduce((sum, n) => sum + n.news.length, 0),
                    news_by_ticker: allNews.map(({ ticker, news }) => ({
                        ticker,
                        news_count: news.length,
                        articles: news.map(article => ({
                            headline: article.headline,
                            summary: article.summary,
                            url: article.url,
                            source: article.source,
                            datetime: new Date(article.datetime * 1000).toISOString(),
                            category: article.category,
                            related: article.related
                        }))
                    })),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'finnhub.io',
                    data_type: 'financial_news_multi_ticker'
                });

            } else {
                // Logique originale pour un seul ticker ou news générales
                const ticker = params.ticker ? params.ticker.toUpperCase() : null;

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
            }

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
