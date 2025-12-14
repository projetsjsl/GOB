// Auto-converted from monolithic dashboard file
// Component: YieldCurveTab



const YieldCurveTab = () => {
    const [yieldData, setYieldData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState('both');
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // S'assurer que isDarkMode est accessible (fallback si non défini)
    const darkMode = typeof isDarkMode !== 'undefined' ? isDarkMode : true;

    const formatRate = (value) => (value === null || value === undefined ? '—' : Number(value).toFixed(2));
    const renderRateTable = (title, dataset, badgeEmoji) => (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold">
                    <span>{badgeEmoji}</span>
                    <span>{title}</span>
                </div>
                <span className="text-xs opacity-70">{dataset?.date || '—'}</span>
            </div>
            {dataset?.rates?.length ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {dataset.rates.map(rate => (
                        <div key={`${title}-${rate.maturity}`} className="flex items-center justify-between border-b border-dashed border-gray-600/30 pb-1">
                            <span className="uppercase tracking-tight">{rate.maturity}</span>
                            <span className="font-semibold">{formatRate(rate.rate)}%</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm opacity-70">Données non disponibles.</p>
            )}
        </div>
    );
    
    console.log('📊 YieldCurveTab monté, isDarkMode:', darkMode);

    // Récupérer les données de la yield curve
    const fetchYieldCurve = async () => {
        console.log('🔄 fetchYieldCurve appelé pour country:', selectedCountry);
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/yield-curve?country=${selectedCountry}`);
            console.log('📡 Réponse API yield-curve:', response.status, response.ok);

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Données yield curve reçues:', data);
            setYieldData(data);
            setLoading(false);
        } catch (err) {
            console.error('❌ Erreur yield curve:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Charger les données au montage et quand le pays change
    useEffect(() => {
        fetchYieldCurve();
    }, [selectedCountry]);

    // Créer/mettre à jour le graphique Chart.js
    useEffect(() => {
        if (!yieldData || !chartRef.current) return;
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js n\'est pas chargé');
            return;
        }

        // Détruire l'ancien graphique
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        const datasets = [];

        // Données US
        if (yieldData.data.us && yieldData.data.us.rates) {
            datasets.push({
                label: 'US Treasury',
                data: yieldData.data.us.rates.map(r => ({
                    x: r.maturity,
                    y: r.rate
                })),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            });
        }

        // Données Canada
        if (yieldData.data.canada && yieldData.data.canada.rates) {
            datasets.push({
                label: 'Canada Bonds',
                data: yieldData.data.canada.rates.map(r => ({
                    x: r.maturity,
                    y: r.rate
                })),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            });
        }

        // Ne créer le graphique que s'il y a des données
        if (datasets.length === 0) {
            console.warn('⚠️ Aucune donnée disponible pour le graphique yield curve');
            return;
        }

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: darkMode ? '#e5e7eb' : '#1f2937',
                            font: { size: 14, weight: 'bold' },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: darkMode ? '#1f2937' : '#fff',
                        titleColor: darkMode ? '#e5e7eb' : '#1f2937',
                        bodyColor: darkMode ? '#e5e7eb' : '#1f2937',
                        borderColor: darkMode ? '#374151' : '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Maturité',
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: isDarkMode ? '#374151' : '#e5e7eb'
                        },
                        ticks: {
                            color: isDarkMode ? '#9ca3af' : '#6b7280'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Taux (%)',
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: isDarkMode ? '#374151' : '#e5e7eb'
                        },
                        ticks: {
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            callback: function(value) {
                                return value.toFixed(2) + '%';
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [yieldData, darkMode]);

    // Fonction pour formater la date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    console.log('🎨 YieldCurveTab render - loading:', loading, 'error:', error, 'yieldData:', yieldData, 'darkMode:', darkMode);

    return (
        <div className="space-y-6">



            {/* En-tête avec contrôles */}
            <div className={`p-6 rounded-lg transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            📈 Courbe des Taux (Yield Curve)
                        </h2>
                        <p className={`text-sm transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            Visualisation des taux obligataires US Treasury et Canada par maturité
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
                                darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        >
                            <option value="both">US + Canada</option>
                            <option value="us">US uniquement</option>
                            <option value="canada">Canada uniquement</option>
                        </select>
                        <button
                            onClick={fetchYieldCurve}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {loading ? '🔄 Chargement...' : '🔄 Actualiser'}
                        </button>
                    </div>
                </div>

                {/* Indicateur de récession (spread 10Y-2Y) */}
                {yieldData?.data?.us?.spread_10y_2y !== undefined && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                        yieldData.data.us.inverted
                            ? 'bg-red-50 border-red-500 dark:bg-red-900/20'
                            : 'bg-green-50 border-green-500 dark:bg-green-900/20'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`font-bold ${
                                    yieldData.data.us.inverted
                                        ? 'text-red-800 dark:text-red-300'
                                        : 'text-green-800 dark:text-green-300'
                                }`}>
                                    {yieldData.data.us.inverted ? '⚠️ Courbe Inversée' : '✅ Courbe Normale'}
                                </h3>
                                <p className={`text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Spread 10Y-2Y: <strong>{yieldData.data.us.spread_10y_2y.toFixed(2)}%</strong>
                                </p>
                            </div>
                            <div className={`text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {yieldData.data.us.inverted
                                    ? 'Indicateur historique de récession potentielle'
                                    : 'Conditions économiques normales'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Graphique de la courbe */}
            {loading && (
                <div className={`p-12 rounded-lg text-center transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Chargement des données...
                    </p>
                </div>
            )}

            {error && (
                <div className={`p-6 rounded-lg border-l-4 border-red-500 ${
                    darkMode ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                    <h3 className={`font-bold mb-2 ${
                        darkMode ? 'text-red-300' : 'text-red-800'
                    }`}>
                        ❌ Erreur
                    </h3>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {error}
                    </p>
                </div>
            )}

            {!loading && !error && yieldData && (
                <>
                    {/* Grid Cards (US / Canada) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {yieldData.data.us && renderRateTable('US Treasury', yieldData.data.us, '🇺🇸')}
                        {yieldData.data.canada && renderRateTable('Obligations Canada', yieldData.data.canada, '🇨🇦')}
                    </div>

                    {/* Tableau des maturités */}
                    <div className={`p-6 rounded-lg transition-colors duration-300 mb-6 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <h3 className={`text-xl font-bold mb-4 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            📊 Tableau des Maturités
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b-2 ${
                                        darkMode ? 'border-gray-700' : 'border-gray-200'
                                    }`}>
                                        <th className={`px-3 py-2 text-left font-bold text-xs ${
                                            darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                            Maturité
                                        </th>
                                        {yieldData.data.us && (
                                            <th className={`px-3 py-2 text-right font-bold text-xs ${
                                                darkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                🇺🇸 US Treasury (%)
                                            </th>
                                        )}
                                        {yieldData.data.canada && (
                                            <th className={`px-3 py-2 text-right font-bold text-xs ${
                                                darkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                🇨🇦 Canada Bonds (%)
                                            </th>
                                        )}
                                        {yieldData.data.us && yieldData.data.canada && (
                                            <th className={`px-3 py-2 text-right font-bold text-xs ${
                                                darkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                Écart (bps)
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Créer une liste unique de toutes les maturités
                                        const maturities = new Set();
                                        if (yieldData.data.us) {
                                            yieldData.data.us.rates.forEach(r => maturities.add(r.maturity));
                                        }
                                        if (yieldData.data.canada) {
                                            yieldData.data.canada.rates.forEach(r => maturities.add(r.maturity));
                                        }

                                        // Helper pour trier les maturités
                                        const maturityToMonths = (m) => {
                                            if (m === '1M') return 1;
                                            if (m === '2M') return 2;
                                            if (m === '3M') return 3;
                                            if (m === '4M') return 4;
                                            if (m === '6M') return 6;
                                            if (m === '1Y') return 12;
                                            if (m === '2Y') return 24;
                                            if (m === '3Y') return 36;
                                            if (m === '5Y') return 60;
                                            if (m === '7Y') return 84;
                                            if (m === '10Y') return 120;
                                            if (m === '20Y') return 240;
                                            if (m === '30Y') return 360;
                                            return 999;
                                        };

                                        return Array.from(maturities)
                                            .sort((a, b) => maturityToMonths(a) - maturityToMonths(b))
                                            .map((maturity, idx) => {
                                                const usRate = yieldData.data.us?.rates.find(r => r.maturity === maturity);
                                                const caRate = yieldData.data.canada?.rates.find(r => r.maturity === maturity);
                                                const spread = usRate && caRate ? ((usRate.rate - caRate.rate) * 100).toFixed(0) : null;

                                                return (
                                                    <tr key={maturity} className={`border-b ${
                                                        darkMode ? 'border-gray-700' : 'border-gray-200'
                                                    } ${idx % 2 === 0 ? (darkMode ? 'bg-gray-700/30' : 'bg-gray-50') : ''}`}>
                                                        <td className={`px-3 py-2 font-semibold text-xs ${
                                                            darkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {maturity}
                                                        </td>
                                                        {yieldData.data.us && (
                                                            <td className={`px-3 py-2 text-right text-xs ${
                                                                darkMode ? 'text-blue-400' : 'text-blue-600'
                                                            }`}>
                                                                {usRate ? usRate.rate.toFixed(2) : '-'}
                                                            </td>
                                                        )}
                                                        {yieldData.data.canada && (
                                                            <td className={`px-3 py-2 text-right text-xs ${
                                                                darkMode ? 'text-red-400' : 'text-red-600'
                                                            }`}>
                                                                {caRate ? caRate.rate.toFixed(2) : '-'}
                                                            </td>
                                                        )}
                                                        {yieldData.data.us && yieldData.data.canada && (
                                                            <td className={`px-3 py-2 text-right font-mono text-xs ${
                                                                spread > 0
                                                                    ? (darkMode ? 'text-green-400' : 'text-green-600')
                                                                    : spread < 0
                                                                    ? (darkMode ? 'text-red-400' : 'text-red-600')
                                                                    : (darkMode ? 'text-gray-400' : 'text-gray-600')
                                                            }`}>
                                                                {spread !== null ? (spread > 0 ? '+' : '') + spread : '-'}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            });
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Métadonnées */}
                        <div className={`mt-4 pt-4 border-t ${
                            darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                {yieldData.data.us && (
                                    <>
                                        <div>
                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                Source US:
                                            </span>
                                            <strong className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {yieldData.data.us.source}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                Date US:
                                            </span>
                                            <strong className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatDate(yieldData.data.us.date)}
                                            </strong>
                                        </div>
                                    </>
                                )}
                                {yieldData.data.canada && (
                                    <>
                                        <div>
                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                Source Canada:
                                            </span>
                                            <strong className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {yieldData.data.canada.source}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                Date Canada:
                                            </span>
                                            <strong className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatDate(yieldData.data.canada.date)}
                                            </strong>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Graphique */}
                    {(yieldData.data?.us?.rates?.length > 0 || yieldData.data?.canada?.rates?.length > 0) ? (
                        <div className={`p-6 rounded-lg transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div style={{ height: '400px', position: 'relative' }}>
                                <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-6 rounded-lg border-l-4 border-yellow-500 ${
                            darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                        }`}>
                            <h3 className={`font-bold mb-2 ${
                                darkMode ? 'text-yellow-300' : 'text-yellow-800'
                            }`}>
                                ⚠️ Aucune donnée disponible
                            </h3>
                            <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                Les données de yield curve ne sont pas disponibles. Vérifiez que la clé API FRED_API_KEY est configurée dans les variables d'environnement Vercel.
                            </p>
                        </div>
                    )}

                    {/* Note explicative */}
                    <div className={`p-4 rounded-lg ${
                        darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                    }`}>
                        <h4 className={`font-bold mb-2 ${
                            darkMode ? 'text-blue-300' : 'text-blue-800'
                        }`}>
                            💡 À propos de la courbe des taux
                        </h4>
                        <ul className={`text-sm space-y-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            <li>• <strong>Courbe normale:</strong> Les taux longs sont supérieurs aux taux courts (économie saine)</li>
                            <li>• <strong>Courbe inversée:</strong> Les taux courts dépassent les taux longs (possibilité de récession)</li>
                            <li>• <strong>Spread 10Y-2Y:</strong> Indicateur clé surveillé par les économistes et investisseurs</li>
                            <li>• <strong>Sources:</strong> FRED (Federal Reserve Economic Data) et FMP (Financial Modeling Prep)</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

window.YieldCurveTab = YieldCurveTab;