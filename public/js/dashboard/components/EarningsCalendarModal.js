// EarningsCalendarModal.js
// Earnings calendar with surprise analysis

const { useState, useEffect } = React;
const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = window.Recharts || {};

const EarningsCalendarModal = ({ symbol, stockData, onClose }) => {
    const [earningsData, setEarningsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (symbol) {
            fetchEarningsData();
        }
    }, [symbol]);

    const fetchEarningsData = async () => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE_URL = window.location.origin || '';

            const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=earnings&symbol=${symbol}`);

            if (!response.ok) {
                throw new Error(`Earnings API error: ${response.status}`);
            }

            const data = await response.json();
            setEarningsData(data);

        } catch (err) {
            console.error('Earnings data error:', err);
            setError(err.message || 'Failed to fetch earnings data');
            setEarningsData({
                symbol,
                consensus: { nextEarningsDate: null },
                upcoming: [],
                historical: []
            });
        } finally {
            setLoading(false);
        }
    };

    const getDaysUntil = (dateString) => {
        if (!dateString) return null;
        const target = new Date(dateString);
        const now = new Date();
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'TBD';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-rose-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-900/40 to-pink-900/40 border-b border-rose-500/30 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <Icon name="calendar" className="w-8 h-8 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Earnings Calendar</h2>
                            <p className="text-gray-400 text-sm">{symbol} • Next earnings & historical surprises</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        <Icon name="cancel" className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-lg">Loading earnings data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                            <h3 className="text-red-400 font-bold mb-2">Error Loading Data</h3>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    ) : earningsData ? (
                        <div className="space-y-6">
                            {/* Next Earnings Countdown */}
                            {earningsData.consensus?.nextEarningsDate && (
                                <div className="bg-gradient-to-br from-rose-900/30 to-pink-900/30 rounded-xl p-6 border border-rose-500/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-2">Next Earnings Report</h3>
                                            <div className="text-3xl font-bold text-rose-400 mb-2">
                                                {formatDate(earningsData.consensus.nextEarningsDate)}
                                            </div>
                                            {getDaysUntil(earningsData.consensus.nextEarningsDate) !== null && (
                                                <div className="text-gray-400">
                                                    {getDaysUntil(earningsData.consensus.nextEarningsDate) > 0
                                                        ? `In ${getDaysUntil(earningsData.consensus.nextEarningsDate)} days`
                                                        : getDaysUntil(earningsData.consensus.nextEarningsDate) === 0
                                                        ? 'Today!'
                                                        : `${Math.abs(getDaysUntil(earningsData.consensus.nextEarningsDate))} days ago`
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {earningsData.consensus.estimatedEPS && (
                                                <div>
                                                    <div className="text-gray-400 text-sm">Expected EPS</div>
                                                    <div className="text-2xl font-bold text-white">
                                                        ${earningsData.consensus.estimatedEPS.toFixed(2)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Earnings */}
                            {earningsData.upcoming && earningsData.upcoming.length > 0 && (
                                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Upcoming Reports</h3>
                                    <div className="space-y-3">
                                        {earningsData.upcoming.slice(0, 3).map((earning, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                                                <div>
                                                    <div className="text-white font-semibold">{formatDate(earning.date)}</div>
                                                    <div className="text-gray-400 text-sm">{earning.fiscalDateEnding || 'FY'}</div>
                                                </div>
                                                <div className="text-right">
                                                    {earning.eps && (
                                                        <div className="text-white font-semibold">${earning.eps.toFixed(2)} EPS</div>
                                                    )}
                                                    {earning.revenue && (
                                                        <div className="text-gray-400 text-sm">
                                                            ${(earning.revenue / 1000000000).toFixed(2)}B Revenue
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Historical Earnings */}
                            {earningsData.historical && earningsData.historical.length > 0 && (
                                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Historical Earnings (Last 8 Quarters)</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left text-gray-400 font-semibold py-2">Date</th>
                                                    <th className="text-right text-gray-400 font-semibold py-2">EPS</th>
                                                    <th className="text-right text-gray-400 font-semibold py-2">Est. EPS</th>
                                                    <th className="text-right text-gray-400 font-semibold py-2">Surprise %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {earningsData.historical.slice(0, 8).map((earning, index) => {
                                                    const surprise = earning.eps && earning.epsEstimated
                                                        ? ((earning.eps - earning.epsEstimated) / earning.epsEstimated * 100)
                                                        : 0;
                                                    const isPositiveSurprise = surprise > 0;

                                                    return (
                                                        <tr key={index} className="border-b border-gray-700/50">
                                                            <td className="py-3 text-gray-300">{formatDate(earning.date)}</td>
                                                            <td className="py-3 text-right text-white font-semibold">
                                                                ${earning.eps?.toFixed(2) || 'N/A'}
                                                            </td>
                                                            <td className="py-3 text-right text-gray-400">
                                                                ${earning.epsEstimated?.toFixed(2) || 'N/A'}
                                                            </td>
                                                            <td className={`py-3 text-right font-bold ${
                                                                isPositiveSurprise ? 'text-green-400' : surprise < 0 ? 'text-red-400' : 'text-gray-400'
                                                            }`}>
                                                                {surprise !== 0 ? `${surprise > 0 ? '+' : ''}${surprise.toFixed(1)}%` : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <Icon name="database" className="w-4 h-4 inline mr-1 text-rose-400" />
                        Earnings data from FMP
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

window.EarningsCalendarModal = EarningsCalendarModal;
