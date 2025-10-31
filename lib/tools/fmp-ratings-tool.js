/**
 * FMP Company Ratings Tool
 * Notes et consensus d'entreprise via Financial Modeling Prep
 */

import BaseTool from './base-tool.js';

export default class FMPRatingsTool extends BaseTool {
    constructor() {
        super();
        this.name = 'FMP Company Ratings';
        this.description = 'Notes et consensus d\'entreprise (ratings snapshot)';
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
                // Récupérer les ratings pour TOUS les tickers (limiter à 5)
                const tickersToFetch = allTickers.slice(0, 5);
                console.log(`📊 Fetching ratings for ${tickersToFetch.length} tickers: ${tickersToFetch.join(', ')}`);

                const ratingsPromises = tickersToFetch.map(async (ticker) => {
                    const url = `https://financialmodelingprep.com/api/v3/rating/${ticker.toUpperCase()}?apikey=${apiKey}`;
                    try {
                        const response = await this.makeApiCall(url);
                        if (!response || response.length === 0) {
                            return { ticker: ticker.toUpperCase(), data: null, error: 'No data found' };
                        }
                        const rating = response[0];
                        return {
                            ticker: ticker.toUpperCase(),
                            data: {
                                rating: rating.rating,
                                rating_score: rating.ratingScore,
                                rating_recommendation: rating.ratingRecommendation,
                                rating_details_dcf_score: rating.ratingDetailsDCFScore,
                                rating_details_dcf_recommendation: rating.ratingDetailsDCFRecommendation,
                                rating_details_roe_score: rating.ratingDetailsROEScore,
                                rating_details_roe_recommendation: rating.ratingDetailsROERecommendation,
                                rating_details_roa_score: rating.ratingDetailsROAScore,
                                rating_details_roa_recommendation: rating.ratingDetailsROARecommendation,
                                rating_details_de_score: rating.ratingDetailsDEScore,
                                rating_details_de_recommendation: rating.ratingDetailsDERecommendation,
                                rating_details_pe_score: rating.ratingDetailsPEScore,
                                rating_details_pe_recommendation: rating.ratingDetailsPERecommendation,
                                rating_details_pb_score: rating.ratingDetailsPBScore,
                                rating_details_pb_recommendation: rating.ratingDetailsPBRecommendation
                            }
                        };
                    } catch (error) {
                        console.error(`❌ Failed to fetch ratings for ${ticker}:`, error.message);
                        return { ticker: ticker.toUpperCase(), data: null, error: error.message };
                    }
                });

                const ratingsResults = await Promise.allSettled(ratingsPromises);
                const allRatings = ratingsResults
                    .filter(r => r.status === 'fulfilled' && r.value.data !== null)
                    .map(r => r.value);

                if (allRatings.length === 0) {
                    throw new Error('No ratings data found for any ticker');
                }

                // Formatter les données agrégées
                const formattedData = {
                    tickers: allTickers,
                    tickers_with_data: allRatings.map(r => r.ticker),
                    ratings_count: allRatings.length,
                    ratings_by_ticker: allRatings.reduce((acc, { ticker, data }) => {
                        acc[ticker] = data;
                        return acc;
                    }, {}),
                    last_updated: new Date().toISOString()
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'company_ratings_multi_ticker'
                });

            } else {
                // Logique originale pour un seul ticker
                const ticker = allTickers[0].toUpperCase();

                // Récupération du rating de l'entreprise
                const url = `https://financialmodelingprep.com/api/v3/rating/${ticker}?apikey=${apiKey}`;

                const response = await this.makeApiCall(url);

                if (!response || response.length === 0) {
                    throw new Error(`No rating data found for ticker: ${ticker}`);
                }

                const rating = response[0];

                const formattedData = {
                    ticker: ticker,
                    rating: rating.rating,
                    rating_score: rating.ratingScore,
                    rating_recommendation: rating.ratingRecommendation,
                    rating_details_dcf_score: rating.ratingDetailsDCFScore,
                    rating_details_dcf_recommendation: rating.ratingDetailsDCFRecommendation,
                    rating_details_roe_score: rating.ratingDetailsROEScore,
                    rating_details_roe_recommendation: rating.ratingDetailsROERecommendation,
                    rating_details_roa_score: rating.ratingDetailsROAScore,
                    rating_details_roa_recommendation: rating.ratingDetailsROARecommendation,
                    rating_details_de_score: rating.ratingDetailsDEScore,
                    rating_details_de_recommendation: rating.ratingDetailsDERecommendation,
                    rating_details_pe_score: rating.ratingDetailsPEScore,
                    rating_details_pe_recommendation: rating.ratingDetailsPERecommendation,
                    rating_details_pb_score: rating.ratingDetailsPBScore,
                    rating_details_pb_recommendation: rating.ratingDetailsPBRecommendation,
                    date: rating.date
                };

                return this.formatResult(formattedData, true, {
                    source: 'financialmodelingprep.com',
                    data_type: 'company_rating'
                });
            }

        } catch (error) {
            return this.handleError(error);
        }
    }
}
