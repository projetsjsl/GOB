/**
 * Yield Curve API Client with TTL Cache & Request Deduplication
 *
 * Problem Solved:
 * - Multiple component instances making simultaneous API calls
 * - No cache = same data fetched repeatedly
 * - Hundreds of requests in Vercel logs
 *
 * Solution:
 * - In-memory TTL cache (5 min default)
 * - Request deduplication (only one inflight request per country)
 * - Shared cache across all component instances
 */

interface YieldCurveData {
    success: boolean;
    data: {
        us?: {
            rates: Array<{ maturity: string; rate: number; change1M: number; prevValue: number | null }>;
            date: string;
            source: string;
            spread_10y_2y?: number;
            inverted?: boolean;
        };
        canada?: {
            rates: Array<{ maturity: string; rate: number; change1M: number; prevValue: number | null }>;
            date: string;
            source: string;
        };
    };
    timestamp: number;
}

interface CacheEntry {
    data: YieldCurveData;
    timestamp: number;
}

interface InflightRequest {
    promise: Promise<YieldCurveData>;
    timestamp: number;
}

class YieldCurveClient {
    private cache: Map<string, CacheEntry> = new Map();
    private inflightRequests: Map<string, InflightRequest> = new Map();
    private readonly TTL: number = 5 * 60 * 1000; // 5 minutes
    private readonly API_BASE: string;

    constructor(apiBase: string = '') {
        this.API_BASE = apiBase || (typeof window !== 'undefined' ? window.location.origin : '');
    }

    /**
     * Fetch yield curve data with cache and deduplication
     */
    async fetchYieldCurve(country: string = 'both'): Promise<YieldCurveData> {
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
                // Cache the result
                this.cache.set(cacheKey, {
                    data,
                    timestamp: now
                });

                // Remove from inflight
                this.inflightRequests.delete(cacheKey);

                return data;
            })
            .catch(error => {
                // Remove from inflight on error
                this.inflightRequests.delete(cacheKey);
                throw error;
            });

        // Store as inflight
        this.inflightRequests.set(cacheKey, {
            promise: requestPromise,
            timestamp: now
        });

        return requestPromise;
    }

    /**
     * Internal method to fetch from API
     */
    private async _fetchFromAPI(country: string): Promise<YieldCurveData> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout (10s)');
            }

            throw error;
        }
    }

    /**
     * Clear cache for a specific country or all
     */
    clearCache(country?: string): void {
        if (country) {
            const cacheKey = `yield_curve_${country}`;
            this.cache.delete(cacheKey);
            console.log(`🗑️ Yield Curve cache cleared: ${country}`);
        } else {
            this.cache.clear();
            console.log(`🗑️ Yield Curve cache cleared: all`);
        }
    }

    /**
     * Get cache stats for debugging
     */
    getCacheStats(): {
        entries: number;
        inflight: number;
        details: Array<{ key: string; age: number }>;
    } {
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

    /**
     * Cleanup old inflight requests (safeguard against memory leaks)
     */
    cleanup(): void {
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

// Singleton instance shared across all components
let globalClient: YieldCurveClient | null = null;

/**
 * Get or create the global yield curve client
 */
export function getYieldCurveClient(apiBase?: string): YieldCurveClient {
    if (!globalClient) {
        globalClient = new YieldCurveClient(apiBase);

        // Cleanup stale requests every 60s
        if (typeof window !== 'undefined') {
            setInterval(() => globalClient?.cleanup(), 60000);
        }
    }
    return globalClient;
}

/**
 * React hook for yield curve data
 */
export function useYieldCurveData(country: string = 'both', apiBase?: string) {
    const [data, setData] = React.useState<YieldCurveData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const client = getYieldCurveClient(apiBase);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await client.fetchYieldCurve(country);
            setData(result);
            setLoading(false);
        } catch (err: any) {
            console.error('❌ Yield Curve fetch error:', err);
            setError(err.message || 'Failed to fetch yield curve data');
            setLoading(false);
        }
    }, [country, client]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        cacheStats: client.getCacheStats()
    };
}

export default getYieldCurveClient;

// Expose for debugging in browser console
if (typeof window !== 'undefined') {
    (window as any).__yieldCurveClient = {
        getStats: () => getYieldCurveClient().getCacheStats(),
        clearCache: (country?: string) => getYieldCurveClient().clearCache(country),
        fetch: (country: string) => getYieldCurveClient().fetchYieldCurve(country)
    };
}
