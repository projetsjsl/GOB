/**
 * Scenario Analysis Modal Component
 * What-If analysis for DCF valuation with multiple scenarios
 * Enhanced with charts and projections inspired by StockUnlock DCF simulator
 */

const { useState, useEffect, useMemo } = React;
const { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
    ComposedChart, Cell
} = window.Recharts || {};

const ScenarioAnalysisModal = ({ symbol, currentPrice, baselineData, onClose }) => {
    const [dataLoading, setDataLoading] = useState(false);
    const [dataError, setDataError] = useState(null);
    
    // Validate and fetch baselineData
    const [validatedBaselineData, setValidatedBaselineData] = useState(() => {
        if (!baselineData) {
            return {
                latestFCF: 10000000000, // $10B default
                netDebt: 5000000000,   // $5B default
                sharesOutstanding: 1000000000, // 1B shares default
                avgGrowth: 5
            };
        }
        
        return {
            latestFCF: baselineData.latestFCF || baselineData.fcf || 10000000000,
            netDebt: baselineData.netDebt || baselineData.debt || 0,
            sharesOutstanding: baselineData.sharesOutstanding || baselineData.shares || 1000000000,
            avgGrowth: baselineData.avgGrowth || baselineData.growth || 5
        };
    });

    // Fetch real data if baselineData is missing or incomplete
    useEffect(() => {
        const fetchBaselineData = async () => {
            // Only fetch if we have missing critical data
            if (!baselineData || !baselineData.latestFCF || !baselineData.sharesOutstanding) {
                setDataLoading(true);
                setDataError(null);
                
                try {
                    const API_BASE_URL = window.location.origin || '';
                    
                    // Fetch cash flow, balance sheet, and key metrics
                    const [cashFlowRes, balanceSheetRes, keyMetricsRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=${symbol}`),
                        fetch(`${API_BASE_URL}/api/fmp?endpoint=balance-sheet-statement&symbol=${symbol}&period=annual&limit=1`),
                        fetch(`${API_BASE_URL}/api/fmp?endpoint=key-metrics&symbol=${symbol}&period=annual&limit=1`)
                    ]);

                    let latestFCF = validatedBaselineData.latestFCF;
                    let netDebt = validatedBaselineData.netDebt;
                    let sharesOutstanding = validatedBaselineData.sharesOutstanding;
                    let avgGrowth = validatedBaselineData.avgGrowth;

                    // Extract FCF from cash flow statement
                    if (cashFlowRes.ok) {
                        const cfData = await cashFlowRes.json();
                        const cashFlow = Array.isArray(cfData?.cashFlow) ? cfData.cashFlow : 
                                       Array.isArray(cfData) ? cfData : 
                                       cfData?.data || [];
                        
                        if (cashFlow.length > 0) {
                            latestFCF = cashFlow[0].freeCashFlow || cashFlow[0].fcf || latestFCF;
                            
                            // Calculate average growth from last 5 years
                            if (cashFlow.length >= 2) {
                                const fcfValues = cashFlow.slice(0, 5).map(cf => cf.freeCashFlow || cf.fcf || 0).filter(v => v > 0);
                                if (fcfValues.length >= 2) {
                                    const growthRates = [];
                                    for (let i = 1; i < fcfValues.length; i++) {
                                        if (fcfValues[i-1] > 0) {
                                            growthRates.push(((fcfValues[i] - fcfValues[i-1]) / Math.abs(fcfValues[i-1])) * 100);
                                        }
                                    }
                                    if (growthRates.length > 0) {
                                        avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
                                    }
                                }
                            }
                        }
                    }

                    // Extract net debt from balance sheet
                    if (balanceSheetRes.ok) {
                        const bsData = await balanceSheetRes.json();
                        const balanceSheet = Array.isArray(bsData?.data) ? bsData.data : 
                                           Array.isArray(bsData) ? bsData : [];
                        
                        if (balanceSheet.length > 0) {
                            const totalDebt = balanceSheet[0].totalDebt || balanceSheet[0].debt || 0;
                            const cash = balanceSheet[0].cashAndCashEquivalents || balanceSheet[0].cash || 0;
                            netDebt = totalDebt - cash;
                        }
                    }

                    // Extract shares outstanding from key metrics
                    if (keyMetricsRes.ok) {
                        const kmData = await keyMetricsRes.json();
                        const keyMetrics = Array.isArray(kmData?.data) ? kmData.data : 
                                         Array.isArray(kmData) ? kmData : [];
                        
                        if (keyMetrics.length > 0) {
                            sharesOutstanding = keyMetrics[0].numberOfShares || 
                                              keyMetrics[0].sharesOutstanding || 
                                              sharesOutstanding;
                        }
                    }

                    setValidatedBaselineData({
                        latestFCF: Math.max(latestFCF, 1000000), // Minimum $1M
                        netDebt: netDebt,
                        sharesOutstanding: Math.max(sharesOutstanding, 1000000), // Minimum 1M shares
                        avgGrowth: Math.max(Math.min(avgGrowth, 50), -50) // Clamp between -50% and 50%
                    });
                } catch (err) {
                    console.error('Error fetching baseline data:', err);
                    setDataError('Impossible de récupérer toutes les données. Utilisation de valeurs par défaut.');
                } finally {
                    setDataLoading(false);
                }
            }
        };

        if (symbol) {
            fetchBaselineData();
        }
    }, [symbol, baselineData]);
    const [scenarios, setScenarios] = useState({
        pessimistic: {
            name: 'Scénario Pessimiste',
            color: 'red',
            revenueGrowth: -5,
            marginChange: -2,
            discountRate: 12,
            terminalGrowth: 1.5
        },
        base: {
            name: 'Scénario de Base',
            color: 'blue',
            revenueGrowth: baselineData?.avgGrowth || 5,
            marginChange: 0,
            discountRate: 10,
            terminalGrowth: 2.5
        },
        optimistic: {
            name: 'Scénario Optimiste',
            color: 'green',
            revenueGrowth: 15,
            marginChange: 3,
            discountRate: 8,
            terminalGrowth: 3.5
        },
        custom: {
            name: 'Scénario Personnalisé',
            color: 'purple',
            revenueGrowth: 10,
            marginChange: 1,
            discountRate: 10,
            terminalGrowth: 2.5
        }
    });

    const [results, setResults] = useState({});
    const [selectedScenario, setSelectedScenario] = useState('base');
    const [sensitivityData, setSensitivityData] = useState([]);

    useEffect(() => {
        if (validatedBaselineData && validatedBaselineData.latestFCF > 0) {
            calculateAllScenarios();
        }
    }, [scenarios, validatedBaselineData]);

    const calculateDCF = (scenario, projectionYears = 10) => {
        if (!validatedBaselineData || validatedBaselineData.latestFCF <= 0) {
            return null;
        }
        
        const { latestFCF, netDebt, sharesOutstanding } = validatedBaselineData;
        const { revenueGrowth, marginChange, discountRate, terminalGrowth } = scenario;

        let totalPV = 0;
        let projectedFCF = latestFCF;
        const fcfProjections = [];
        const pvProjections = [];
        const cumulativePV = [];

        // Project over specified years
        for (let year = 1; year <= projectionYears; year++) {
            const growthRate = (revenueGrowth + marginChange) / 100;
            projectedFCF = projectedFCF * (1 + growthRate);
            const pv = projectedFCF / Math.pow(1 + discountRate / 100, year);
            totalPV += pv;
            
            fcfProjections.push({
                year: year,
                fcf: projectedFCF,
                pv: pv,
                cumulativePV: totalPV
            });
            
            pvProjections.push(pv);
            cumulativePV.push(totalPV);
        }

        // Terminal value (using last year's FCF)
        // Ensure discount rate > terminal growth rate
        const discountRateDecimal = discountRate / 100;
        const terminalGrowthDecimal = terminalGrowth / 100;
        
        if (discountRateDecimal <= terminalGrowthDecimal) {
            // Invalid scenario - discount rate must be > terminal growth
            return null;
        }
        
        const terminalFCF = projectedFCF * (1 + terminalGrowthDecimal);
        const terminalValue = terminalFCF / (discountRateDecimal - terminalGrowthDecimal);
        const pvTerminal = terminalValue / Math.pow(1 + discountRateDecimal, projectionYears);

        // Equity value
        const enterpriseValue = totalPV + pvTerminal;
        const equityValue = enterpriseValue - netDebt;
        const fairValue = equityValue / sharesOutstanding;

        const upside = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

        return {
            fairValue,
            enterpriseValue,
            equityValue,
            upside,
            totalPV,
            pvTerminal,
            fcfProjections,
            pvProjections,
            cumulativePV,
            terminalValue
        };
    };

    const calculateAllScenarios = () => {
        const newResults = {};
        Object.keys(scenarios).forEach(key => {
            newResults[key] = calculateDCF(scenarios[key]);
        });
        setResults(newResults);
        
        // Calculate sensitivity analysis
        calculateSensitivityAnalysis();
    };

    const calculateSensitivityAnalysis = () => {
        const baseScenario = scenarios.base;
        const sensitivity = [];
        
        // Vary discount rate from 6% to 14%
        for (let dr = 6; dr <= 14; dr += 1) {
            const scenario = { ...baseScenario, discountRate: dr };
            const result = calculateDCF(scenario);
            sensitivity.push({
                discountRate: dr,
                fairValue: result.fairValue
            });
        }
        
        setSensitivityData(sensitivity);
    };

    const updateScenario = (scenarioKey, field, value) => {
        setScenarios(prev => ({
            ...prev,
            [scenarioKey]: {
                ...prev[scenarioKey],
                [field]: parseFloat(value) || 0
            }
        }));
    };

    const getColorClass = (color) => {
        const colors = {
            red: 'from-red-900/30 to-red-800/20 border-red-700',
            blue: 'from-blue-900/30 to-blue-800/20 border-blue-700',
            green: 'from-green-900/30 to-green-800/20 border-green-700',
            purple: 'from-purple-900/30 to-purple-800/20 border-purple-700'
        };
        return colors[color] || colors.blue;
    };

    const getTextColor = (color) => {
        const colors = {
            red: 'text-red-400',
            blue: 'text-blue-400',
            green: 'text-green-400',
            purple: 'text-purple-400'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-7xl w-full border border-gray-700 shadow-2xl my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-900/30 to-blue-900/30">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <i className="iconoir-graph-up text-purple-400 text-xl"></i>
                            </span>
                            Analyse de Scénarios - {symbol}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Simulation What-If pour la valorisation DCF
                        </p>
                    </div>
                    <button title="Action"
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-xmark text-gray-400 text-xl"></i>
                    </button>
                </div>

                <div className="p-6">
                    {/* Data Loading/Error Banner */}
                    {dataLoading && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-blue-400 text-sm">Récupération des données financières depuis FMP...</p>
                            </div>
                        </div>
                    )}
                    {dataError && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <i className="iconoir-warning-triangle text-yellow-400"></i>
                                <p className="text-yellow-400 text-sm">{dataError}</p>
                            </div>
                        </div>
                    )}

                    {/* Baseline Data Summary */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 mb-6">
                        <h3 className="text-lg font-bold text-white mb-3">Données de Base</h3>
                        {validatedBaselineData.latestFCF <= 1000000 && (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-3">
                                <p className="text-yellow-400 text-xs">
                                    ⚠️ Données par défaut utilisées. Les calculs peuvent ne pas être précis. 
                                    Assurez-vous que baselineData contient les vraies données financières.
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400 text-xs mb-1">Free Cash Flow</div>
                                <div className="text-white font-mono">${(validatedBaselineData.latestFCF / 1e9).toFixed(2)}B</div>
                                {validatedBaselineData.latestFCF <= 1000000 && (
                                    <div className="text-yellow-400 text-xs mt-1">(Par défaut)</div>
                                )}
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-1">Net Debt</div>
                                <div className="text-white font-mono">${(validatedBaselineData.netDebt / 1e9).toFixed(2)}B</div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-1">Shares Outstanding</div>
                                <div className="text-white font-mono">{(validatedBaselineData.sharesOutstanding / 1e9).toFixed(3)}B</div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs mb-1">Croissance Moyenne</div>
                                <div className="text-white font-mono">{validatedBaselineData.avgGrowth.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {Object.entries(scenarios).map(([key, scenario]) => {
                            const result = results[key];
                            const isSelected = selectedScenario === key;

                            return (
                                <div
                                    key={key}
                                    onClick={() => setSelectedScenario(key)}
                                    className={`bg-gradient-to-br ${getColorClass(scenario.color)} rounded-xl p-4 border-2 cursor-pointer transition-all ${isSelected ? 'scale-105 shadow-xl' : 'hover:scale-102'
                                        }`}
                                >
                                    <h3 className={`font-bold text-lg mb-3 ${getTextColor(scenario.color)}`}>
                                        {scenario.name}
                                    </h3>

                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-gray-400">Croissance Rev. (%)</label>
                                            <input
                                                type="number"
                                                value={scenario.revenueGrowth}
                                                onChange={(e) => updateScenario(key, 'revenueGrowth', e.target.value)}
                                                className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                                                step="0.5"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400">Δ Marge (%)</label>
                                            <input
                                                type="number"
                                                value={scenario.marginChange}
                                                onChange={(e) => updateScenario(key, 'marginChange', e.target.value)}
                                                className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                                                step="0.5"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400">Taux d'actualisation (%)</label>
                                            <input
                                                type="number"
                                                value={scenario.discountRate}
                                                onChange={(e) => updateScenario(key, 'discountRate', e.target.value)}
                                                className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                                                step="0.5"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400">Croissance Terminale (%)</label>
                                            <input
                                                type="number"
                                                value={scenario.terminalGrowth}
                                                onChange={(e) => updateScenario(key, 'terminalGrowth', e.target.value)}
                                                className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>

                                    {result && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-400">Juste Valeur</div>
                                                <div className={`text-2xl font-bold ${getTextColor(scenario.color)}`}>
                                                    ${result.fairValue.toFixed(2)}
                                                </div>
                                                <div className={`text-sm font-medium mt-1 ${result.upside >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {result.upside >= 0 ? '+' : ''}{result.upside.toFixed(1)}% vs Prix Actuel
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* FCF Projections Chart */}
                    {LineChart && results[selectedScenario]?.fcfProjections && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">
                                Projections FCF - {scenarios[selectedScenario]?.name}
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={results[selectedScenario].fcfProjections}>
                                    <defs>
                                        <linearGradient id="fcfGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={scenarios[selectedScenario]?.color === 'red' ? '#ef4444' : 
                                                                        scenarios[selectedScenario]?.color === 'green' ? '#10b981' :
                                                                        scenarios[selectedScenario]?.color === 'purple' ? '#a855f7' : '#3b82f6'} 
                                                  stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={scenarios[selectedScenario]?.color === 'red' ? '#ef4444' : 
                                                                         scenarios[selectedScenario]?.color === 'green' ? '#10b981' :
                                                                         scenarios[selectedScenario]?.color === 'purple' ? '#a855f7' : '#3b82f6'} 
                                                  stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="year" stroke="#9ca3af" />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        tickFormatter={(value) => `$${(value / 1e9).toFixed(1)}B`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        formatter={(value) => [`$${(value / 1e9).toFixed(2)}B`, 'FCF']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="fcf" 
                                        stroke={scenarios[selectedScenario]?.color === 'red' ? '#ef4444' : 
                                               scenarios[selectedScenario]?.color === 'green' ? '#10b981' :
                                               scenarios[selectedScenario]?.color === 'purple' ? '#a855f7' : '#3b82f6'} 
                                        fill="url(#fcfGradient)" 
                                        strokeWidth={2}
                                    />
                                    <ReferenceLine 
                                        y={validatedBaselineData.latestFCF} 
                                        stroke="#fbbf24" 
                                        strokeDasharray="5 5" 
                                        label={{ value: "FCF Actuel", position: "right", fill: "#fbbf24" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Multi-Scenario Comparison Chart */}
                    {ComposedChart && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">Comparaison Multi-Scénarios</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={Object.keys(scenarios).map(key => ({
                                    scenario: scenarios[key].name,
                                    fairValue: results[key]?.fairValue || 0,
                                    currentPrice: currentPrice
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="scenario" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        formatter={(value) => [`$${value.toFixed(2)}`, '']}
                                    />
                                    <Legend />
                                    <Bar dataKey="fairValue" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                                        {Object.keys(scenarios).map((key, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                scenarios[key].color === 'red' ? '#ef4444' :
                                                scenarios[key].color === 'green' ? '#10b981' :
                                                scenarios[key].color === 'purple' ? '#a855f7' : '#3b82f6'
                                            } />
                                        ))}
                                    </Bar>
                                    <Line 
                                        type="monotone" 
                                        dataKey="currentPrice" 
                                        stroke="#fbbf24" 
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#fbbf24', r: 6 }}
                                        name="Prix Actuel"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* PV Projections Chart */}
                    {LineChart && results[selectedScenario]?.fcfProjections && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">
                                Valeur Actuelle Nette (PV) - {scenarios[selectedScenario]?.name}
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={results[selectedScenario].fcfProjections}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="year" stroke="#9ca3af" />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        tickFormatter={(value) => `$${(value / 1e9).toFixed(1)}B`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        formatter={(value) => [`$${(value / 1e9).toFixed(2)}B`, '']}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="pv" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        name="PV Annuel"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="cumulativePV" 
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        name="PV Cumulatif"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Sensitivity Analysis Chart */}
                    {LineChart && sensitivityData.length > 0 && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">
                                Analyse de Sensibilité - Taux d'Actualisation
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Impact du taux d'actualisation sur la valorisation (scénario de base)
                            </p>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={sensitivityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                        dataKey="discountRate" 
                                        stroke="#9ca3af"
                                        label={{ value: 'Taux d\'actualisation (%)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                                        label={{ value: 'Juste Valeur ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        formatter={(value) => [`$${value.toFixed(2)}`, 'Juste Valeur']}
                                        labelFormatter={(label) => `Taux: ${label}%`}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="fairValue" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3}
                                        dot={{ r: 5, fill: '#3b82f6' }}
                                        activeDot={{ r: 7 }}
                                    />
                                    <ReferenceLine 
                                        y={currentPrice} 
                                        stroke="#fbbf24" 
                                        strokeDasharray="5 5" 
                                        label={{ value: "Prix Actuel", position: "right", fill: "#fbbf24" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Future Price Projection Chart */}
                    {LineChart && results[selectedScenario]?.fcfProjections && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">
                                Projection de Prix Futur - {scenarios[selectedScenario]?.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Projection basée sur la croissance FCF et les multiples de valorisation
                            </p>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={[
                                    { year: 'Aujourd\'hui', price: currentPrice, fairValue: results[selectedScenario]?.fairValue || currentPrice },
                                    ...results[selectedScenario].fcfProjections.slice(0, 5).map((proj, idx) => ({
                                        year: `Y${idx + 1}`,
                                        price: currentPrice * Math.pow(1 + (scenarios[selectedScenario]?.revenueGrowth || 0) / 100, idx + 1),
                                        fairValue: results[selectedScenario]?.fairValue || currentPrice
                                    }))
                                ]}>
                                    <defs>
                                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="fairValueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="year" stroke="#9ca3af" />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        formatter={(value) => [`$${value.toFixed(2)}`, '']}
                                    />
                                    <Legend />
                                    <Area 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke="#3b82f6" 
                                        fill="url(#priceGradient)" 
                                        strokeWidth={2}
                                        name="Prix Projeté"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="fairValue" 
                                        stroke="#10b981" 
                                        fill="url(#fairValueGradient)" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Juste Valeur"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Comparison Chart */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-6">Comparaison des Valorisations</h3>

                        <div className="space-y-4">
                            {/* Current Price Reference Line */}
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
                                <div className="w-48 text-gray-400 font-medium">Prix Actuel</div>
                                <div className="flex-1 relative">
                                    <div className="w-full bg-gray-700 rounded-full h-2"></div>
                                    <div className="absolute top-0 left-0 h-2 bg-yellow-500 rounded-full"
                                        style={{ width: '50%' }}></div>
                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-gray-900"></div>
                                        <div className="text-xs text-yellow-400 font-mono mt-1 whitespace-nowrap">
                                            ${currentPrice.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Scenario Bars */}
                            {Object.entries(scenarios).map(([key, scenario]) => {
                                const result = results[key];
                                if (!result) return null;

                                const maxValue = Math.max(...Object.values(results).map(r => r?.fairValue || 0), currentPrice);
                                const percentage = (result.fairValue / maxValue) * 100;
                                const currentPricePercentage = (currentPrice / maxValue) * 100;

                                return (
                                    <div key={key} className="flex items-center gap-4">
                                        <div className={`w-48 font-medium ${getTextColor(scenario.color)}`}>
                                            {scenario.name}
                                        </div>
                                        <div className="flex-1 relative">
                                            <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                                                <div
                                                    className={`h-8 rounded-full transition-all duration-1000 ${scenario.color === 'red' ? 'bg-red-500' :
                                                            scenario.color === 'green' ? 'bg-green-500' :
                                                                scenario.color === 'purple' ? 'bg-purple-500' :
                                                                    'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                                {/* Current price marker */}
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
                                                    style={{ left: `${currentPricePercentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-white font-mono text-sm">
                                                    ${result.fairValue.toFixed(2)}
                                                </span>
                                                <span className={`text-sm font-medium ${result.upside >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {result.upside >= 0 ? '+' : ''}{result.upside.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Stats */}
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-400 mb-1">Valorisation Min</div>
                                <div className="text-xl font-bold text-red-400">
                                    ${Math.min(...Object.values(results).map(r => r?.fairValue || Infinity)).toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-400 mb-1">Valorisation Moyenne</div>
                                <div className="text-xl font-bold text-blue-400">
                                    ${(Object.values(results).reduce((sum, r) => sum + (r?.fairValue || 0), 0) / Object.keys(results).length).toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-400 mb-1">Valorisation Max</div>
                                <div className="text-xl font-bold text-green-400">
                                    ${Math.max(...Object.values(results).map(r => r?.fairValue || 0)).toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-400 mb-1">Prix Actuel</div>
                                <div className="text-xl font-bold text-yellow-400">
                                    ${currentPrice.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Waterfall Chart for Valuation Breakdown */}
                        {BarChart && results[selectedScenario] && (() => {
                            const waterfallData = [
                                { name: 'PV FCF', value: results[selectedScenario].totalPV, cumulative: results[selectedScenario].totalPV, type: 'positive' },
                                { name: 'Terminal', value: results[selectedScenario].pvTerminal, cumulative: results[selectedScenario].enterpriseValue, type: 'positive' },
                                { name: 'Enterprise', value: results[selectedScenario].enterpriseValue, cumulative: results[selectedScenario].enterpriseValue, type: 'neutral' },
                                { name: 'Net Debt', value: -(validatedBaselineData.netDebt || 0), cumulative: results[selectedScenario].equityValue, type: 'negative' },
                                { name: 'Equity', value: results[selectedScenario].equityValue, cumulative: results[selectedScenario].equityValue, type: 'final' }
                            ];
                            
                            return (
                                <div className="mt-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-xl font-bold text-white mb-4">
                                        Construction de la Valorisation - {scenarios[selectedScenario]?.name}
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart 
                                            data={waterfallData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="#9ca3af" 
                                                angle={-45} 
                                                textAnchor="end" 
                                                height={80}
                                            />
                                            <YAxis 
                                                stroke="#9ca3af"
                                                tickFormatter={(value) => `$${(Math.abs(value) / 1e9).toFixed(1)}B`}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                formatter={(value) => [`$${(Math.abs(value) / 1e9).toFixed(2)}B`, '']}
                                            />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                {waterfallData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={
                                                            entry.type === 'positive' ? '#10b981' :
                                                            entry.type === 'negative' ? '#ef4444' :
                                                            entry.type === 'final' ? '#3b82f6' : '#6b7280'
                                                        } 
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            );
                        })()}

                        {/* Detailed Breakdown for Selected Scenario */}
                        {results[selectedScenario] && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3">Détails du Calcul - {scenarios[selectedScenario]?.name}</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">PV des FCF (10 ans)</span>
                                            <span className="text-white font-mono">${(results[selectedScenario].totalPV / 1e9).toFixed(2)}B</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Valeur Terminale (PV)</span>
                                            <span className="text-white font-mono">${(results[selectedScenario].pvTerminal / 1e9).toFixed(2)}B</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Enterprise Value</span>
                                            <span className="text-white font-mono">${(results[selectedScenario].enterpriseValue / 1e9).toFixed(2)}B</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Net Debt</span>
                                            <span className="text-white font-mono">${(validatedBaselineData.netDebt / 1e9).toFixed(2)}B</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-700">
                                            <span className="text-gray-400">Equity Value</span>
                                            <span className="text-white font-mono">${(results[selectedScenario].equityValue / 1e9).toFixed(2)}B</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Shares Outstanding</span>
                                            <span className="text-white font-mono">{(validatedBaselineData.sharesOutstanding / 1e9).toFixed(3)}B</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3">Hypothèses</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">FCF Initial</span>
                                            <span className="text-white font-mono">${(validatedBaselineData.latestFCF / 1e9).toFixed(2)}B</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Croissance Rev.</span>
                                            <span className="text-white font-mono">{scenarios[selectedScenario]?.revenueGrowth.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Δ Marge</span>
                                            <span className="text-white font-mono">{scenarios[selectedScenario]?.marginChange.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Taux d'actualisation</span>
                                            <span className="text-white font-mono">{scenarios[selectedScenario]?.discountRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Croissance Terminale</span>
                                            <span className="text-white font-mono">{scenarios[selectedScenario]?.terminalGrowth.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.ScenarioAnalysisModal = ScenarioAnalysisModal;
