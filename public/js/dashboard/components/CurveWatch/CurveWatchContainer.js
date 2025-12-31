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

  useEffect(() => {
    if (rechartsReady) return;
    if (window.__rechartsLoading) return;
    window.__rechartsLoading = true;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/recharts@2.10.3/dist/Recharts.js';
    script.async = true;
    script.dataset.rechartsFallback = 'true';
    script.onload = () => {
      window.__rechartsLoading = false;
      setRechartsReady(!!(window.Recharts && window.Recharts.LineChart && window.Recharts.ResponsiveContainer));
    };
    script.onerror = () => {
      window.__rechartsLoading = false;
    };
    document.head.appendChild(script);
  }, [rechartsReady]);

  // Safe fetch that bypasses any overrides
  const safeFetch = useCallback((url) => {
    // Check if we have the original fetch from before overrides
    const nativeFetch = window.nativeFetch || window.originalFetch || fetch;

    // If native fetch is not available, use XMLHttpRequest
    if (typeof window.XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = () => {
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
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send();
      });
    } else {
      // Fallback to native fetch if XMLHttpRequest is not available
      return nativeFetch(url);
    }
  }, []);

  // Fetch current yield curve data
  const fetchCurrentData = useCallback(async () => {
    try {
      const response = await safeFetch('/api/yield-curve?country=both');
      if (!response.ok) throw new Error('Failed to fetch yield curve data');
      const result = await response.json();

      setCurrentData({
        us: result.data?.us || null,
        canada: result.data?.canada || null
      });
      setError(null);
    } catch (err) {
      console.error('CurveWatch: Error fetching current data:', err);
      setError(err.message);
    }
  }, [safeFetch]);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async (period) => {
    try {
      const response = await safeFetch(`/api/yield-curve?history=true&country=both&period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      const result = await response.json();

      setHistoricalData({
        us: result.history?.us || [],
        canada: result.history?.canada || []
      });
    } catch (err) {
      console.error('CurveWatch: Error fetching historical data:', err);
    }
  }, [safeFetch]);

  // Fetch compare date data
  const fetchCompareData = useCallback(async (date) => {
    if (!date) {
      setCompareData(null);
      return;
    }

    try {
      const response = await safeFetch(`/api/yield-curve?country=both&date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch compare data');
      const result = await response.json();

      setCompareData({
        us: result.data?.us || null,
        canada: result.data?.canada || null,
        date
      });
    } catch (err) {
      console.error('CurveWatch: Error fetching compare data:', err);
      setCompareData(null);
    }
  }, [safeFetch]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCurrentData(),
        fetchHistoricalData(selectedPeriod)
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchCurrentData, fetchHistoricalData, selectedPeriod]);

  // Fetch compare data when date changes
  useEffect(() => {
    fetchCompareData(compareDate);
  }, [compareDate, fetchCompareData]);

  // Refresh data periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(fetchCurrentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCurrentData]);

  // Transform rates array to chart data
  const getChartData = useCallback(() => {
    if (!currentData.us && !currentData.canada) return [];

    const maturities = ['1M', '2M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];

    return maturities.map(maturity => {
      const usRate = currentData.us?.rates?.find(r => r.maturity === maturity);
      const canadaRate = currentData.canada?.rates?.find(r => r.maturity === maturity);
      const usCompare = compareData?.us?.rates?.find(r => r.maturity === maturity);
      const canadaCompare = compareData?.canada?.rates?.find(r => r.maturity === maturity);

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
  }, [currentData, compareData]);

  // Get spread history data
  const getSpreadHistoryData = useCallback(() => {
    if (!historicalData.us.length) return [];

    return historicalData.us.map(item => ({
      date: item.data_date,
      spread: item.spread_10y_2y,
      inverted: item.inverted
    })).filter(d => d.spread !== null);
  }, [historicalData]);

  // Helper function
  const maturityToMonths = (maturity) => {
    const value = parseFloat(maturity);
    if (maturity.includes('M')) return value;
    if (maturity.includes('Y')) return value * 12;
    return 0;
  };

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
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: colors.textMuted }}>Chargement des courbes de taux...</div>
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
      </div>
    );
  }

  const chartData = getChartData();
  const spreadData = getSpreadHistoryData();

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
      </div>

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
      <RateCards
        usData={currentData.us}
        canadaData={currentData.canada}
        colors={colors}
        showUS={showUS}
        showCanada={showCanada}
      />

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
          <SpreadChart
            data={spreadData}
            colors={colors}
            isDark={isDark}
          />
        )}

        {activeView === 'compare' && (
          <HistoricalCompare
            currentData={chartData}
            compareData={compareData}
            colors={colors}
            showUS={showUS}
            showCanada={showCanada}
            isDark={isDark}
          />
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
