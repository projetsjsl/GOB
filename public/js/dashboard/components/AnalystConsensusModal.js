// AnalystConsensusModal.js
// Analyst consensus dashboard with EPS estimates and ratings

const { useState, useEffect } = React;
const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = window.Recharts || {};

const AnalystConsensusModal = ({ symbol, stockData, onClose }) => {
    const [analystData, setAnalystData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (symbol) {
            fetchAnalystData();
        }
    }, [symbol]);

    const fetchAnalystData = async () => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE_URL = window.location.origin || '';
            let analystData = null;

            // Try FMP first (primary source)
            try {
                const response = await fetch(`${API_BASE_URL}/api/marketdata?endpoint=analyst&symbol=${symbol}`);

                if (response.ok) {
                    const data = await response.json();
                    
                    // Normalize FMP data structure
                    if (data && (data.consensus || data.estimates)) {
                        analystData = {
                            symbol: data.symbol || symbol.toUpperCase(),
                            consensus: {
                                estimatedEPS: data.consensus?.estimatedEPS || 
                                            data.consensus?.estimatedEpsAvg || 
                                            data.estimates?.[0]?.estimatedEpsAvg || null,
                                estimatedEPSHigh: data.consensus?.estimatedEPSHigh || 
                                                data.consensus?.estimatedEpsHigh || 
                                                data.estimates?.[0]?.estimatedEpsHigh || null,
                                estimatedEPSLow: data.consensus?.estimatedEPSLow || 
                                               data.consensus?.estimatedEpsLow || 
                                               data.estimates?.[0]?.estimatedEpsLow || null,
                                estimatedRevenue: data.consensus?.estimatedRevenue || 
                                                data.consensus?.estimatedRevenueAvg || 
                                                data.estimates?.[0]?.estimatedRevenueAvg || null,
                                numberAnalysts: data.consensus?.numberAnalysts || 
                                             data.consensus?.numberAnalystEstimatedRevenue || 
                                             data.estimates?.[0]?.numberAnalystEstimatedRevenue || 0
                            },
                            estimates: (data.estimates || []).map(est => ({
                                date: est.date || est.calendarYear || est.fiscalDateEnding || 'N/A',
                                estimatedEpsAvg: est.estimatedEpsAvg || est.estimatedEPS || null,
                                estimatedEpsHigh: est.estimatedEpsHigh || null,
                                estimatedEpsLow: est.estimatedEpsLow || null,
                                estimatedRevenueAvg: est.estimatedRevenueAvg || est.estimatedRevenue || null,
                                numberAnalystEstimatedRevenue: est.numberAnalystEstimatedRevenue || 
                                                              est.numberAnalysts || 0
                            })).slice(0, 8) // Last 8 quarters
                        };
                    }
                }
            } catch (fmpError) {
                console.warn('FMP analyst fetch failed:', fmpError);
            }

            // Fallback: Try FMP direct API endpoint
            if (!analystData || !analystData.consensus?.estimatedEPS) {
                try {
                    const fmpRes = await fetch(`${API_BASE_URL}/api/fmp?endpoint=analyst-estimates&symbol=${symbol}`);
                    
                    if (fmpRes.ok) {
                        const fmpData = await fmpRes.json();
                        
                        if (Array.isArray(fmpData) && fmpData.length > 0) {
                            const latest = fmpData[0];
                            
                            analystData = {
                                symbol: symbol.toUpperCase(),
                                consensus: {
                                    estimatedEPS: latest.estimatedEpsAvg || latest.estimatedEPS || null,
                                    estimatedEPSHigh: latest.estimatedEpsHigh || null,
                                    estimatedEPSLow: latest.estimatedEpsLow || null,
                                    estimatedRevenue: latest.estimatedRevenueAvg || latest.estimatedRevenue || null,
                                    numberAnalysts: latest.numberAnalystEstimatedRevenue || 
                                                  latest.numberAnalysts || 0
                                },
                                estimates: fmpData.slice(0, 8).map(est => ({
                                    date: est.date || est.calendarYear || est.fiscalDateEnding || 'N/A',
                                    estimatedEpsAvg: est.estimatedEpsAvg || est.estimatedEPS || null,
                                    estimatedEpsHigh: est.estimatedEpsHigh || null,
                                    estimatedEpsLow: est.estimatedEpsLow || null,
                                    estimatedRevenueAvg: est.estimatedRevenueAvg || est.estimatedRevenue || null,
                                    numberAnalystEstimatedRevenue: est.numberAnalystEstimatedRevenue || 
                                                                  est.numberAnalysts || 0
                                }))
                            };
                        }
                    }
                } catch (fmpDirectError) {
                    console.warn('FMP direct API fallback failed:', fmpDirectError);
                }
            }

            // Set data or fallback
            if (analystData && analystData.consensus) {
                setAnalystData(analystData);
            } else {
                setAnalystData({
                    symbol: symbol.toUpperCase(),
                    consensus: {
                        estimatedEPS: null,
                        estimatedRevenue: null,
                        numberAnalysts: 0
                    },
                    estimates: []
                });
                setError('Aucune donnée d\'analystes disponible pour ce symbole');
            }

        } catch (err) {
            console.error('Analyst data error:', err);
            setError(err.message || 'Failed to fetch analyst data');
            setAnalystData({
                symbol: symbol.toUpperCase(),
                consensus: {
                    estimatedEPS: null,
                    estimatedRevenue: null,
                    numberAnalysts: 0
                },
                estimates: []
            });
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num) return 'N/A';
        if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
        if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
        return `$${num.toFixed(2)}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-lime-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-lime-900/40 to-green-900/40 border-b border-lime-500/30 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-lime-500/20 flex items-center justify-center">
                            <i className="iconoir-community text-lime-400 text-3xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Analyst Consensus</h2>
                            <p className="text-gray-400 text-sm">{symbol} • Expert estimates & ratings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-cancel text-gray-400 text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-lg">Loading analyst consensus...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                            <h3 className="text-red-400 font-bold mb-2">Error Loading Data</h3>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    ) : analystData ? (
                        <div className="space-y-6">
                            {/* Current Consensus */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                                    <div className="text-gray-400 text-sm mb-2">EPS Estimate</div>
                                    <div className="text-2xl font-bold text-white">
                                        {analystData.consensus?.estimatedEPS !== null && analystData.consensus?.estimatedEPS !== undefined 
                                            ? `$${analystData.consensus.estimatedEPS.toFixed(2)}` 
                                            : 'N/A'}
                                    </div>
                                    {analystData.consensus?.estimatedEPSHigh && analystData.consensus?.estimatedEPSLow && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            Range: ${analystData.consensus.estimatedEPSLow.toFixed(2)} - ${analystData.consensus.estimatedEPSHigh.toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                                    <div className="text-gray-400 text-sm mb-2">Revenue Estimate</div>
                                    <div className="text-2xl font-bold text-white">
                                        {formatNumber(analystData.consensus?.estimatedRevenue)}
                                    </div>
                                    {analystData.consensus?.estimatedRevenue && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            {analystData.consensus.estimatedRevenue >= 1000000000 
                                                ? `${(analystData.consensus.estimatedRevenue / 1000000000).toFixed(2)}B` 
                                                : `${(analystData.consensus.estimatedRevenue / 1000000).toFixed(2)}M`}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                                    <div className="text-gray-400 text-sm mb-2">Number of Analysts</div>
                                    <div className="text-2xl font-bold text-white">
                                        {analystData.consensus?.numberAnalysts || 0}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">Covering this stock</div>
                                </div>
                            </div>

                            {/* Historical Estimates */}
                            {analystData.estimates && analystData.estimates.length > 0 ? (
                                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Historical Estimates</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left text-gray-400 font-semibold py-2">Date</th>
                                                    <th className="text-right text-gray-400 font-semibold py-2">EPS Est.</th>
                                                    <th className="text-right text-gray-400 font-semibold py-2">Revenue Est.</th>
                                                    <th className="text-right text-gray-400 font-semibold py-2">Analysts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analystData.estimates.map((est, index) => {
                                                    const formatEstDate = (dateStr) => {
                                                        if (!dateStr || dateStr === 'N/A') return 'N/A';
                                                        try {
                                                            const date = new Date(dateStr);
                                                            return date.toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            });
                                                        } catch {
                                                            return dateStr;
                                                        }
                                                    };

                                                    return (
                                                        <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                                            <td className="py-3 text-gray-300">{formatEstDate(est.date)}</td>
                                                            <td className="py-3 text-right text-white font-semibold">
                                                                {est.estimatedEpsAvg !== null && est.estimatedEpsAvg !== undefined 
                                                                    ? `$${est.estimatedEpsAvg.toFixed(2)}` 
                                                                    : 'N/A'}
                                                            </td>
                                                            <td className="py-3 text-right text-white font-semibold">
                                                                {formatNumber(est.estimatedRevenueAvg)}
                                                            </td>
                                                            <td className="py-3 text-right text-gray-400">
                                                                {est.numberAnalystEstimatedRevenue || 0}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Historical Estimates</h3>
                                    <p className="text-gray-400 text-center py-4">
                                        Aucune donnée historique disponible pour ce symbole
                                    </p>
                                </div>
                            )}

                            {/* Info Message */}
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <i className="iconoir-info-circle text-blue-400 text-xl mt-0.5"></i>
                                    <div className="text-sm text-gray-300">
                                        <strong className="text-blue-400">Note:</strong> Analyst estimates are forward-looking
                                        and may not reflect actual results. Always conduct your own research before making
                                        investment decisions.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <i className="iconoir-database text-lime-400 mr-1"></i>
                        Data from Financial Modeling Prep
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

window.AnalystConsensusModal = AnalystConsensusModal;
