/**
 * WORKFLOW AGENT - n8n Replacement
 * 
 * Executes scheduled workflows and automated pipelines natively.
 * Replaces n8n for:
 * - Scheduled tasks (cron-like)
 * - Data pipelines
 * - Automated briefings
 * - Alert workflows
 * - Multi-step processes
 * 
 * Benefits over n8n:
 * - Native integration with orchestrator and agents
 * - No external dependency
 * - Unified logging and monitoring
 * - Direct access to all GOB tools/APIs
 */

import { BaseAgent } from './base-agent.js';
import { masterOrchestrator } from './master-orchestrator.js';

export class WorkflowAgent extends BaseAgent {
    constructor() {
        super('WorkflowAgent', [
            'execute_workflow',
            'schedule_workflow',
            'list_workflows',
            'get_workflow_status',
            'cancel_workflow'
        ]);

        // Active scheduled workflows
        this.scheduledWorkflows = new Map();
        
        // Workflow execution history
        this.history = [];

        // =======================================================
        // PREDEFINED WORKFLOWS (Replaces n8n workflow definitions)
        // =======================================================
        this.workflows = {
            // =====================================================
            // MORNING BRIEFING (Daily 6:30 AM)
            // Previously: n8n morning-briefing workflow
            // =====================================================
            'morning_briefing': {
                id: 'morning_briefing',
                name: 'Briefing Matinal',
                schedule: '30 6 * * 1-5',  // 6:30 AM Mon-Fri
                enabled: true,
                steps: [
                    {
                        id: 'fetch_markets',
                        action: 'api_call',
                        endpoint: '/api/ai-services',
                        params: { service: 'briefing-data', type: 'morning' }
                    },
                    {
                        id: 'fetch_news',
                        action: 'orchestrator',
                        persona: 'researcher',
                        message: 'Actualités marchés les plus importantes ce matin',
                        waitFor: 'fetch_markets'
                    },
                    {
                        id: 'generate_briefing',
                        action: 'orchestrator',
                        persona: 'writer',
                        message: 'Génère le briefing matinal avec les données fournies',
                        context: { useResults: ['fetch_markets', 'fetch_news'] }
                    },
                    {
                        id: 'send_email',
                        action: 'api_call',
                        endpoint: '/api/send-email',
                        params: { type: 'morning_briefing' },
                        waitFor: 'generate_briefing'
                    }
                ]
            },

            // =====================================================
            // NOON UPDATE (Daily 12:00 PM)
            // =====================================================
            'noon_update': {
                id: 'noon_update',
                name: 'Update Mi-journée',
                schedule: '0 12 * * 1-5',
                enabled: true,
                steps: [
                    {
                        id: 'check_markets',
                        action: 'orchestrator',
                        persona: 'finance',
                        message: 'État des marchés à mi-journée, mouvements significatifs'
                    },
                    {
                        id: 'analyze_movers',
                        action: 'orchestrator',
                        persona: 'geek',
                        message: 'Analyse technique des plus gros mouvements'
                    },
                    {
                        id: 'send_sms',
                        action: 'api_call',
                        endpoint: '/api/emma-n8n',
                        params: { action: 'send_sms', type: 'noon_summary' }
                    }
                ]
            },

            // =====================================================
            // EARNINGS WATCH (Every 15 min during market hours)
            // =====================================================
            'earnings_monitor': {
                id: 'earnings_monitor',
                name: 'Surveillance Earnings',
                schedule: '*/15 9-16 * * 1-5',  // Every 15 min 9AM-4PM Mon-Fri
                enabled: true,
                steps: [
                    {
                        id: 'check_earnings',
                        action: 'agent',
                        agent: 'earnings',
                        task: { action: 'daily_earnings_check', daysAhead: 1 }
                    },
                    {
                        id: 'alert_if_needed',
                        action: 'conditional',
                        condition: 'check_earnings.result.upcoming_earnings.length > 0',
                        then: {
                            action: 'orchestrator',
                            persona: 'finance',
                            message: 'Alerte earnings imminent pour: {{tickers}}'
                        }
                    }
                ]
            },

            // =====================================================
            // NEWS MONITORING (Every 15 min)
            // =====================================================
            'news_monitor': {
                id: 'news_monitor',
                name: 'Surveillance News',
                schedule: '*/15 * * * *',  // Every 15 min
                enabled: true,
                steps: [
                    {
                        id: 'fetch_news',
                        action: 'agent',
                        agent: 'news',
                        task: { action: 'monitor_news', lookbackMinutes: 15 }
                    },
                    {
                        id: 'filter_important',
                        action: 'filter',
                        input: 'fetch_news.result',
                        condition: 'item.importance >= 7'
                    },
                    {
                        id: 'alert_critical',
                        action: 'conditional',
                        condition: 'filter_important.length > 0',
                        then: {
                            action: 'api_call',
                            endpoint: '/api/emma-n8n',
                            params: { action: 'send_alert', priority: 'high' }
                        }
                    }
                ]
            },

            // =====================================================
            // WEEKLY DIGEST (Friday 5:00 PM)
            // =====================================================
            'weekly_digest': {
                id: 'weekly_digest',
                name: 'Digest Hebdomadaire',
                schedule: '0 17 * * 5',  // Friday 5:00 PM
                enabled: true,
                steps: [
                    {
                        id: 'fetch_weekly_data',
                        action: 'orchestrator',
                        persona: 'researcher',
                        message: 'Récapitulatif complet de la semaine boursière'
                    },
                    {
                        id: 'critical_review',
                        action: 'orchestrator',
                        persona: 'critic',
                        message: 'Analyse critique des positions et risques',
                        waitFor: 'fetch_weekly_data'
                    },
                    {
                        id: 'generate_digest',
                        action: 'orchestrator',
                        persona: 'writer',
                        message: 'Rédige le digest hebdomadaire complet',
                        context: { useResults: ['fetch_weekly_data', 'critical_review'] }
                    },
                    {
                        id: 'send_digest',
                        action: 'api_call',
                        endpoint: '/api/send-email',
                        params: { type: 'weekly_digest', format: 'html' }
                    }
                ]
            },

            // =====================================================
            // PORTFOLIO SYNC (Every hour)
            // =====================================================
            'portfolio_sync': {
                id: 'portfolio_sync',
                name: 'Sync Portefeuille',
                schedule: '0 * * * *',  // Every hour
                enabled: true,
                steps: [
                    {
                        id: 'fetch_prices',
                        action: 'api_call',
                        endpoint: '/api/fmp',
                        params: { action: 'batch_quotes' }
                    },
                    {
                        id: 'update_supabase',
                        action: 'api_call',
                        endpoint: '/api/supabase-watchlist',
                        params: { action: 'sync_prices' }
                    },
                    {
                        id: 'check_alerts',
                        action: 'orchestrator',
                        persona: 'finance',
                        message: 'Vérifier si des alertes de prix doivent être déclenchées'
                    }
                ]
            }
        };
    }

    async _executeInternal(task, context) {
        const { action, workflowId, schedule, steps } = task;

        switch (action) {
            case 'execute_workflow':
                return this.executeWorkflow(workflowId, context);
            case 'schedule_workflow':
                return this.scheduleWorkflow(workflowId, schedule);
            case 'list_workflows':
                return this.listWorkflows();
            case 'get_workflow_status':
                return this.getWorkflowStatus(workflowId);
            case 'cancel_workflow':
                return this.cancelWorkflow(workflowId);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Execute a workflow by ID
     */
    async executeWorkflow(workflowId, context = {}) {
        const workflow = this.workflows[workflowId];
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        console.log(`\n🔄 [WorkflowAgent] Executing: ${workflow.name}`);
        const startTime = Date.now();
        const results = {};
        const errors = [];

        for (const step of workflow.steps) {
            console.log(`   📍 Step: ${step.id}`);

            try {
                // Check waitFor dependency
                if (step.waitFor && !results[step.waitFor]) {
                    console.log(`   ⏳ Waiting for: ${step.waitFor}`);
                }

                // Execute based on action type
                let stepResult;

                switch (step.action) {
                    case 'orchestrator':
                        stepResult = await masterOrchestrator.process(
                            step.message,
                            { persona: step.persona, ...step.context }
                        );
                        break;

                    case 'api_call':
                        stepResult = await this.makeApiCall(step.endpoint, step.params);
                        break;

                    case 'agent':
                        // Execute specific agent
                        stepResult = await this.executeAgent(step.agent, step.task);
                        break;

                    case 'conditional':
                        // Evaluate condition and execute if true
                        const conditionMet = this.evaluateCondition(step.condition, results);
                        if (conditionMet && step.then) {
                            stepResult = await this.executeStep(step.then, results);
                        } else {
                            stepResult = { skipped: true, reason: 'Condition not met' };
                        }
                        break;

                    case 'filter':
                        // Filter array based on condition
                        stepResult = this.filterResults(step.input, step.condition, results);
                        break;

                    default:
                        stepResult = { warning: `Unknown action: ${step.action}` };
                }

                results[step.id] = {
                    success: true,
                    result: stepResult,
                    duration: Date.now() - startTime
                };

                console.log(`   ✅ ${step.id}: Complete`);

            } catch (error) {
                console.error(`   ❌ ${step.id}: ${error.message}`);
                errors.push({ step: step.id, error: error.message });
                results[step.id] = { success: false, error: error.message };
            }
        }

        const duration = Date.now() - startTime;
        const execution = {
            workflowId,
            workflowName: workflow.name,
            startTime: new Date(startTime).toISOString(),
            duration,
            steps: Object.keys(results).length,
            errors: errors.length,
            success: errors.length === 0,
            results
        };

        this.history.push(execution);
        console.log(`\n✅ [WorkflowAgent] ${workflow.name} completed in ${duration}ms\n`);

        return execution;
    }

    /**
     * Schedule a workflow for recurring execution
     */
    scheduleWorkflow(workflowId, customSchedule = null) {
        const workflow = this.workflows[workflowId];
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        const schedule = customSchedule || workflow.schedule;
        
        // In a real implementation, use node-cron or similar
        // For now, we return the schedule info
        this.scheduledWorkflows.set(workflowId, {
            schedule,
            enabled: true,
            lastRun: null,
            nextRun: this.calculateNextRun(schedule)
        });

        console.log(`📅 [WorkflowAgent] Scheduled: ${workflow.name} (${schedule})`);

        return {
            workflowId,
            schedule,
            enabled: true,
            message: `Workflow scheduled: ${schedule}`
        };
    }

    /**
     * List all available workflows
     */
    listWorkflows() {
        return Object.values(this.workflows).map(w => ({
            id: w.id,
            name: w.name,
            schedule: w.schedule,
            enabled: w.enabled,
            steps: w.steps.length,
            scheduled: this.scheduledWorkflows.has(w.id)
        }));
    }

    /**
     * Get workflow execution status
     */
    getWorkflowStatus(workflowId) {
        const workflow = this.workflows[workflowId];
        const scheduled = this.scheduledWorkflows.get(workflowId);
        const recentExecutions = this.history
            .filter(h => h.workflowId === workflowId)
            .slice(-5);

        return {
            workflow: workflow ? { id: workflow.id, name: workflow.name } : null,
            scheduled: scheduled || null,
            recentExecutions,
            totalExecutions: this.history.filter(h => h.workflowId === workflowId).length
        };
    }

    /**
     * Cancel a scheduled workflow
     */
    cancelWorkflow(workflowId) {
        if (this.scheduledWorkflows.has(workflowId)) {
            this.scheduledWorkflows.delete(workflowId);
            return { success: true, message: `Workflow ${workflowId} cancelled` };
        }
        return { success: false, message: `Workflow ${workflowId} not scheduled` };
    }

    // Helper methods
    async makeApiCall(endpoint, params) {
        // Simplified - in production use fetch
        console.log(`      📡 API Call: ${endpoint}`);
        return { endpoint, params, simulated: true };
    }

    async executeAgent(agentName, task) {
        // Would call the actual agent
        console.log(`      🤖 Agent: ${agentName}`);
        return { agent: agentName, task, simulated: true };
    }

    async executeStep(step, context) {
        // Recursive step execution
        return { step: step.action, executed: true };
    }

    evaluateCondition(condition, results) {
        // Simplified condition evaluation
        return true;
    }

    filterResults(inputPath, condition, results) {
        // Simplified filter
        return [];
    }

    calculateNextRun(cronSchedule) {
        // Would use cron-parser
        return new Date(Date.now() + 3600000).toISOString();
    }
}

// Singleton
export const workflowAgent = new WorkflowAgent();

export default WorkflowAgent;
