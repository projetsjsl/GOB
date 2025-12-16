/**
 * Emma Client SDK - Unified Emma AI Client for all GOB applications
 * 
 * This client provides a unified interface to Emma AI that can be used across:
 * - JLab (/jlab)
 * - Bienvenue (/bienvenue)
 * - Nouveauclient (/nouveauclient)
 * - Any future applications
 * 
 * FEATURES:
 * - Dual-mode: External LLM (API) vs Local heuristics (sensitive data)
 * - Config sync with emma-config.html via Supabase
 * - Offline fallback for sensitive/network-restricted scenarios
 * - Consistent interface across all apps
 * 
 * USAGE:
 * ```javascript
 * import { EmmaClient } from '/lib/emma-client.js';
 * const emma = new EmmaClient({ mode: 'auto' });
 * const response = await emma.chat('What is AAPL trading at?');
 * ```
 */

// Configuration defaults (can be overridden by emma-config.html settings)
const DEFAULT_CONFIG = {
    apiEndpoint: '/api/emma-agent',
    mode: 'auto', // 'auto' | 'external' | 'local'
    useExternalForFinance: true,
    useLocalForSensitive: true,
    sensitiveKeywords: ['personnel', 'salaire', 'employé', 'confidentiel', 'secret', 'privé', 'rh', 'ressources humaines'],
    timeout: 30000,
    retryAttempts: 2,
    language: 'fr'
};

// Local knowledge base for offline/sensitive mode (borrowed from better implementations)
const LOCAL_KNOWLEDGE_BASE = {
    // Greetings
    'bonjour|salut|hello|hi|hey': {
        response: (ctx) => `Bonjour${ctx.userName ? ' ' + ctx.userName : ''} ! 👋 Je suis Emma, votre assistante IA. Comment puis-je vous aider ?`,
        intent: 'greeting'
    },
    // Help
    'aide|help|quoi faire|comment': {
        response: () => `Je peux vous aider avec:\n\n📊 **Analyse financière** - Prix, fondamentaux, actualités\n📋 **Tâches** - Suivi de votre intégration\n👥 **Contacts** - Trouver les bonnes personnes\n💡 **Questions générales** - N'hésitez pas à demander !`,
        intent: 'help'
    },
    // Thanks
    'merci|thanks|thank you': {
        response: (ctx) => `De rien${ctx.userName ? ' ' + ctx.userName : ''} ! 😊 N'hésitez pas si vous avez d'autres questions.`,
        intent: 'thanks'
    },
    // OK/Acknowledgment
    'ok|okay|d\'accord|parfait|bien|compris': {
        response: () => `Parfait ! 👍 Que souhaitez-vous faire maintenant ?`,
        intent: 'acknowledgment'
    }
};

/**
 * EmmaClient - Unified client for Emma AI interactions
 */
export class EmmaClient {
    constructor(options = {}) {
        this.config = { ...DEFAULT_CONFIG, ...options };
        this.conversationHistory = [];
        this.context = {
            userName: options.userName || null,
            userRole: options.userRole || null,
            appName: options.appName || 'unknown',
            customData: options.customData || {}
        };
        this.supabaseConfig = null;
        this.configLoaded = false;
        
        // Load mode from localStorage (synced with emma-config.html UI)
        this._loadModeFromStorage();
        
        // Start loading config from Supabase (non-blocking)
        this._loadConfigFromSupabase().catch(err => {
            console.warn('⚠️ Emma Client: Could not load config from Supabase, using defaults:', err.message);
        });
        
        console.log(`🤖 Emma Client initialized for ${this.context.appName} (mode: ${this.config.mode})`);
    }

    /**
     * Load processing mode from localStorage (synced with emma-config.html)
     * @private
     */
    _loadModeFromStorage() {
        if (typeof localStorage !== 'undefined') {
            const savedMode = localStorage.getItem('emma_processing_mode');
            if (savedMode && ['external', 'local', 'auto'].includes(savedMode)) {
                this.config.mode = savedMode;
                console.log(`📦 Emma mode loaded from localStorage: ${savedMode}`);
            }
        }
    }

    /**
     * Main chat method - sends message to Emma and returns response
     * @param {string} message - User message
     * @param {object} options - Additional options (forceMode, context, etc.)
     * @returns {Promise<object>} - Response object with text and metadata
     */
    async chat(message, options = {}) {
        const startTime = Date.now();
        
        // Determine which mode to use
        const mode = options.forceMode || this._selectMode(message);
        
        console.log(`💬 Emma Client: Processing message (mode: ${mode})`);
        
        let response;
        
        try {
            if (mode === 'external') {
                response = await this._callExternalAPI(message, options);
            } else {
                response = this._processLocally(message, options);
            }
        } catch (error) {
            console.error('❌ Emma Client error:', error);
            
            // Fallback to local mode on API failure
            if (mode === 'external') {
                console.log('🔄 Falling back to local mode');
                response = this._processLocally(message, { ...options, fallback: true });
            } else {
                response = {
                    success: false,
                    text: "Désolée, j'ai rencontré une erreur technique. Veuillez réessayer.",
                    error: error.message
                };
            }
        }
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
        
        this.conversationHistory.push({
            role: 'assistant',
            content: response.text || response.response,
            timestamp: new Date().toISOString()
        });
        
        // Keep history reasonable
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }
        
        return {
            success: response.success !== false,
            text: response.text || response.response,
            mode: mode,
            intent: response.intent || 'unknown',
            confidence: response.confidence || 0.7,
            executionTime: Date.now() - startTime,
            toolsUsed: response.tools_used || [],
            isReliable: response.is_reliable !== false,
            metadata: {
                model: response.model || (mode === 'local' ? 'local-heuristics' : 'api'),
                conversationLength: this.conversationHistory.length
            }
        };
    }

    /**
     * Select processing mode based on message content
     * @private
     */
    _selectMode(message) {
        if (this.config.mode !== 'auto') {
            return this.config.mode;
        }
        
        const messageLower = message.toLowerCase();
        
        // Check for sensitive keywords - use local mode
        if (this.config.useLocalForSensitive) {
            const hasSensitiveContent = this.config.sensitiveKeywords.some(kw => 
                messageLower.includes(kw.toLowerCase())
            );
            if (hasSensitiveContent) {
                console.log('🔒 Sensitive content detected - using local mode');
                return 'local';
            }
        }
        
        // Check for finance/market questions - use external LLM
        if (this.config.useExternalForFinance) {
            const financeKeywords = [
                'prix', 'price', 'cours', 'ticker', 'action', 'stock', 
                'analyse', 'analysis', 'marché', 'market', 'fondamental',
                'technique', 'actualité', 'news', 'earnings', 'résultats',
                'dividende', 'ratio', 'pe', 'roi', 'croissance', 'sector',
                'aapl', 'msft', 'googl', 'tsla', 'amzn', 'bce', 'ry', 'td'
            ];
            const hasFinanceContent = financeKeywords.some(kw => 
                messageLower.includes(kw.toLowerCase())
            );
            if (hasFinanceContent) {
                return 'external';
            }
        }
        
        // Simple greetings and acknowledgments - local mode (faster)
        const simplePatterns = /^(bonjour|salut|hello|hi|hey|merci|thanks|ok|okay|oui|non|parfait|super|wow)[\s!?.]*$/i;
        if (simplePatterns.test(message.trim())) {
            return 'local';
        }
        
        // Default to external for complex questions
        return 'external';
    }

    /**
     * Call the external Emma API
     * @private
     */
    async _callExternalAPI(message, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        try {
            const requestBody = {
                message: message,
                context: {
                    ...this.context,
                    ...options.context,
                    conversationHistory: this.conversationHistory.slice(-10),
                    output_mode: options.outputMode || 'chat'
                }
            };
            
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return {
                success: data.success !== false,
                text: data.response || data.text,
                intent: data.intent,
                confidence: data.confidence,
                tools_used: data.tools_used,
                model: data.model,
                is_reliable: data.is_reliable
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Process message locally using heuristics (for offline/sensitive mode)
     * @private
     */
    _processLocally(message, options = {}) {
        const messageLower = message.toLowerCase().trim();
        
        // Check knowledge base patterns
        for (const [pattern, handler] of Object.entries(LOCAL_KNOWLEDGE_BASE)) {
            const keywords = pattern.split('|');
            const matches = keywords.some(kw => messageLower.includes(kw));
            
            if (matches) {
                const text = typeof handler.response === 'function' 
                    ? handler.response(this.context) 
                    : handler.response;
                
                return {
                    success: true,
                    text: text,
                    intent: handler.intent,
                    confidence: 0.85,
                    model: 'local-heuristics',
                    is_reliable: true
                };
            }
        }
        
        // Default fallback
        let fallbackText = `🤔 Je n'ai pas bien compris votre question.`;
        
        if (options.fallback) {
            fallbackText += `\n\n⚠️ Le service IA externe n'est pas disponible actuellement. Je fonctionne en mode local avec des capacités limitées.`;
        }
        
        fallbackText += `\n\nPouvez-vous préciser si cela concerne:\n- 📊 Une analyse financière\n- 👥 Vos contacts ou collègues\n- 📋 Vos tâches ou objectifs`;
        
        return {
            success: true,
            text: fallbackText,
            intent: 'unknown',
            confidence: 0.4,
            model: 'local-fallback',
            is_reliable: !options.fallback
        };
    }

    /**
     * Load configuration from Supabase (synced with emma-config.html)
     * @private
     */
    async _loadConfigFromSupabase() {
        if (typeof window === 'undefined' || !window.supabase) {
            return;
        }
        
        try {
            // Try to get config from the emma_config table
            const { data, error } = await window.supabase
                .from('emma_config')
                .select('*')
                .eq('section', 'client')
                .single();
            
            if (!error && data) {
                this.supabaseConfig = data;
                
                // Apply loaded config
                if (data.value) {
                    const configValues = typeof data.value === 'string' 
                        ? JSON.parse(data.value) 
                        : data.value;
                    
                    Object.assign(this.config, configValues);
                    console.log('✅ Emma Client: Config loaded from Supabase');
                }
            }
            
            this.configLoaded = true;
        } catch (err) {
            console.warn('⚠️ Could not load Emma config from Supabase:', err);
        }
    }

    /**
     * Update context (e.g., when user info changes)
     */
    updateContext(newContext) {
        this.context = { ...this.context, ...newContext };
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Get current conversation history
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Check if external API is available
     */
    async checkAPIHealth() {
        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'ping', context: { healthCheck: true } })
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Export a factory function for easy instantiation
export function createEmmaClient(options = {}) {
    return new EmmaClient(options);
}

// Also export for CommonJS/browser global usage
if (typeof window !== 'undefined') {
    window.EmmaClient = EmmaClient;
    window.createEmmaClient = createEmmaClient;
}

export default EmmaClient;
