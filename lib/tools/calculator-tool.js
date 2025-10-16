/**
 * Financial Calculator Tool
 * Calculs financiers (ratios, valorisation, métriques)
 */

import BaseTool from './base-tool.js';

export default class CalculatorTool extends BaseTool {
    constructor() {
        super();
        this.name = 'Financial Calculator';
        this.description = 'Calculs financiers et ratios';
    }

    async execute(params, context = {}) {
        try {
            this.validateParams(params, ['operation', 'values']);
            
            const operation = params.operation;
            const values = params.values;
            
            let result;
            
            switch (operation) {
                case 'pe_ratio':
                    result = this.calculatePERatio(values);
                    break;
                case 'market_cap':
                    result = this.calculateMarketCap(values);
                    break;
                case 'dividend_yield':
                    result = this.calculateDividendYield(values);
                    break;
                case 'price_to_book':
                    result = this.calculatePriceToBook(values);
                    break;
                case 'debt_to_equity':
                    result = this.calculateDebtToEquity(values);
                    break;
                case 'return_on_equity':
                    result = this.calculateROE(values);
                    break;
                case 'earnings_growth':
                    result = this.calculateEarningsGrowth(values);
                    break;
                case 'compound_annual_growth':
                    result = this.calculateCAGR(values);
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            return this.formatResult(result, true, {
                operation: operation,
                input_values: values
            });

        } catch (error) {
            return this.handleError(error);
        }
    }

    calculatePERatio(values) {
        const { price, earnings_per_share } = values;
        if (!price || !earnings_per_share || earnings_per_share <= 0) {
            throw new Error('Invalid values for P/E ratio calculation');
        }
        
        const pe_ratio = price / earnings_per_share;
        
        return {
            pe_ratio: pe_ratio.toFixed(2),
            interpretation: this.interpretPERatio(pe_ratio),
            calculation: `${price} / ${earnings_per_share} = ${pe_ratio.toFixed(2)}`
        };
    }

    calculateMarketCap(values) {
        const { price, shares_outstanding } = values;
        if (!price || !shares_outstanding) {
            throw new Error('Invalid values for market cap calculation');
        }
        
        const market_cap = price * shares_outstanding;
        
        return {
            market_cap: market_cap,
            market_cap_formatted: this.formatMarketCap(market_cap),
            calculation: `${price} × ${shares_outstanding.toLocaleString()} = ${market_cap.toLocaleString()}`
        };
    }

    calculateDividendYield(values) {
        const { annual_dividend, price } = values;
        if (!annual_dividend || !price || price <= 0) {
            throw new Error('Invalid values for dividend yield calculation');
        }
        
        const yield_percent = (annual_dividend / price) * 100;
        
        return {
            dividend_yield: yield_percent.toFixed(2) + '%',
            annual_dividend: annual_dividend,
            price: price,
            calculation: `(${annual_dividend} / ${price}) × 100 = ${yield_percent.toFixed(2)}%`
        };
    }

    calculatePriceToBook(values) {
        const { price, book_value_per_share } = values;
        if (!price || !book_value_per_share || book_value_per_share <= 0) {
            throw new Error('Invalid values for P/B ratio calculation');
        }
        
        const pb_ratio = price / book_value_per_share;
        
        return {
            price_to_book: pb_ratio.toFixed(2),
            interpretation: this.interpretPriceToBook(pb_ratio),
            calculation: `${price} / ${book_value_per_share} = ${pb_ratio.toFixed(2)}`
        };
    }

    calculateDebtToEquity(values) {
        const { total_debt, total_equity } = values;
        if (total_debt === undefined || total_equity === undefined || total_equity <= 0) {
            throw new Error('Invalid values for debt-to-equity calculation');
        }
        
        const debt_to_equity = total_debt / total_equity;
        
        return {
            debt_to_equity: debt_to_equity.toFixed(2),
            interpretation: this.interpretDebtToEquity(debt_to_equity),
            calculation: `${total_debt} / ${total_equity} = ${debt_to_equity.toFixed(2)}`
        };
    }

    calculateROE(values) {
        const { net_income, shareholders_equity } = values;
        if (!net_income || !shareholders_equity || shareholders_equity <= 0) {
            throw new Error('Invalid values for ROE calculation');
        }
        
        const roe = (net_income / shareholders_equity) * 100;
        
        return {
            return_on_equity: roe.toFixed(2) + '%',
            interpretation: this.interpretROE(roe),
            calculation: `(${net_income} / ${shareholders_equity}) × 100 = ${roe.toFixed(2)}%`
        };
    }

    calculateEarningsGrowth(values) {
        const { current_earnings, previous_earnings } = values;
        if (!current_earnings || !previous_earnings || previous_earnings <= 0) {
            throw new Error('Invalid values for earnings growth calculation');
        }
        
        const growth_rate = ((current_earnings - previous_earnings) / previous_earnings) * 100;
        
        return {
            earnings_growth: growth_rate.toFixed(2) + '%',
            current_earnings: current_earnings,
            previous_earnings: previous_earnings,
            calculation: `((${current_earnings} - ${previous_earnings}) / ${previous_earnings}) × 100 = ${growth_rate.toFixed(2)}%`
        };
    }

    calculateCAGR(values) {
        const { beginning_value, ending_value, years } = values;
        if (!beginning_value || !ending_value || !years || beginning_value <= 0 || years <= 0) {
            throw new Error('Invalid values for CAGR calculation');
        }
        
        const cagr = (Math.pow(ending_value / beginning_value, 1 / years) - 1) * 100;
        
        return {
            cagr: cagr.toFixed(2) + '%',
            beginning_value: beginning_value,
            ending_value: ending_value,
            years: years,
            calculation: `(((${ending_value} / ${beginning_value})^(1/${years})) - 1) × 100 = ${cagr.toFixed(2)}%`
        };
    }

    // Méthodes d'interprétation
    interpretPERatio(pe) {
        if (pe < 10) return 'Potentiellement sous-évalué';
        if (pe < 15) return 'Évaluation raisonnable';
        if (pe < 25) return 'Évaluation modérée';
        return 'Potentiellement surévalué';
    }

    interpretPriceToBook(pb) {
        if (pb < 1) return 'Potentiellement sous-évalué';
        if (pb < 3) return 'Évaluation raisonnable';
        return 'Potentiellement surévalué';
    }

    interpretDebtToEquity(de) {
        if (de < 0.3) return 'Faible endettement';
        if (de < 0.6) return 'Endettement modéré';
        return 'Endettement élevé';
    }

    interpretROE(roe) {
        if (roe > 15) return 'Excellente rentabilité';
        if (roe > 10) return 'Bonne rentabilité';
        if (roe > 5) return 'Rentabilité modérée';
        return 'Rentabilité faible';
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
