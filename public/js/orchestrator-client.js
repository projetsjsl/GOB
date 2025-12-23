/**
 * ORCHESTRATOR CLIENT
 * 
 * Frontend client for interacting with the Multi-Agent Orchestrator API.
 * Use this in React components, dashboard tabs, or standalone scripts.
 * 
 * Usage:
 *   import { orchestratorClient } from './orchestrator-client.js';
 *   
 *   // Simple query
 *   const result = await orchestratorClient.ask("Analyse AAPL");
 *   
 *   // With persona
 *   const criticism = await orchestratorClient.askAs("critic", "Risques Tesla");
 *   
 *   // Full options
 *   const analysis = await orchestratorClient.process({
 *     message: "Analyse complète",
 *     persona: "finance",
 *     tickers: ["AAPL", "MSFT"],
 *     options: { comprehensive: true }
 *   });
 */

class OrchestratorClient {
    constructor(baseUrl = '/api/orchestrator') {
        this.baseUrl = baseUrl;
        this.currentPersona = 'finance';
        this.lastResponse = null;
    }

    /**
     * Simple ask - auto persona selection
     */
    async ask(message, options = {}) {
        return this.process({ message, ...options });
    }

    /**
     * Ask with specific persona
     */
    async askAs(persona, message, options = {}) {
        return this.process({ message, persona, ...options });
    }

    // =========================================================
    // PERSONA SHORTCUTS
    // =========================================================

    /**
     * Ask Emma Finance (stock analysis)
     */
    async askFinance(message, tickers = []) {
        return this.askAs('finance', message, { tickers });
    }

    /**
     * Ask Emma Critic (contrarian view)
     */
    async askCritic(message, tickers = []) {
        return this.askAs('critic', message, { tickers });
    }

    /**
     * Ask Emma Researcher (deep research)
     */
    async askResearcher(message) {
        return this.askAs('researcher', message, { options: { comprehensive: true } });
    }

    /**
     * Ask Emma Writer (briefings, emails)
     */
    async askWriter(message, format = 'briefing') {
        return this.askAs('writer', message, { options: { format } });
    }

    /**
     * Ask Emma Geek (technical analysis)
     */
    async askGeek(message, tickers = []) {
        return this.askAs('geek', message, { tickers });
    }

    /**
     * Ask Emma Macro (macroeconomic analysis)
     */
    async askMacro(message) {
        return this.askAs('macro', message);
    }

    /**
     * CEO Mode (simulate CEO responses)
     */
    async askCEO(company, question) {
        return this.askAs('ceo', `En tant que CEO de ${company}: ${question}`);
    }

    // =========================================================
    // CORE METHODS
    // =========================================================

    /**
     * Full process method
     */
    async process(request) {
        const { message, persona, tickers, channel, options } = request;

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    persona: persona || this.currentPersona,
                    tickers: tickers || [],
                    channel: channel || 'web',
                    options: options || {}
                })
            });

            const data = await response.json();
            this.lastResponse = data;

            if (data.success) {
                console.log(`✅ [OrchestratorClient] Response received from ${data.persona?.name || 'Orchestrator'}`);
            } else {
                console.warn(`⚠️ [OrchestratorClient] Error: ${data.error}`);
            }

            return data;

        } catch (error) {
            console.error('❌ [OrchestratorClient] Request failed:', error);
            return {
                success: false,
                error: error.message,
                response: null
            };
        }
    }

    /**
     * Get orchestrator status
     */
    async getStatus() {
        try {
            const response = await fetch(`${this.baseUrl}?action=status`);
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available personas
     */
    async getPersonas() {
        try {
            const response = await fetch(`${this.baseUrl}?action=personas`);
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get recommended model for task type
     */
    async getRecommendedModel(taskType = 'stock_analysis') {
        try {
            const response = await fetch(`${this.baseUrl}?action=models&taskType=${taskType}`);
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Set default persona
     */
    setPersona(persona) {
        this.currentPersona = persona;
        console.log(`🎭 [OrchestratorClient] Default persona set to: ${persona}`);
    }

    /**
     * Get last response
     */
    getLastResponse() {
        return this.lastResponse;
    }
}

// Singleton instance
export const orchestratorClient = new OrchestratorClient();

// Also export class for custom instances
export default OrchestratorClient;

/**
 * USAGE FROM BROWSER CONSOLE:
 * 
 * // Simple ask
 * await orchestratorClient.ask("Analyse AAPL")
 * 
 * // With persona
 * await orchestratorClient.askCritic("Quels sont les risques de Tesla?")
 * 
 * // Get personas
 * await orchestratorClient.getPersonas()
 * 
 * // Check status
 * await orchestratorClient.getStatus()
 */

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.orchestratorClient = orchestratorClient;
    window.OrchestratorClient = OrchestratorClient;
    console.log('🤖 OrchestratorClient available globally as window.orchestratorClient');
}
