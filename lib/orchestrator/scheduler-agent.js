/**
 * SCHEDULER AGENT - Cron-based Automation
 * 
 * Schedules and executes recurring tasks.
 * Replaces n8n for background job scheduling.
 * 
 * Features:
 * - Cron schedule parsing
 * - Task queuing
 * - Execution history
 * - Error handling with retries
 */

import { BaseAgent } from './base-agent.js';

class SchedulerAgent extends BaseAgent {
    constructor() {
        super('SchedulerAgent', [
            'create_schedule',
            'get_schedules',
            'delete_schedule',
            'pause_schedule',
            'resume_schedule',
            'run_now',
            'get_execution_history',
            'get_next_runs'
        ]);
        
        // In-memory schedule storage
        this.schedules = new Map();
        this.executionHistory = [];
        this.timers = new Map();  // Active timers
        this.maxHistoryLength = 200;
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        switch (action) {
            case 'create_schedule':
                return this._createSchedule(params);
            case 'get_schedules':
                return this._getSchedules();
            case 'delete_schedule':
                return this._deleteSchedule(params.scheduleId);
            case 'pause_schedule':
                return this._pauseSchedule(params.scheduleId);
            case 'resume_schedule':
                return this._resumeSchedule(params.scheduleId);
            case 'run_now':
                return this._runNow(params.scheduleId);
            case 'get_execution_history':
                return this._getExecutionHistory(params.limit);
            case 'get_next_runs':
                return this._getNextRuns(params.count);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Create a new scheduled task
     */
    _createSchedule({ name, cron, taskAgent, taskAction, taskParams, enabled = true }) {
        if (!name || !cron || !taskAgent || !taskAction) {
            return { 
                success: false, 
                error: 'Required: name, cron, taskAgent, taskAction' 
            };
        }

        // Validate cron expression
        const nextRun = this._parseNextRun(cron);
        if (!nextRun) {
            return { success: false, error: 'Invalid cron expression' };
        }

        const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const schedule = {
            id: scheduleId,
            name,
            cron,
            taskAgent,
            taskAction,
            taskParams: taskParams || {},
            enabled,
            createdAt: new Date().toISOString(),
            lastRun: null,
            nextRun: nextRun.toISOString(),
            runCount: 0,
            errorCount: 0
        };

        this.schedules.set(scheduleId, schedule);

        // Start the timer if enabled
        if (enabled) {
            this._startTimer(scheduleId);
        }

        return {
            success: true,
            schedule,
            message: `Scheduled "${name}" with cron "${cron}". Next run: ${nextRun.toLocaleString()}`
        };
    }

    /**
     * Get all schedules
     */
    _getSchedules() {
        const schedules = Array.from(this.schedules.values());
        
        // Update next run times
        for (const schedule of schedules) {
            if (schedule.enabled) {
                const nextRun = this._parseNextRun(schedule.cron);
                if (nextRun) {
                    schedule.nextRun = nextRun.toISOString();
                }
            }
        }

        return {
            success: true,
            schedules,
            count: schedules.length,
            activeCount: schedules.filter(s => s.enabled).length
        };
    }

    /**
     * Delete a schedule
     */
    _deleteSchedule(scheduleId) {
        if (!this.schedules.has(scheduleId)) {
            return { success: false, error: 'Schedule not found' };
        }

        // Clear timer
        this._clearTimer(scheduleId);

        const schedule = this.schedules.get(scheduleId);
        this.schedules.delete(scheduleId);

        return {
            success: true,
            deleted: schedule
        };
    }

    /**
     * Pause a schedule
     */
    _pauseSchedule(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        
        if (!schedule) {
            return { success: false, error: 'Schedule not found' };
        }

        schedule.enabled = false;
        this._clearTimer(scheduleId);

        return {
            success: true,
            schedule,
            message: `Schedule "${schedule.name}" paused`
        };
    }

    /**
     * Resume a schedule
     */
    _resumeSchedule(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        
        if (!schedule) {
            return { success: false, error: 'Schedule not found' };
        }

        schedule.enabled = true;
        schedule.nextRun = this._parseNextRun(schedule.cron)?.toISOString();
        this._startTimer(scheduleId);

        return {
            success: true,
            schedule,
            message: `Schedule "${schedule.name}" resumed. Next run: ${schedule.nextRun}`
        };
    }

    /**
     * Run a scheduled task immediately
     */
    async _runNow(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        
        if (!schedule) {
            return { success: false, error: 'Schedule not found' };
        }

        return this._executeScheduledTask(schedule, true);
    }

    /**
     * Execute a scheduled task
     */
    async _executeScheduledTask(schedule, manual = false) {
        const startTime = Date.now();
        
        const execution = {
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            executedAt: new Date().toISOString(),
            manual,
            success: false,
            duration: 0,
            result: null,
            error: null
        };

        try {
            // Call the orchestrator API
            const response = await fetch('/api/orchestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: schedule.taskAgent,
                    action: schedule.taskAction,
                    ...schedule.taskParams
                })
            });

            const result = await response.json();
            
            execution.success = result.success !== false;
            execution.result = result;
            execution.duration = Date.now() - startTime;

            schedule.lastRun = execution.executedAt;
            schedule.runCount++;
            
            if (!execution.success) {
                schedule.errorCount++;
            }

        } catch (error) {
            execution.error = error.message;
            execution.duration = Date.now() - startTime;
            schedule.errorCount++;
        }

        // Update next run
        schedule.nextRun = this._parseNextRun(schedule.cron)?.toISOString();

        // Add to history
        this.executionHistory.unshift(execution);
        if (this.executionHistory.length > this.maxHistoryLength) {
            this.executionHistory = this.executionHistory.slice(0, this.maxHistoryLength);
        }

        // Reschedule if still enabled
        if (schedule.enabled && !manual) {
            this._startTimer(schedule.id);
        }

        return {
            success: true,
            execution
        };
    }

    /**
     * Get execution history
     */
    _getExecutionHistory(limit = 50) {
        return {
            success: true,
            history: this.executionHistory.slice(0, limit),
            total: this.executionHistory.length
        };
    }

    /**
     * Get next scheduled runs
     */
    _getNextRuns(count = 10) {
        const activeSchedules = Array.from(this.schedules.values())
            .filter(s => s.enabled)
            .map(s => ({
                scheduleId: s.id,
                name: s.name,
                nextRun: s.nextRun,
                agent: s.taskAgent,
                action: s.taskAction
            }))
            .sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun))
            .slice(0, count);

        return {
            success: true,
            upcomingRuns: activeSchedules
        };
    }

    /**
     * Start a timer for a schedule
     */
    _startTimer(scheduleId) {
        this._clearTimer(scheduleId);

        const schedule = this.schedules.get(scheduleId);
        if (!schedule || !schedule.enabled) return;

        const nextRun = new Date(schedule.nextRun);
        const now = new Date();
        const delay = nextRun.getTime() - now.getTime();

        if (delay > 0) {
            const timer = setTimeout(() => {
                this._executeScheduledTask(schedule);
            }, Math.min(delay, 2147483647)); // Max timeout value

            this.timers.set(scheduleId, timer);
        }
    }

    /**
     * Clear a timer
     */
    _clearTimer(scheduleId) {
        if (this.timers.has(scheduleId)) {
            clearTimeout(this.timers.get(scheduleId));
            this.timers.delete(scheduleId);
        }
    }

    /**
     * Parse cron expression and get next run time
     * Simplified cron parser: "minute hour dayOfMonth month dayOfWeek"
     */
    _parseNextRun(cronExpression) {
        try {
            // Handle common shortcuts
            const shortcuts = {
                '@hourly': '0 * * * *',
                '@daily': '0 9 * * *',
                '@weekly': '0 9 * * 1',
                '@monthly': '0 9 1 * *'
            };

            const cron = shortcuts[cronExpression] || cronExpression;
            const parts = cron.split(' ');
            
            if (parts.length !== 5) {
                throw new Error('Invalid cron format');
            }

            const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
            
            const now = new Date();
            const next = new Date(now);
            
            // Simple next-run calculation (for common cases)
            if (minute !== '*') {
                next.setMinutes(parseInt(minute));
            }
            if (hour !== '*') {
                next.setHours(parseInt(hour));
                if (next <= now) {
                    next.setDate(next.getDate() + 1);
                }
            }
            next.setSeconds(0);
            next.setMilliseconds(0);

            // Ensure it's in the future
            if (next <= now) {
                next.setHours(next.getHours() + 1);
            }

            return next;
            
        } catch (error) {
            console.warn('Cron parse error:', error.message);
            return null;
        }
    }

    /**
     * Get preset schedules for common tasks
     */
    getPresetSchedules() {
        return [
            {
                name: 'Morning Briefing',
                cron: '0 7 * * 1-5',  // 7 AM weekdays
                taskAgent: 'briefing',
                taskAction: 'generate_morning_briefing'
            },
            {
                name: 'Noon Market Update',
                cron: '0 12 * * 1-5',  // 12 PM weekdays
                taskAgent: 'briefing',
                taskAction: 'generate_noon_update'
            },
            {
                name: 'Check Price Alerts',
                cron: '*/15 9-16 * * 1-5',  // Every 15 min during market hours
                taskAgent: 'alert',
                taskAction: 'check_alerts'
            },
            {
                name: 'Daily News Digest',
                cron: '0 18 * * 1-5',  // 6 PM weekdays
                taskAgent: 'news',
                taskAction: 'weekly_digest'
            },
            {
                name: 'Weekly Portfolio Review',
                cron: '0 9 * * 0',  // 9 AM Sunday
                taskAgent: 'portfolio',
                taskAction: 'analyze_portfolio',
                taskParams: { portfolioId: 'default' }
            }
        ];
    }
}

export const schedulerAgent = new SchedulerAgent();
export { SchedulerAgent };
