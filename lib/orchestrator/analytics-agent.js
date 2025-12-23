/**
 * ANALYTICS AGENT - Usage & Performance Tracking
 * 
 * Tracks orchestrator usage, performance metrics, and generates insights.
 * Helps optimize model selection and improve response times.
 */

import { BaseAgent } from './base-agent.js';

class AnalyticsAgent extends BaseAgent {
    constructor() {
        super('AnalyticsAgent', [
            'track_request',
            'get_stats',
            'get_model_performance',
            'get_persona_usage',
            'get_agent_usage',
            'get_latency_report',
            'export_analytics'
        ]);
        
        // In-memory metrics
        this.metrics = {
            requests: [],
            modelUsage: {},
            personaUsage: {},
            agentUsage: {},
            errors: [],
            startTime: Date.now()
        };
        
        this.maxStoredRequests = 1000;
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        switch (action) {
            case 'track_request':
                return this._trackRequest(params);
            case 'get_stats':
                return this._getStats(params.timeRange);
            case 'get_model_performance':
                return this._getModelPerformance();
            case 'get_persona_usage':
                return this._getPersonaUsage();
            case 'get_agent_usage':
                return this._getAgentUsage();
            case 'get_latency_report':
                return this._getLatencyReport();
            case 'export_analytics':
                return this._exportAnalytics();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Track a request for analytics
     */
    _trackRequest({ model, persona, agent, duration, success, error, tokens, cached }) {
        const record = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            model,
            persona,
            agent,
            duration,
            success: success !== false,
            error: error || null,
            tokens: tokens || 0,
            cached: cached || false
        };

        // Store request
        this.metrics.requests.push(record);
        if (this.metrics.requests.length > this.maxStoredRequests) {
            this.metrics.requests = this.metrics.requests.slice(-this.maxStoredRequests);
        }

        // Update model usage
        if (model) {
            if (!this.metrics.modelUsage[model]) {
                this.metrics.modelUsage[model] = { count: 0, totalDuration: 0, errors: 0, totalTokens: 0 };
            }
            this.metrics.modelUsage[model].count++;
            this.metrics.modelUsage[model].totalDuration += duration || 0;
            this.metrics.modelUsage[model].totalTokens += tokens || 0;
            if (!success) this.metrics.modelUsage[model].errors++;
        }

        // Update persona usage
        if (persona) {
            if (!this.metrics.personaUsage[persona]) {
                this.metrics.personaUsage[persona] = { count: 0, totalDuration: 0 };
            }
            this.metrics.personaUsage[persona].count++;
            this.metrics.personaUsage[persona].totalDuration += duration || 0;
        }

        // Update agent usage
        if (agent) {
            if (!this.metrics.agentUsage[agent]) {
                this.metrics.agentUsage[agent] = { count: 0, totalDuration: 0, errors: 0 };
            }
            this.metrics.agentUsage[agent].count++;
            this.metrics.agentUsage[agent].totalDuration += duration || 0;
            if (!success) this.metrics.agentUsage[agent].errors++;
        }

        // Track errors
        if (!success && error) {
            this.metrics.errors.push({
                timestamp: record.timestamp,
                error,
                model,
                persona,
                agent
            });
        }

        return { success: true, recorded: record.id };
    }

    /**
     * Get usage statistics
     */
    _getStats(timeRange = '24h') {
        const now = Date.now();
        const ranges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            'all': now - this.metrics.startTime
        };

        const cutoff = now - (ranges[timeRange] || ranges['24h']);
        const filteredRequests = this.metrics.requests.filter(
            r => new Date(r.timestamp).getTime() > cutoff
        );

        const totalRequests = filteredRequests.length;
        const successRate = totalRequests > 0
            ? (filteredRequests.filter(r => r.success).length / totalRequests * 100).toFixed(1)
            : 0;
        const avgDuration = totalRequests > 0
            ? (filteredRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / totalRequests).toFixed(0)
            : 0;
        const cachedRate = totalRequests > 0
            ? (filteredRequests.filter(r => r.cached).length / totalRequests * 100).toFixed(1)
            : 0;

        return {
            success: true,
            timeRange,
            stats: {
                totalRequests,
                successRate: `${successRate}%`,
                avgDuration: `${avgDuration}ms`,
                cachedRate: `${cachedRate}%`,
                uptime: this._formatUptime(now - this.metrics.startTime),
                errorCount: filteredRequests.filter(r => !r.success).length
            },
            topModels: this._getTopItems(filteredRequests, 'model', 5),
            topPersonas: this._getTopItems(filteredRequests, 'persona', 5),
            topAgents: this._getTopItems(filteredRequests, 'agent', 5)
        };
    }

    /**
     * Get model performance metrics
     */
    _getModelPerformance() {
        const performance = [];

        for (const [model, stats] of Object.entries(this.metrics.modelUsage)) {
            performance.push({
                model,
                requests: stats.count,
                avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
                errorRate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(1) + '%' : '0%',
                totalTokens: stats.totalTokens,
                avgTokens: stats.count > 0 ? Math.round(stats.totalTokens / stats.count) : 0
            });
        }

        return {
            success: true,
            models: performance.sort((a, b) => b.requests - a.requests)
        };
    }

    /**
     * Get persona usage breakdown
     */
    _getPersonaUsage() {
        const usage = [];

        for (const [persona, stats] of Object.entries(this.metrics.personaUsage)) {
            usage.push({
                persona,
                requests: stats.count,
                avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
                percentage: this._calculatePercentage(stats.count, this.metrics.requests.length)
            });
        }

        return {
            success: true,
            personas: usage.sort((a, b) => b.requests - a.requests)
        };
    }

    /**
     * Get agent usage breakdown
     */
    _getAgentUsage() {
        const usage = [];

        for (const [agent, stats] of Object.entries(this.metrics.agentUsage)) {
            usage.push({
                agent,
                requests: stats.count,
                avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
                errorRate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(1) + '%' : '0%'
            });
        }

        return {
            success: true,
            agents: usage.sort((a, b) => b.requests - a.requests)
        };
    }

    /**
     * Get latency report with percentiles
     */
    _getLatencyReport() {
        const durations = this.metrics.requests
            .filter(r => r.duration > 0)
            .map(r => r.duration)
            .sort((a, b) => a - b);

        if (durations.length === 0) {
            return { success: true, message: 'No latency data available' };
        }

        const p50 = this._percentile(durations, 50);
        const p90 = this._percentile(durations, 90);
        const p95 = this._percentile(durations, 95);
        const p99 = this._percentile(durations, 99);

        return {
            success: true,
            latency: {
                min: durations[0],
                max: durations[durations.length - 1],
                avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
                p50,
                p90,
                p95,
                p99
            },
            sampleSize: durations.length
        };
    }

    /**
     * Export all analytics data
     */
    _exportAnalytics() {
        return {
            success: true,
            exportedAt: new Date().toISOString(),
            data: {
                summary: this._getStats('all'),
                modelPerformance: this._getModelPerformance(),
                personaUsage: this._getPersonaUsage(),
                agentUsage: this._getAgentUsage(),
                latencyReport: this._getLatencyReport(),
                recentErrors: this.metrics.errors.slice(-20)
            }
        };
    }

    // Helper methods
    _getTopItems(requests, field, limit) {
        const counts = {};
        for (const req of requests) {
            if (req[field]) {
                counts[req[field]] = (counts[req[field]] || 0) + 1;
            }
        }
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    _percentile(arr, p) {
        const index = Math.ceil((p / 100) * arr.length) - 1;
        return arr[Math.max(0, index)];
    }

    _formatUptime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    _calculatePercentage(part, total) {
        return total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0%';
    }
}

export const analyticsAgent = new AnalyticsAgent();
export { AnalyticsAgent };
