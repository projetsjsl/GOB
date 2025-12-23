/**
 * CACHE AGENT - Intelligent Caching System
 * 
 * Caches API responses and LLM outputs to reduce costs and latency.
 * 
 * Features:
 * - TTL-based expiration
 * - Category-based cache management
 * - Cache statistics
 * - Local + Supabase storage options
 */

import { BaseAgent } from './base-agent.js';

class CacheAgent extends BaseAgent {
    constructor() {
        super('CacheAgent', [
            'get',
            'set',
            'delete',
            'clear',
            'get_stats',
            'prune_expired',
            'warm_cache'
        ]);
        
        // In-memory cache
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };
        
        // Default TTLs by category (in seconds)
        this.ttls = {
            'quote': 60,           // 1 minute for real-time quotes
            'profile': 86400,      // 24 hours for company profiles
            'ratios': 3600,        // 1 hour for financial ratios
            'news': 900,           // 15 minutes for news
            'llm': 3600,           // 1 hour for LLM responses
            'research': 1800,      // 30 minutes for research
            'default': 300         // 5 minutes default
        };
        
        // Max cache size
        this.maxSize = 1000;
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        switch (action) {
            case 'get':
                return this._get(params.key, params.category);
            case 'set':
                return this._set(params.key, params.value, params.category, params.ttl);
            case 'delete':
                return this._delete(params.key);
            case 'clear':
                return this._clear(params.category);
            case 'get_stats':
                return this._getStats();
            case 'prune_expired':
                return this._pruneExpired();
            case 'warm_cache':
                return this._warmCache(params.keys);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Get cached value
     */
    _get(key, category = 'default') {
        const fullKey = this._buildKey(key, category);
        const cached = this.cache.get(fullKey);
        
        if (!cached) {
            this.stats.misses++;
            return { success: false, hit: false };
        }
        
        // Check expiration
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
            this.cache.delete(fullKey);
            this.stats.misses++;
            return { success: false, hit: false, expired: true };
        }
        
        this.stats.hits++;
        cached.accessCount++;
        cached.lastAccess = Date.now();
        
        return {
            success: true,
            hit: true,
            value: cached.value,
            category,
            age: Date.now() - cached.createdAt,
            ttl: cached.expiresAt ? cached.expiresAt - Date.now() : null
        };
    }

    /**
     * Set cache value
     */
    _set(key, value, category = 'default', ttl = null) {
        const fullKey = this._buildKey(key, category);
        const effectiveTtl = ttl || this.ttls[category] || this.ttls.default;
        
        // Evict if at max size
        if (this.cache.size >= this.maxSize) {
            this._evictOldest();
        }
        
        const entry = {
            key,
            category,
            value,
            createdAt: Date.now(),
            expiresAt: Date.now() + (effectiveTtl * 1000),
            accessCount: 0,
            lastAccess: Date.now(),
            size: JSON.stringify(value).length
        };
        
        this.cache.set(fullKey, entry);
        this.stats.sets++;
        
        return {
            success: true,
            key: fullKey,
            ttl: effectiveTtl,
            expiresAt: new Date(entry.expiresAt).toISOString()
        };
    }

    /**
     * Delete a cache entry
     */
    _delete(key) {
        const deleted = this.cache.delete(key);
        
        return {
            success: true,
            deleted,
            key
        };
    }

    /**
     * Clear cache by category or all
     */
    _clear(category = null) {
        let cleared = 0;
        
        if (category) {
            for (const [key, entry] of this.cache.entries()) {
                if (entry.category === category) {
                    this.cache.delete(key);
                    cleared++;
                }
            }
        } else {
            cleared = this.cache.size;
            this.cache.clear();
        }
        
        return {
            success: true,
            cleared,
            category: category || 'all'
        };
    }

    /**
     * Get cache statistics
     */
    _getStats() {
        const categories = {};
        let totalSize = 0;
        
        for (const entry of this.cache.values()) {
            if (!categories[entry.category]) {
                categories[entry.category] = { count: 0, size: 0 };
            }
            categories[entry.category].count++;
            categories[entry.category].size += entry.size;
            totalSize += entry.size;
        }
        
        const hitRate = (this.stats.hits + this.stats.misses) > 0
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
            : 0;
        
        return {
            success: true,
            stats: {
                ...this.stats,
                hitRate: `${hitRate}%`,
                entries: this.cache.size,
                totalSize: this._formatBytes(totalSize),
                maxSize: this.maxSize
            },
            categories,
            ttlConfig: this.ttls
        };
    }

    /**
     * Remove expired entries
     */
    _pruneExpired() {
        const now = Date.now();
        let pruned = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this.cache.delete(key);
                pruned++;
            }
        }
        
        return {
            success: true,
            pruned,
            remaining: this.cache.size
        };
    }

    /**
     * Pre-warm cache with common data
     */
    async _warmCache(keys = []) {
        const warmed = [];
        
        // Default keys to warm: popular tickers
        const defaultKeys = keys.length > 0 ? keys : [
            { ticker: 'AAPL', category: 'profile' },
            { ticker: 'MSFT', category: 'profile' },
            { ticker: 'GOOGL', category: 'profile' },
            { ticker: 'NVDA', category: 'profile' },
            { ticker: 'TSLA', category: 'profile' }
        ];
        
        for (const item of defaultKeys) {
            try {
                // Fetch and cache company profile
                const response = await fetch(`/api/fmp-company-data?ticker=${item.ticker}`);
                if (response.ok) {
                    const data = await response.json();
                    this._set(`profile_${item.ticker}`, data, 'profile');
                    warmed.push(item.ticker);
                }
            } catch {
                // Skip failed fetches
            }
        }
        
        return {
            success: true,
            warmed,
            count: warmed.length
        };
    }

    /**
     * Evict oldest entry
     */
    _evictOldest() {
        let oldest = null;
        let oldestTime = Infinity;
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccess < oldestTime) {
                oldest = key;
                oldestTime = entry.lastAccess;
            }
        }
        
        if (oldest) {
            this.cache.delete(oldest);
            this.stats.evictions++;
        }
    }

    /**
     * Build full cache key
     */
    _buildKey(key, category) {
        return `${category}:${key}`;
    }

    /**
     * Format bytes to human readable
     */
    _formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * Decorator to wrap functions with caching
     */
    withCache(fn, keyGenerator, category = 'default') {
        return async (...args) => {
            const key = keyGenerator(...args);
            const cached = this._get(key, category);
            
            if (cached.hit) {
                return cached.value;
            }
            
            const result = await fn(...args);
            this._set(key, result, category);
            return result;
        };
    }
}

export const cacheAgent = new CacheAgent();
export { CacheAgent };
