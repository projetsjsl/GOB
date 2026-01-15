/**
 * Stock Analysis Modal Component
 * Comprehensive stock analysis with Valuation, Financials, Metrics, and AI Insights
 */

const { useState, useEffect } = React;

const StockAnalysisModal = ({ symbol, currentPrice, onClose }) => {
    const [activeTab, setActiveTab] = useState('valuation');
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (symbol && window.StockAnalysisAPI) {
            loadAnalysisData();
        }
    }, [symbol]);

    const loadAnalysisData = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await window.StockAnalysisAPI.fetchCompleteAnalysis(symbol, currentPrice);
            setAnalysisData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 border border-gray-700 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300 text-lg">Analyse approfondie de {symbol}...</p>
                        <p className="text-gray-500 text-sm">Recuperation des etats financiers et calcul des metriques</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-red-700 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <i className="iconoir-warning-triangle text-red-500 text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white">Erreur de Chargement</h3>
                        <p className="text-gray-400 text-center">{error}</p>
                        <div className="flex gap-3 mt-4">
                            <button title="Action"
                                onClick={loadAnalysisData}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                Reessayer
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-7xl w-full border border-gray-700 shadow-2xl my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-900/30 to-purple-900/30">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <i className="iconoir-graph-up text-blue-400 text-xl"></i>
                            </span>
                            Analyse Approfondie: {symbol}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Powered by FMP, Finnhub & Gemini AI</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-xmark text-gray-400 text-xl"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 bg-gray-900/50 px-6 overflow-x-auto">
                    {[
                        { id: 'valuation', label: 'Valorisation', icon: 'dollar' },
                        { id: 'financials', label: 'Etats Financiers', icon: 'doc-star' },
                        { id: 'metrics', label: 'Metriques Cles', icon: 'dashboard-speed' },
                        { id: 'insights', label: 'Insights IA', icon: 'brain' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <i className={`iconoir-${tab.icon}`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {activeTab === 'valuation' && <ValuationTab data={analysisData} />}
                    {activeTab === 'financials' && <FinancialsTab data={analysisData} />}
                    {activeTab === 'metrics' && <MetricsTab data={analysisData} />}
                    {activeTab === 'insights' && <InsightsTab data={analysisData} />}
                </div>
            </div>
        </div>
    );
};

// Valuation Tab Component
const ValuationTab = ({ data }) => {
    const { valuation, dcf, currentPrice, cashFlow = [], incomeStatement = [] } = data;

    if (!valuation) {
        return <div className="text-gray-400 text-center py-12">Donnees de valorisation non disponibles</div>;
    }

    const fairValue = valuation.fairValue || 0;
    const marginOfSafety = valuation.marginOfSafety || 0;
    const upside = ((fairValue - currentPrice) / currentPrice) * 100;

    const formatBillions = (value) => {
        if (!value && value !== 0) return 'N/A';
        return `${(value / 1e9).toFixed(2)}B`;
    };

    const buildSparklinePath = (values, width = 220, height = 80) => {
        if (!values || values.length === 0) return '';
        const max = Math.max(...values, 0);
        const min = Math.min(...values, 0);
        const range = max - min || 1;
        const step = width / Math.max(values.length - 1, 1);
        return values
            .map((v, i) => {
                const x = i * step;
                const y = height - ((v - min) / range) * height;
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
    };

    const fcfSeries = Array.isArray(cashFlow)
        ? cashFlow.slice(0, 6).reverse().map(item => item.freeCashFlow || 0)
        : [];
    const revenueSeries = Array.isArray(incomeStatement)
        ? incomeStatement.slice(0, 6).reverse().map(item => item.revenue || 0)
        : [];

    const fcfPath = buildSparklinePath(fcfSeries);
    const revenuePath = buildSparklinePath(revenueSeries);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fair Value Gauge */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i className="iconoir-target text-blue-400"></i>
                    Juste Valeur
                </h3>
                <div className="flex items-center justify-center py-8">
                    <div className="relative">
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="80"
                                stroke="#374151"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="96"
                                cy="96"
                                r="80"
                                stroke={marginOfSafety > 0 ? '#10B981' : '#EF4444'}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${Math.abs(marginOfSafety) * 5} ${500 - Math.abs(marginOfSafety) * 5}`}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">${(fairValue || 0).toFixed(2)}</span>
                            <span className="text-sm text-gray-400">Juste Valeur</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Prix Actuel</p>
                        <p className="text-white font-bold text-lg">${(currentPrice || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Potentiel</p>
                        <p className={`font-bold text-lg ${upside > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {upside > 0 ? '+' : ''}{(upside || 0).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Valuation Methods */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i className="iconoir-calculator text-purple-400"></i>
                    Methodes de Valorisation
                </h3>
                <div className="space-y-4">
                    {valuation.dcfValue && (
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">DCF (Discounted Cash Flow)</span>
                                <span className="text-white font-bold">${valuation.dcfValue.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((valuation.dcfValue / fairValue) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    {valuation.peValue && (
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">P/E Multiple</span>
                                <span className="text-white font-bold">${valuation.peValue.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((valuation.peValue / fairValue) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    {valuation.pbValue && (
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">P/B Multiple</span>
                                <span className="text-white font-bold">${valuation.pbValue.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((valuation.pbValue / fairValue) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Historical Trends */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i className="iconoir-chart-line text-emerald-400"></i>
                    Tendances Financieres (5-6 periodes)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Free Cash Flow</span>
                            <span className="text-white font-mono text-sm">
                                {fcfSeries.length ? formatBillions(fcfSeries[fcfSeries.length - 1]) : 'N/A'}
                            </span>
                        </div>
                        <div className="h-28 relative">
                            {fcfSeries.length === 0 ? (
                                <div className="text-gray-500 text-sm">Donnees FCF indisponibles</div>
                            ) : (
                                <svg viewBox="0 0 220 80" className="w-full h-full">
                                    <defs>
                                        <linearGradient id="fcfGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                                            <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d={`${fcfPath} L220,80 L0,80 Z`}
                                        fill="url(#fcfGradient)"
                                        opacity="0.35"
                                    />
                                    <path d={fcfPath} stroke="#34d399" strokeWidth="3" fill="none" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Chiffre d'affaires</span>
                            <span className="text-white font-mono text-sm">
                                {revenueSeries.length ? formatBillions(revenueSeries[revenueSeries.length - 1]) : 'N/A'}
                            </span>
                        </div>
                        <div className="h-28 relative">
                            {revenueSeries.length === 0 ? (
                                <div className="text-gray-500 text-sm">Donnees revenus indisponibles</div>
                            ) : (
                                <svg viewBox="0 0 220 80" className="w-full h-full">
                                    <defs>
                                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                                            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d={`${revenuePath} L220,80 L0,80 Z`}
                                        fill="url(#revGradient)"
                                        opacity="0.35"
                                    />
                                    <path d={revenuePath} stroke="#60a5fa" strokeWidth="3" fill="none" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendation Card */}
            <div className="lg:col-span-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Recommandation: {valuation.recommendation}
                        </h3>
                        <p className="text-gray-300">
                            Marge de securite: <span className={`font-bold ${marginOfSafety > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(marginOfSafety || 0).toFixed(1)}%
                            </span>
                        </p>
                    </div>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${valuation.recommendation.includes('Buy') ? 'bg-green-500/20' :
                            valuation.recommendation.includes('Sell') ? 'bg-red-500/20' :
                                'bg-yellow-500/20'
                        }`}>
                        <i className={`iconoir-${valuation.recommendation.includes('Buy') ? 'arrow-up' :
                                valuation.recommendation.includes('Sell') ? 'arrow-down' :
                                    'minus'
                            } text-3xl ${valuation.recommendation.includes('Buy') ? 'text-green-400' :
                                valuation.recommendation.includes('Sell') ? 'text-red-400' :
                                    'text-yellow-400'
                            }`}></i>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Financials Tab Component
const FinancialsTab = ({ data }) => {
    const [statementType, setStatementType] = useState('income');
    const { incomeStatement, balanceSheet, cashFlow } = data;

    const statements = {
        income: incomeStatement?.slice(0, 5) || [],
        balance: balanceSheet?.slice(0, 5) || [],
        cashflow: cashFlow?.slice(0, 5) || []
    };

    const currentStatements = statements[statementType];

    if (!currentStatements || currentStatements.length === 0) {
        return <div className="text-gray-400 text-center py-12">Donnees financieres non disponibles</div>;
    }

    const formatNumber = (num) => {
        if (!num) return 'N/A';
        const billion = num / 1e9;
        return billion >= 1 ? `$${billion.toFixed(2)}B` : `$${(num / 1e6).toFixed(2)}M`;
    };

    const getKeyMetrics = () => {
        switch (statementType) {
            case 'income':
                return [
                    { label: 'Revenus', key: 'revenue' },
                    { label: 'Cout des ventes', key: 'costOfRevenue' },
                    { label: 'Benefice brut', key: 'grossProfit' },
                    { label: 'EBITDA', key: 'ebitda' },
                    { label: 'Benefice net', key: 'netIncome' },
                    { label: 'EPS', key: 'eps', format: (v) => `$${v?.toFixed(2) || 'N/A'}` }
                ];
            case 'balance':
                return [
                    { label: 'Actifs totaux', key: 'totalAssets' },
                    { label: 'Actifs courants', key: 'totalCurrentAssets' },
                    { label: 'Passifs totaux', key: 'totalLiabilities' },
                    { label: 'Dette totale', key: 'totalDebt' },
                    { label: 'Capitaux propres', key: 'totalStockholdersEquity' },
                    { label: 'Tresorerie', key: 'cashAndCashEquivalents' }
                ];
            case 'cashflow':
                return [
                    { label: 'Flux operationnels', key: 'operatingCashFlow' },
                    { label: 'Flux d\'investissement', key: 'netCashUsedForInvestingActivites' },
                    { label: 'Flux de financement', key: 'netCashUsedProvidedByFinancingActivities' },
                    { label: 'Free Cash Flow', key: 'freeCashFlow' },
                    { label: 'CapEx', key: 'capitalExpenditure' },
                    { label: 'Dividendes payes', key: 'dividendsPaid' }
                ];
            default:
                return [];
        }
    };

    return (
        <div className="space-y-6">
            {/* Statement Type Selector */}
            <div className="flex gap-3 bg-gray-900/50 p-2 rounded-lg">
                {[
                    { id: 'income', label: 'Compte de Resultat', icon: 'dollar' },
                    { id: 'balance', label: 'Bilan', icon: 'percentage' },
                    { id: 'cashflow', label: 'Flux de Tresorerie', icon: 'graph-up' }
                ].map(type => (
                    <button
                        key={type.id}
                        onClick={() => setStatementType(type.id)}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${statementType === type.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <i className={`iconoir-${type.icon}`}></i>
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Financial Table */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900/80">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-medium sticky left-0 bg-gray-900">Metrique</th>
                                {currentStatements.map((stmt, idx) => (
                                    <th key={idx} className="text-right p-4 text-gray-400 font-medium whitespace-nowrap">
                                        {stmt.date || stmt.calendarYear}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {getKeyMetrics().map((metric, idx) => (
                                <tr key={idx} className="border-t border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 text-white font-medium sticky left-0 bg-gray-800/95">{metric.label}</td>
                                    {currentStatements.map((stmt, stmtIdx) => {
                                        const value = stmt[metric.key];
                                        const displayValue = metric.format ? metric.format(value) : formatNumber(value);

                                        // Calculate growth if not first column
                                        let growth = null;
                                        if (stmtIdx > 0) {
                                            const prevValue = currentStatements[stmtIdx - 1][metric.key];
                                            if (prevValue && value) {
                                                growth = ((value - prevValue) / Math.abs(prevValue)) * 100;
                                            }
                                        }

                                        return (
                                            <td key={stmtIdx} className="p-4 text-right">
                                                <div className="text-white font-mono">{displayValue}</div>
                                                {growth !== null && (
                                                    <div className={`text-xs font-medium ${growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Metrics Tab Component
const MetricsTab = ({ data }) => {
    const { keyMetrics, ratios } = data;

    if (!keyMetrics || keyMetrics.length === 0) {
        return <div className="text-gray-400 text-center py-12">Metriques non disponibles</div>;
    }

    const latest = keyMetrics[0];
    const latestRatios = ratios?.[0] || {};

    const metricCategories = [
        {
            title: 'Rentabilite',
            icon: 'percentage',
            color: 'green',
            metrics: [
                { label: 'ROE', value: (latest.roe * 100)?.toFixed(1), unit: '%', good: latest.roe > 0.15 },
                { label: 'ROA', value: (latest.roa * 100)?.toFixed(1), unit: '%', good: latest.roa > 0.05 },
                { label: 'Marge Nette', value: (latestRatios.netProfitMargin * 100)?.toFixed(1), unit: '%', good: latestRatios.netProfitMargin > 0.10 },
                { label: 'Marge Brute', value: (latestRatios.grossProfitMargin * 100)?.toFixed(1), unit: '%', good: latestRatios.grossProfitMargin > 0.30 }
            ]
        },
        {
            title: 'Valorisation',
            icon: 'dollar',
            color: 'blue',
            metrics: [
                { label: 'P/E Ratio', value: latest.peRatio?.toFixed(1), unit: 'x', good: latest.peRatio < 25 },
                { label: 'P/B Ratio', value: latest.priceToBookRatio?.toFixed(1), unit: 'x', good: latest.priceToBookRatio < 3 },
                { label: 'P/S Ratio', value: latest.priceToSalesRatio?.toFixed(1), unit: 'x', good: latest.priceToSalesRatio < 5 },
                { label: 'EV/EBITDA', value: latest.enterpriseValueOverEBITDA?.toFixed(1), unit: 'x', good: latest.enterpriseValueOverEBITDA < 15 }
            ]
        },
        {
            title: 'Liquidite',
            icon: 'droplet',
            color: 'cyan',
            metrics: [
                { label: 'Current Ratio', value: latestRatios.currentRatio?.toFixed(2), unit: 'x', good: latestRatios.currentRatio > 1.5 },
                { label: 'Quick Ratio', value: latestRatios.quickRatio?.toFixed(2), unit: 'x', good: latestRatios.quickRatio > 1.0 },
                { label: 'Cash Ratio', value: latestRatios.cashRatio?.toFixed(2), unit: 'x', good: latestRatios.cashRatio > 0.5 },
                { label: 'Working Capital', value: `$${(latest.workingCapital / 1e9)?.toFixed(2)}B`, unit: '', good: latest.workingCapital > 0 }
            ]
        },
        {
            title: 'Solvabilite',
            icon: 'shield-check',
            color: 'purple',
            metrics: [
                { label: 'Debt/Equity', value: latestRatios.debtEquityRatio?.toFixed(2), unit: 'x', good: latestRatios.debtEquityRatio < 1.0 },
                { label: 'Debt/Assets', value: latestRatios.debtRatio?.toFixed(2), unit: 'x', good: latestRatios.debtRatio < 0.5 },
                { label: 'Interest Coverage', value: latestRatios.interestCoverage?.toFixed(1), unit: 'x', good: latestRatios.interestCoverage > 3 },
                { label: 'Equity Ratio', value: (latestRatios.totalEquityToTotalAssets * 100)?.toFixed(1), unit: '%', good: latestRatios.totalEquityToTotalAssets > 0.5 }
            ]
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metricCategories.map((category, idx) => (
                <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className={`w-8 h-8 bg-${category.color}-500/20 rounded-lg flex items-center justify-center`}>
                            <i className={`iconoir-${category.icon} text-${category.color}-400`}></i>
                        </span>
                        {category.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {category.metrics.map((metric, metricIdx) => (
                            <div key={metricIdx} className="bg-gray-900/50 rounded-lg p-4">
                                <p className="text-gray-400 text-xs mb-1">{metric.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className={`text-2xl font-bold ${metric.good ? `text-${category.color}-400` : 'text-gray-300'}`}>
                                        {metric.value || 'N/A'}
                                    </p>
                                    {metric.unit && <span className="text-gray-500 text-sm">{metric.unit}</span>}
                                </div>
                                {metric.good !== undefined && (
                                    <div className={`mt-2 w-full h-1 rounded-full ${metric.good ? `bg-${category.color}-500` : 'bg-gray-600'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Insights Tab Component
const InsightsTab = ({ data }) => {
    const { aiInsights } = data;

    // Markdown formatter function
    const formatMarkdown = (text) => {
        if (!text) return '';
        
        // Split into lines for better processing
        const lines = text.split('\n');
        let html = '';
        let inList = false;
        let listType = null; // 'ul' or 'ol'
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Headers
            if (line.startsWith('#### ')) {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += `<h4 class="text-base font-bold text-white mt-4 mb-2">${line.substring(5)}</h4>`;
            } else if (line.startsWith('### ')) {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += `<h3 class="text-lg font-bold text-white mt-5 mb-3">${line.substring(4)}</h3>`;
            } else if (line.startsWith('## ')) {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += `<h2 class="text-xl font-bold text-white mt-6 mb-4">${line.substring(3)}</h2>`;
            } else if (line.startsWith('# ')) {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += `<h1 class="text-2xl font-bold text-white mt-8 mb-5">${line.substring(2)}</h1>`;
            }
            // Numbered list
            else if (/^\d+\.\s+/.test(line)) {
                const currentListType = 'ol';
                if (!inList || listType !== currentListType) {
                    if (inList) {
                        html += listType === 'ul' ? '</ul>' : '</ol>';
                    }
                    html += '<ol class="list-decimal ml-6 space-y-2 my-3">';
                    inList = true;
                    listType = currentListType;
                }
                const content = line.replace(/^\d+\.\s+/, '');
                html += `<li class="text-gray-300">${formatInlineMarkdown(content)}</li>`;
            }
            // Bullet list
            else if (/^[-*]\s+/.test(line)) {
                const currentListType = 'ul';
                if (!inList || listType !== currentListType) {
                    if (inList) {
                        html += listType === 'ul' ? '</ul>' : '</ol>';
                    }
                    html += '<ul class="list-disc ml-6 space-y-2 my-3">';
                    inList = true;
                    listType = currentListType;
                }
                const content = line.replace(/^[-*]\s+/, '');
                html += `<li class="text-gray-300">${formatInlineMarkdown(content)}</li>`;
            }
            // Empty line
            else if (line === '') {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += '<br />';
            }
            // Regular paragraph
            else {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += `<p class="text-gray-300 leading-relaxed mb-3">${formatInlineMarkdown(line)}</p>`;
            }
        }
        
        // Close any open list
        if (inList) {
            html += listType === 'ul' ? '</ul>' : '</ol>';
        }
        
        return html;
    };
    
    // Format inline markdown (bold, italic, code)
    const formatInlineMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-blue-400 px-2 py-1 rounded text-sm font-mono">$1</code>');
    };

    if (!aiInsights || !aiInsights.success) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="iconoir-brain text-yellow-400 text-3xl"></i>
                </div>
                <p className="text-gray-400">Insights IA temporairement indisponibles</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i className="iconoir-brain text-purple-400"></i>
                    Analyse Gemini AI
                </h3>
                <div 
                    className="prose prose-invert max-w-none text-gray-300 leading-relaxed analysis-content"
                    style={{
                        lineHeight: '1.7'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: formatMarkdown(aiInsights.analysis)
                    }}
                />
                <style>{`
                    .analysis-content h1,
                    .analysis-content h2,
                    .analysis-content h3,
                    .analysis-content h4 {
                        scroll-margin-top: 1rem;
                    }
                    .analysis-content ul,
                    .analysis-content ol {
                        margin-top: 0.75rem;
                        margin-bottom: 0.75rem;
                    }
                    .analysis-content li {
                        margin-top: 0.5rem;
                        margin-bottom: 0.5rem;
                    }
                    .analysis-content code {
                        display: inline-block;
                        padding: 0.125rem 0.375rem;
                        margin: 0 0.125rem;
                    }
                    .analysis-content p {
                        margin-bottom: 0.75rem;
                    }
                    .analysis-content strong {
                        color: #ffffff;
                        font-weight: 600;
                    }
                `}</style>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-green-700/30">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i className="iconoir-check-circle text-green-400"></i>
                        Forces
                    </h3>
                    <ul className="space-y-3">
                        {(aiInsights.strengths || []).map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="iconoir-plus text-green-400 text-sm"></i>
                                </span>
                                <span className="text-gray-300 text-sm">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-700/30">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i className="iconoir-warning-triangle text-red-400"></i>
                        Risques
                    </h3>
                    <ul className="space-y-3">
                        {(aiInsights.weaknesses || []).map((weakness, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="iconoir-minus text-red-400 text-sm"></i>
                                </span>
                                <span className="text-gray-300 text-sm">{weakness}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Trends */}
            {aiInsights.trends && aiInsights.trends.length > 0 && (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-blue-700/30">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i className="iconoir-graph-up text-blue-400"></i>
                        Tendances Cles
                    </h3>
                    <ul className="space-y-3">
                        {aiInsights.trends.map((trend, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i className="iconoir-arrow-tr text-blue-400 text-sm"></i>
                                </span>
                                <span className="text-gray-300 text-sm">{trend}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Export component
window.StockAnalysisModal = StockAnalysisModal;
