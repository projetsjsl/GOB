/**
 * ORCHESTRATOR CLIENT - Universal AI Interface for Frontend
 * 
 * This client provides easy access to the Multi-Agent Orchestrator
 * from any frontend code, chatbot, or prompt interface.
 * 
 * Load in your HTML:
 *   <script src="/js/orchestrator-client.js"></script>
 * 
 * Then use anywhere:
 *   const response = await orchestratorClient.ask("Analyse AAPL");
 *   const financeResponse = await orchestratorClient.askFinance("TSLA");
 *   const data = await orchestratorClient.agent("data", "get_stock_quote", { ticker: "AAPL" });
 */

(function(global) {
    'use strict';

    const API_ENDPOINT = '/api/orchestrator';

    // 
    // CORE CLIENT
    // 

    const orchestratorClient = {
        version: '2.0',
        initialized: false,
        lastResponse: null,

        // =============================================================
        // INITIALIZATION
        // =============================================================

        async init() {
            if (this.initialized) return this;
            
            try {
                const status = await this.getStatus();
                this.initialized = status.success;
                console.log(' [OrchestratorClient] Initialized', status.status?.ready ? '' : '');
            } catch (error) {
                console.warn(' [OrchestratorClient] Init failed:', error.message);
            }
            
            return this;
        },

        // =============================================================
        // MAIN CHAT API - Universal message processing
        // =============================================================

        /**
         * Send a message to the orchestrator (auto persona selection)
         * @param {string} message - The user message
         * @param {object} options - Additional options
         * @returns {Promise<object>} Response from orchestrator
         */
        async ask(message, options = {}) {
            return this._post({ message, ...options });
        },

        /**
         * Send a message with a specific persona
         * @param {string} persona - The Emma persona to use
         * @param {string} message - The user message
         * @param {object} options - Additional options
         * @returns {Promise<object>} Response from orchestrator
         */
        async askWithPersona(persona, message, options = {}) {
            return this._post({ message, persona, ...options });
        },

        // =============================================================
        // PERSONA SHORTCUTS - Quick access to each Emma personality
        // =============================================================

        /**  Finance persona - Stock analysis, dividends, portfolio */
        async askFinance(message, options = {}) {
            return this.askWithPersona('finance', message, options);
        },

        /**  Critic persona - Risk analysis, contrarian views */
        async askCritic(message, options = {}) {
            return this.askWithPersona('critic', message, options);
        },

        /**  Researcher persona - Deep research, citations */
        async askResearcher(message, options = {}) {
            return this.askWithPersona('researcher', message, options);
        },

        /**  Writer persona - Briefings, emails, reports */
        async askWriter(message, options = {}) {
            return this.askWithPersona('writer', message, options);
        },

        /**  Geek persona - Technical analysis, charts */
        async askGeek(message, options = {}) {
            return this.askWithPersona('geek', message, options);
        },

        /**  CEO persona - Strategic decisions, executive summary */
        async askCEO(message, options = {}) {
            return this.askWithPersona('ceo', message, options);
        },

        /**  Macro persona - Macroeconomics, rates */
        async askMacro(message, options = {}) {
            return this.askWithPersona('macro', message, options);
        },

        /**  Politics persona - Policy impact, regulations */
        async askPolitics(message, options = {}) {
            return this.askWithPersona('politics', message, options);
        },

        // =============================================================
        // AGENT API - Direct agent calls
        // =============================================================

        /**
         * Call a specific agent directly
         * @param {string} agentName - The agent to call (data, news, earnings, etc.)
         * @param {string} action - The action to execute
         * @param {object} params - Action parameters
         * @returns {Promise<object>} Agent response
         */
        async agent(agentName, action, params = {}) {
            return this._post({
                agent: agentName,
                action,
                ...params
            });
        },

        // Agent shortcuts
        async getStockQuote(ticker) {
            return this.agent('data', 'get_stock_quote', { ticker });
        },

        async getCompanyData(ticker) {
            return this.agent('data', 'get_company_data', { ticker });
        },

        async getNews(tickers, lookbackMinutes = 60) {
            return this.agent('news', 'monitor_news', { tickers, lookbackMinutes });
        },

        async getEarnings(daysAhead = 7) {
            return this.agent('earnings', 'daily_earnings_check', { daysAhead });
        },

        async generateBriefing(type = 'morning') {
            return this.agent('briefing', `generate_${type}_briefing`, {});
        },

        async runWorkflow(workflowId) {
            return this.agent('workflow', 'execute_workflow', { workflowId });
        },

        // =============================================================
        // STREAMING API - Real-time responses
        // =============================================================

        /**
         * Stream a response word-by-word (returns EventSource)
         * @param {string} message - The message
         * @param {object} options - Options (persona, tickers)
         * @param {function} onChunk - Callback for each chunk
         * @param {function} onDone - Callback when complete
         * @param {function} onError - Callback on error
         */
        askStream(message, options = {}, callbacks = {}) {
            const { persona, tickers } = options;
            const { onChunk, onDone, onError, onStart } = callbacks;
            
            const params = new URLSearchParams({ message });
            if (persona) params.append('persona', persona);
            if (tickers) params.append('tickers', tickers.join(','));
            
            const eventSource = new EventSource(`/api/orchestrator-stream?${params}`);
            let responseText = '';
            
            eventSource.addEventListener('start', (e) => {
                const data = JSON.parse(e.data);
                if (onStart) onStart(data);
            });
            
            eventSource.addEventListener('chunk', (e) => {
                const data = JSON.parse(e.data);
                responseText += data.text;
                if (onChunk) onChunk(data.text, responseText);
            });
            
            eventSource.addEventListener('done', (e) => {
                const data = JSON.parse(e.data);
                eventSource.close();
                if (onDone) onDone({ ...data, response: responseText });
            });
            
            eventSource.addEventListener('error', (e) => {
                eventSource.close();
                if (onError) onError(e);
            });
            
            // Return control object
            return {
                eventSource,
                stop: () => eventSource.close(),
                getResponse: () => responseText
            };
        },

        // =============================================================
        // CONTEXT API - Session management
        // =============================================================

        async getContext(sessionId = 'default') {
            return this.agent('context', 'get_context', { sessionId });
        },

        async addToHistory(role, content, sessionId = 'default') {
            return this.agent('context', 'add_message', { sessionId, role, content });
        },

        async getHistory(limit = 20, sessionId = 'default') {
            return this.agent('context', 'get_history', { sessionId, limit });
        },

        async clearHistory(sessionId = 'default') {
            return this.agent('context', 'clear_history', { sessionId });
        },

        async setPreferences(preferences, sessionId = 'default') {
            return this.agent('context', 'set_user_preferences', { sessionId, preferences });
        },

        // =============================================================
        // MCP API - Model Context Protocol tools
        // =============================================================

        async listMCPTools() {
            return this.agent('mcp', 'list_mcp_tools', {});
        },

        async callMCP(server, tool, params = {}) {
            return this.agent('mcp', 'execute_mcp_tool', { server, tool, params });
        },

        async perplexityAsk(query) {
            return this.agent('mcp', 'perplexity_ask', { query });
        },

        async supabaseQuery(query, projectId) {
            return this.agent('mcp', 'supabase_query', { query, projectId });
        },

        // =============================================================
        // RESEARCH API - Deep financial analysis
        // =============================================================

        async analyzeStock(ticker) {
            return this.agent('research', 'analyze_stock', { ticker });
        },

        async comparePeers(ticker, peers) {
            return this.agent('research', 'compare_peers', { ticker, peers });
        },

        async getBullBear(ticker) {
            return this.agent('research', 'generate_bull_bear', { ticker });
        },

        async assessRisk(ticker) {
            return this.agent('research', 'assess_risk', { ticker });
        },

        async deepDive(ticker) {
            return this.agent('research', 'deep_dive', { ticker });
        },

        async generateThesis(ticker, stance = 'neutral') {
            return this.agent('research', 'generate_thesis', { ticker, stance });
        },

        // =============================================================
        // TOOLS API - Function calling
        // =============================================================

        async getTools() {
            return this.agent('tools', 'list_tools', {});
        },

        async executeTool(toolName, args) {
            return this.agent('tools', 'execute_tool', { toolName, arguments: args });
        },

        async calculateDCF(ticker, growthRate, discountRate) {
            return this.agent('tools', 'calculate_dcf', { ticker, growthRate, discountRate });
        },

        async getYieldCurve(country = 'both') {
            return this.agent('tools', 'get_yield_curve', { country });
        },

        // =============================================================
        // ANALYTICS API - Usage tracking
        // =============================================================

        async getAnalytics(timeRange = '24h') {
            return this.agent('analytics', 'get_stats', { timeRange });
        },

        async getLatencyReport() {
            return this.agent('analytics', 'get_latency_report', {});
        },

        async exportAnalytics() {
            return this.agent('analytics', 'export_analytics', {});
        },

        // =============================================================
        // PORTFOLIO API - Portfolio management
        // =============================================================

        async createPortfolio(portfolioId, name, holdings = []) {
            return this.agent('portfolio', 'create_portfolio', { portfolioId, name, holdings });
        },

        async getPortfolio(portfolioId = 'default') {
            return this.agent('portfolio', 'get_portfolio', { portfolioId });
        },

        async addHolding(ticker, shares, costBasis, portfolioId = 'default') {
            return this.agent('portfolio', 'add_holding', { portfolioId, ticker, shares, costBasis });
        },

        async analyzePortfolio(portfolioId = 'default') {
            return this.agent('portfolio', 'analyze_portfolio', { portfolioId });
        },

        async getPortfolioDividends(portfolioId = 'default') {
            return this.agent('portfolio', 'get_dividends', { portfolioId });
        },

        async suggestRebalance(portfolioId = 'default') {
            return this.agent('portfolio', 'suggest_rebalance', { portfolioId });
        },

        // =============================================================
        // ALERT API - Price alerts & notifications
        // =============================================================

        async createAlert(ticker, type, value, channels = ['email']) {
            return this.agent('alert', 'create_alert', { ticker, type, value, channels });
        },

        async getAlerts(ticker) {
            return this.agent('alert', 'get_alerts', { ticker });
        },

        async checkAlerts() {
            return this.agent('alert', 'check_alerts', {});
        },

        async setAlertChannel(channel, destination) {
            return this.agent('alert', 'set_notification_channel', { channel, destination });
        },

        // =============================================================
        // SCHEDULER API - Cron-based automation
        // =============================================================

        async createSchedule(name, cron, taskAgent, taskAction, taskParams = {}) {
            return this.agent('scheduler', 'create_schedule', { 
                name, cron, taskAgent, taskAction, taskParams 
            });
        },

        async getSchedules() {
            return this.agent('scheduler', 'get_schedules', {});
        },

        async pauseSchedule(scheduleId) {
            return this.agent('scheduler', 'pause_schedule', { scheduleId });
        },

        async resumeSchedule(scheduleId) {
            return this.agent('scheduler', 'resume_schedule', { scheduleId });
        },

        async runScheduleNow(scheduleId) {
            return this.agent('scheduler', 'run_now', { scheduleId });
        },

        async getNextRuns(count = 10) {
            return this.agent('scheduler', 'get_next_runs', { count });
        },

        // =============================================================
        // METADATA API - Get orchestrator info
        // =============================================================

        async getStatus() {
            return this._get('status');
        },

        async getPersonas() {
            return this._get('personas');
        },

        async getModels(taskType = 'stock_analysis') {
            return this._get(`models&taskType=${taskType}`);
        },

        async getAgents() {
            return this._get('agents');
        },

        // =============================================================
        // INTERNAL METHODS
        // =============================================================

        async _post(body) {
            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const data = await response.json();
                this.lastResponse = data;
                
                if (!response.ok) {
                    console.error(' [OrchestratorClient] Error:', data.error);
                }
                
                return data;
            } catch (error) {
                console.error(' [OrchestratorClient] Network error:', error);
                return { success: false, error: error.message };
            }
        },

        async _get(action) {
            try {
                const response = await fetch(`${API_ENDPOINT}?action=${action}`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error(' [OrchestratorClient] GET error:', error);
                return { success: false, error: error.message };
            }
        },

        // =============================================================
        // UTILITY METHODS
        // =============================================================

        /**
         * Get just the response text from a result
         */
        getResponseText(result) {
            if (!result) return '';
            return result.response || result.result?.response || result.result || '';
        },

        /**
         * Check if last response used real-time data
         */
        wasRealtime() {
            return this.lastResponse?.metadata?.realtimeUsed || false;
        },

        /**
         * Get the model used in last response
         */
        getLastModel() {
            return this.lastResponse?.model || this.lastResponse?.result?.model || null;
        },

        /**
         * Print help in console
         */
        help() {
            console.log(`

                     JLAB ORCHESTRATOR - QUICK REFERENCE                    

                                                                               
   CHAT:  emma.ask("Analyse AAPL") | emma.askFinance() | emma.askStream()   
                                                                               
   RESEARCH:  emma.analyzeStock("AAPL") | emma.deepDive() | emma.getBullBear()
                emma.assessRisk() | emma.generateThesis() | emma.comparePeers()
                                                                               
   PORTFOLIO:  emma.createPortfolio() | emma.addHolding() | emma.analyzePortfolio()
                 emma.getPortfolioDividends() | emma.suggestRebalance()        
                                                                               
   ALERTS:  emma.createAlert("AAPL", "price_above", 200) | emma.checkAlerts()
              emma.setAlertChannel("email", "you@email.com")                   
                                                                               
   SCHEDULER:  emma.createSchedule("Morning", "@daily", "briefing", "generate")
                 emma.getSchedules() | emma.runScheduleNow() | emma.getNextRuns()
                                                                               
   TOOLS:  emma.getStockQuote() | emma.calculateDCF() | emma.getYieldCurve() 
                                                                               
   ANALYTICS:  emma.getAnalytics("24h") | emma.getLatencyReport()            
                                                                               
   CONTEXT:  emma.getHistory() | emma.clearHistory() | emma.setPreferences() 
                                                                               
   MCP:  emma.listMCPTools() | emma.perplexityAsk() | emma.supabaseQuery()   
                                                                               
  i  INFO:  emma.getStatus() | emma.getPersonas() | emma.getAgents()          
                                                                               
   PERSONAS: finance, critic, researcher, writer, geek, ceo, macro, politics
   AGENTS (15): data, news, earnings, briefing, research, tools, analytics, 
                  mcp, context, portfolio, alert, scheduler, workflow, model   

            `);
        }
    };

    // 
    // EXPORT TO GLOBAL SCOPE
    // 

    // Make available globally
    global.orchestratorClient = orchestratorClient;
    
    // Also expose as window.emma for convenience
    global.emma = orchestratorClient;

    // Auto-init on load
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            orchestratorClient.init().then(() => {
                console.log(' Orchestrator ready. Type orchestratorClient.help() for commands.');
            });
        });
    }

    // AMD/CommonJS support
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = orchestratorClient;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return orchestratorClient; });
    }

})(typeof window !== 'undefined' ? window : global);
