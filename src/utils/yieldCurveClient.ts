type YieldCurvePayload = any;

type FetchOptions = {
  country?: string;
  baseUrl?: string;
  forceRefresh?: boolean;
};

type CacheEntry = {
  data: YieldCurvePayload;
  cachedAt: number;
};

const TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
const MIN_FETCH_INTERVAL_MS = 2000; // Minimum 2 seconds between fetches for same key
const inflight = new Map<string, Promise<YieldCurvePayload>>();
const cache = new Map<string, CacheEntry>();
const lastFetchTime = new Map<string, number>(); // Track last fetch time for rate limiting

const buildCacheKey = (country: string, baseUrl: string) => `${baseUrl}::${country}`;

const buildYieldCurveUrl = (country: string, baseUrl: string) => {
  const path = `/api/yield-curve?country=${encodeURIComponent(country)}`;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
};

export async function fetchYieldCurve(options: FetchOptions = {}): Promise<YieldCurvePayload> {
  const country = options.country ?? 'both';
  const baseUrl = options.baseUrl ?? '';
  const cacheKey = buildCacheKey(country, baseUrl);
  const now = Date.now();

  // RATE LIMITING - Block rapid repeat calls
  const lastFetch = lastFetchTime.get(cacheKey) || 0;
  const timeSinceLastFetch = now - lastFetch;
  if (timeSinceLastFetch < MIN_FETCH_INTERVAL_MS) {
    // Return cached data if available, otherwise return inflight request
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`🛑 yieldCurveClient RATE LIMITED (${cacheKey}) - returning cached`);
      return cached.data;
    }
    const inflightReq = inflight.get(cacheKey);
    if (inflightReq) {
      console.log(`🛑 yieldCurveClient RATE LIMITED (${cacheKey}) - joining inflight`);
      return inflightReq;
    }
  }

  if (!options.forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && now - cached.cachedAt < TTL_MS) {
      return cached.data;
    }
  }

  const existing = inflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  // Update last fetch time BEFORE making request
  lastFetchTime.set(cacheKey, now);

  const request = fetch(buildYieldCurveUrl(country, baseUrl), {
    method: 'GET',
    headers: { Accept: 'application/json' }
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      cache.set(cacheKey, { data, cachedAt: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, request);
  return request;
}

export function clearYieldCurveCache(country?: string, baseUrl: string = '') {
  if (!country) {
    cache.clear();
    return;
  }
  cache.delete(buildCacheKey(country, baseUrl));
}
