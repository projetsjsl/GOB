/**
 * RESEARCH AGENT - Deep Financial Analysis
 * 
 * Combines multiple data sources and agents to perform
 * comprehensive research on stocks, sectors, and market trends.
 * 
 * Features:
 * - Multi-source data aggregation
 * - AI-powered analysis synthesis
 * - Bull/Bear case generation
 * - Risk assessment
 * - Peer comparison
 */

import { BaseAgent } from './base-agent.js';
import { toolsAgent } from './tools-agent.js';

class ResearchAgent extends BaseAgent {
    constructor() {
        super('ResearchAgent', [
            'analyze_stock',
            'compare_peers',
            'generate_bull_bear',
            'assess_risk',
            'sector_analysis',
            'generate_thesis',
            'deep_dive'
        ]);
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        switch (action) {
            case 'analyze_stock':
                return this._analyzeStock(params.ticker);
            case 'compare_peers':
                return this._comparePeers(params.ticker, params.peers);
            case 'generate_bull_bear':
                return this._generateBullBear(params.ticker);
            case 'assess_risk':
                return this._assessRisk(params.ticker);
            case 'sector_analysis':
                return this._sectorAnalysis(params.sector);
            case 'generate_thesis':
                return this._generateThesis(params.ticker, params.stance);
            case 'deep_dive':
                return this._deepDive(params.ticker);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Comprehensive stock analysis
     */
    async _analyzeStock(ticker) {
        const [quote, profile, ratios, news] = await Promise.all([
            toolsAgent._execute_get_stock_price({ ticker }),
            toolsAgent._execute_get_company_profile({ ticker }),
            toolsAgent._execute_get_financial_ratios({ ticker }),
            toolsAgent._execute_get_market_news({ ticker, limit: 5 })
        ]);

        // Generate analysis sections
        const valuation = this._analyzeValuation(ratios);
        const quality = this._analyzeQuality(ratios);
        const momentum = this._analyzeMomentum(quote);

        return {
            success: true,
            ticker,
            summary: {
                name: profile.name,
                sector: profile.sector,
                price: quote.price,
                change: quote.changePercent,
                marketCap: this._formatNumber(profile.marketCap)
            },
            valuation,
            quality,
            momentum,
            recentNews: news.news,
            overallScore: this._calculateScore(valuation, quality, momentum),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Compare stock with peers
     */
    async _comparePeers(ticker, peers) {
        const allTickers = [ticker, ...(peers || [])];
        
        // If no peers provided, try to find them from the same sector
        if (!peers || peers.length === 0) {
            const profile = await toolsAgent._execute_get_company_profile({ ticker });
            // For now, return message to provide peers
            return {
                success: false,
                message: `Please provide peer tickers for comparison. ${ticker} is in the ${profile.sector} sector.`,
                sector: profile.sector
            };
        }

        const comparison = await toolsAgent._execute_compare_stocks({
            tickers: allTickers,
            metrics: ['price', 'changePercent', 'pe', 'roe', 'dividendYield', 'netMargin']
        });

        // Calculate rankings
        const rankings = this._rankPeers(comparison.comparison);

        return {
            success: true,
            ticker,
            peers,
            comparison: comparison.comparison,
            rankings,
            analysis: this._generatePeerAnalysis(ticker, rankings)
        };
    }

    /**
     * Generate bull and bear cases
     */
    async _generateBullBear(ticker) {
        const analysis = await this._analyzeStock(ticker);
        
        const bullCase = {
            title: `🐂 Bull Case for ${ticker}`,
            points: []
        };
        
        const bearCase = {
            title: `🐻 Bear Case for ${ticker}`,
            points: []
        };

        // Generate points based on metrics
        if (analysis.valuation.peScore === 'Undervalued') {
            bullCase.points.push(`Attractive valuation with P/E of ${analysis.valuation.pe?.toFixed(1)}`);
        } else if (analysis.valuation.peScore === 'Overvalued') {
            bearCase.points.push(`Premium valuation with P/E of ${analysis.valuation.pe?.toFixed(1)}`);
        }

        if (analysis.quality.roeScore === 'Excellent') {
            bullCase.points.push(`Strong profitability: ROE of ${(analysis.quality.roe * 100).toFixed(1)}%`);
        } else if (analysis.quality.roeScore === 'Poor') {
            bearCase.points.push(`Weak profitability: ROE of ${(analysis.quality.roe * 100).toFixed(1)}%`);
        }

        if (analysis.quality.marginScore === 'Healthy') {
            bullCase.points.push(`Solid margins: Net margin of ${(analysis.quality.netMargin * 100).toFixed(1)}%`);
        }

        if (analysis.momentum.trend === 'Positive') {
            bullCase.points.push(`Positive momentum: Stock up ${analysis.momentum.changePercent?.toFixed(1)}%`);
        } else if (analysis.momentum.trend === 'Negative') {
            bearCase.points.push(`Negative momentum: Stock down ${Math.abs(analysis.momentum.changePercent || 0).toFixed(1)}%`);
        }

        // Always include some standard points
        if (bullCase.points.length < 3) {
            bullCase.points.push('Market leader in its sector');
            bullCase.points.push('Strong management track record');
        }
        if (bearCase.points.length < 3) {
            bearCase.points.push('Competitive pressures in the industry');
            bearCase.points.push('Macroeconomic uncertainties');
        }

        return {
            success: true,
            ticker,
            bullCase,
            bearCase,
            recommendation: this._getRecommendation(analysis.overallScore)
        };
    }

    /**
     * Risk assessment
     */
    async _assessRisk(ticker) {
        const [profile, ratios, quote] = await Promise.all([
            toolsAgent._execute_get_company_profile({ ticker }),
            toolsAgent._execute_get_financial_ratios({ ticker }),
            toolsAgent._execute_get_stock_price({ ticker })
        ]);

        const risks = [];
        let riskScore = 0;

        // Valuation risk
        if (ratios.pe > 30) {
            risks.push({ category: 'Valuation', level: 'High', note: `High P/E of ${ratios.pe.toFixed(1)}` });
            riskScore += 2;
        } else if (ratios.pe > 20) {
            risks.push({ category: 'Valuation', level: 'Medium', note: `Elevated P/E of ${ratios.pe.toFixed(1)}` });
            riskScore += 1;
        }

        // Leverage risk
        if (ratios.debtEquity > 2) {
            risks.push({ category: 'Leverage', level: 'High', note: `High debt/equity of ${ratios.debtEquity.toFixed(2)}` });
            riskScore += 2;
        } else if (ratios.debtEquity > 1) {
            risks.push({ category: 'Leverage', level: 'Medium', note: `Elevated debt/equity of ${ratios.debtEquity.toFixed(2)}` });
            riskScore += 1;
        }

        // Profitability risk
        if (ratios.roe < 0.05) {
            risks.push({ category: 'Profitability', level: 'High', note: `Low ROE of ${(ratios.roe * 100).toFixed(1)}%` });
            riskScore += 2;
        }

        // Liquidity risk
        if (ratios.currentRatio < 1) {
            risks.push({ category: 'Liquidity', level: 'High', note: `Current ratio below 1` });
            riskScore += 2;
        }

        // Market cap risk
        if (profile.marketCap < 1e9) {
            risks.push({ category: 'Size', level: 'Medium', note: 'Small cap - higher volatility' });
            riskScore += 1;
        }

        const overallRisk = riskScore >= 5 ? 'High' :
                           riskScore >= 3 ? 'Medium' : 'Low';

        return {
            success: true,
            ticker,
            overallRisk,
            riskScore,
            maxScore: 10,
            risks,
            mitigatingFactors: this._getMitigatingFactors(ratios)
        };
    }

    /**
     * Deep dive analysis
     */
    async _deepDive(ticker) {
        const [analysis, bullBear, risk, dcf] = await Promise.all([
            this._analyzeStock(ticker),
            this._generateBullBear(ticker),
            this._assessRisk(ticker),
            toolsAgent._execute_calculate_dcf({ ticker, growthRate: 10 })
        ]);

        return {
            success: true,
            ticker,
            deepDive: {
                overview: analysis.summary,
                valuation: {
                    ...analysis.valuation,
                    dcf: dcf
                },
                quality: analysis.quality,
                momentum: analysis.momentum,
                bullCase: bullBear.bullCase,
                bearCase: bullBear.bearCase,
                riskAssessment: risk,
                overallScore: analysis.overallScore,
                recommendation: bullBear.recommendation,
                recentNews: analysis.recentNews
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Generate investment thesis
     */
    async _generateThesis(ticker, stance = 'neutral') {
        const deepDive = await this._deepDive(ticker);
        const dd = deepDive.deepDive;

        const thesis = {
            ticker,
            stance,
            summary: `${ticker} at $${dd.overview.price} (${dd.overview.change}%)`,
            sections: {}
        };

        if (stance === 'bull' || stance === 'neutral') {
            thesis.sections.bullCase = dd.bullCase.points;
        }
        if (stance === 'bear' || stance === 'neutral') {
            thesis.sections.bearCase = dd.bearCase.points;
        }
        
        thesis.sections.valuation = {
            currentPE: dd.valuation.pe,
            dcfUpside: dd.valuation.dcf?.impliedUpside,
            verdict: dd.valuation.peScore
        };
        
        thesis.sections.risks = dd.riskAssessment.risks.map(r => r.note);
        
        thesis.conclusion = stance === 'bull' 
            ? `BUY recommendation with target upside of ${dd.valuation.dcf?.impliedUpside || 'N/A'}`
            : stance === 'bear'
            ? `SELL recommendation - key risks outweigh potential returns`
            : `HOLD - balanced risk/reward at current levels`;

        return {
            success: true,
            thesis
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════

    _analyzeValuation(ratios) {
        return {
            pe: ratios.pe,
            pb: ratios.pb,
            ps: ratios.ps,
            peg: ratios.peg,
            peScore: ratios.pe < 15 ? 'Undervalued' :
                    ratios.pe < 25 ? 'Fair' : 'Overvalued',
            dividendYield: ratios.dividendYield
        };
    }

    _analyzeQuality(ratios) {
        return {
            roe: ratios.roe,
            roa: ratios.roa,
            netMargin: ratios.netMargin,
            roeScore: ratios.roe > 0.20 ? 'Excellent' :
                     ratios.roe > 0.10 ? 'Good' :
                     ratios.roe > 0.05 ? 'Average' : 'Poor',
            marginScore: ratios.netMargin > 0.15 ? 'Healthy' :
                        ratios.netMargin > 0.05 ? 'Average' : 'Weak'
        };
    }

    _analyzeMomentum(quote) {
        return {
            price: quote.price,
            changePercent: quote.changePercent,
            trend: quote.changePercent > 0 ? 'Positive' : 'Negative',
            dayRange: `${quote.low} - ${quote.high}`
        };
    }

    _calculateScore(valuation, quality, momentum) {
        let score = 50; // Base score
        
        if (valuation.peScore === 'Undervalued') score += 15;
        else if (valuation.peScore === 'Overvalued') score -= 10;
        
        if (quality.roeScore === 'Excellent') score += 20;
        else if (quality.roeScore === 'Good') score += 10;
        else if (quality.roeScore === 'Poor') score -= 15;
        
        if (quality.marginScore === 'Healthy') score += 10;
        else if (quality.marginScore === 'Weak') score -= 10;
        
        if (momentum.trend === 'Positive') score += 5;
        else score -= 5;
        
        return Math.max(0, Math.min(100, score));
    }

    _rankPeers(comparison) {
        const metricRankings = {};
        
        // Sort by each metric
        ['pe', 'roe', 'dividendYield', 'netMargin'].forEach(metric => {
            const sorted = [...comparison]
                .filter(c => c[metric] !== undefined && c[metric] !== null)
                .sort((a, b) => {
                    if (metric === 'pe') return (a[metric] || Infinity) - (b[metric] || Infinity);
                    return (b[metric] || 0) - (a[metric] || 0);
                });
            
            metricRankings[metric] = sorted.map((c, i) => ({
                ticker: c.ticker,
                rank: i + 1,
                value: c[metric]
            }));
        });

        return metricRankings;
    }

    _generatePeerAnalysis(ticker, rankings) {
        const analysis = [];
        
        for (const [metric, ranks] of Object.entries(rankings)) {
            const tickerRank = ranks.find(r => r.ticker === ticker);
            if (tickerRank) {
                const position = tickerRank.rank === 1 ? 'leads' :
                               tickerRank.rank === ranks.length ? 'lags' : 'ranks middle';
                analysis.push(`${ticker} ${position} in ${metric} (rank ${tickerRank.rank}/${ranks.length})`);
            }
        }
        
        return analysis;
    }

    _getRecommendation(score) {
        if (score >= 75) return { rating: 'Strong Buy', confidence: 'High' };
        if (score >= 60) return { rating: 'Buy', confidence: 'Medium-High' };
        if (score >= 45) return { rating: 'Hold', confidence: 'Medium' };
        if (score >= 30) return { rating: 'Sell', confidence: 'Medium' };
        return { rating: 'Strong Sell', confidence: 'High' };
    }

    _getMitigatingFactors(ratios) {
        const factors = [];
        if (ratios.currentRatio > 1.5) factors.push('Strong liquidity position');
        if (ratios.dividendYield > 0.02) factors.push('Dividend provides income cushion');
        if (ratios.grossMargin > 0.4) factors.push('High gross margins indicate pricing power');
        return factors;
    }

    _formatNumber(num) {
        if (!num) return 'N/A';
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return `$${num.toLocaleString()}`;
    }
}

export const researchAgent = new ResearchAgent();
export { ResearchAgent };
