/**
 * Cache Manager for Dashboard
 * Handles caching logic for dashboard data
 */

/**
 * Cache Settings Structure:
 * {
 *   maxAgeHours: number,
 *   refreshOnNavigation: boolean,
 *   refreshIntervalMinutes: number
 * }
 */

/**
 * Get cache settings from localStorage
 */
const getCacheSettings = () => {
    try {
        const saved = localStorage.getItem('cacheSettings');
        return saved ? JSON.parse(saved) : {
            maxAgeHours: 4,
            refreshOnNavigation: true,
            refreshIntervalMinutes: 10
        };
    } catch (e) {
        console.warn('Error reading cache settings:', e);
        return {
            maxAgeHours: 4,
            refreshOnNavigation: true,
            refreshIntervalMinutes: 10
        };
    }
};

/**
 * Save cache settings to localStorage
 */
const saveCacheSettings = (settings) => {
    try {
        localStorage.setItem('cacheSettings', JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Error saving cache settings:', e);
        return false;
    }
};

/**
 * Check if cached data is expired
 */
const isCacheExpired = (timestamp, maxAgeHours = 4) => {
    if (!timestamp) return true;
    const now = Date.now();
    const age = now - timestamp;
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
    return age > maxAge;
};

/**
 * Get cached data from sessionStorage or localStorage
 */
const getCachedData = (key, maxAgeHours = 4, storage = 'session') => {
    try {
        const storageObj = storage === 'session' ? sessionStorage : localStorage;
        const cached = storageObj.getItem(key);

        if (!cached) return null;

        const data = JSON.parse(cached);

        // Check if expired
        if (data.timestamp && isCacheExpired(data.timestamp, maxAgeHours)) {
            // Clear expired cache
            storageObj.removeItem(key);
            return null;
        }

        return data.data;
    } catch (e) {
        console.warn(`Error reading cached data for ${key}:`, e);
        return null;
    }
};

/**
 * Set cached data in sessionStorage or localStorage
 */
const setCachedData = (key, data, storage = 'session') => {
    try {
        const storageObj = storage === 'session' ? sessionStorage : localStorage;
        const cacheObject = {
            data,
            timestamp: Date.now()
        };
        storageObj.setItem(key, JSON.stringify(cacheObject));
        return true;
    } catch (e) {
        console.error(`Error caching data for ${key}:`, e);
        return false;
    }
};

/**
 * Clear cached data
 */
const clearCachedData = (key, storage = 'session') => {
    try {
        const storageObj = storage === 'session' ? sessionStorage : localStorage;
        storageObj.removeItem(key);
        return true;
    } catch (e) {
        console.error(`Error clearing cache for ${key}:`, e);
        return false;
    }
};

/**
 * Clear all dashboard caches
 */
const clearAllDashboardCaches = () => {
    const cacheKeys = [
        'preloaded-dashboard-data',
        'dashboard-ticker-data',
        'dashboard-news-data',
        'dashboard-seeking-alpha-data',
        'dashboard-stock-data'
    ];

    let cleared = 0;

    cacheKeys.forEach(key => {
        if (clearCachedData(key, 'session')) cleared++;
        if (clearCachedData(key, 'local')) cleared++;
    });

    console.log(`✅ Cleared ${cleared} cache entries`);
    return cleared;
};

/**
 * Get cache status for all dashboard data
 */
const getCacheStatus = () => {
    const cacheKeys = [
        { key: 'preloaded-dashboard-data', storage: 'session', label: 'Preloaded Data' },
        { key: 'dashboard-ticker-data', storage: 'session', label: 'Ticker Data' },
        { key: 'dashboard-news-data', storage: 'session', label: 'News Data' },
        { key: 'dashboard-seeking-alpha-data', storage: 'session', label: 'Seeking Alpha Data' }
    ];

    const status = {};

    cacheKeys.forEach(({ key, storage, label }) => {
        try {
            const storageObj = storage === 'session' ? sessionStorage : localStorage;
            const cached = storageObj.getItem(key);

            if (cached) {
                const data = JSON.parse(cached);
                const settings = getCacheSettings();
                const expired = isCacheExpired(data.timestamp, settings.maxAgeHours);

                status[key] = {
                    label,
                    exists: true,
                    timestamp: data.timestamp,
                    age: Date.now() - data.timestamp,
                    expired,
                    size: new Blob([cached]).size
                };
            } else {
                status[key] = {
                    label,
                    exists: false
                };
            }
        } catch (e) {
            status[key] = {
                label,
                exists: false,
                error: e.message
            };
        }
    });

    return status;
};

/**
 * Format cache age for display
 */
const formatCacheAge = (timestamp) => {
    if (!timestamp) return 'N/A';

    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (60 * 1000));
    const hours = Math.floor(age / (60 * 60 * 1000));
    const days = Math.floor(age / (24 * 60 * 60 * 1000));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

/**
 * Format cache size for display
 */
const formatCacheSize = (bytes) => {
    if (!bytes) return 'N/A';

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    if (kb >= 1) return `${kb.toFixed(2)} KB`;
    return `${bytes} bytes`;
};

/**
 * Preload dashboard data (called from login page)
 */
const preloadDashboardData = async (API_BASE_URL) => {
    try {
        console.log('🔄 Preloading dashboard data...');

        // Fetch ticker data
        const tickerResponse = await fetch(`${API_BASE_URL}/api/marketdata-batch?type=indices`);
        const tickerData = tickerResponse.ok ? await tickerResponse.json() : null;

        // Fetch news data
        const newsResponse = await fetch(`${API_BASE_URL}/api/news?limit=20`);
        const newsData = newsResponse.ok ? await newsResponse.json() : null;

        // Create preload package
        const preloadPackage = {
            timestamp: Date.now(),
            tickerData: tickerData?.data || [],
            newsData: newsData?.articles || [],
            titlesTabData: {
                tickerLatestNews: {},
                tickerMoveReasons: {}
            }
        };

        // Save to sessionStorage
        sessionStorage.setItem('preloaded-dashboard-data', JSON.stringify(preloadPackage));

        console.log('✅ Dashboard data preloaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Error preloading dashboard data:', error);
        return false;
    }
};

/**
 * Check if preloaded data is available and valid
 */
const hasValidPreloadedData = (maxAgeMinutes = 5) => {
    try {
        const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
        if (!preloadedDataStr) return false;

        const preloadedData = JSON.parse(preloadedDataStr);
        const dataAge = Date.now() - (preloadedData.timestamp || 0);
        const maxAge = maxAgeMinutes * 60 * 1000;

        return dataAge < maxAge;
    } catch (e) {
        return false;
    }
};
