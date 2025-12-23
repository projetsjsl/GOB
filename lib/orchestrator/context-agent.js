/**
 * CONTEXT AGENT - Conversation Memory & Context Management
 * 
 * Manages conversation history and context for multi-turn interactions.
 * Stores context in Supabase or localStorage for persistence.
 * 
 * Features:
 * - Conversation history
 * - User preferences
 * - Active tickers/portfolio context
 * - Session management
 */

import { BaseAgent } from './base-agent.js';

class ContextAgent extends BaseAgent {
    constructor() {
        super('ContextAgent', [
            'get_context',
            'set_context',
            'add_message',
            'get_history',
            'clear_history',
            'get_user_preferences',
            'set_user_preferences',
            'get_active_tickers',
            'set_active_tickers'
        ]);
        
        // In-memory cache
        this.contexts = new Map();
        this.maxHistoryLength = 50;  // Messages to keep
    }

    async _executeInternal(task, context) {
        const { action, sessionId, ...params } = task;
        const sid = sessionId || context.sessionId || 'default';

        switch (action) {
            case 'get_context':
                return this._getContext(sid);
                
            case 'set_context':
                return this._setContext(sid, params);
                
            case 'add_message':
                return this._addMessage(sid, params.role, params.content);
                
            case 'get_history':
                return this._getHistory(sid, params.limit);
                
            case 'clear_history':
                return this._clearHistory(sid);
                
            case 'get_user_preferences':
                return this._getUserPreferences(sid);
                
            case 'set_user_preferences':
                return this._setUserPreferences(sid, params.preferences);
                
            case 'get_active_tickers':
                return this._getActiveTickers(sid);
                
            case 'set_active_tickers':
                return this._setActiveTickers(sid, params.tickers);
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Initialize context for a session
     */
    _initContext(sessionId) {
        if (!this.contexts.has(sessionId)) {
            this.contexts.set(sessionId, {
                sessionId,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                history: [],
                preferences: {
                    persona: 'finance',
                    language: 'fr',
                    detailLevel: 'detailed',
                    preferredModel: 'auto'
                },
                activeTickers: [],
                metadata: {}
            });
        }
        return this.contexts.get(sessionId);
    }

    /**
     * Get full context for a session
     */
    _getContext(sessionId) {
        const ctx = this._initContext(sessionId);
        return {
            success: true,
            context: {
                ...ctx,
                historyLength: ctx.history.length
            }
        };
    }

    /**
     * Update context properties
     */
    _setContext(sessionId, updates) {
        const ctx = this._initContext(sessionId);
        
        // Update allowed properties
        if (updates.preferences) ctx.preferences = { ...ctx.preferences, ...updates.preferences };
        if (updates.activeTickers) ctx.activeTickers = updates.activeTickers;
        if (updates.metadata) ctx.metadata = { ...ctx.metadata, ...updates.metadata };
        
        ctx.lastActivity = new Date().toISOString();
        
        return { success: true, context: ctx };
    }

    /**
     * Add a message to conversation history
     */
    _addMessage(sessionId, role, content) {
        const ctx = this._initContext(sessionId);
        
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role,  // 'user', 'assistant', 'system'
            content,
            timestamp: new Date().toISOString()
        };
        
        ctx.history.push(message);
        
        // Trim history if too long
        if (ctx.history.length > this.maxHistoryLength) {
            ctx.history = ctx.history.slice(-this.maxHistoryLength);
        }
        
        ctx.lastActivity = new Date().toISOString();
        
        return { success: true, message, historyLength: ctx.history.length };
    }

    /**
     * Get conversation history
     */
    _getHistory(sessionId, limit = 20) {
        const ctx = this._initContext(sessionId);
        const history = ctx.history.slice(-limit);
        
        return {
            success: true,
            history,
            total: ctx.history.length,
            returned: history.length
        };
    }

    /**
     * Clear conversation history
     */
    _clearHistory(sessionId) {
        const ctx = this._initContext(sessionId);
        const previousLength = ctx.history.length;
        ctx.history = [];
        
        return {
            success: true,
            cleared: previousLength,
            message: `Cleared ${previousLength} messages`
        };
    }

    /**
     * Get user preferences
     */
    _getUserPreferences(sessionId) {
        const ctx = this._initContext(sessionId);
        return {
            success: true,
            preferences: ctx.preferences
        };
    }

    /**
     * Set user preferences
     */
    _setUserPreferences(sessionId, preferences) {
        const ctx = this._initContext(sessionId);
        ctx.preferences = { ...ctx.preferences, ...preferences };
        
        return {
            success: true,
            preferences: ctx.preferences
        };
    }

    /**
     * Get active tickers for portfolio context
     */
    _getActiveTickers(sessionId) {
        const ctx = this._initContext(sessionId);
        return {
            success: true,
            tickers: ctx.activeTickers
        };
    }

    /**
     * Set active tickers
     */
    _setActiveTickers(sessionId, tickers) {
        const ctx = this._initContext(sessionId);
        ctx.activeTickers = Array.isArray(tickers) ? tickers : [tickers];
        
        return {
            success: true,
            tickers: ctx.activeTickers
        };
    }

    /**
     * Build context summary for AI prompt
     */
    buildPromptContext(sessionId) {
        const ctx = this._initContext(sessionId);
        
        // Build recent history summary
        const recentMessages = ctx.history.slice(-5);
        const historyText = recentMessages.map(m => 
            `${m.role === 'user' ? 'User' : 'Emma'}: ${m.content.substring(0, 200)}...`
        ).join('\n');
        
        // Build ticker context
        const tickerText = ctx.activeTickers.length > 0
            ? `Active tickers: ${ctx.activeTickers.join(', ')}`
            : '';
        
        return {
            summary: `
Session Context:
- Language: ${ctx.preferences.language}
- Detail Level: ${ctx.preferences.detailLevel}
${tickerText}

Recent Conversation:
${historyText || 'No previous messages'}
`.trim(),
            preferences: ctx.preferences,
            activeTickers: ctx.activeTickers,
            historyLength: ctx.history.length
        };
    }

    /**
     * Serialize context for storage
     */
    async saveToStorage(sessionId) {
        const ctx = this.contexts.get(sessionId);
        if (!ctx) return { success: false, error: 'No context found' };
        
        try {
            // Try Supabase first
            const response = await fetch('/api/admin/emma-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: 'contexts',
                    key: `session_${sessionId}`,
                    value: JSON.stringify(ctx)
                })
            });
            
            if (response.ok) {
                return { success: true, storage: 'supabase' };
            }
        } catch { }
        
        // Fallback to localStorage
        try {
            localStorage.setItem(`jlab_context_${sessionId}`, JSON.stringify(ctx));
            return { success: true, storage: 'localStorage' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Load context from storage
     */
    async loadFromStorage(sessionId) {
        try {
            // Try Supabase first
            const response = await fetch(`/api/admin/emma-config?section=contexts&key=session_${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.config?.value) {
                    const ctx = JSON.parse(data.config.value);
                    this.contexts.set(sessionId, ctx);
                    return { success: true, storage: 'supabase', context: ctx };
                }
            }
        } catch { }
        
        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(`jlab_context_${sessionId}`);
            if (stored) {
                const ctx = JSON.parse(stored);
                this.contexts.set(sessionId, ctx);
                return { success: true, storage: 'localStorage', context: ctx };
            }
        } catch { }
        
        return { success: false, error: 'No stored context found' };
    }
}

export const contextAgent = new ContextAgent();
export { ContextAgent };
