// Auto-converted from monolithic dashboard file
// Component: YieldCurveTab - UPGRADED TO PREMIUM TERMINAL
// Uses GLOBAL cache from window.__yieldCurveGlobalCache

const { useState, useEffect, useRef, useCallback } = React;

// Use global cache function if available, otherwise create local fallback
const fetchYieldCurveData = async (country, { forceRefresh = false } = {}) => {
    // Prefer global cache function from app-inline.js
    if (window.fetchYieldCurveWithCache) {
        console.log('🔗 YieldCurveTab.js using GLOBAL cache function');
        return window.fetchYieldCurveWithCache(country, { forceRefresh });
    }

    // Fallback: Initialize global cache if not already done
    if (!window.__yieldCurveGlobalCache) {
        window.__yieldCurveGlobalCache = {
            cache: new Map(),
            inflight: new Map(),
            TTL_MS: 5 * 60 * 1000,
            callCount: 0,
            lastReset: Date.now()
        };
        console.log('🚀 YieldCurveTab.js initialized GLOBAL cache');
    }

    const global = window.__yieldCurveGlobalCache;
    const cacheKey = country || 'both';
    const now = Date.now();

    // Track calls
    global.callCount++;
    if (global.callCount > 10) {
        console.warn(`⚠️ YieldCurveTab.js: ${global.callCount} calls`);
    }
    if (now - global.lastReset > 60000) {
        global.callCount = 0;
        global.lastReset = now;
    }

    if (!forceRefresh) {
        const cached = global.cache.get(cacheKey);
        if (cached && now - cached.cachedAt < global.TTL_MS) {
            console.log(`✅ YieldCurveTab.js GLOBAL Cache HIT (${cacheKey})`);
            return cached.data;
        }
    }

    const existing = global.inflight.get(cacheKey);
    if (existing) {
        console.log(`🔄 YieldCurveTab.js Request DEDUPLICATED (${cacheKey})`);
        return existing;
    }

    console.log(`🌐 YieldCurveTab.js GLOBAL Cache MISS (${cacheKey})`);

    const request = fetch(`/api/yield-curve?country=${encodeURIComponent(country)}`)
        .then((response) => {
            if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            global.cache.set(cacheKey, { data, cachedAt: Date.now() });
            return data;
        })
        .finally(() => {
            global.inflight.delete(cacheKey);
        });

    global.inflight.set(cacheKey, request);
    return request;
};

const SpreadChart = ({ usRates, caRates, darkMode }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !usRates || !caRates) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const maturityOrder = ['1M', '2M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
        
        // Calculer les spreads
        const spreads = maturityOrder.map(maturity => {
            const us = usRates.find(r => r.maturity === maturity);
            const ca = caRates.find(r => r.maturity === maturity);
            if (us && ca) {
                return (us.rate - ca.rate) * 100; // en bps
            }
            return null;
        });

        const ctx = canvasRef.current.getContext('2d');
        
        // Couleurs dynamiques selon positif/négatif
        const bgColors = spreads.map(v => v >= 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)');
        const borderColors = spreads.map(v => v >= 0 ? '#3b82f6' : '#ef4444');

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: maturityOrder,
                datasets: [{
                    label: 'Spread US-Canada (bps)',
                    data: spreads,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Spread: ${ctx.parsed.y.toFixed(0)} bps`
                        }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Points de base (bps)', color: darkMode ? '#9ca3af' : '#6b7280' },
                        grid: { color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)' },
                        ticks: { color: darkMode ? '#9ca3af' : '#6b7280' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: darkMode ? '#9ca3af' : '#6b7280' }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [usRates, caRates, darkMode]);

    return (
        <div style={{ height: '200px', width: '100%' }}>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};


const TradingViewCurve = ({ darkMode }) => {
    const [isWidgetActive, setIsWidgetActive] = useState(false);
    const container = useRef();
    const LazyWidgetWrapper = window.LazyWidgetWrapper || (({ children }) => <>{children}</>);

    useEffect(() => {
        if (!isWidgetActive || !container.current) return;
        
        // Cleanup content to prevent duplicates/memory leaks
        container.current.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": "TVC:US10Y",
            "interval": "D",
            "theme": darkMode ? "dark" : "light",
            "style": "2",
            "locale": "fr",
            "hide_top_toolbar": true,
            "allow_symbol_change": true,
            "support_host": "https://www.tradingview.com"
        });
        container.current.appendChild(script);

        return () => {
            if (container.current) container.current.innerHTML = '';
        };
    }, [isWidgetActive, darkMode]);

    if (!isWidgetActive) {
        return (
            <div style={{ height: "400px", width: "100%" }} className="flex items-center justify-center bg-neutral-900/10 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 z-0"></div>
                
                {/* Visual Placeholder Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="text-center z-10 p-6">
                   <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400 w-8 h-8">
                            <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                   </div>
                   <h3 className="text-lg font-bold text-neutral-300 mb-2">Graphique Avancé</h3>
                   <p className="text-sm text-neutral-500 max-w-xs mb-6">Charger le terminal complet pour l'analyse technique (Consomme plus de ressources)</p>
                   
                   <button 
                        onClick={() => setIsWidgetActive(true)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                   >
                        <LucideIcon name="Activity" className="w-4 h-4" />
                        Charger le Graphique
                   </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: "400px", width: "100%" }}>
            <LazyWidgetWrapper threshold={0.25} height={400} className="w-full h-full">
                <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
                    <div className="tradingview-widget-container__widget"></div>
                </div>
            </LazyWidgetWrapper>
        </div>
    );
};

const YieldCurveTab = () => {
    const [yieldData, setYieldData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState('both');
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // S'assurer que isDarkMode est accessible
    const darkMode = window.BetaCombinedDashboard?.isDarkMode ?? true;

    const formatRate = (value) => (value === null || value === undefined ? '—' : Number(value).toFixed(2));
    
    // Récupérer les données de la yield curve
    const fetchYieldCurve = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchYieldCurveData(selectedCountry, { forceRefresh });
            setYieldData(data);
            setLoading(false);
        } catch (err) {
            console.error('❌ Erreur yield curve:', err);
            setError(err instanceof Error ? err.message : String(err));
            setLoading(false);
        }
    }, [selectedCountry]);

    useEffect(() => {
        fetchYieldCurve();
    }, [fetchYieldCurve]);

    // Graphique Chart.js (Comparaison Actuel/M-1)
    useEffect(() => {
        if (!yieldData || !chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const maturityOrder = ['1M', '2M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
        const getRate = (dataset, maturity) => dataset?.rates?.find(item => item.maturity === maturity)?.rate || null;
        const getPrevRate = (dataset, maturity) => dataset?.rates?.find(item => item.maturity === maturity)?.prevValue || null;

        const datasets = [];
        if (yieldData.data.us) {
            datasets.push({
                label: '🇺🇸 US Treasury (Actuel)',
                data: maturityOrder.map(m => getRate(yieldData.data.us, m)),
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 4,
            });
            datasets.push({
                label: '🇺🇸 US Treasury (M-1)',
                data: maturityOrder.map(m => getPrevRate(yieldData.data.us, m)),
                borderColor: '#60a5fa',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.3,
                pointRadius: 0,
                hidden: true
            });
        }
        if (yieldData.data.canada) {
            datasets.push({
                label: '🇨🇦 Canada Bonds (Actuel)',
                data: maturityOrder.map(m => getRate(yieldData.data.canada, m)),
                borderColor: '#f87171',
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 4,
            });
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { labels: maturityOrder, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: darkMode ? '#e5e7eb' : '#1f2937' } }
                },
                scales: {
                    y: { grid: { color: darkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(0,0,0,0.05)' }, ticks: { color: darkMode ? '#9ca3af' : '#6b7280' } },
                    x: { grid: { color: darkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(0,0,0,0.05)' }, ticks: { color: darkMode ? '#9ca3af' : '#6b7280' } }
                }
            }
        });

        return () => chartInstance.current?.destroy();
    }, [yieldData, darkMode]);



    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LucideIcon name="TrendingUp" className="w-6 h-6 text-blue-500" />
                        JLab CurveWatch™ <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">PRO TERMINAL</span>
                    </h2>
                </div>
                <div className="flex gap-2">
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="bg-neutral-900 border border-neutral-800 text-sm rounded px-3 py-1">
                        <option value="both">US + Canada</option>
                        <option value="us">US Only</option>
                        <option value="canada">Canada Only</option>
                    </select>
                    <button title="Action" onClick={() => fetchYieldCurve(true)} className="p-1.5 hover:bg-neutral-800 rounded transition-colors">
                        <LucideIcon name="RefreshCw" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Macro Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'US 2-YEAR', key: '2Y', color: 'blue' },
                    { label: 'US 10-YEAR', key: '10Y', color: 'indigo' },
                    { label: 'US 30-YEAR', key: '30Y', color: 'purple' },
                    { label: 'SPREAD 10Y-2Y', specialized: true }
                ].map((item, i) => {
                    const rate = yieldData?.data?.us?.rates?.find(r => r.maturity === item.key)?.rate;
                    return (
                        <div key={i} className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">{item.label}</div>
                            {item.specialized ? (
                                <div className={`text-2xl font-bold ${yieldData?.data?.us?.inverted ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {yieldData?.data?.us?.spread_10y_2y?.toFixed(2)}%
                                </div>
                            ) : (
                                <div className="text-2xl font-bold">{formatRate(rate)}%</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Main Interactive Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
                        <h3 className="text-sm font-bold uppercase mb-4 text-neutral-400">Courbe de Taux Interactive (TradingView)</h3>
                        <TradingViewCurve darkMode={darkMode} />
                    </div>
                    
                    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
                        <h3 className="text-sm font-bold uppercase mb-4 text-neutral-400">Comparaison US / Canada (Actual vs M-1)</h3>
                        <div style={{ height: '300px' }}>
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
                        <h3 className="text-sm font-bold uppercase mb-4 text-neutral-400">Tableau des Maturités</h3>
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-neutral-950">
                                    <tr className="text-neutral-500 border-b border-neutral-800">
                                        <th className="text-left py-2">EXP</th>
                                        <th className="text-right py-2">US%</th>
                                        <th className="text-right py-2">1M Δ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {yieldData?.data?.us?.rates?.map(r => (
                                        <tr key={r.maturity} className="border-b border-neutral-900 hover:bg-neutral-800/30">
                                            <td className="py-2 font-mono text-neutral-300">{r.maturity}</td>
                                            <td className="text-right py-2 font-bold text-blue-400">{r.rate.toFixed(2)}%</td>
                                            <td className={`text-right py-2 ${r.change1M >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {(r.change1M * 100).toFixed(0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
                        <h3 className="text-sm font-bold uppercase mb-4 text-neutral-400">Spread US-Canada (bps)</h3>
                        <SpreadChart usRates={yieldData?.data?.us?.rates} caRates={yieldData?.data?.canada?.rates} darkMode={darkMode} />
                    </div>
                </div>
            </div>

            {/* Official Links */}
            <div className="p-6 rounded-xl border border-dashed border-neutral-800">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                    <LucideIcon name="Shield" className="w-3 h-3" /> Sources de Référence
                </h3>
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                    <a href="https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve" target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500" /> U.S. Treasury Official
                    </a>
                    <a href="https://fred.stlouisfed.org" target="_blank" className="text-xs text-neutral-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" /> FRED St Louis Fed
                    </a>
                    <a href="https://www.tradingview.com" target="_blank" className="text-xs text-neutral-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-indigo-500" /> TradingView Charts
                    </a>
                </div>
            </div>
        </div>
    );
};

window.YieldCurveTab = YieldCurveTab;
