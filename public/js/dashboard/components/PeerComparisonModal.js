/**
 * Peer Comparison Modal Component
 * Compare multiple stocks side-by-side with key metrics
 */

const { useState, useEffect } = React;

const PeerComparisonModal = ({ symbols, onClose }) => {
    const [comparisonData, setComparisonData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetrics, setSelectedMetrics] = useState([
        'marketCap', 'peRatio', 'priceToBook', 'priceToSales', 'roe', 'roa', 
        'debtToEquity', 'currentRatio', 'revenueGrowth', 'netMargin', 'grossMargin', 'beta'
    ]);

    useEffect(() => {
        loadComparisonData();
    }, [symbols]);

    const loadComparisonData = async () => {
        setLoading(true);
        try {
            const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase()).filter(Boolean)));
            const API_BASE_URL = window.location.origin || '';

            // Fetch from FMP batch API (primary source)
            const batchRes = await fetch(
                `${API_BASE_URL}/api/marketdata/batch?symbols=${uniqueSymbols.join(',')}&endpoints=quote,profile,ratios`
            );
            
            let batch = null;
            if (batchRes.ok) {
                batch = await batchRes.json();
            }

            const quoteData = batch?.data?.quote || {};
            const profileData = batch?.data?.profile || {};
            const ratiosData = batch?.data?.ratios || {};

            // Fetch individual quotes from Finnhub as fallback for missing data
            const finnhubQuotes = {};
            const missingQuotes = uniqueSymbols.filter(symbol => !quoteData[symbol] || !quoteData[symbol].price);
            
            if (missingQuotes.length > 0) {
                try {
                    const finnhubPromises = missingQuotes.map(async (symbol) => {
                        try {
                            const res = await fetch(`${API_BASE_URL}/api/finnhub?symbol=${symbol}&endpoint=quote`);
                            if (res.ok) {
                                const data = await res.json();
                                // Finnhub quote format: { c: current, h: high, l: low, o: open, pc: previous close, t: timestamp }
                                if (data && (data.c !== undefined || data.currentPrice !== undefined)) {
                                    return { 
                                        symbol, 
                                        data: {
                                            price: data.c || data.currentPrice || 0,
                                            changesPercentage: data.dp || ((data.c && data.pc) ? ((data.c - data.pc) / data.pc) * 100 : 0),
                                            change: data.d || (data.c && data.pc ? data.c - data.pc : 0),
                                            high: data.h || data.high || 0,
                                            low: data.l || data.low || 0,
                                            open: data.o || data.open || 0,
                                            previousClose: data.pc || data.previousClose || 0
                                        }
                                    };
                                }
                            }
                        } catch (err) {
                            console.warn(`Finnhub fallback failed for ${symbol}:`, err);
                        }
                        return null;
                    });
                    
                    const finnhubResults = await Promise.all(finnhubPromises);
                    finnhubResults.forEach(result => {
                        if (result && result.data) {
                            finnhubQuotes[result.symbol] = result.data;
                        }
                    });
                } catch (err) {
                    console.warn('Finnhub fallback error:', err);
                }
            }

            // Map data with enhanced fallback logic
            const mapped = uniqueSymbols.map(symbol => {
                const quote = quoteData[symbol] || finnhubQuotes[symbol] || {};
                const profile = profileData[symbol] || {};
                const ratios = ratiosData[symbol] || {};

                // Enhanced data extraction with multiple fallback sources
                const price = quote.price || quote.c || quote.pc || 0;
                const change = quote.changesPercentage || 
                              (quote.dp ? parseFloat(quote.dp) : 0) || 
                              (quote.c && quote.pc ? ((quote.c - quote.pc) / quote.pc) * 100 : 0) || 0;
                
                const marketCap = quote.marketCap || 
                                 profile.mktCap || 
                                 (ratios.marketCapTTM || ratios.marketCap) || 0;

                return {
                    symbol,
                    name: profile.companyName || 
                          quote.name || 
                          profile.name || 
                          symbol,
                    price: price,
                    change: change,
                    marketCap: marketCap,
                    // Valuation ratios
                    peRatio: ratios.priceEarningsRatioTTM || 
                            ratios.peRatioTTM || 
                            ratios.peRatio || 
                            (price && ratios.epsTTM ? price / ratios.epsTTM : 0),
                    priceToBook: ratios.priceToBookRatioTTM || 
                               ratios.priceToBookRatio || 
                               ratios.pbRatio || 0,
                    priceToSales: ratios.priceToSalesRatioTTM || 
                                ratios.priceToSalesRatio || 
                                ratios.psRatio || 0,
                    evToEbitda: ratios.enterpriseValueMultipleTTM || 
                              ratios.evToEbitda || 0,
                    // Profitability
                    roe: (ratios.returnOnEquityTTM || ratios.roe || 0) * 100,
                    roa: (ratios.returnOnAssetsTTM || ratios.roa || 0) * 100,
                    roic: (ratios.returnOnInvestedCapitalTTM || ratios.roic || 0) * 100,
                    netMargin: (ratios.netProfitMarginTTM || 
                               ratios.netProfitMargin || 
                               ratios.netMargin || 0) * 100,
                    grossMargin: (ratios.grossProfitMarginTTM || 
                                 ratios.grossProfitMargin || 
                                 ratios.grossMargin || 0) * 100,
                    operatingMargin: (ratios.operatingProfitMarginTTM || 
                                     ratios.operatingProfitMargin || 
                                     ratios.operatingMargin || 0) * 100,
                    // Financial health
                    debtToEquity: ratios.debtEquityRatio || 
                                ratios.debtToEquity || 
                                ratios.debtEquity || 0,
                    debtToAssets: ratios.debtRatio || 
                                ratios.debtToAssets || 0,
                    currentRatio: ratios.currentRatio || 0,
                    quickRatio: ratios.quickRatio || 0,
                    cashRatio: ratios.cashRatio || 0,
                    interestCoverage: ratios.interestCoverageTTM || 
                                    ratios.interestCoverage || 0,
                    // Growth
                    revenueGrowth: (ratios.revenueGrowthTTM || 
                                  ratios.revenueGrowth || 0) * 100,
                    earningsGrowth: (ratios.earningsGrowthTTM || 
                                    ratios.earningsGrowth || 0) * 100,
                    // Other metrics
                    dividendYield: (ratios.dividendYieldTTM || 
                                   ratios.dividendYield || 0) * 100,
                    payoutRatio: (ratios.payoutRatioTTM || 
                                 ratios.payoutRatio || 0) * 100,
                    beta: quote.beta || profile.beta || 0,
                    volume: quote.volume || quote.v || 0,
                    avgVolume: quote.avgVolume || quote.av || 0,
                    // Additional from profile
                    sector: profile.sector || 'N/A',
                    industry: profile.industry || 'N/A',
                    exchange: profile.exchange || quote.exchange || 'N/A'
                };
            });

            setComparisonData(mapped);
        } catch (error) {
            console.error('Error loading comparison data:', error);
            // Set empty data on error to prevent UI crash
            setComparisonData(symbols.map(s => ({
                symbol: s.toUpperCase(),
                name: s.toUpperCase(),
                price: 0,
                change: 0,
                marketCap: 0,
                peRatio: 0,
                priceToBook: 0,
                roe: 0,
                roa: 0,
                debtToEquity: 0,
                currentRatio: 0,
                quickRatio: 0,
                revenueGrowth: 0,
                netMargin: 0,
                dividendYield: 0,
                beta: 0
            })));
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (key, value) => {
        if (!value && value !== 0) return 'N/A';

        switch (key) {
            case 'marketCap':
                if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                return `$${value.toFixed(0)}`;
            case 'price':
                return `$${value.toFixed(2)}`;
            case 'change':
            case 'roe':
            case 'roa':
            case 'roic':
            case 'revenueGrowth':
            case 'earningsGrowth':
            case 'netMargin':
            case 'grossMargin':
            case 'operatingMargin':
            case 'dividendYield':
            case 'payoutRatio':
                return `${value.toFixed(2)}%`;
            case 'peRatio':
            case 'priceToBook':
            case 'priceToSales':
            case 'evToEbitda':
            case 'debtToEquity':
            case 'debtToAssets':
            case 'currentRatio':
            case 'quickRatio':
            case 'cashRatio':
            case 'interestCoverage':
            case 'beta':
                return value.toFixed(2);
            case 'volume':
            case 'avgVolume':
                if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
                if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
                return value.toLocaleString();
            default:
                return typeof value === 'number' ? value.toFixed(2) : value;
        }
    };

    const getMetricLabel = (key) => {
        const labels = {
            marketCap: 'Capitalisation',
            peRatio: 'P/E Ratio',
            priceToBook: 'P/B Ratio',
            priceToSales: 'P/S Ratio',
            evToEbitda: 'EV/EBITDA',
            roe: 'ROE',
            roa: 'ROA',
            roic: 'ROIC',
            debtToEquity: 'Dette/Capitaux',
            debtToAssets: 'Dette/Actifs',
            currentRatio: 'Ratio Courant',
            quickRatio: 'Ratio Rapide',
            cashRatio: 'Ratio Trésorerie',
            interestCoverage: 'Couverture Intérêts',
            revenueGrowth: 'Croissance Rev.',
            earningsGrowth: 'Croissance Bénéf.',
            netMargin: 'Marge Nette',
            grossMargin: 'Marge Brute',
            operatingMargin: 'Marge Opérationnelle',
            dividendYield: 'Rendement Div.',
            payoutRatio: 'Ratio Distribution',
            beta: 'Beta',
            volume: 'Volume',
            avgVolume: 'Volume Moyen',
            sector: 'Secteur',
            industry: 'Industrie',
            exchange: 'Bourse'
        };
        return labels[key] || key;
    };

    const getBestValue = (key, values) => {
        const higherIsBetter = [
            'roe', 'roa', 'roic', 'currentRatio', 'quickRatio', 'cashRatio', 
            'interestCoverage', 'revenueGrowth', 'earningsGrowth', 
            'netMargin', 'grossMargin', 'operatingMargin', 
            'dividendYield', 'marketCap', 'volume', 'avgVolume'
        ];
        const lowerIsBetter = [
            'peRatio', 'priceToBook', 'priceToSales', 'evToEbitda',
            'debtToEquity', 'debtToAssets', 'payoutRatio', 'beta'
        ];

        const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v !== 0);
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
                                <i className="iconoir-stats-report text-blue-400 text-xl"></i>
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
                        <i className="iconoir-xmark text-gray-400 text-xl"></i>
                    </button>
                </div>

                {/* Metrics Selector */}
                <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-300">Métriques à comparer</h3>
                        <div className="text-xs text-gray-500">
                            <i className="iconoir-info-circle mr-1"></i>
                            Données: FMP (principal) + Finnhub (fallback)
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'marketCap', label: 'Capitalisation', category: 'valuation' },
                            { key: 'peRatio', label: 'P/E', category: 'valuation' },
                            { key: 'priceToBook', label: 'P/B', category: 'valuation' },
                            { key: 'priceToSales', label: 'P/S', category: 'valuation' },
                            { key: 'evToEbitda', label: 'EV/EBITDA', category: 'valuation' },
                            { key: 'roe', label: 'ROE', category: 'profitability' },
                            { key: 'roa', label: 'ROA', category: 'profitability' },
                            { key: 'roic', label: 'ROIC', category: 'profitability' },
                            { key: 'netMargin', label: 'Marge Nette', category: 'profitability' },
                            { key: 'grossMargin', label: 'Marge Brute', category: 'profitability' },
                            { key: 'operatingMargin', label: 'Marge Op.', category: 'profitability' },
                            { key: 'debtToEquity', label: 'Dette/Capitaux', category: 'health' },
                            { key: 'currentRatio', label: 'Ratio Courant', category: 'health' },
                            { key: 'quickRatio', label: 'Ratio Rapide', category: 'health' },
                            { key: 'revenueGrowth', label: 'Croissance Rev.', category: 'growth' },
                            { key: 'earningsGrowth', label: 'Croissance Bénéf.', category: 'growth' },
                            { key: 'dividendYield', label: 'Rendement Div.', category: 'other' },
                            { key: 'beta', label: 'Beta', category: 'other' }
                        ].map(metric => (
                            <button
                                key={metric.key}
                                onClick={() => {
                                    if (selectedMetrics.includes(metric.key)) {
                                        setSelectedMetrics(selectedMetrics.filter(m => m !== metric.key));
                                    } else {
                                        setSelectedMetrics([...selectedMetrics, metric.key]);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    selectedMetrics.includes(metric.key)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {comparisonData.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Aucune donnée disponible</p>
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900 sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="text-left p-4 text-gray-400 font-medium">Métrique</th>
                                    {comparisonData.map((stock, idx) => (
                                        <th key={idx} className="text-center p-4 min-w-[180px]">
                                            <div className="text-white font-bold text-lg">{stock.symbol}</div>
                                            <div className="text-gray-400 text-xs truncate" title={stock.name}>
                                                {stock.name}
                                            </div>
                                            <div className="text-white font-mono mt-1 text-lg">
                                                ${stock.price > 0 ? stock.price.toFixed(2) : 'N/A'}
                                            </div>
                                            <div className={`text-sm font-medium mt-1 ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {stock.change !== 0 ? (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2) + '%' : '0.00%'}
                                            </div>
                                            {stock.sector && stock.sector !== 'N/A' && (
                                                <div className="text-xs text-gray-500 mt-1">{stock.sector}</div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedMetrics.map((metric, idx) => {
                                    const values = comparisonData.map(stock => stock[metric]);
                                    const bestValue = getBestValue(metric, values);

                                    return (
                                        <tr key={idx} className="border-t border-gray-700/50 hover:bg-gray-800/50 odd:bg-transparent even:bg-gray-800/20 transition-colors">
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
                    )}

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
