/**
 * ALERT AGENT - Price Alerts & Notifications
 * 
 * Manages price alerts, earnings alerts, and sends notifications
 * via email, SMS, or push notifications.
 * 
 * Features:
 * - Price target alerts
 * - Earnings date reminders
 * - News alerts
 * - Movement alerts (% change)
 * - Multi-channel delivery
 */

import { BaseAgent } from './base-agent.js';
import { toolsAgent } from './tools-agent.js';

class AlertAgent extends BaseAgent {
    constructor() {
        super('AlertAgent', [
            'create_alert',
            'get_alerts',
            'delete_alert',
            'check_alerts',
            'trigger_alert',
            'set_notification_channel',
            'get_triggered_history'
        ]);
        
        // In-memory alert storage
        this.alerts = new Map();
        this.triggeredHistory = [];
        this.channels = {
            email: null,
            sms: null,
            push: null
        };
        this.maxHistoryLength = 100;
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        switch (action) {
            case 'create_alert':
                return this._createAlert(params);
            case 'get_alerts':
                return this._getAlerts(params.ticker);
            case 'delete_alert':
                return this._deleteAlert(params.alertId);
            case 'check_alerts':
                return this._checkAlerts();
            case 'trigger_alert':
                return this._triggerAlert(params.alertId, params.reason);
            case 'set_notification_channel':
                return this._setChannel(params.channel, params.destination);
            case 'get_triggered_history':
                return this._getTriggeredHistory(params.limit);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Create a new alert
     */
    _createAlert({ ticker, type, condition, value, message, channels = ['email'] }) {
        if (!ticker || !type || !value) {
            return { success: false, error: 'ticker, type, and value are required' };
        }

        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const alert = {
            id: alertId,
            ticker: ticker.toUpperCase(),
            type, // 'price_above', 'price_below', 'percent_change', 'earnings', 'news'
            condition, // 'gt', 'lt', 'eq', 'change_up', 'change_down'
            value,
            message: message || this._defaultMessage(ticker, type, value),
            channels,
            active: true,
            createdAt: new Date().toISOString(),
            lastChecked: null,
            triggeredCount: 0
        };

        this.alerts.set(alertId, alert);

        return {
            success: true,
            alert,
            message: `Alert created: ${alert.message}`
        };
    }

    /**
     * Get all alerts, optionally filtered by ticker
     */
    _getAlerts(ticker) {
        let alerts = Array.from(this.alerts.values());
        
        if (ticker) {
            alerts = alerts.filter(a => a.ticker === ticker.toUpperCase());
        }

        return {
            success: true,
            alerts,
            count: alerts.length,
            activeCount: alerts.filter(a => a.active).length
        };
    }

    /**
     * Delete an alert
     */
    _deleteAlert(alertId) {
        if (!this.alerts.has(alertId)) {
            return { success: false, error: 'Alert not found' };
        }

        const alert = this.alerts.get(alertId);
        this.alerts.delete(alertId);

        return {
            success: true,
            deleted: alert,
            message: `Alert deleted: ${alert.message}`
        };
    }

    /**
     * Check all active alerts against current data
     */
    async _checkAlerts() {
        const activeAlerts = Array.from(this.alerts.values()).filter(a => a.active);
        const triggered = [];
        const checked = [];

        // Group by ticker for efficient fetching
        const tickerGroups = {};
        for (const alert of activeAlerts) {
            if (!tickerGroups[alert.ticker]) {
                tickerGroups[alert.ticker] = [];
            }
            tickerGroups[alert.ticker].push(alert);
        }

        // Check each ticker
        for (const [ticker, tickerAlerts] of Object.entries(tickerGroups)) {
            try {
                const quote = await toolsAgent._execute_get_stock_price({ ticker });

                for (const alert of tickerAlerts) {
                    alert.lastChecked = new Date().toISOString();
                    checked.push(alert.id);

                    let shouldTrigger = false;
                    let currentValue = null;

                    switch (alert.type) {
                        case 'price_above':
                            currentValue = quote.price;
                            shouldTrigger = quote.price >= alert.value;
                            break;
                            
                        case 'price_below':
                            currentValue = quote.price;
                            shouldTrigger = quote.price <= alert.value;
                            break;
                            
                        case 'percent_change_up':
                            currentValue = quote.changePercent;
                            shouldTrigger = quote.changePercent >= alert.value;
                            break;
                            
                        case 'percent_change_down':
                            currentValue = quote.changePercent;
                            shouldTrigger = quote.changePercent <= -alert.value;
                            break;
                    }

                    if (shouldTrigger) {
                        const triggerResult = await this._triggerAlert(alert.id, 
                            `Current: ${currentValue} | Target: ${alert.value}`);
                        if (triggerResult.success) {
                            triggered.push(triggerResult.triggered);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to check alerts for ${ticker}:`, error.message);
            }
        }

        return {
            success: true,
            checked: checked.length,
            triggered: triggered.length,
            triggeredAlerts: triggered,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Trigger an alert
     */
    async _triggerAlert(alertId, reason) {
        const alert = this.alerts.get(alertId);
        
        if (!alert) {
            return { success: false, error: 'Alert not found' };
        }

        const triggeredRecord = {
            alertId,
            ticker: alert.ticker,
            type: alert.type,
            message: alert.message,
            reason,
            triggeredAt: new Date().toISOString(),
            notificationsSent: []
        };

        // Send notifications
        for (const channel of alert.channels) {
            const notifyResult = await this._sendNotification(channel, {
                subject: `🔔 Alert: ${alert.ticker}`,
                body: `${alert.message}\n\n${reason}`,
                ticker: alert.ticker
            });
            
            triggeredRecord.notificationsSent.push({
                channel,
                success: notifyResult.success,
                error: notifyResult.error
            });
        }

        // Update alert
        alert.triggeredCount++;
        
        // Add to history
        this.triggeredHistory.unshift(triggeredRecord);
        if (this.triggeredHistory.length > this.maxHistoryLength) {
            this.triggeredHistory = this.triggeredHistory.slice(0, this.maxHistoryLength);
        }

        return {
            success: true,
            triggered: triggeredRecord
        };
    }

    /**
     * Set notification channel destination
     */
    _setChannel(channel, destination) {
        if (!['email', 'sms', 'push'].includes(channel)) {
            return { success: false, error: 'Invalid channel. Use: email, sms, push' };
        }

        this.channels[channel] = destination;

        return {
            success: true,
            channel,
            destination,
            message: `${channel} notifications will be sent to ${destination}`
        };
    }

    /**
     * Get triggered alert history
     */
    _getTriggeredHistory(limit = 20) {
        return {
            success: true,
            history: this.triggeredHistory.slice(0, limit),
            total: this.triggeredHistory.length
        };
    }

    /**
     * Send notification via specified channel
     */
    async _sendNotification(channel, { subject, body, ticker }) {
        const destination = this.channels[channel];
        
        if (!destination) {
            return { success: false, error: `${channel} not configured` };
        }

        try {
            switch (channel) {
                case 'email':
                    const emailResponse = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: destination,
                            subject,
                            text: body
                        })
                    });
                    return { success: emailResponse.ok, channel: 'email' };
                    
                case 'sms':
                    const smsResponse = await fetch('/api/emma-n8n', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'send_sms',
                            phone: destination,
                            message: `[${ticker}] ${subject}: ${body.substring(0, 140)}`
                        })
                    });
                    return { success: smsResponse.ok, channel: 'sms' };
                    
                case 'push':
                    // Push notifications would require service worker setup
                    console.log(`[Push] ${subject}: ${body}`);
                    return { success: true, channel: 'push', note: 'Logged to console' };
                    
                default:
                    return { success: false, error: 'Unknown channel' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate default alert message
     */
    _defaultMessage(ticker, type, value) {
        const messages = {
            'price_above': `${ticker} reached $${value} or higher`,
            'price_below': `${ticker} dropped to $${value} or lower`,
            'percent_change_up': `${ticker} gained ${value}% or more`,
            'percent_change_down': `${ticker} lost ${value}% or more`,
            'earnings': `${ticker} earnings date alert`,
            'news': `Important news about ${ticker}`
        };
        
        return messages[type] || `Alert for ${ticker}`;
    }

    /**
     * Create common alert shortcuts
     */
    createPriceTargetAlert(ticker, targetPrice, direction = 'above') {
        return this._createAlert({
            ticker,
            type: direction === 'above' ? 'price_above' : 'price_below',
            value: targetPrice,
            channels: ['email']
        });
    }

    createMovementAlert(ticker, percentThreshold) {
        // Creates both up and down alerts
        const upAlert = this._createAlert({
            ticker,
            type: 'percent_change_up',
            value: percentThreshold,
            channels: ['email', 'sms']
        });
        
        const downAlert = this._createAlert({
            ticker,
            type: 'percent_change_down',
            value: percentThreshold,
            channels: ['email', 'sms']
        });
        
        return {
            success: true,
            alerts: [upAlert.alert, downAlert.alert],
            message: `Movement alerts created for ±${percentThreshold}% on ${ticker}`
        };
    }
}

export const alertAgent = new AlertAgent();
export { AlertAgent };
