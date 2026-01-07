/**
 * CurveWatch Container - Main component for yield curve visualization
 *
 * Features:
 * - Real-time US & Canada yield curves
 * - Interactive Recharts with zoom/pan
 * - Historical comparison
 * - Spread analysis
 */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// Hook to get theme from GOBThemes
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (window.GOBThemes) {
      return window.GOBThemes.getCurrentTheme() === 'dark';
    }
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      if (window.GOBThemes) {
        setIsDark(window.GOBThemes.getCurrentTheme() === 'dark');
      } else {
        setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  return isDark;
};

// Theme colors
const getThemeColors = (isDark) => ({
  background: isDark ? '#1a1a2e' : '#ffffff',
  cardBg: isDark ? '#16213e' : '#f8f9fa',
  text: isDark ? '#e0e0e0' : '#333333',
  textMuted: isDark ? '#888888' : '#666666',
  border: isDark ? '#2d3748' : '#e2e8f0',
  grid: isDark ? '#2d3748' : '#e2e8f0',
  usLine: '#3b82f6',
  canadaLine: '#ef4444',
  spreadPositive: '#22c55e',
  spreadNegative: '#ef4444',
  tooltip: isDark ? '#1e293b' : '#ffffff',
});

// Main Container Component
window.CurveWatchContainer = ({ embedded = false }) => {
  const isDark = useDarkMode();
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonBlockingError, setNonBlockingError] = useState(null);
  const [currentData, setCurrentData] = useState({ us: null, canada: null });
  const [historicalData, setHistoricalData] = useState({ us: [], canada: [] });
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [compareDate, setCompareDate] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [activeView, setActiveView] = useState('curves'); // 'curves', 'spread', 'compare'
  const [showCanada, setShowCanada] = useState(true);
  const [showUS, setShowUS] = useState(true);
  const [rechartsReady, setRechartsReady] = useState(() => (
    !!(window.Recharts && window.Recharts.LineChart && window.Recharts.ResponsiveContainer)
  ));
  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  const [manualData, setManualData] = useState(null);
  const [apiCallLog, setApiCallLog] = useState([]);
  const inflightRef = useRef({ current: false, historical: 0, compare: 0 });
  const historyRequestIdRef = useRef(0);
  const compareRequestIdRef = useRef(0);
  const hasCurrentDataRef = useRef(false);

  // Check periodically if Recharts becomes available (in case it's loaded by page)
  useEffect(() => {
    const checkRecharts = () => {
      // Method 1: Try global Recharts (like JLabTab does)
      let RechartsGlobal = null;
      try {
        // Check if Recharts is available globally (not just window.Recharts)
        if (typeof Recharts !== 'undefined') {
          RechartsGlobal = Recharts;
        } else if (typeof window !== 'undefined' && typeof window.Recharts !== 'undefined') {
          RechartsGlobal = window.Recharts;
        }
      } catch (e) {
        // Recharts might not be defined yet
      }

      // Method 2: Force expose to window.Recharts if found globally
      if (RechartsGlobal && !window.Recharts) {
        window.Recharts = RechartsGlobal;
      }

      // Method 3: Handle UMD format - check if Recharts is in default export
      if (window.Recharts && window.Recharts.default) {
        const recharts = window.Recharts.default;
        // Copy all exports to main object
        Object.keys(recharts).forEach(key => {
          if (!window.Recharts[key] && typeof recharts[key] !== 'undefined') {
            window.Recharts[key] = recharts[key];
          }
        });
      }

      // Method 4: Try to extract components directly like JLabTab
      let LineChart, ResponsiveContainer;
      try {
        // Try direct access first (like JLabTab: const { LineChart } = Recharts)
        if (typeof Recharts !== 'undefined') {
          LineChart = Recharts.LineChart;
          ResponsiveContainer = Recharts.ResponsiveContainer;
          // If found, ensure window.Recharts has them
          if (LineChart && ResponsiveContainer) {
            window.Recharts = window.Recharts || {};
            window.Recharts.LineChart = LineChart;
            window.Recharts.ResponsiveContainer = ResponsiveContainer;
          }
        }
        
        // Fallback to window.Recharts
        if (!LineChart && window.Recharts) {
          LineChart = window.Recharts.LineChart;
          ResponsiveContainer = window.Recharts.ResponsiveContainer;
        }
      } catch (e) {
        if (debugMode) {
          console.warn('Error accessing Recharts components:', e);
        }
      }
      
      const isReady = !!(LineChart && ResponsiveContainer);
      if (isReady && !rechartsReady) {
        if (debugMode) {
          console.log('✅ Recharts detected and ready:', {
            hasRecharts: !!window.Recharts,
            hasGlobalRecharts: typeof Recharts !== 'undefined',
            hasLineChart: !!LineChart,
            hasResponsiveContainer: !!ResponsiveContainer,
            keys: window.Recharts ? Object.keys(window.Recharts).slice(0, 15) : []
          });
        }
        setRechartsReady(true);
        return true;
      }
      
      // Debug info if not ready
      if (debugMode) {
        console.log('🔍 Recharts check:', {
          hasRecharts: !!window.Recharts,
          hasGlobalRecharts: typeof Recharts !== 'undefined',
          hasLineChart: !!LineChart,
          hasResponsiveContainer: !!ResponsiveContainer,
          rechartsType: typeof window.Recharts,
          keys: window.Recharts ? Object.keys(window.Recharts).slice(0, 15) : [],
          hasDefault: !!(window.Recharts && window.Recharts.default)
        });
      }
      
      return false;
    };

    // Check immediately
    if (checkRecharts()) return;

    // If not ready, check periodically (more frequently)
    const interval = setInterval(() => {
      if (checkRecharts()) {
        clearInterval(interval);
      }
    }, 100);

    // Also try loading if not available after 500ms (faster)
    const timeout = setTimeout(() => {
      if (rechartsReady || window.__rechartsLoading) {
        return;
      }

      if (debugMode) {
        console.log('🔄 Recharts not detected, loading from CDN...');
      }

      window.__rechartsLoading = true;
      const script = document.createElement('script');
      // Try jsdelivr first (same as dashboard), then fallback to unpkg
      script.src = 'https://cdn.jsdelivr.net/npm/recharts@2.10.3/dist/Recharts.js';
      script.async = true;
      script.dataset.rechartsFallback = 'true';
      script.onload = () => {
        window.__rechartsLoading = false;
        // Wait a bit for Recharts to initialize
        setTimeout(() => {
          checkRecharts();
        }, 200);
      };
      script.onerror = () => {
        window.__rechartsLoading = false;
        if (debugMode) {
          console.error('❌ Failed to load Recharts from jsdelivr, trying unpkg...');
        }
        // Fallback to unpkg
        const fallback = document.createElement('script');
        fallback.src = 'https://unpkg.com/recharts@2.10.3/dist/Recharts.js';
        fallback.async = true;
        fallback.onload = () => {
          window.__rechartsLoading = false;
          setTimeout(() => {
            checkRecharts();
          }, 200);
        };
        fallback.onerror = () => {
          window.__rechartsLoading = false;
          if (debugMode) {
            console.error('❌ Failed to load Recharts from both CDNs');
          }
        };
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [rechartsReady, debugMode]);

  const createRequestId = () => `cw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const formatCurveWatchError = useCallback((err, contextLabel) => {
    const details = err?.details || {};
    const parts = [];
    if (details.status) {
      parts.push(`HTTP ${details.status}`);
    }
    if (details.contentType) {
      parts.push(`ct ${details.contentType}`);
    }
    if (details.requestId) {
      parts.push(`req ${details.requestId}`);
    }
    const base = err?.message || `Erreur ${contextLabel}`;
    return parts.length ? `${base} (${parts.join(' | ')})` : base;
  }, []);

  // Safe fetch that bypasses any overrides
  const safeFetch = useCallback((url, { timeoutMs = 15000 } = {}) => {
    const requestId = createRequestId();
    const nativeFetch = window.nativeFetch || window.originalFetch || window.fetch;

    if (debugMode) {
      setApiCallLog(prev => [...prev, {
        url,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }]);
    }

    if (typeof nativeFetch === 'function') {
      let controller = null;
      let timeoutId = null;
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      }

      return nativeFetch(url, controller ? { signal: controller.signal } : undefined)
        .then(response => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.requestId === requestId
                ? { ...log, status: response.status, response: 'Response received' }
                : log
            ));
          }
          if (timeoutId) clearTimeout(timeoutId);
          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            text: () => response.text(),
            url: response.url,
            __requestId: requestId,
            __requestUrl: url
          };
        })
        .catch(error => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.requestId === requestId
                ? { ...log, status: 'error', error: error.message }
                : log
            ));
          }
          if (timeoutId) clearTimeout(timeoutId);
          error.requestId = requestId;
          throw error;
        });
    }

    if (typeof window.XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.timeout = timeoutMs;
        xhr.onload = () => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.requestId === requestId
                ? { ...log, status: xhr.status, response: xhr.responseText.substring(0, 100) + '...' }
                : log
            ));
          }

          const headers = {
            get: (name) => xhr.getResponseHeader(name)
          };

          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers,
            text: () => Promise.resolve(xhr.responseText),
            url,
            __requestId: requestId,
            __requestUrl: url
          });
        };
        xhr.ontimeout = () => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.requestId === requestId
                ? { ...log, status: 'timeout', error: 'Request timeout' }
                : log
            ));
          }
          const error = new Error('Request timeout');
          error.requestId = requestId;
          reject(error);
        };
        xhr.onerror = () => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.requestId === requestId
                ? { ...log, status: 'error', error: 'Network error' }
                : log
            ));
          }
          const error = new Error('Network error');
          error.requestId = requestId;
          reject(error);
        };
        xhr.send();
      });
    }

    return Promise.reject(new Error('Fetch is not available in this environment'));
  }, [debugMode]);

  const parseJsonResponse = useCallback(async (response, contextLabel) => {
    if (!response) {
      throw new Error(`No response (${contextLabel})`);
    }

    const requestId = response.__requestId || createRequestId();
    const url = response.url || response.__requestUrl || 'unknown';
    const status = response.status ?? 'unknown';
    const statusText = response.statusText || '';
    const contentType = response.headers?.get?.('content-type') || '';
    const text = await response.text();
    const snippet = text.trim().slice(0, 200);
    const details = {
      requestId,
      url,
      status,
      statusText,
      contentType,
      snippet
    };

    const fail = (message) => {
      const error = new Error(message);
      error.details = details;
      console.error('❌ CurveWatch: Invalid response', { contextLabel, ...details });
      throw error;
    };

    if (!response.ok) {
      return fail(`HTTP ${status}${statusText ? ` ${statusText}` : ''} (${contextLabel})`);
    }

    if (!text || text.trim().length === 0) {
      return fail(`Empty response body (${contextLabel})`);
    }

    if (!contentType.includes('application/json')) {
      return fail(`Expected JSON, got ${contentType || 'unknown'} (${contextLabel})`);
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      return fail(`Invalid JSON payload (${contextLabel})`);
    }
  }, []);

  const fetchWithRetry = useCallback(async (url, contextLabel, { retries = 2 } = {}) => {
    let attempt = 0;
    let lastError = null;

    while (attempt <= retries) {
      try {
        const response = await safeFetch(url, { timeoutMs: 15000 });
        return await parseJsonResponse(response, contextLabel);
      } catch (err) {
        lastError = err;
        const status = err?.details?.status;
        const shouldRetry = status === 429 || status === 503 || err?.message?.includes('timeout');
        if (!shouldRetry || attempt === retries) {
          throw err;
        }
        const delay = 250 * Math.pow(2, attempt);
        if (debugMode) {
          console.warn(`🔁 CurveWatch retry (${contextLabel}) in ${delay}ms`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt += 1;
      }
    }

    throw lastError;
  }, [safeFetch, parseJsonResponse, debugMode]);

  const assertPayloadShape = useCallback((payload, contextLabel) => {
    if (!payload || typeof payload !== 'object') {
      const error = new Error(`Unexpected payload shape (${contextLabel})`);
      error.details = { payloadType: typeof payload };
      throw error;
    }

    if (contextLabel === 'current' || contextLabel === 'compare') {
      if (!payload.data || typeof payload.data !== 'object') {
        const error = new Error(`Unexpected payload shape (${contextLabel})`);
        error.details = { keys: Object.keys(payload || {}) };
        throw error;
      }
    }

    if (contextLabel === 'historical') {
      if (!payload.history || typeof payload.history !== 'object') {
        const error = new Error(`Unexpected payload shape (${contextLabel})`);
        error.details = { keys: Object.keys(payload || {}) };
        throw error;
      }
    }
  }, []);

  // Fetch current yield curve data
  const fetchCurrentData = useCallback(async () => {
    if (debugMode) {
      console.log('🔍 CurveWatch: Starting fetchCurrentData');
    }

    if (inflightRef.current.current) return;
    inflightRef.current.current = true;

    try {
      const result = await fetchWithRetry('/api/yield-curve?country=both', 'current');
      assertPayloadShape(result, 'current');

      if (debugMode) {
        console.log('📊 CurveWatch: API Response:', result);
        console.log('📊 CurveWatch: US Data:', result.data?.us);
        console.log('📊 CurveWatch: Canada Data:', result.data?.canada);
      }

      setCurrentData({
        us: result.data?.us || null,
        canada: result.data?.canada || null
      });
      setError(null);
      setNonBlockingError(null);
      hasCurrentDataRef.current = !!(result.data?.us || result.data?.canada);

      if (debugMode) {
        console.log('✅ CurveWatch: Current data updated successfully');
      }
    } catch (err) {
      console.error('❌ CurveWatch: Error fetching current data:', err);
      const message = formatCurveWatchError(err, 'current');
      if (hasCurrentDataRef.current) {
        setNonBlockingError(message);
      } else {
        setError(message);
      }
    } finally {
      inflightRef.current.current = false;
    }
  }, [fetchWithRetry, assertPayloadShape, debugMode, formatCurveWatchError]);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async (period) => {
    if (debugMode) {
      console.log('🔍 CurveWatch: Starting fetchHistoricalData for period:', period);
    }

    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    inflightRef.current.historical += 1;

    try {
      const result = await fetchWithRetry(`/api/yield-curve?history=true&country=both&period=${period}`, 'historical');
      assertPayloadShape(result, 'historical');
      if (requestId !== historyRequestIdRef.current) return;

      if (debugMode) {
        console.log('📊 CurveWatch: Historical API Response:', result);
        console.log('📊 CurveWatch: Historical US Data:', result.history?.us?.length, 'items');
        console.log('📊 CurveWatch: Historical Canada Data:', result.history?.canada?.length, 'items');
      }

      setHistoricalData({
        us: result.history?.us || [],
        canada: result.history?.canada || []
      });
    } catch (err) {
      console.error('❌ CurveWatch: Error fetching historical data:', err);
      const message = formatCurveWatchError(err, 'historical');
      setNonBlockingError(prev => prev || message);
    } finally {
      inflightRef.current.historical = Math.max(0, inflightRef.current.historical - 1);
    }
  }, [fetchWithRetry, assertPayloadShape, debugMode, formatCurveWatchError]);

  // Fetch compare date data
  const fetchCompareData = useCallback(async (date) => {
    if (!date) {
      if (debugMode) {
        console.log('🔍 CurveWatch: Clearing compare data (no date provided)');
      }
      setCompareData(null);
      return;
    }

    if (debugMode) {
      console.log('🔍 CurveWatch: Starting fetchCompareData for date:', date);
    }

    const requestId = compareRequestIdRef.current + 1;
    compareRequestIdRef.current = requestId;
    inflightRef.current.compare += 1;

    try {
      const result = await fetchWithRetry(`/api/yield-curve?country=both&date=${date}`, 'compare');
      assertPayloadShape(result, 'compare');
      if (requestId !== compareRequestIdRef.current) return;

      if (debugMode) {
        console.log('📊 CurveWatch: Compare API Response:', result);
        console.log('📊 CurveWatch: Compare US Data:', result.data?.us);
        console.log('📊 CurveWatch: Compare Canada Data:', result.data?.canada);
      }

      setCompareData({
        us: result.data?.us || null,
        canada: result.data?.canada || null,
        date
      });
    } catch (err) {
      console.error('❌ CurveWatch: Error fetching compare data:', err);
      setCompareData(null);
      const message = formatCurveWatchError(err, 'compare');
      setNonBlockingError(prev => prev || message);
    } finally {
      inflightRef.current.compare = Math.max(0, inflightRef.current.compare - 1);
    }
  }, [fetchWithRetry, assertPayloadShape, debugMode, formatCurveWatchError]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      if (debugMode) {
        console.log('🔍 CurveWatch: Starting initial data load');
      }

      setLoading(true);
      await Promise.all([
        fetchCurrentData(),
        fetchHistoricalData(selectedPeriod)
      ]);
      setLoading(false);

      if (debugMode) {
        console.log('✅ CurveWatch: Initial data load completed');
      }
    };
    loadData();
  }, [fetchCurrentData, fetchHistoricalData, selectedPeriod, debugMode]);

  // Fetch compare data when date changes
  useEffect(() => {
    if (debugMode) {
      console.log('🔍 CurveWatch: Compare date changed to:', compareDate);
    }
    fetchCompareData(compareDate);
  }, [compareDate, fetchCompareData, debugMode]);

  // Refresh data periodically (every 5 minutes)
  useEffect(() => {
    if (debugMode) {
      console.log('🔄 CurveWatch: Setting up auto-refresh interval');
    }

    const interval = setInterval(() => {
      if (debugMode) {
        console.log('🔄 CurveWatch: Auto-refresh triggered');
      }
      fetchCurrentData();
    }, 5 * 60 * 1000);

    return () => {
      if (debugMode) {
        console.log('🔄 CurveWatch: Cleaning up auto-refresh interval');
      }
      clearInterval(interval);
    };
  }, [fetchCurrentData, debugMode]);

  // Transform rates array to chart data
  const getChartData = useCallback(() => {
    if (debugMode) {
      console.log('📊 CurveWatch: getChartData called with currentData:', currentData);
      console.log('📊 CurveWatch: compareData:', compareData);
    }

    if (!currentData.us && !currentData.canada) {
      if (debugMode) {
        console.log('📊 CurveWatch: No current data available, returning empty array');
      }
      return [];
    }

    const maturities = ['1M', '2M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];

    const chartData = maturities.map(maturity => {
      const usRate = currentData.us?.rates?.find(r => r.maturity === maturity);
      const canadaRate = currentData.canada?.rates?.find(r => r.maturity === maturity);
      const usCompare = compareData?.us?.rates?.find(r => r.maturity === maturity);
      const canadaCompare = compareData?.canada?.rates?.find(r => r.maturity === maturity);

      if (debugMode && (usRate || canadaRate)) {
        console.log(`📊 CurveWatch: Maturity ${maturity} - US: ${usRate?.rate || 'null'}, CA: ${canadaRate?.rate || 'null'}`);
      }

      return {
        maturity,
        months: maturityToMonths(maturity),
        us: usRate?.rate || null,
        canada: canadaRate?.rate || null,
        usChange: usRate?.change1M || null,
        canadaChange: canadaRate?.change1M || null,
        usCompare: usCompare?.rate || null,
        canadaCompare: canadaCompare?.rate || null,
      };
    }).filter(d => d.us !== null || d.canada !== null);

    if (debugMode) {
      console.log('📊 CurveWatch: Final chart data:', chartData);
    }

    return chartData;
  }, [currentData, compareData, debugMode]);

  // Get spread history data
  const getSpreadHistoryData = useCallback(() => {
    if (debugMode) {
      console.log('📊 CurveWatch: getSpreadHistoryData called with historicalData:', historicalData);
    }

    if (!historicalData.us.length) {
      if (debugMode) {
        console.log('📊 CurveWatch: No historical data available, returning empty array');
      }
      return [];
    }

    const spreadData = historicalData.us.map(item => ({
      date: item.data_date,
      spread: item.spread_10y_2y,
      inverted: item.inverted
    })).filter(d => d.spread !== null);

    if (debugMode) {
      console.log('📊 CurveWatch: Final spread history data:', spreadData);
    }

    return spreadData;
  }, [historicalData, debugMode]);

  // Helper function
  const maturityToMonths = (maturity) => {
    const value = parseFloat(maturity);
    if (maturity.includes('M')) return value;
    if (maturity.includes('Y')) return value * 12;
    return 0;
  };

  // Function to test API calls directly
  const testApiCall = useCallback(async () => {
    if (debugMode) {
      console.log('🔍 Testing API call directly...');
    }

    try {
      const response = await fetch('/api/yield-curve?country=both');
      const data = await response.json();

      if (debugMode) {
        console.log('✅ API Test Response:', data);
        console.log('✅ API Test - US Data Structure:', data.data?.us);
        console.log('✅ API Test - Canada Data Structure:', data.data?.canada);

        // Validate data structure
        if (data.data?.us?.rates) {
          console.log('✅ US rates structure OK:', data.data.us.rates.length, 'items');
          console.log('✅ Sample US rate:', data.data.us.rates[0]);
        } else {
          console.warn('⚠️ US rates structure invalid:', data.data?.us);
        }

        if (data.data?.canada?.rates) {
          console.log('✅ Canada rates structure OK:', data.data.canada.rates.length, 'items');
          console.log('✅ Sample Canada rate:', data.data.canada.rates[0]);
        } else {
          console.warn('⚠️ Canada rates structure invalid:', data.data?.canada);
        }
      }

      return data;
    } catch (error) {
      console.error('❌ API Test Error:', error);
      return null;
    }
  }, [debugMode]);

  // Period selector
  const periods = [
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' }
  ];

  // View tabs
  const views = [
    { value: 'curves', label: 'Courbes' },
    { value: 'spread', label: 'Spread 10Y-2Y' },
    { value: 'compare', label: 'Comparer' }
  ];

  // Styles
  const containerStyle = {
    backgroundColor: colors.cardBg,
    borderRadius: '12px',
    padding: embedded ? '12px' : '16px',
    border: `1px solid ${colors.border}`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
    margin: 0
  };

  const tabsStyle = {
    display: 'flex',
    gap: '4px',
    backgroundColor: isDark ? '#1a1a2e' : '#e2e8f0',
    borderRadius: '8px',
    padding: '4px'
  };

  const tabStyle = (isActive) => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: isActive ? colors.usLine : 'transparent',
    color: isActive ? '#ffffff' : colors.textMuted,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s'
  });

  const periodStyle = (isActive) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    border: `1px solid ${isActive ? colors.usLine : colors.border}`,
    backgroundColor: isActive ? colors.usLine : 'transparent',
    color: isActive ? '#ffffff' : colors.textMuted,
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500'
  });

  const checkboxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: colors.textMuted,
    cursor: 'pointer'
  };

  if (!rechartsReady) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: colors.textMuted }}>
          Chargement de Recharts en cours...
        </div>
        {/* Debug controls */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: '6px 12px',
              backgroundColor: debugMode ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {debugMode ? 'Debug ON' : 'Debug OFF'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: colors.textMuted }}>Chargement des courbes de taux...</div>
        {/* Debug controls */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: '6px 12px',
              backgroundColor: debugMode ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {debugMode ? 'Debug ON' : 'Debug OFF'}
          </button>
        </div>
      </div>
    );
  }

  const hasData = !!(currentData.us || currentData.canada);

  if (error && !hasData) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: colors.spreadNegative }}>Erreur: {error}</div>
        <button
          onClick={fetchCurrentData}
          style={{ marginTop: '8px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Réessayer
        </button>
        {/* Debug controls */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: '6px 12px',
              backgroundColor: debugMode ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {debugMode ? 'Debug ON' : 'Debug OFF'}
          </button>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const spreadData = getSpreadHistoryData();

  if (debugMode) {
    console.log('📊 Final chart data passed to YieldCurveChart:', chartData);
    console.log('📊 Final spread data passed to SpreadChart:', spreadData);
  }

  return (
    <div style={containerStyle}>
      {nonBlockingError && hasData && (
        <div
          style={{
            marginBottom: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
            border: `1px solid ${colors.spreadNegative}`,
            color: colors.spreadNegative,
            fontSize: '12px'
          }}
        >
          {nonBlockingError}
          <button
            onClick={fetchCurrentData}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Réessayer
          </button>
        </div>
      )}
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          CurveWatch - Courbes des Taux
        </h3>

        {/* View Tabs */}
        <div style={tabsStyle}>
          {views.map(view => (
            <button
              key={view.value}
              style={tabStyle(activeView === view.value)}
              onClick={() => setActiveView(view.value)}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Debug controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: '4px 8px',
              backgroundColor: debugMode ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            {debugMode ? 'Debug ON' : 'Debug OFF'}
          </button>
        </div>
      </div>

      {/* Debug Panel - Only shown when debug mode is on */}
      {debugMode && (
        <div style={{
          backgroundColor: colors.tooltip,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: colors.text }}>
            🐞 Debug Panel
          </div>

          {/* API Call Log */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: colors.text }}>
              API Calls ({apiCallLog.length}):
            </div>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '10px', color: colors.textMuted }}>
              {apiCallLog.slice(-5).map((log, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>
                  {log.status === 'pending' ? '⏳' : log.status === 'error' ? '❌' : '✅'}
                  {log.url} - {log.status} {log.response && `(${log.response})`}
                </div>
              ))}
            </div>
          </div>

          {/* Manual Data Input */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: colors.text }}>
              Manual Data Input:
            </div>
            <textarea
              value={manualData || ''}
              onChange={(e) => setManualData(e.target.value)}
              placeholder="Paste JSON data here to manually load it"
              style={{
                width: '100%',
                height: '80px',
                padding: '6px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: '10px',
                fontFamily: 'monospace'
              }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <button
                onClick={() => {
                  try {
                    if (manualData) {
                      const parsed = JSON.parse(manualData);
                      setCurrentData({
                        us: parsed.data?.us || null,
                        canada: parsed.data?.canada || null
                      });
                      setError(null);
                      console.log('✅ Manual data loaded:', parsed);
                    }
                  } catch (err) {
                    console.error('❌ Error parsing manual data:', err);
                    setError('Invalid JSON format');
                  }
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Load Manual Data
              </button>
              <button
                onClick={() => {
                  // Load sample mock data
                  const mockData = {
                    data: {
                      us: {
                        country: "US",
                        currency: "USD",
                        date: new Date().toISOString().split('T')[0],
                        source: "Mock Data",
                        rates: [
                          { maturity: "1M", rate: 5.35, months: 1, change1M: 0.05 },
                          { maturity: "2M", rate: 5.30, months: 2, change1M: 0.03 },
                          { maturity: "3M", rate: 5.28, months: 3, change1M: 0.02 },
                          { maturity: "6M", rate: 5.15, months: 6, change1M: -0.02 },
                          { maturity: "1Y", rate: 4.95, months: 12, change1M: -0.05 },
                          { maturity: "2Y", rate: 4.65, months: 24, change1M: -0.10 },
                          { maturity: "3Y", rate: 4.45, months: 36, change1M: -0.12 },
                          { maturity: "5Y", rate: 4.25, months: 60, change1M: -0.15 },
                          { maturity: "7Y", rate: 4.30, months: 84, change1M: -0.12 },
                          { maturity: "10Y", rate: 4.35, months: 120, change1M: -0.10 },
                          { maturity: "20Y", rate: 4.45, months: 240, change1M: -0.08 },
                          { maturity: "30Y", rate: 4.40, months: 360, change1M: -0.07 }
                        ]
                      },
                      canada: {
                        country: "Canada",
                        currency: "CAD",
                        date: new Date().toISOString().split('T')[0],
                        source: "Mock Data",
                        rates: [
                          { maturity: "1M", rate: 4.85, months: 1, change1M: 0.02 },
                          { maturity: "2M", rate: 4.80, months: 2, change1M: 0.01 },
                          { maturity: "3M", rate: 4.78, months: 3, change1M: 0.00 },
                          { maturity: "6M", rate: 4.65, months: 6, change1M: -0.03 },
                          { maturity: "1Y", rate: 4.45, months: 12, change1M: -0.06 },
                          { maturity: "2Y", rate: 4.15, months: 24, change1M: -0.11 },
                          { maturity: "3Y", rate: 3.95, months: 36, change1M: -0.13 },
                          { maturity: "5Y", rate: 3.75, months: 60, change1M: -0.16 },
                          { maturity: "7Y", rate: 3.80, months: 84, change1M: -0.13 },
                          { maturity: "10Y", rate: 3.85, months: 120, change1M: -0.11 },
                          { maturity: "20Y", rate: 3.95, months: 240, change1M: -0.09 },
                          { maturity: "30Y", rate: 3.90, months: 360, change1M: -0.08 }
                        ]
                      }
                    }
                  };
                  setCurrentData({
                    us: mockData.data.us,
                    canada: mockData.data.canada
                  });
                  setError(null);
                  console.log('✅ Sample mock data loaded');
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Load Sample Data
              </button>
            </div>
          </div>

          {/* Data Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: colors.text }}>
              Data Status:
            </div>
            <div style={{ fontSize: '10px', color: colors.textMuted }}>
              US Rates: {currentData.us?.rates?.length || 0},
              CA Rates: {currentData.canada?.rates?.length || 0},
              Chart Points: {chartData.length}
            </div>
          </div>

          {/* API Test Button */}
          <div>
            <button
              onClick={testApiCall}
              style={{
                padding: '4px 8px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Test API Call
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {/* Country toggles */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={showUS}
              onChange={(e) => setShowUS(e.target.checked)}
            />
            <span style={{ color: colors.usLine }}>US Treasury</span>
          </label>
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={showCanada}
              onChange={(e) => setShowCanada(e.target.checked)}
            />
            <span style={{ color: colors.canadaLine }}>Canada</span>
          </label>
        </div>

        {/* Period selector (for spread view) */}
        {activeView === 'spread' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {periods.map(p => (
              <button
                key={p.value}
                style={periodStyle(selectedPeriod === p.value)}
                onClick={() => setSelectedPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Date picker for compare view */}
        {activeView === 'compare' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: colors.textMuted }}>Comparer avec:</span>
            <input
              type="date"
              value={compareDate || ''}
              onChange={(e) => setCompareDate(e.target.value || null)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: '12px'
              }}
            />
            {compareDate && (
              <button
                onClick={() => setCompareDate(null)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: colors.spreadNegative,
                  color: '#ffffff',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Effacer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rate Cards */}
      {window.RateCards ? (
        <RateCards
          usData={currentData.us}
          canadaData={currentData.canada}
          colors={colors}
          showUS={showUS}
          showCanada={showCanada}
        />
      ) : (
        <div style={{ padding: '12px', color: colors.textMuted, fontSize: '12px' }}>
          RateCards component not loaded
        </div>
      )}

      {/* Charts */}
      <div style={{ flex: 1, minHeight: '300px' }}>
        {activeView === 'curves' && (
          <YieldCurveChart
            data={chartData}
            colors={colors}
            showUS={showUS}
            showCanada={showCanada}
            isDark={isDark}
          />
        )}

        {activeView === 'spread' && (
          window.SpreadChart ? (
            <SpreadChart
              data={spreadData}
              colors={colors}
              isDark={isDark}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
              SpreadChart component not loaded
            </div>
          )
        )}

        {activeView === 'compare' && (
          window.HistoricalCompare ? (
            <HistoricalCompare
              currentData={chartData}
              compareData={compareData}
              colors={colors}
              showUS={showUS}
              showCanada={showCanada}
              isDark={isDark}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
              HistoricalCompare component not loaded
            </div>
          )
        )}
      </div>

      {/* Footer info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: colors.textMuted,
        paddingTop: '8px',
        borderTop: `1px solid ${colors.border}`
      }}>
        <span>
          Sources: {currentData.us?.source || 'N/A'} (US), {currentData.canada?.source || 'N/A'} (CA)
        </span>
        <span>
          Dernière mise à jour: {currentData.us?.date || 'N/A'}
        </span>
      </div>
    </div>
  );
};

console.log('CurveWatchContainer loaded');
