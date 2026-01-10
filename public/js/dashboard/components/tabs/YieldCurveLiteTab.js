/**
 * YieldCurveLiteTab - Version simplifiée pour la section Marchés
 * 
 * Affiche les 2 courbes complètes (US + Canada) avec tooltip détaillé au survol
 * Utilise Recharts (disponible globalement) au lieu de Chart.js
 * + bouton vers JLab CurveWatch pour l'analyse avancée
 */

const { useState, useEffect, useCallback } = React;

// Récupération Recharts depuis window
const {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} = window.Recharts || {};

// Récupération des données yield curve avec cache global
const fetchYieldCurveData = async () => {
    if (window.fetchYieldCurveWithCache) {
        return window.fetchYieldCurveWithCache('both', { forceRefresh: false });
    }
    
    const response = await fetch('/api/yield-curve?country=both');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
};

// Labels lisibles pour les maturités
const maturityLabels = {
    '1M': '1 mois', '2M': '2 mois', '3M': '3 mois', '4M': '4 mois', '6M': '6 mois',
    '1Y': '1 an', '2Y': '2 ans', '3Y': '3 ans', '5Y': '5 ans', '7Y': '7 ans',
    '10Y': '10 ans', '20Y': '20 ans', '30Y': '30 ans'
};

// Tooltip personnalisé
const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
    if (!active || !payload || !payload.length) return null;
    
    const usData = payload.find(p => p.dataKey === 'us');
    const caData = payload.find(p => p.dataKey === 'canada');
    
    const usRate = usData?.value;
    const caRate = caData?.value;
    const spread = usRate && caRate ? (usRate - caRate).toFixed(2) : null;
    
    return (
        <div className={`p-4 rounded-xl shadow-2xl border ${
            isDarkMode 
                ? 'bg-gray-900/95 border-gray-700 text-white' 
                : 'bg-white/95 border-gray-200 text-gray-900'
        }`} style={{ minWidth: '200px' }}>
            <div className="font-bold text-base mb-3 pb-2 border-b border-gray-600">
                📊 {maturityLabels[label] || label}
            </div>
            
            {usRate !== undefined && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400 font-medium">🇺🇸 US Treasury</span>
                    <span className="font-bold text-lg">{usRate?.toFixed(3)}%</span>
                </div>
            )}
            
            {caRate !== undefined && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-red-400 font-medium">🇨🇦 Canada</span>
                    <span className="font-bold text-lg">{caRate?.toFixed(3)}%</span>
                </div>
            )}
            
            {spread && (
                <div className={`mt-3 pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>📐 Spread US-CA</span>
                        <span className={`font-bold ${parseFloat(spread) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {parseFloat(spread) >= 0 ? '+' : ''}{spread}%
                        </span>
                    </div>
                </div>
            )}
            
            <div className={`text-xs mt-3 pt-2 border-t ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                💡 Cliquez "Analyse Avancée" pour plus
            </div>
        </div>
    );
};

const YieldCurveLiteTab = ({ isDarkMode = true, setActiveTab }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState([]);

    // Charger les données
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchYieldCurveData();
            setData(result);
            
            // Préparer les données pour Recharts
            const maturityOrder = ['1M', '2M', '3M', '4M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
            const usRates = result?.data?.us?.rates || [];
            const caRates = result?.data?.canada?.rates || [];
            
            const prepared = maturityOrder.map(m => {
                const usRate = usRates.find(r => r.maturity === m);
                const caRate = caRates.find(r => r.maturity === m);
                return {
                    maturity: m,
                    us: usRate?.rate || null,
                    canada: caRate?.rate || null,
                    usChange: usRate?.change1M,
                    caChange: caRate?.change1M
                };
            }).filter(d => d.us !== null || d.canada !== null);
            
            setChartData(prepared);
        } catch (err) {
            console.error('❌ YieldCurveLite: Erreur:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Navigation vers JLab CurveWatch
    const goToFullCurveWatch = () => {
        // Méthode 1: handleNewTabChange (gère main + sub tabs)
        if (typeof window.handleNewTabChange === 'function') {
            window.handleNewTabChange('jlab-curvewatch');
            return;
        }
        
        // Méthode 2: handleTabChange exposé
        if (typeof window.handleTabChange === 'function') {
            window.handleTabChange('jlab-curvewatch');
            return;
        }
        
        // Méthode 3: setActiveTab prop ou global
        if (typeof setActiveTab === 'function') {
            setActiveTab('jlab-curvewatch');
            return;
        }
        if (typeof window.setActiveTab === 'function') {
            window.setActiveTab('jlab-curvewatch');
            return;
        }
        
        // Fallback: navigation directe vers la page standalone
        window.location.href = '/curvewatch.html';
    };

    // Calculer le spread 10Y-2Y pour l'indicateur
    const us2Y = chartData.find(d => d.maturity === '2Y')?.us;
    const us10Y = chartData.find(d => d.maturity === '10Y')?.us;
    const spread10Y2Y = us10Y && us2Y ? (us10Y - us2Y).toFixed(2) : null;
    const isInverted = spread10Y2Y && parseFloat(spread10Y2Y) < 0;

    // Vérifier si Recharts est disponible
    if (!LineChart) {
        return (
            <div className={`flex items-center justify-center h-96 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-50'}`}>
                <div className="text-center text-red-500">
                    <p className="text-xl font-bold mb-2">⚠️ Composant non disponible</p>
                    <p className="text-sm opacity-80">Recharts n'est pas chargé</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-96 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-50'}`}>
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement des courbes de taux...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center h-96 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-50'}`}>
                <div className="text-center text-red-500">
                    <p className="text-xl font-bold mb-2">❌ Erreur</p>
                    <p className="text-sm opacity-80 mb-4">{error}</p>
                    <button onClick={loadData} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 sm:p-6 ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}>
            {/* Header compact */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            📈 Courbes de Taux
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                LIVE
                            </span>
                        </h2>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            🇺🇸 US Treasury & 🇨🇦 Obligations Canada • {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString('fr-FR') : '—'}
                        </p>
                    </div>
                    
                    {/* Indicateur spread */}
                    {spread10Y2Y && (
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                            isInverted 
                                ? (isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                                : (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                        }`}>
                            <span>10Y-2Y:</span>
                            <span className="font-bold">{spread10Y2Y}%</span>
                            {isInverted && <span>⚠️</span>}
                        </div>
                    )}
                </div>
                
                {/* Bouton Analyse Avancée */}
                <button
                    onClick={goToFullCurveWatch}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl ${
                        isDarkMode 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-500/30'
                    }`}
                >
                    <span>🔬 Analyse Avancée</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>

            {/* Graphique principal avec Recharts */}
            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="p-4 sm:p-6" style={{ height: '420px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                            data={chartData} 
                            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke={isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(0,0,0,0.1)'} 
                                vertical={false}
                            />
                            <XAxis 
                                dataKey="maturity" 
                                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                                axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                                tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                                label={{ 
                                    value: 'Maturité', 
                                    position: 'bottom', 
                                    offset: 0,
                                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                    fontSize: 12
                                }}
                            />
                            <YAxis 
                                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                                axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                                tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                                tickFormatter={(value) => `${value.toFixed(1)}%`}
                                label={{ 
                                    value: 'Taux (%)', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                    fontSize: 12
                                }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip 
                                content={<CustomTooltip isDarkMode={isDarkMode} />}
                                cursor={{ 
                                    stroke: isDarkMode ? '#6b7280' : '#9ca3af', 
                                    strokeWidth: 1,
                                    strokeDasharray: '5 5'
                                }}
                            />
                            <Legend 
                                verticalAlign="top"
                                align="right"
                                wrapperStyle={{ paddingBottom: 10 }}
                                formatter={(value) => (
                                    <span style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937', fontWeight: 600 }}>
                                        {value === 'us' ? '🇺🇸 US Treasury' : '🇨🇦 Canada'}
                                    </span>
                                )}
                            />
                            
                            {/* Ligne US Treasury */}
                            <Line 
                                type="monotone"
                                dataKey="us" 
                                name="us"
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: isDarkMode ? '#1f2937' : '#fff' }}
                                activeDot={{ r: 8, fill: '#60a5fa', stroke: '#fff', strokeWidth: 3 }}
                                connectNulls
                            />
                            
                            {/* Ligne Canada */}
                            <Line 
                                type="monotone"
                                dataKey="canada" 
                                name="canada"
                                stroke="#ef4444" 
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: isDarkMode ? '#1f2937' : '#fff' }}
                                activeDot={{ r: 8, fill: '#f87171', stroke: '#fff', strokeWidth: 3 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Note en bas du graphique */}
                <div className={`px-4 sm:px-6 py-3 border-t ${isDarkMode ? 'border-neutral-700 bg-neutral-800/60' : 'border-gray-200 bg-gray-100/50'}`}>
                    <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        💡 <strong>Survolez les points</strong> pour voir les détails de chaque maturité • 
                        <button onClick={goToFullCurveWatch} className="ml-1 text-blue-500 hover:text-blue-400 underline">
                            Ouvrir JLab CurveWatch
                        </button> pour historique, spreads, forward rates et plus
                    </p>
                </div>
            </div>
        </div>
    );
};

window.YieldCurveLiteTab = YieldCurveLiteTab;
console.log('✅ YieldCurveLiteTab loaded (Recharts version)');
