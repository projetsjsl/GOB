/**
 * Yield Curve API Client with TTL Cache & Request Deduplication (JavaScript version)
 *
 * This file is for use in Babel-transpiled components
 */

class YieldCurveClient {
    constructor(apiBase = '') {
        this.cache = new Map();
        this.inflightRequests = new Map();
        this.TTL = 5 * 60 * 1000; // 5 minutes
        this.API_BASE = apiBase || (typeof window !== 'undefined' ? window.location.origin : '');
    }

    async fetchYieldCurve(country = 'both') {
        const cacheKey = `yield_curve_${country}`;
        const now = Date.now();

        // 1. Check cache first (TTL: 5 min)
        const cached = this.cache.get(cacheKey);
        if (cached && (now - cached.timestamp) < this.TTL) {
            console.log(`✅ Yield Curve Cache HIT (${country}) - age: ${Math.round((now - cached.timestamp) / 1000)}s`);
            return cached.data;
        }

        // 2. Check if request is already in-flight (deduplication)
        const inflight = this.inflightRequests.get(cacheKey);
        if (inflight) {
            console.log(`🔄 Yield Curve Request DEDUPLICATED (${country}) - joining existing request`);
            return inflight.promise;
        }

        // 3. Make new request
        console.log(`🌐 Yield Curve Cache MISS (${country}) - fetching from API...`);

        const requestPromise = this._fetchFromAPI(country)
            .then(data => {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: now
                });
                this.inflightRequests.delete(cacheKey);
                return data;
            })
            .catch(error => {
                this.inflightRequests.delete(cacheKey);
                throw error;
            });

        this.inflightRequests.set(cacheKey, {
            promise: requestPromise,
            timestamp: now
        });

        return requestPromise;
    }

    async _fetchFromAPI(country) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(
                `${this.API_BASE}/api/yield-curve?country=${country}`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                ...data,
                timestamp: Date.now()
            };
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout (10s)');
            }

            throw error;
        }
    }

    clearCache(country) {
        if (country) {
            const cacheKey = `yield_curve_${country}`;
            this.cache.delete(cacheKey);
            console.log(`🗑️ Yield Curve cache cleared: ${country}`);
        } else {
            this.cache.clear();
            console.log(`🗑️ Yield Curve cache cleared: all`);
        }
    }

    getCacheStats() {
        const now = Date.now();
        return {
            entries: this.cache.size,
            inflight: this.inflightRequests.size,
            details: Array.from(this.cache.entries()).map(([key, entry]) => ({
                key,
                age: Math.round((now - entry.timestamp) / 1000)
            }))
        };
    }

    cleanup() {
        const now = Date.now();
        const INFLIGHT_TIMEOUT = 30000; // 30s

        for (const [key, request] of this.inflightRequests.entries()) {
            if (now - request.timestamp > INFLIGHT_TIMEOUT) {
                console.warn(`⚠️ Cleaning up stale inflight request: ${key}`);
                this.inflightRequests.delete(key);
            }
        }
    }
}

// Singleton instance
let globalClient = null;

function getYieldCurveClient(apiBase) {
    if (!globalClient) {
        globalClient = new YieldCurveClient(apiBase);

        // Cleanup stale requests every 60s
        if (typeof window !== 'undefined') {
            setInterval(() => globalClient?.cleanup(), 60000);
        }
    }
    return globalClient;
}

// Expose globally for use in app-inline.js
if (typeof window !== 'undefined') {
    window.getYieldCurveClient = getYieldCurveClient;
    window.YieldCurveClient = YieldCurveClient;

    // Debug helpers
    window.__yieldCurveClient = {
        getStats: () => getYieldCurveClient().getCacheStats(),
        clearCache: (country) => getYieldCurveClient().clearCache(country),
        fetch: (country) => getYieldCurveClient().fetchYieldCurve(country)
    };
}

export { YieldCurveClient, getYieldCurveClient };
export default getYieldCurveClient;
