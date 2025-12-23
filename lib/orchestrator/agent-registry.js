/**
 * AGENT REGISTRY - Centralized Agent Management
 * 
 * This file registers all agents with the MasterOrchestrator.
 * Wraps existing agents to be compatible with BaseAgent interface.
 */

import { BaseAgent } from './base-agent.js';
import { masterOrchestrator } from './master-orchestrator.js';
import { modelSelectorAgent } from './model-selector-agent.js';
import { workflowAgent } from './workflow-agent.js';
import { mcpToolsAgent } from './mcp-tools-agent.js';
import { contextAgent } from './context-agent.js';

// ═══════════════════════════════════════════════════════════════════
// EXISTING AGENT WRAPPERS (adapt old agents to BaseAgent interface)
// ═══════════════════════════════════════════════════════════════════

/**
 * EarningsAgent - Wraps EarningsCalendarAgent
 */
class EarningsAgent extends BaseAgent {
    constructor() {
        super('EarningsAgent', [
            'initialize_yearly_calendar',
            'daily_earnings_check',
            'prepare_pre_earnings_analysis',
            'track_earnings_surprises',
            'get_upcoming_earnings'
        ]);
        
        // Lazy load the original agent
        this._originalAgent = null;
    }
    
    async _getOriginalAgent() {
        if (!this._originalAgent) {
            try {
                const { EarningsCalendarAgent } = await import('../agents/earnings-calendar-agent.js');
                this._originalAgent = new EarningsCalendarAgent();
            } catch (error) {
                console.warn('⚠️ [EarningsAgent] Original agent not available:', error.message);
            }
        }
        return this._originalAgent;
    }
    
    async _executeInternal(task, context) {
        const agent = await this._getOriginalAgent();
        if (!agent) {
            return { error: 'EarningsCalendarAgent not available' };
        }
        
        const { action, tickers, daysAhead, year } = task;
        
        switch (action) {
            case 'initialize_yearly_calendar':
                return agent.initializeYearlyCalendar(tickers || [], year);
                
            case 'daily_earnings_check':
                return agent.dailyEarningsCheck(daysAhead || 7);
                
            case 'prepare_pre_earnings_analysis':
                return agent.preparePreEarningsAnalysis?.(tickers) || { message: 'Not implemented' };
                
            case 'get_upcoming_earnings':
                return agent.dailyEarningsCheck(daysAhead || 14);
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

/**
 * NewsAgent - Wraps NewsMonitoringAgent
 */
class NewsAgent extends BaseAgent {
    constructor() {
        super('NewsAgent', [
            'monitor_news',
            'score_importance',
            'categorize_news',
            'analyze_sentiment',
            'generate_alerts',
            'weekly_digest',
            'get_significant_news'
        ]);
        
        this._originalAgent = null;
    }
    
    async _getOriginalAgent() {
        if (!this._originalAgent) {
            try {
                const { NewsMonitoringAgent } = await import('../agents/news-monitoring-agent.js');
                this._originalAgent = new NewsMonitoringAgent();
            } catch (error) {
                console.warn('⚠️ [NewsAgent] Original agent not available:', error.message);
            }
        }
        return this._originalAgent;
    }
    
    async _executeInternal(task, context) {
        const agent = await this._getOriginalAgent();
        if (!agent) {
            return { error: 'NewsMonitoringAgent not available' };
        }
        
        const { action, tickers, lookbackMinutes } = task;
        
        switch (action) {
            case 'monitor_news':
                return agent.monitorNews(tickers || [], lookbackMinutes || 15);
                
            case 'weekly_digest':
                return agent.generateWeeklyDigest(tickers || []);
                
            case 'get_significant_news':
                return agent.monitorNews(tickers || [], 60 * 24); // Last 24 hours
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

/**
 * SMSAgent - SMS communication handler
 */
class SMSAgent extends BaseAgent {
    constructor() {
        super('SMSAgent', [
            'send_sms',
            'receive_sms',
            'process_command',
            'send_briefing_sms'
        ]);
    }
    
    async _executeInternal(task, context) {
        const { action, phone, message, type } = task;
        
        // Would call the SMS handlers in lib/sms/
        switch (action) {
            case 'send_sms':
                return this._sendSMS(phone, message);
                
            case 'send_briefing_sms':
                return this._sendBriefingSMS(phone, type);
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    
    async _sendSMS(phone, message) {
        try {
            const response = await fetch('/api/emma-n8n', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send_sms', phone, message })
            });
            return response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async _sendBriefingSMS(phone, type) {
        return this._sendSMS(phone, `[Emma Briefing] ${type}`);
    }
}

/**
 * DataAgent - Market data fetching
 */
class DataAgent extends BaseAgent {
    constructor() {
        super('DataAgent', [
            'get_stock_quote',
            'get_company_data',
            'get_market_news',
            'get_earnings_calendar',
            'search_ticker',
            'get_yield_curve'
        ]);
    }
    
    async _executeInternal(task, context) {
        const { action, ticker, tickers, query } = task;
        
        switch (action) {
            case 'get_stock_quote':
                return this._fetchAPI(`/api/fmp?ticker=${ticker}&action=quote`);
                
            case 'get_company_data':
                return this._fetchAPI(`/api/fmp-company-data?ticker=${ticker}`);
                
            case 'get_market_news':
                return this._fetchAPI(`/api/news?ticker=${ticker || 'market'}`);
                
            case 'get_earnings_calendar':
                return this._fetchAPI(`/api/calendar-earnings?tickers=${(tickers || []).join(',')}`);
                
            case 'search_ticker':
                return this._fetchAPI(`/api/fmp-search?q=${query}`);
                
            case 'get_yield_curve':
                return this._fetchAPI('/api/yield-curve');
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    
    async _fetchAPI(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
}

/**
 * BriefingAgent - Email briefing generation
 */
class BriefingAgent extends BaseAgent {
    constructor() {
        super('BriefingAgent', [
            'generate_morning_briefing',
            'generate_noon_update',
            'generate_weekly_digest',
            'send_briefing',
            'schedule_briefing'
        ]);
    }
    
    async _executeInternal(task, context) {
        const { action, type, recipient } = task;
        
        switch (action) {
            case 'generate_morning_briefing':
                return this._generateBriefing('morning');
                
            case 'generate_noon_update':
                return this._generateBriefing('noon');
                
            case 'generate_weekly_digest':
                return this._generateBriefing('weekly');
                
            case 'send_briefing':
                return this._sendBriefing(type, recipient);
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    
    async _generateBriefing(type) {
        try {
            const response = await fetch('/api/briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, action: 'generate' })
            });
            return response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async _sendBriefing(type, recipient) {
        try {
            const response = await fetch('/api/send-briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, recipient })
            });
            return response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// AGENT INSTANCES
// ═══════════════════════════════════════════════════════════════════

export const earningsAgent = new EarningsAgent();
export const newsAgent = new NewsAgent();
export const smsAgent = new SMSAgent();
export const dataAgent = new DataAgent();
export const briefingAgent = new BriefingAgent();

// ═══════════════════════════════════════════════════════════════════
// REGISTER ALL AGENTS WITH ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════

export function registerAllAgents(orchestrator) {
    console.log('📦 [AgentRegistry] Registering all agents...');
    
    // Core agents (already in orchestrator)
    orchestrator.registerAgent('modelSelector', modelSelectorAgent);
    orchestrator.registerAgent('workflow', workflowAgent);
    
    // Specialized agents
    orchestrator.registerAgent('earnings', earningsAgent);
    orchestrator.registerAgent('news', newsAgent);
    orchestrator.registerAgent('sms', smsAgent);
    orchestrator.registerAgent('data', dataAgent);
    orchestrator.registerAgent('briefing', briefingAgent);
    orchestrator.registerAgent('mcp', mcpToolsAgent);
    orchestrator.registerAgent('context', contextAgent);
    
    console.log(`✅ [AgentRegistry] ${Object.keys(orchestrator.agents).length} agents registered`);
    
    return orchestrator;
}

// Auto-register on import
registerAllAgents(masterOrchestrator);

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default {
    earningsAgent,
    newsAgent,
    smsAgent,
    dataAgent,
    briefingAgent,
    registerAllAgents
};
