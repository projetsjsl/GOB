/**
 * API CREDENTIALS MANAGER
 * 
 * Centralized management for all API keys, tokens, and MCP connections.
 * Supports multiple storage backends:
 * - Vercel environment variables (production)
 * - Supabase secret storage (cloud-synced)
 * - localStorage (browser-local, manual entry)
 * 
 * Usage:
 *   const apiKey = await credentialsManager.get('PERPLEXITY_API_KEY');
 *   await credentialsManager.set('FMP_API_KEY', 'abc123', 'supabase');
 */

// 
// CREDENTIAL SOURCES
// 

const SOURCES = {
    VERCEL: 'vercel',       // Environment variables on Vercel
    SUPABASE: 'supabase',   // Stored in Supabase (encrypted)
    LOCAL: 'local',         // localStorage (browser only)
    MANUAL: 'manual'        // Manually entered (session only)
};

// 
// API REGISTRY - All supported APIs and their metadata
// 

const API_REGISTRY = {
    // LLM Providers
    PERPLEXITY_API_KEY: {
        name: 'Perplexity AI',
        category: 'llm',
        icon: '',
        description: 'Web-search augmented AI (Sonar, Pro models)',
        required: true,
        testEndpoint: 'https://api.perplexity.ai/chat/completions',
        docUrl: 'https://docs.perplexity.ai/'
    },
    OPENAI_API_KEY: {
        name: 'OpenAI',
        category: 'llm',
        icon: '',
        description: 'GPT-4, GPT-4o, o1 models',
        required: false,
        testEndpoint: 'https://api.openai.com/v1/models',
        docUrl: 'https://platform.openai.com/docs'
    },
    ANTHROPIC_API_KEY: {
        name: 'Anthropic Claude',
        category: 'llm',
        icon: '',
        description: 'Claude 3.5 Sonnet, Haiku, Opus',
        required: false,
        testEndpoint: 'https://api.anthropic.com/v1/messages',
        docUrl: 'https://docs.anthropic.com/'
    },
    GOOGLE_API_KEY: {
        name: 'Google Gemini',
        category: 'llm',
        icon: '',
        description: 'Gemini Flash, Pro models with grounding',
        required: false,
        docUrl: 'https://ai.google.dev/docs'
    },
    
    // Financial Data
    FMP_API_KEY: {
        name: 'Financial Modeling Prep',
        category: 'finance',
        icon: '',
        description: 'Stock quotes, financials, earnings',
        required: true,
        testEndpoint: 'https://financialmodelingprep.com/api/v3/stock/list',
        docUrl: 'https://site.financialmodelingprep.com/developer/docs'
    },
    FINNHUB_API_KEY: {
        name: 'Finnhub',
        category: 'finance',
        icon: '',
        description: 'Real-time quotes, company news',
        required: false,
        testEndpoint: 'https://finnhub.io/api/v1/stock/symbol',
        docUrl: 'https://finnhub.io/docs/api'
    },
    
    // Communication
    RESEND_API_KEY: {
        name: 'Resend',
        category: 'communication',
        icon: '',
        description: 'Email sending for briefings',
        required: false,
        testEndpoint: 'https://api.resend.com/emails',
        docUrl: 'https://resend.com/docs'
    },
    TWILIO_ACCOUNT_SID: {
        name: 'Twilio Account SID',
        category: 'communication',
        icon: '',
        description: 'SMS sending',
        required: false,
        docUrl: 'https://www.twilio.com/docs'
    },
    TWILIO_AUTH_TOKEN: {
        name: 'Twilio Auth Token',
        category: 'communication',
        icon: '',
        description: 'SMS authentication',
        required: false,
        isSensitive: true
    },
    
    // Database & Storage
    SUPABASE_URL: {
        name: 'Supabase URL',
        category: 'database',
        icon: '',
        description: 'Supabase project URL',
        required: true,
        docUrl: 'https://supabase.com/docs'
    },
    SUPABASE_ANON_KEY: {
        name: 'Supabase Anon Key',
        category: 'database',
        icon: '',
        description: 'Public anonymous key',
        required: true
    },
    SUPABASE_SERVICE_ROLE_KEY: {
        name: 'Supabase Service Role',
        category: 'database',
        icon: '',
        description: 'Admin access key (server-side only)',
        required: false,
        isSensitive: true
    },
    
    // Specialized
    TAVUS_API_KEY: {
        name: 'Tavus',
        category: 'video',
        icon: '',
        description: 'AI video avatars',
        required: false,
        docUrl: 'https://docs.tavus.io/'
    },
    HEYGEN_API_KEY: {
        name: 'HeyGen',
        category: 'video',
        icon: '',
        description: 'AI video generation',
        required: false,
        docUrl: 'https://docs.heygen.com/'
    }
};

// 
// MCP CONNECTIONS REGISTRY
// 

const MCP_REGISTRY = {
    'perplexity-ask': {
        name: 'Perplexity Ask',
        description: 'Web search with AI analysis',
        icon: '',
        requiredKeys: ['PERPLEXITY_API_KEY'],
        status: 'connected'
    },
    'supabase-mcp-server': {
        name: 'Supabase MCP',
        description: 'Database operations, migrations',
        icon: '',
        requiredKeys: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        status: 'connected'
    },
    'financial-data': {
        name: 'Financial Data',
        description: 'Stock quotes, company data, earnings',
        icon: '',
        requiredKeys: ['FMP_API_KEY'],
        status: 'available'
    },
    'email-sender': {
        name: 'Email Sender',
        description: 'Send emails via Resend',
        icon: '',
        requiredKeys: ['RESEND_API_KEY'],
        status: 'available'
    }
};

// 
// CREDENTIALS MANAGER CLASS
// 

class CredentialsManager {
    constructor() {
        this.cache = new Map();
        this.sources = {};  // Preferred source per key
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        // Load source preferences from localStorage
        try {
            const savedSources = localStorage.getItem('api-credential-sources');
            if (savedSources) {
                this.sources = JSON.parse(savedSources);
            }
        } catch { }
        
        this.initialized = true;
        console.log(' [CredentialsManager] Initialized');
    }

    /**
     * Get a credential from the preferred source
     */
    async get(key) {
        await this.init();
        
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const source = this.sources[key] || SOURCES.VERCEL;
        let value = null;

        switch (source) {
            case SOURCES.VERCEL:
                value = await this._getFromVercel(key);
                break;
            case SOURCES.SUPABASE:
                value = await this._getFromSupabase(key);
                break;
            case SOURCES.LOCAL:
                value = this._getFromLocal(key);
                break;
            case SOURCES.MANUAL:
                value = this._getFromSession(key);
                break;
        }

        if (value) {
            this.cache.set(key, value);
        }
        
        return value;
    }

    /**
     * Set a credential with specified source
     */
    async set(key, value, source = SOURCES.LOCAL) {
        await this.init();
        
        this.sources[key] = source;
        this._saveSources();
        
        switch (source) {
            case SOURCES.SUPABASE:
                await this._setInSupabase(key, value);
                break;
            case SOURCES.LOCAL:
                this._setInLocal(key, value);
                break;
            case SOURCES.MANUAL:
                this._setInSession(key, value);
                break;
            case SOURCES.VERCEL:
                console.warn(' Cannot set Vercel env vars from client. Use Vercel dashboard.');
                return false;
        }
        
        this.cache.set(key, value);
        return true;
    }

    /**
     * Get preferred source for a key
     */
    getSource(key) {
        return this.sources[key] || SOURCES.VERCEL;
    }

    /**
     * Set preferred source for a key
     */
    setSource(key, source) {
        this.sources[key] = source;
        this._saveSources();
        this.cache.delete(key);  // Clear cache to force refresh
    }

    /**
     * Test if a credential is valid
     */
    async test(key) {
        const value = await this.get(key);
        if (!value) return { valid: false, error: 'No value found' };
        
        const config = API_REGISTRY[key];
        if (!config?.testEndpoint) {
            return { valid: true, message: 'No test endpoint available' };
        }
        
        try {
            const response = await fetch('/api/credentials-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, testEndpoint: config.testEndpoint })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get all credentials status
     */
    async getStatus() {
        await this.init();
        
        const status = {};
        
        for (const [key, config] of Object.entries(API_REGISTRY)) {
            const value = await this.get(key);
            status[key] = {
                ...config,
                key,
                hasValue: !!value,
                source: this.getSource(key),
                masked: value ? `${value.substring(0, 4)}...${value.slice(-4)}` : null
            };
        }
        
        return status;
    }

    /**
     * Get MCP connections status
     */
    async getMCPStatus() {
        const mcpStatus = {};
        
        for (const [id, config] of Object.entries(MCP_REGISTRY)) {
            const allKeysPresent = await Promise.all(
                config.requiredKeys.map(key => this.get(key))
            ).then(values => values.every(Boolean));
            
            mcpStatus[id] = {
                ...config,
                id,
                ready: allKeysPresent,
                missingKeys: allKeysPresent ? [] : config.requiredKeys.filter(
                    async key => !(await this.get(key))
                )
            };
        }
        
        return mcpStatus;
    }

    // 
    // PRIVATE: Source-specific getters/setters
    // 

    async _getFromVercel(key) {
        try {
            const response = await fetch(`/api/credentials?key=${key}`);
            if (response.ok) {
                const data = await response.json();
                return data.value;
            }
        } catch { }
        return null;
    }

    async _getFromSupabase(key) {
        try {
            const response = await fetch('/api/admin/emma-config?section=credentials&key=' + key);
            if (response.ok) {
                const data = await response.json();
                return data.config?.value;
            }
        } catch { }
        return null;
    }

    _getFromLocal(key) {
        try {
            return localStorage.getItem(`credential_${key}`);
        } catch { }
        return null;
    }

    _getFromSession(key) {
        try {
            return sessionStorage.getItem(`credential_${key}`);
        } catch { }
        return null;
    }

    async _setInSupabase(key, value) {
        try {
            await fetch('/api/admin/emma-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: 'credentials',
                    key,
                    value,
                    metadata: { updatedAt: new Date().toISOString() }
                })
            });
        } catch (error) {
            console.error('Failed to save to Supabase:', error);
        }
    }

    _setInLocal(key, value) {
        try {
            localStorage.setItem(`credential_${key}`, value);
        } catch { }
    }

    _setInSession(key, value) {
        try {
            sessionStorage.setItem(`credential_${key}`, value);
        } catch { }
    }

    _saveSources() {
        try {
            localStorage.setItem('api-credential-sources', JSON.stringify(this.sources));
        } catch { }
    }

    /**
     * Clear all cached credentials
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Export configuration (for backup)
     */
    exportConfig() {
        return {
            sources: this.sources,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import configuration
     */
    importConfig(config) {
        if (config.sources) {
            this.sources = config.sources;
            this._saveSources();
        }
    }
}

// 
// SINGLETON INSTANCE
// 

const credentialsManager = new CredentialsManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { credentialsManager, API_REGISTRY, MCP_REGISTRY, SOURCES };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.credentialsManager = credentialsManager;
    window.API_REGISTRY = API_REGISTRY;
    window.MCP_REGISTRY = MCP_REGISTRY;
    window.CREDENTIAL_SOURCES = SOURCES;
}
