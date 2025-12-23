/**
 * TOOLS AGENT - Function Calling for Structured Data
 * 
 * Provides structured function calling for AI models.
 * Each tool is a well-defined function that returns structured data.
 * 
 * Used by the orchestrator to execute specific operations
 * and return structured results.
 */

import { BaseAgent } from './base-agent.js';

// ═══════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS (OpenAI-style function calling format)
// ═══════════════════════════════════════════════════════════════════

const TOOLS = {
    get_stock_price: {
        name: 'get_stock_price',
        description: 'Get the current stock price and basic quote data',
        parameters: {
            type: 'object',
            properties: {
                ticker: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL)' }
            },
            required: ['ticker']
        }
    },
    get_company_profile: {
        name: 'get_company_profile',
        description: 'Get company profile including sector, industry, description',
        parameters: {
            type: 'object',
            properties: {
                ticker: { type: 'string', description: 'Stock ticker symbol' }
            },
            required: ['ticker']
        }
    },
    get_financial_ratios: {
        name: 'get_financial_ratios',
        description: 'Get key financial ratios (P/E, ROE, Debt/Equity, etc.)',
        parameters: {
            type: 'object',
            properties: {
                ticker: { type: 'string', description: 'Stock ticker symbol' }
            },
            required: ['ticker']
        }
    },
    get_earnings_calendar: {
        name: 'get_earnings_calendar',
        description: 'Get upcoming earnings dates for stocks',
        parameters: {
            type: 'object',
            properties: {
                tickers: { type: 'array', items: { type: 'string' }, description: 'Stock tickers' },
                daysAhead: { type: 'number', description: 'Days to look ahead', default: 14 }
            },
            required: ['tickers']
        }
    },
    search_ticker: {
        name: 'search_ticker',
        description: 'Search for a stock ticker by company name',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Company name or partial ticker' }
            },
            required: ['query']
        }
    },
    get_market_news: {
        name: 'get_market_news',
        description: 'Get recent market news, optionally for a specific stock',
        parameters: {
            type: 'object',
            properties: {
                ticker: { type: 'string', description: 'Stock ticker (optional)' },
                limit: { type: 'number', description: 'Number of articles', default: 10 }
            }
        }
    },
    get_yield_curve: {
        name: 'get_yield_curve',
        description: 'Get current US/Canada yield curve data',
        parameters: {
            type: 'object',
            properties: {
                country: { type: 'string', enum: ['us', 'canada', 'both'], default: 'both' }
            }
        }
    },
    get_portfolio_analysis: {
        name: 'get_portfolio_analysis',
        description: 'Analyze a portfolio of stocks',
        parameters: {
            type: 'object',
            properties: {
                tickers: { type: 'array', items: { type: 'string' }, description: 'Portfolio tickers' },
                weights: { type: 'array', items: { type: 'number' }, description: 'Optional weights' }
            },
            required: ['tickers']
        }
    },
    compare_stocks: {
        name: 'compare_stocks',
        description: 'Compare multiple stocks side by side',
        parameters: {
            type: 'object',
            properties: {
                tickers: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
                metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics to compare' }
            },
            required: ['tickers']
        }
    },
    calculate_dcf: {
        name: 'calculate_dcf',
        description: 'Calculate discounted cash flow valuation',
        parameters: {
            type: 'object',
            properties: {
                ticker: { type: 'string', description: 'Stock ticker' },
                growthRate: { type: 'number', description: 'Expected growth rate %' },
                discountRate: { type: 'number', description: 'Discount rate %', default: 10 }
            },
            required: ['ticker']
        }
    }
};

// ═══════════════════════════════════════════════════════════════════
// TOOLS AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class ToolsAgent extends BaseAgent {
    constructor() {
        super('ToolsAgent', [
            'list_tools',
            'get_tool_schema',
            'execute_tool',
            ...Object.keys(TOOLS)
        ]);
        
        this.tools = TOOLS;
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        // Meta actions
        if (action === 'list_tools') {
            return this._listTools();
        }
        if (action === 'get_tool_schema') {
            return this._getToolSchema(params.toolName);
        }
        if (action === 'execute_tool') {
            return this._executeTool(params.toolName, params.arguments);
        }

        // Direct tool execution
        if (this.tools[action]) {
            return this._executeTool(action, params);
        }

        throw new Error(`Unknown tool or action: ${action}`);
    }

    /**
     * List all available tools
     */
    _listTools() {
        const tools = Object.values(this.tools).map(t => ({
            name: t.name,
            description: t.description,
            parameters: Object.keys(t.parameters.properties || {})
        }));

        return {
            success: true,
            tools,
            count: tools.length,
            format: 'OpenAI function calling compatible'
        };
    }

    /**
     * Get full schema for a tool
     */
    _getToolSchema(toolName) {
        const tool = this.tools[toolName];
        if (!tool) {
            return { success: false, error: `Tool not found: ${toolName}` };
        }

        return {
            success: true,
            tool: {
                type: 'function',
                function: tool
            }
        };
    }

    /**
     * Execute a tool with arguments
     */
    async _executeTool(toolName, args = {}) {
        const tool = this.tools[toolName];
        if (!tool) {
            return { success: false, error: `Tool not found: ${toolName}` };
        }

        // Validate required parameters
        const required = tool.parameters.required || [];
        for (const param of required) {
            if (args[param] === undefined) {
                return { 
                    success: false, 
                    error: `Missing required parameter: ${param}`,
                    tool: toolName
                };
            }
        }

        // Execute based on tool name
        try {
            const result = await this[`_execute_${toolName}`](args);
            return {
                success: true,
                tool: toolName,
                result
            };
        } catch (error) {
            return {
                success: false,
                tool: toolName,
                error: error.message
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TOOL IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════

    async _execute_get_stock_price({ ticker }) {
        const response = await fetch(`/api/fmp?ticker=${ticker}&action=quote`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        
        return {
            ticker,
            price: data.c || data.price,
            change: data.d || data.change,
            changePercent: data.dp || data.changesPercentage,
            high: data.h || data.dayHigh,
            low: data.l || data.dayLow,
            volume: data.v || data.volume,
            timestamp: new Date().toISOString()
        };
    }

    async _execute_get_company_profile({ ticker }) {
        const response = await fetch(`/api/fmp-company-data?ticker=${ticker}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        
        return {
            ticker,
            name: data.companyName || data.name,
            sector: data.sector,
            industry: data.industry,
            country: data.country,
            marketCap: data.mktCap || data.marketCap,
            employees: data.fullTimeEmployees,
            description: data.description?.substring(0, 500),
            website: data.website,
            ceo: data.ceo
        };
    }

    async _execute_get_financial_ratios({ ticker }) {
        const response = await fetch(`/api/fmp?ticker=${ticker}&action=ratios`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        const ratios = Array.isArray(data) ? data[0] : data;
        
        return {
            ticker,
            pe: ratios.peRatioTTM,
            peg: ratios.pegRatioTTM,
            pb: ratios.priceToBookRatioTTM,
            ps: ratios.priceToSalesRatioTTM,
            roe: ratios.returnOnEquityTTM,
            roa: ratios.returnOnAssetsTTM,
            debtEquity: ratios.debtEquityRatioTTM,
            currentRatio: ratios.currentRatioTTM,
            grossMargin: ratios.grossProfitMarginTTM,
            netMargin: ratios.netProfitMarginTTM,
            dividendYield: ratios.dividendYieldTTM
        };
    }

    async _execute_get_earnings_calendar({ tickers, daysAhead = 14 }) {
        const tickerStr = tickers.join(',');
        const response = await fetch(`/api/calendar-earnings?tickers=${tickerStr}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        
        return {
            earnings: data.earnings || data,
            count: (data.earnings || data)?.length || 0,
            daysAhead
        };
    }

    async _execute_search_ticker({ query }) {
        const response = await fetch(`/api/fmp-search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        
        return {
            query,
            results: (data || []).slice(0, 10).map(r => ({
                symbol: r.symbol,
                name: r.name,
                exchange: r.exchangeShortName || r.exchange
            }))
        };
    }

    async _execute_get_market_news({ ticker, limit = 10 }) {
        const url = ticker ? `/api/news?ticker=${ticker}` : '/api/news';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        
        const news = (data.news || data || []).slice(0, limit);
        return {
            ticker: ticker || 'market',
            news: news.map(n => ({
                title: n.title,
                source: n.site || n.source,
                date: n.publishedDate || n.date,
                url: n.url
            })),
            count: news.length
        };
    }

    async _execute_get_yield_curve({ country = 'both' }) {
        const response = await fetch('/api/yield-curve');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        
        if (country === 'us') return { us: data.us };
        if (country === 'canada') return { canada: data.canada };
        return data;
    }

    async _execute_get_portfolio_analysis({ tickers, weights }) {
        // Fetch data for all tickers
        const results = await Promise.all(
            tickers.map(async (ticker, i) => {
                try {
                    const quote = await this._execute_get_stock_price({ ticker });
                    const ratios = await this._execute_get_financial_ratios({ ticker });
                    return {
                        ticker,
                        weight: weights?.[i] || (1 / tickers.length),
                        ...quote,
                        ...ratios
                    };
                } catch {
                    return { ticker, error: 'Failed to fetch data' };
                }
            })
        );

        // Calculate portfolio metrics
        const validResults = results.filter(r => !r.error);
        const avgPE = validResults.reduce((sum, r) => sum + (r.pe || 0) * r.weight, 0);
        const avgROE = validResults.reduce((sum, r) => sum + (r.roe || 0) * r.weight, 0);
        const avgDY = validResults.reduce((sum, r) => sum + (r.dividendYield || 0) * r.weight, 0);

        return {
            holdings: results,
            summary: {
                weightedPE: avgPE.toFixed(2),
                weightedROE: (avgROE * 100).toFixed(2) + '%',
                weightedDividendYield: (avgDY * 100).toFixed(2) + '%',
                count: tickers.length,
                dataAvailable: validResults.length
            }
        };
    }

    async _execute_compare_stocks({ tickers, metrics }) {
        const defaultMetrics = ['price', 'changePercent', 'pe', 'roe', 'dividendYield'];
        const selectedMetrics = metrics || defaultMetrics;

        const comparisons = await Promise.all(
            tickers.map(async (ticker) => {
                try {
                    const quote = await this._execute_get_stock_price({ ticker });
                    const ratios = await this._execute_get_financial_ratios({ ticker });
                    return { ticker, ...quote, ...ratios };
                } catch {
                    return { ticker, error: 'Failed to fetch' };
                }
            })
        );

        return {
            tickers,
            metrics: selectedMetrics,
            comparison: comparisons.map(c => {
                const filtered = { ticker: c.ticker };
                for (const m of selectedMetrics) {
                    filtered[m] = c[m];
                }
                return filtered;
            })
        };
    }

    async _execute_calculate_dcf({ ticker, growthRate, discountRate = 10 }) {
        // Get current financials
        const ratios = await this._execute_get_financial_ratios({ ticker });
        const profile = await this._execute_get_company_profile({ ticker });
        const quote = await this._execute_get_stock_price({ ticker });

        // Simplified DCF calculation
        const currentPrice = quote.price;
        const estimatedFCF = (profile.marketCap / ratios.pe) || 0;
        
        // 5-year projection
        let totalPV = 0;
        for (let year = 1; year <= 5; year++) {
            const futureFCF = estimatedFCF * Math.pow(1 + (growthRate || 10) / 100, year);
            const presentValue = futureFCF / Math.pow(1 + discountRate / 100, year);
            totalPV += presentValue;
        }

        // Terminal value
        const terminalGrowth = 2.5;  // Perpetual growth rate
        const terminalValue = (estimatedFCF * Math.pow(1 + (growthRate || 10) / 100, 5) * (1 + terminalGrowth / 100)) 
                              / (discountRate / 100 - terminalGrowth / 100);
        const pvTerminal = terminalValue / Math.pow(1 + discountRate / 100, 5);

        const intrinsicValue = totalPV + pvTerminal;
        const upside = ((intrinsicValue / profile.marketCap - 1) * 100).toFixed(1);

        return {
            ticker,
            currentPrice,
            marketCap: profile.marketCap,
            inputs: { growthRate: growthRate || 10, discountRate },
            dcfValue: Math.round(intrinsicValue),
            impliedUpside: `${upside}%`,
            recommendation: parseFloat(upside) > 20 ? 'Undervalued' :
                           parseFloat(upside) < -20 ? 'Overvalued' : 'Fair Value'
        };
    }

    /**
     * Get all tools in OpenAI function calling format
     */
    getOpenAITools() {
        return Object.values(this.tools).map(tool => ({
            type: 'function',
            function: tool
        }));
    }
}

export const toolsAgent = new ToolsAgent();
export { ToolsAgent, TOOLS };
