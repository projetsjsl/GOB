/**
 * BASE AGENT - Abstract Base Class for All Agents
 * 
 * All specialized agents inherit from this class.
 * Provides common interface for execution, logging, and tool access.
 */

export class BaseAgent {
    constructor(name, capabilities = []) {
        this.name = name;
        this.capabilities = capabilities;
        this.executionCount = 0;
        this.lastExecution = null;
        this.errors = [];
    }

    /**
     * Check if this agent can handle the given task
     * @param {Object} task - Task to evaluate
     * @returns {boolean}
     */
    canHandle(task) {
        if (!task || !task.action) return false;
        return this.capabilities.includes(task.action);
    }

    /**
     * Execute the agent's main logic
     * @param {Object} task - Task details
     * @param {Object} context - Execution context
     * @returns {Promise<Object>} - Execution result
     */
    async execute(task, context = {}) {
        const startTime = Date.now();
        this.executionCount++;
        
        try {
            console.log(`🤖 [${this.name}] Executing: ${task.action || 'unknown'}`);
            
            const result = await this._executeInternal(task, context);
            
            this.lastExecution = {
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime,
                success: true,
                task
            };
            
            console.log(`✅ [${this.name}] Completed in ${Date.now() - startTime}ms`);
            return {
                success: true,
                agent: this.name,
                result,
                duration: Date.now() - startTime
            };
            
        } catch (error) {
            console.error(`❌ [${this.name}] Error:`, error.message);
            
            this.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                task
            });
            
            this.lastExecution = {
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime,
                success: false,
                error: error.message
            };
            
            return {
                success: false,
                agent: this.name,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Internal execution - to be implemented by subclasses
     * @param {Object} task 
     * @param {Object} context 
     */
    async _executeInternal(task, context) {
        throw new Error(`${this.name}._executeInternal() must be implemented`);
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            name: this.name,
            capabilities: this.capabilities,
            executions: this.executionCount,
            lastExecution: this.lastExecution,
            errorCount: this.errors.length,
            healthy: this.errors.length < 5
        };
    }

    /**
     * Reset error state
     */
    resetErrors() {
        this.errors = [];
    }
}

export default BaseAgent;
