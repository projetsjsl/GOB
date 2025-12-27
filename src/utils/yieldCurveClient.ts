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

const TTL_MS = 5 * 60 * 1000;
const inflight = new Map<string, Promise<YieldCurvePayload>>();
const cache = new Map<string, CacheEntry>();

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
