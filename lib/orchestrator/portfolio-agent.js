/**
 * PORTFOLIO AGENT - Portfolio Management & Analysis
 * 
 * Manages user portfolios, tracks performance, and provides
 * optimization suggestions.
 * 
 * Features:
 * - Portfolio tracking
 * - Performance analysis
 * - Allocation optimization
 * - Dividend tracking
 * - Rebalancing suggestions
 */

import { BaseAgent } from './base-agent.js';
import { toolsAgent } from './tools-agent.js';

class PortfolioAgent extends BaseAgent {
    constructor() {
        super('PortfolioAgent', [
            'create_portfolio',
            'get_portfolio',
            'add_holding',
            'remove_holding',
            'update_holding',
            'analyze_portfolio',
            'get_allocation',
            'get_performance',
            'get_dividends',
            'suggest_rebalance',
            'optimize_portfolio'
        ]);
        
        // In-memory portfolio storage (would use Supabase in production)
        this.portfolios = new Map();
    }

    async _executeInternal(task, context) {
        const { action, portfolioId, ...params } = task;
        const pid = portfolioId || context.portfolioId || 'default';

        switch (action) {
            case 'create_portfolio':
                return this._createPortfolio(pid, params.name, params.holdings);
            case 'get_portfolio':
                return this._getPortfolio(pid);
            case 'add_holding':
                return this._addHolding(pid, params.ticker, params.shares, params.costBasis);
            case 'remove_holding':
                return this._removeHolding(pid, params.ticker);
            case 'update_holding':
                return this._updateHolding(pid, params.ticker, params.shares, params.costBasis);
            case 'analyze_portfolio':
                return this._analyzePortfolio(pid);
            case 'get_allocation':
                return this._getAllocation(pid);
            case 'get_performance':
                return this._getPerformance(pid);
            case 'get_dividends':
                return this._getDividends(pid);
            case 'suggest_rebalance':
                return this._suggestRebalance(pid, params.targetAllocation);
            case 'optimize_portfolio':
                return this._optimizePortfolio(pid, params.objective);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Create a new portfolio
     */
    _createPortfolio(portfolioId, name, holdings = []) {
        const portfolio = {
            id: portfolioId,
            name: name || `Portfolio ${portfolioId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            holdings: [],
            metadata: {}
        };

        // Add initial holdings
        for (const h of holdings) {
            portfolio.holdings.push({
                ticker: h.ticker.toUpperCase(),
                shares: h.shares || 0,
                costBasis: h.costBasis || 0,
                addedAt: new Date().toISOString()
            });
        }

        this.portfolios.set(portfolioId, portfolio);

        return {
            success: true,
            portfolio,
            message: `Portfolio "${portfolio.name}" created with ${portfolio.holdings.length} holdings`
        };
    }

    /**
     * Get portfolio details
     */
    _getPortfolio(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        
        if (!portfolio) {
            return {
                success: false,
                error: `Portfolio "${portfolioId}" not found`,
                suggestion: 'Use create_portfolio to create a new portfolio'
            };
        }

        return {
            success: true,
            portfolio
        };
    }

    /**
     * Add a holding to portfolio
     */
    _addHolding(portfolioId, ticker, shares, costBasis) {
        const portfolio = this.portfolios.get(portfolioId);
        
        if (!portfolio) {
            // Auto-create portfolio
            this._createPortfolio(portfolioId, 'Auto-created');
        }

        const p = this.portfolios.get(portfolioId);
        const existing = p.holdings.find(h => h.ticker === ticker.toUpperCase());

        if (existing) {
            // Update existing holding
            existing.shares += shares;
            existing.costBasis = ((existing.costBasis * (existing.shares - shares)) + (costBasis * shares)) / existing.shares;
        } else {
            p.holdings.push({
                ticker: ticker.toUpperCase(),
                shares,
                costBasis,
                addedAt: new Date().toISOString()
            });
        }

        p.updatedAt = new Date().toISOString();

        return {
            success: true,
            holding: p.holdings.find(h => h.ticker === ticker.toUpperCase()),
            totalHoldings: p.holdings.length
        };
    }

    /**
     * Remove holding from portfolio
     */
    _removeHolding(portfolioId, ticker) {
        const portfolio = this.portfolios.get(portfolioId);
        
        if (!portfolio) {
            return { success: false, error: 'Portfolio not found' };
        }

        const index = portfolio.holdings.findIndex(h => h.ticker === ticker.toUpperCase());
        
        if (index === -1) {
            return { success: false, error: `Holding ${ticker} not found` };
        }

        const removed = portfolio.holdings.splice(index, 1)[0];
        portfolio.updatedAt = new Date().toISOString();

        return {
            success: true,
            removed,
            remainingHoldings: portfolio.holdings.length
        };
    }

    /**
     * Update holding
     */
    _updateHolding(portfolioId, ticker, shares, costBasis) {
        const portfolio = this.portfolios.get(portfolioId);
        
        if (!portfolio) {
            return { success: false, error: 'Portfolio not found' };
        }

        const holding = portfolio.holdings.find(h => h.ticker === ticker.toUpperCase());
        
        if (!holding) {
            return { success: false, error: `Holding ${ticker} not found` };
        }

        if (shares !== undefined) holding.shares = shares;
        if (costBasis !== undefined) holding.costBasis = costBasis;
        holding.updatedAt = new Date().toISOString();
        portfolio.updatedAt = new Date().toISOString();

        return {
            success: true,
            holding
        };
    }

    /**
     * Comprehensive portfolio analysis
     */
    async _analyzePortfolio(portfolioId) {
        const portfolioResult = this._getPortfolio(portfolioId);
        
        if (!portfolioResult.success) {
            return portfolioResult;
        }

        const portfolio = portfolioResult.portfolio;
        const holdingData = [];
        let totalValue = 0;
        let totalCost = 0;

        // Fetch current data for all holdings
        for (const holding of portfolio.holdings) {
            try {
                const quote = await toolsAgent._execute_get_stock_price({ ticker: holding.ticker });
                const ratios = await toolsAgent._execute_get_financial_ratios({ ticker: holding.ticker });
                
                const currentValue = (quote.price || 0) * holding.shares;
                const costValue = holding.costBasis * holding.shares;
                const gain = currentValue - costValue;
                const gainPercent = costValue > 0 ? ((gain / costValue) * 100) : 0;

                holdingData.push({
                    ticker: holding.ticker,
                    shares: holding.shares,
                    costBasis: holding.costBasis,
                    currentPrice: quote.price,
                    currentValue,
                    gain,
                    gainPercent: gainPercent.toFixed(2) + '%',
                    pe: ratios.pe,
                    dividendYield: ratios.dividendYield
                });

                totalValue += currentValue;
                totalCost += costValue;
            } catch (error) {
                holdingData.push({
                    ticker: holding.ticker,
                    error: 'Failed to fetch data'
                });
            }
        }

        const totalGain = totalValue - totalCost;
        const totalGainPercent = totalCost > 0 ? ((totalGain / totalCost) * 100) : 0;

        return {
            success: true,
            portfolioId,
            name: portfolio.name,
            summary: {
                totalValue: this._formatCurrency(totalValue),
                totalCost: this._formatCurrency(totalCost),
                totalGain: this._formatCurrency(totalGain),
                totalGainPercent: totalGainPercent.toFixed(2) + '%',
                holdingsCount: portfolio.holdings.length
            },
            holdings: holdingData,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get allocation breakdown
     */
    async _getAllocation(portfolioId) {
        const analysis = await this._analyzePortfolio(portfolioId);
        
        if (!analysis.success) {
            return analysis;
        }

        const totalValue = parseFloat(analysis.summary.totalValue.replace(/[$,]/g, ''));
        const allocation = analysis.holdings
            .filter(h => !h.error)
            .map(h => ({
                ticker: h.ticker,
                value: h.currentValue,
                weight: ((h.currentValue / totalValue) * 100).toFixed(2) + '%',
                absoluteWeight: h.currentValue / totalValue
            }))
            .sort((a, b) => b.absoluteWeight - a.absoluteWeight);

        // Concentration analysis
        const top3Weight = allocation.slice(0, 3).reduce((sum, a) => sum + a.absoluteWeight, 0);
        const concentration = top3Weight > 0.6 ? 'High' : top3Weight > 0.4 ? 'Medium' : 'Low';

        return {
            success: true,
            portfolioId,
            allocation,
            analysis: {
                concentration,
                top3Weight: (top3Weight * 100).toFixed(1) + '%',
                diversification: allocation.length >= 10 ? 'Good' : allocation.length >= 5 ? 'Fair' : 'Low'
            }
        };
    }

    /**
     * Get dividend information
     */
    async _getDividends(portfolioId) {
        const portfolioResult = this._getPortfolio(portfolioId);
        
        if (!portfolioResult.success) {
            return portfolioResult;
        }

        const portfolio = portfolioResult.portfolio;
        const dividends = [];
        let totalAnnualDividend = 0;

        for (const holding of portfolio.holdings) {
            try {
                const quote = await toolsAgent._execute_get_stock_price({ ticker: holding.ticker });
                const ratios = await toolsAgent._execute_get_financial_ratios({ ticker: holding.ticker });
                
                const annualDividend = (quote.price || 0) * (ratios.dividendYield || 0) * holding.shares;
                
                dividends.push({
                    ticker: holding.ticker,
                    shares: holding.shares,
                    dividendYield: ratios.dividendYield ? (ratios.dividendYield * 100).toFixed(2) + '%' : 'N/A',
                    annualDividend: this._formatCurrency(annualDividend),
                    monthlyDividend: this._formatCurrency(annualDividend / 12)
                });

                totalAnnualDividend += annualDividend;
            } catch {
                dividends.push({ ticker: holding.ticker, error: 'Failed to fetch' });
            }
        }

        return {
            success: true,
            portfolioId,
            dividends,
            summary: {
                totalAnnualDividend: this._formatCurrency(totalAnnualDividend),
                monthlyIncome: this._formatCurrency(totalAnnualDividend / 12),
                avgYield: dividends.length > 0 
                    ? (dividends.filter(d => !d.error).reduce((sum, d) => sum + parseFloat(d.dividendYield) || 0, 0) / dividends.length).toFixed(2) + '%'
                    : 'N/A'
            }
        };
    }

    /**
     * Suggest rebalancing trades
     */
    async _suggestRebalance(portfolioId, targetAllocation) {
        const allocation = await this._getAllocation(portfolioId);
        
        if (!allocation.success) {
            return allocation;
        }

        // Default equal-weight target
        const defaultTarget = 1 / allocation.allocation.length;
        const suggestions = [];

        for (const holding of allocation.allocation) {
            const target = targetAllocation?.[holding.ticker] || defaultTarget;
            const current = holding.absoluteWeight;
            const diff = target - current;
            
            if (Math.abs(diff) > 0.02) { // Only suggest if >2% difference
                suggestions.push({
                    ticker: holding.ticker,
                    currentWeight: holding.weight,
                    targetWeight: (target * 100).toFixed(2) + '%',
                    action: diff > 0 ? 'BUY' : 'SELL',
                    magnitude: Math.abs(diff * 100).toFixed(1) + '%'
                });
            }
        }

        return {
            success: true,
            portfolioId,
            currentAllocation: allocation.allocation,
            suggestions: suggestions.sort((a, b) => 
                parseFloat(b.magnitude) - parseFloat(a.magnitude)
            ),
            message: suggestions.length > 0 
                ? `${suggestions.length} rebalancing trades suggested`
                : 'Portfolio is well-balanced'
        };
    }

    /**
     * Optimize portfolio based on objective
     */
    async _optimizePortfolio(portfolioId, objective = 'balanced') {
        const analysis = await this._analyzePortfolio(portfolioId);
        
        if (!analysis.success) {
            return analysis;
        }

        const recommendations = [];
        const holdingMetrics = analysis.holdings.filter(h => !h.error);

        switch (objective) {
            case 'growth':
                // Prioritize high PE (growth stocks)
                recommendations.push(...holdingMetrics
                    .filter(h => h.pe < 15)
                    .map(h => ({ action: 'Consider reducing', ticker: h.ticker, reason: 'Low PE suggests value stock' }))
                );
                break;
                
            case 'income':
                // Prioritize dividend yield
                recommendations.push(...holdingMetrics
                    .filter(h => (h.dividendYield || 0) < 0.01)
                    .map(h => ({ action: 'Consider replacing', ticker: h.ticker, reason: 'Low dividend yield' }))
                );
                break;
                
            case 'value':
                // Prioritize low PE
                recommendations.push(...holdingMetrics
                    .filter(h => h.pe > 25)
                    .map(h => ({ action: 'Consider reducing', ticker: h.ticker, reason: 'High PE suggests overvaluation' }))
                );
                break;
                
            case 'balanced':
            default:
                // Suggest diversification
                if (holdingMetrics.length < 8) {
                    recommendations.push({ action: 'Add more holdings', reason: 'Increase diversification' });
                }
                break;
        }

        return {
            success: true,
            portfolioId,
            objective,
            currentState: analysis.summary,
            recommendations,
            message: recommendations.length > 0 
                ? `${recommendations.length} optimization suggestions`
                : 'Portfolio is optimized for ' + objective
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════

    _formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }

    /**
     * Load portfolios from Supabase (for persistence)
     */
    async loadFromStorage(userId) {
        try {
            const response = await fetch(`/api/admin/emma-config?section=portfolios&userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.portfolios) {
                    for (const p of data.portfolios) {
                        this.portfolios.set(p.id, p);
                    }
                    return { success: true, loaded: data.portfolios.length };
                }
            }
        } catch { }
        return { success: false };
    }

    /**
     * Save portfolios to Supabase
     */
    async saveToStorage(userId) {
        try {
            const portfoliosArray = Array.from(this.portfolios.values());
            await fetch('/api/admin/emma-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: 'portfolios',
                    userId,
                    value: JSON.stringify(portfoliosArray)
                })
            });
            return { success: true, saved: portfoliosArray.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export const portfolioAgent = new PortfolioAgent();
export { PortfolioAgent };
