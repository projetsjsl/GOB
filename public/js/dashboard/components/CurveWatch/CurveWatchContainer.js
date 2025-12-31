/**
 * CurveWatch Container - Main component for yield curve visualization
 *
 * Features:
 * - Real-time US & Canada yield curves
 * - Interactive Recharts with zoom/pan
 * - Historical comparison
 * - Spread analysis
 */

const { useState, useEffect, useCallback, useMemo } = React;

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

  useEffect(() => {
    if (rechartsReady) {
      if (debugMode) {
        console.log('✅ Recharts already loaded and ready');
      }
      return;
    }

    if (window.__rechartsLoading) {
      if (debugMode) {
        console.log('🔄 Recharts already loading...');
      }
      return;
    }

    if (debugMode) {
      console.log('🔄 Loading Recharts from CDN...');
    }

    window.__rechartsLoading = true;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/recharts@2.10.3/dist/Recharts.js';
    script.async = true;
    script.dataset.rechartsFallback = 'true';
    script.onload = () => {
      window.__rechartsLoading = false;
      const isReady = !!(window.Recharts && window.Recharts.LineChart && window.Recharts.ResponsiveContainer);
      if (debugMode) {
        console.log('✅ Recharts loaded:', {
          hasRecharts: !!window.Recharts,
          hasLineChart: !!(window.Recharts && window.Recharts.LineChart),
          hasResponsiveContainer: !!(window.Recharts && window.Recharts.ResponsiveContainer),
          isReady
        });
      }
      setRechartsReady(isReady);
    };
    script.onerror = () => {
      window.__rechartsLoading = false;
      if (debugMode) {
        console.error('❌ Failed to load Recharts from CDN');
      }
    };
    document.head.appendChild(script);
  }, [rechartsReady, debugMode]);

  // Safe fetch that bypasses any overrides
  const safeFetch = useCallback((url) => {
    // Check if we have the original fetch from before overrides
    const nativeFetch = window.nativeFetch || window.originalFetch || fetch;

    // Log API call
    if (debugMode) {
      setApiCallLog(prev => [...prev, {
        url,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }]);
    }

    // If native fetch is not available, use XMLHttpRequest
    if (typeof window.XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = () => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.url === url && log.status === 'pending'
                ? { ...log, status: xhr.status, response: xhr.responseText.substring(0, 100) + '...' }
                : log
            ));
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              ok: true,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText)
            });
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.url === url && log.status === 'pending'
                ? { ...log, status: 'error', error: 'Network error' }
                : log
            ));
          }
          reject(new Error('Network error'));
        };
        xhr.send();
      });
    } else {
      // Fallback to native fetch if XMLHttpRequest is not available
      return nativeFetch(url)
        .then(response => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.url === url && log.status === 'pending'
                ? { ...log, status: response.status, response: 'Response received' }
                : log
            ));
          }
          return response;
        })
        .catch(error => {
          if (debugMode) {
            setApiCallLog(prev => prev.map(log =>
              log.url === url && log.status === 'pending'
                ? { ...log, status: 'error', error: error.message }
                : log
            ));
          }
          throw error;
        });
    }
  }, [debugMode]);

  // Fetch current yield curve data
  const fetchCurrentData = useCallback(async () => {
    if (debugMode) {
      console.log('🔍 CurveWatch: Starting fetchCurrentData');
    }

    try {
      const response = await safeFetch('/api/yield-curve?country=both');
      if (!response.ok) throw new Error('Failed to fetch yield curve data');
      const result = await response.json();

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

      if (debugMode) {
        console.log('✅ CurveWatch: Current data updated successfully');
      }
    } catch (err) {
      console.error('❌ CurveWatch: Error fetching current data:', err);
      setError(err.message);
    }
  }, [safeFetch, debugMode]);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async (period) => {
    if (debugMode) {
      console.log('🔍 CurveWatch: Starting fetchHistoricalData for period:', period);
    }

    try {
      const response = await safeFetch(`/api/yield-curve?history=true&country=both&period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      const result = await response.json();

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
    }
  }, [safeFetch, debugMode]);

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

    try {
      const response = await safeFetch(`/api/yield-curve?country=both&date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch compare data');
      const result = await response.json();

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
    }
  }, [safeFetch, debugMode]);

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

  if (error) {
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
                    };
                    setCurrentData({
                      us: mockData.data.us,
                      canada: mockData.data.canada
                    });
                    setError(null);
                    console.log('✅ Sample mock data loaded');
                  }
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
