/**
 * Scenario Analysis Modal Component
 * What-If analysis for DCF valuation with multiple scenarios
 */

const { useState, useEffect } = React;

const ScenarioAnalysisModal = ({ symbol, currentPrice, baselineData, onClose }) => {
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

    useEffect(() => {
        calculateAllScenarios();
    }, [scenarios, baselineData]);

    const calculateDCF = (scenario) => {
        if (!baselineData) return null;

        const { latestFCF, netDebt, sharesOutstanding } = baselineData;
        const { revenueGrowth, marginChange, discountRate, terminalGrowth } = scenario;

        let totalPV = 0;
        let projectedFCF = latestFCF;

        // Project 5 years
        for (let year = 1; year <= 5; year++) {
            const growthRate = (revenueGrowth + marginChange) / 100;
            projectedFCF = projectedFCF * (1 + growthRate);
            const pv = projectedFCF / Math.pow(1 + discountRate / 100, year);
            totalPV += pv;
        }

        // Terminal value
        const terminalFCF = projectedFCF * (1 + terminalGrowth / 100);
        const terminalValue = terminalFCF / ((discountRate / 100) - (terminalGrowth / 100));
        const pvTerminal = terminalValue / Math.pow(1 + discountRate / 100, 5);

        // Equity value
        const enterpriseValue = totalPV + pvTerminal;
        const equityValue = enterpriseValue - netDebt;
        const fairValue = equityValue / sharesOutstanding;

        const upside = ((fairValue - currentPrice) / currentPrice) * 100;

        return {
            fairValue,
            enterpriseValue,
            equityValue,
            upside,
            totalPV,
            pvTerminal
        };
    };

    const calculateAllScenarios = () => {
        const newResults = {};
        Object.keys(scenarios).forEach(key => {
            newResults[key] = calculateDCF(scenarios[key]);
        });
        setResults(newResults);
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
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-xmark text-gray-400 text-xl"></i>
                    </button>
                </div>

                <div className="p-6">
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
                        <div className="mt-8 grid grid-cols-3 gap-4">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.ScenarioAnalysisModal = ScenarioAnalysisModal;
