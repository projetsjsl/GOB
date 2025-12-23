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

    // ═══════════════════════════════════════════════════════════════════
    // CORE CLIENT
    // ═══════════════════════════════════════════════════════════════════

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
                console.log('🎯 [OrchestratorClient] Initialized', status.status?.ready ? '✅' : '⚠️');
            } catch (error) {
                console.warn('⚠️ [OrchestratorClient] Init failed:', error.message);
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

        /** 📊 Finance persona - Stock analysis, dividends, portfolio */
        async askFinance(message, options = {}) {
            return this.askWithPersona('finance', message, options);
        },

        /** ⚖️ Critic persona - Risk analysis, contrarian views */
        async askCritic(message, options = {}) {
            return this.askWithPersona('critic', message, options);
        },

        /** 🔬 Researcher persona - Deep research, citations */
        async askResearcher(message, options = {}) {
            return this.askWithPersona('researcher', message, options);
        },

        /** ✍️ Writer persona - Briefings, emails, reports */
        async askWriter(message, options = {}) {
            return this.askWithPersona('writer', message, options);
        },

        /** 📈 Geek persona - Technical analysis, charts */
        async askGeek(message, options = {}) {
            return this.askWithPersona('geek', message, options);
        },

        /** 👔 CEO persona - Strategic decisions, executive summary */
        async askCEO(message, options = {}) {
            return this.askWithPersona('ceo', message, options);
        },

        /** 🌍 Macro persona - Macroeconomics, rates */
        async askMacro(message, options = {}) {
            return this.askWithPersona('macro', message, options);
        },

        /** 🏛️ Politics persona - Policy impact, regulations */
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
                    console.error('❌ [OrchestratorClient] Error:', data.error);
                }
                
                return data;
            } catch (error) {
                console.error('❌ [OrchestratorClient] Network error:', error);
                return { success: false, error: error.message };
            }
        },

        async _get(action) {
            try {
                const response = await fetch(`${API_ENDPOINT}?action=${action}`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('❌ [OrchestratorClient] GET error:', error);
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
╔══════════════════════════════════════════════════════════════════╗
║              🎯 ORCHESTRATOR CLIENT - QUICK REFERENCE            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  CHAT (natural language):                                        ║
║    orchestratorClient.ask("Analyse AAPL")                        ║
║    orchestratorClient.askFinance("TSLA valuation")               ║
║    orchestratorClient.askCritic("Risques marché")                ║
║    orchestratorClient.askWriter("Briefing matinal")              ║
║                                                                   ║
║  AGENTS (direct calls):                                          ║
║    orchestratorClient.getStockQuote("AAPL")                      ║
║    orchestratorClient.getNews(["AAPL", "MSFT"])                  ║
║    orchestratorClient.getEarnings(7)                             ║
║    orchestratorClient.generateBriefing("morning")                ║
║    orchestratorClient.runWorkflow("morning_briefing")            ║
║                                                                   ║
║  INFO:                                                           ║
║    orchestratorClient.getStatus()                                ║
║    orchestratorClient.getPersonas()                              ║
║    orchestratorClient.getAgents()                                ║
║                                                                   ║
║  PERSONAS: finance, critic, researcher, writer,                  ║
║            geek, ceo, macro, politics                            ║
║                                                                   ║
║  AGENTS: data, news, earnings, briefing, sms, workflow           ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
            `);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // EXPORT TO GLOBAL SCOPE
    // ═══════════════════════════════════════════════════════════════════

    // Make available globally
    global.orchestratorClient = orchestratorClient;
    
    // Also expose as window.emma for convenience
    global.emma = orchestratorClient;

    // Auto-init on load
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            orchestratorClient.init().then(() => {
                console.log('🎯 Orchestrator ready. Type orchestratorClient.help() for commands.');
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
