/**
 * Analyst Recommendations Tool
 * Recommandations d'analystes financiers
 */

import BaseTool from './base-tool.js';

export default class AnalystRecommendationsTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Analyst Recommendations';
        this.description = 'Recommandations d\'analystes financiers';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['ticker']);
            
            const ticker = params.ticker.toUpperCase();
            const apiKey = process.env.FMP_API_KEY;
            
            if (!apiKey) {
                throw new Error('FMP_API_KEY not configured');
            }

            const url = `https://financialmodelingprep.com/api/v3/grade/${ticker}?apikey=${apiKey}`;
            
            const response = await this.makeApiCall(url);
            
            if (!response || response.length === 0) {
                throw new Error(`No analyst recommendations found for ticker: ${ticker}`);
            }

            // Calculer les statistiques des recommandations
            const recommendations = response.map(rec => ({
                symbol: rec.symbol,
                grading_company: rec.gradingCompany,
                new_grade: rec.newGrade,
                previous_grade: rec.previousGrade,
                action: rec.action,
                date: rec.date
            }));

            const gradeCounts = recommendations.reduce((acc, rec) => {
                acc[rec.new_grade] = (acc[rec.new_grade] || 0) + 1;
                return acc;
            }, {});

            const formattedData = {
                ticker: ticker,
                recommendations: recommendations,
                count: recommendations.length,
                grade_distribution: gradeCounts,
                latest_recommendations: recommendations.slice(0, 5), // 5 plus récentes
                consensus: this.calculateConsensus(gradeCounts),
                last_updated: recommendations[0]?.date || new Date().toISOString()
            };

            return this.formatResult(formattedData, true, {
                source: 'financialmodelingprep.com',
                data_type: 'analyst_recommendations'
            });

        } catch (error) {
            return this.handleError(error);
        }
    }

    calculateConsensus(gradeCounts) {
        const gradeValues = {
            'Strong Buy': 5,
            'Buy': 4,
            'Hold': 3,
            'Sell': 2,
            'Strong Sell': 1
        };

        let totalWeight = 0;
        let totalCount = 0;

        Object.entries(gradeCounts).forEach(([grade, count]) => {
            if (gradeValues[grade]) {
                totalWeight += gradeValues[grade] * count;
                totalCount += count;
            }
        });

        if (totalCount === 0) return 'N/A';

        const averageScore = totalWeight / totalCount;
        
        if (averageScore >= 4.5) return 'Strong Buy';
        if (averageScore >= 3.5) return 'Buy';
        if (averageScore >= 2.5) return 'Hold';
        if (averageScore >= 1.5) return 'Sell';
        return 'Strong Sell';
    }
}
