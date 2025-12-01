/**
 * Peer Comparison Modal Component
 * Compare multiple stocks side-by-side with key metrics
 */

const { useState, useEffect } = React;

const PeerComparisonModal = ({ symbols, onClose }) => {
    const [comparisonData, setComparisonData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetrics, setSelectedMetrics] = useState([
        'marketCap', 'peRatio', 'priceToBook', 'roe', 'debtToEquity',
        'currentRatio', 'revenueGrowth', 'netMargin'
    ]);

    useEffect(() => {
        loadComparisonData();
    }, [symbols]);

    const loadComparisonData = async () => {
        setLoading(true);
        try {
            const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase()).filter(Boolean)));
            const API_BASE_URL = window.location.origin || '';

            const batchRes = await fetch(
                `${API_BASE_URL}/api/marketdata/batch?symbols=${uniqueSymbols.join(',')}&endpoints=quote,fundamentals,ratios`
            );
            const batch = batchRes.ok ? await batchRes.json() : null;
            const quoteData = batch?.data?.quote || {};
            const fundamentalsData = batch?.data?.fundamentals || {};
            const ratiosData = batch?.data?.ratios || {};

            const mapped = uniqueSymbols.map(symbol => {
                const quote = quoteData[symbol] || {};
                const ratios = ratiosData[symbol] || fundamentalsData[symbol] || {};

                return {
                    symbol,
                    name: quote.name || quote.companyName || symbol,
                    price: quote.price || quote.c || 0,
                    change: quote.changesPercentage || quote.d || 0,
                    marketCap: quote.marketCap || ratios.marketCap || 0,
                    peRatio: ratios.priceEarningsRatioTTM || ratios.peRatioTTM || ratios.peRatio || 0,
                    priceToBook: ratios.priceToBookRatioTTM || ratios.priceToBookRatio || 0,
                    roe: (ratios.returnOnEquityTTM || ratios.roe || 0) * 100,
                    roa: (ratios.returnOnAssetsTTM || ratios.roa || 0) * 100,
                    debtToEquity: ratios.debtEquityRatio || ratios.debtToEquity || 0,
                    currentRatio: ratios.currentRatio || 0,
                    quickRatio: ratios.quickRatio || 0,
                    revenueGrowth: (ratios.revenueGrowthTTM || ratios.revenueGrowth || 0) * 100,
                    netMargin: (ratios.netProfitMarginTTM || ratios.netMargin || 0) * 100,
                    dividendYield: (ratios.dividendYieldTTM || ratios.dividendYield || 0) * 100,
                    beta: quote.beta || 0
                };
            });

            setComparisonData(mapped);
        } catch (error) {
            console.error('Error loading comparison data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (key, value) => {
        if (!value && value !== 0) return 'N/A';

        switch (key) {
            case 'marketCap':
                return `$${(value / 1e9).toFixed(2)}B`;
            case 'price':
                return `$${value.toFixed(2)}`;
            case 'change':
            case 'roe':
            case 'roa':
            case 'revenueGrowth':
            case 'netMargin':
            case 'dividendYield':
                return `${value.toFixed(2)}%`;
            case 'peRatio':
            case 'priceToBook':
            case 'debtToEquity':
            case 'currentRatio':
            case 'quickRatio':
            case 'beta':
                return value.toFixed(2);
            default:
                return value;
        }
    };

    const getMetricLabel = (key) => {
        const labels = {
            marketCap: 'Capitalisation',
            peRatio: 'P/E Ratio',
            priceToBook: 'P/B Ratio',
            roe: 'ROE',
            roa: 'ROA',
            debtToEquity: 'Dette/Capitaux',
            currentRatio: 'Ratio Courant',
            quickRatio: 'Ratio Rapide',
            revenueGrowth: 'Croissance Rev.',
            netMargin: 'Marge Nette',
            dividendYield: 'Rendement Div.',
            beta: 'Beta'
        };
        return labels[key] || key;
    };

    const getBestValue = (key, values) => {
        const higherIsBetter = ['roe', 'roa', 'currentRatio', 'quickRatio', 'revenueGrowth', 'netMargin', 'dividendYield', 'marketCap'];
        const lowerIsBetter = ['peRatio', 'priceToBook', 'debtToEquity', 'beta'];

        const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
        if (validValues.length === 0) return null;

        if (higherIsBetter.includes(key)) {
            return Math.max(...validValues);
        } else if (lowerIsBetter.includes(key)) {
            return Math.min(...validValues);
        }
        return null;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-6xl w-full mx-4 border border-gray-700">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300 text-lg">Comparaison des titres...</p>
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
                                <Icon name="stats-report" className="w-5 h-5 text-blue-400" />
                            </span>
                            Comparaison Multi-Titres
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {symbols.join(' vs ')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <Icon name="xmark" className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Comparison Table */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900/80 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left p-4 text-gray-400 font-medium">Métrique</th>
                                    {comparisonData.map((stock, idx) => (
                                        <th key={idx} className="text-center p-4">
                                            <div className="text-white font-bold text-lg">{stock.symbol}</div>
                                            <div className="text-gray-400 text-xs">{stock.name}</div>
                                            <div className="text-white font-mono mt-1">${stock.price.toFixed(2)}</div>
                                            <div className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedMetrics.map((metric, idx) => {
                                    const values = comparisonData.map(stock => stock[metric]);
                                    const bestValue = getBestValue(metric, values);

                                    return (
                                        <tr key={idx} className="border-t border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 text-white font-medium sticky left-0 bg-gray-800/95">
                                                {getMetricLabel(metric)}
                                            </td>
                                            {comparisonData.map((stock, stockIdx) => {
                                                const value = stock[metric];
                                                const isBest = value === bestValue && bestValue !== null;

                                                return (
                                                    <td key={stockIdx} className="p-4 text-center">
                                                        <div className={`font-mono text-lg ${isBest ? 'text-green-400 font-bold' : 'text-white'
                                                            }`}>
                                                            {formatValue(metric, value)}
                                                        </div>
                                                        {isBest && (
                                                            <div className="text-xs text-green-400 mt-1">★ Meilleur</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Visual Comparison Charts */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* P/E Ratio Comparison */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">P/E Ratio Comparison</h3>
                            <div className="space-y-3">
                                {comparisonData.map((stock, idx) => {
                                    const maxPE = Math.max(...comparisonData.map(s => s.peRatio || 0));
                                    const percentage = maxPE > 0 ? (stock.peRatio / maxPE) * 100 : 0;

                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">{stock.symbol}</span>
                                                <span className="text-white font-mono">{stock.peRatio?.toFixed(2) || 'N/A'}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-3">
                                                <div
                                                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ROE Comparison */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">ROE Comparison</h3>
                            <div className="space-y-3">
                                {comparisonData.map((stock, idx) => {
                                    const maxROE = Math.max(...comparisonData.map(s => s.roe || 0));
                                    const percentage = maxROE > 0 ? (stock.roe / maxROE) * 100 : 0;

                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">{stock.symbol}</span>
                                                <span className="text-white font-mono">{stock.roe?.toFixed(2)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-3">
                                                <div
                                                    className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.PeerComparisonModal = PeerComparisonModal;
