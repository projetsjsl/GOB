/**
 * Advanced Stock Screener Modal
 * Multi-criteria filtering with saved presets
 */

const { useState, useEffect } = React;

const AdvancedScreenerModal = ({ onClose, onSelectStock }) => {
    const [filters, setFilters] = useState({
        marketCapMin: 0,
        marketCapMax: 1000000000000,
        peRatioMin: 0,
        peRatioMax: 100,
        roeMin: 0,
        dividendYieldMin: 0,
        debtToEquityMax: 5,
        revenueGrowthMin: -50,
        sector: 'all',
        country: 'all'
    });

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedPresets, setSavedPresets] = useState([]);
    const [presetName, setPresetName] = useState('');

    const sectors = [
        'all', 'Technology', 'Healthcare', 'Financial Services',
        'Consumer Cyclical', 'Industrials', 'Energy', 'Real Estate',
        'Consumer Defensive', 'Utilities', 'Communication Services'
    ];

    const presetFilters = {
        'Value Stocks': {
            peRatioMax: 15,
            priceToBookMax: 1.5,
            dividendYieldMin: 2,
            debtToEquityMax: 1
        },
        'Growth Stocks': {
            revenueGrowthMin: 15,
            roeMin: 15,
            peRatioMin: 20
        },
        'Dividend Aristocrats': {
            dividendYieldMin: 3,
            debtToEquityMax: 1.5,
            roeMin: 10
        },
        'Small Cap Growth': {
            marketCapMax: 2000000000,
            revenueGrowthMin: 20,
            roeMin: 15
        },
        'Blue Chips': {
            marketCapMin: 10000000000,
            roeMin: 12,
            debtToEquityMax: 2
        }
    };

    useEffect(() => {
        loadSavedPresets();
    }, []);

    const loadSavedPresets = () => {
        const saved = localStorage.getItem('screenPresets');
        if (saved) {
            setSavedPresets(JSON.parse(saved));
        }
    };

    const savePreset = () => {
        if (!presetName.trim()) return;

        const newPreset = {
            name: presetName,
            filters: { ...filters },
            date: new Date().toISOString()
        };

        const updated = [...savedPresets, newPreset];
        setSavedPresets(updated);
        localStorage.setItem('screenPresets', JSON.stringify(updated));
        setPresetName('');
    };

    const loadPreset = (preset) => {
        setFilters(preset.filters);
    };

    const deletePreset = (index) => {
        const updated = savedPresets.filter((_, i) => i !== index);
        setSavedPresets(updated);
        localStorage.setItem('screenPresets', JSON.stringify(updated));
    };

    const runScreen = async () => {
        setLoading(true);
        setResults([]);
        
        try {
            const API_BASE_URL = window.location.origin || '';
            let stocksToScreen = [];

            // Step 1: Get list of stocks from FMP stock screener based on filters
            try {
                // Build FMP screener URL with basic filters
                const screenerParams = {
                    endpoint: 'stock-screener',
                    marketCapMoreThan: Math.floor(filters.marketCapMin).toString(),
                    limit: '100' // Get up to 100 stocks to screen
                };

                // Add market cap max if specified
                if (filters.marketCapMax < 1000000000000) {
                    screenerParams.marketCapLowerThan = Math.floor(filters.marketCapMax).toString();
                }

                // Add sector filter if specified
                if (filters.sector !== 'all') {
                    screenerParams.sector = filters.sector;
                }

                const queryString = new URLSearchParams(screenerParams).toString();
                const screenerUrl = `${API_BASE_URL}/api/fmp?${queryString}`;
                const screenerRes = await fetch(screenerUrl);

                if (screenerRes.ok) {
                    const screenerData = await screenerRes.json();
                    const stocks = Array.isArray(screenerData?.data) ? screenerData.data : 
                                  Array.isArray(screenerData) ? screenerData : [];
                    
                    // Extract symbols from screener results
                    stocksToScreen = stocks.slice(0, 50).map(s => s.symbol || s.ticker).filter(Boolean);
                    console.log(`📊 FMP Screener: ${stocksToScreen.length} stocks found`);
                }
            } catch (screenerError) {
                console.warn('FMP screener failed, using default list:', screenerError);
            }

            // Fallback: Use a comprehensive list of major stocks if screener fails
            if (stocksToScreen.length === 0) {
                stocksToScreen = [
                    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
                    'JNJ', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'BAC', 'XOM', 'CVX', 'ABBV',
                    'PFE', 'KO', 'PEP', 'TMO', 'COST', 'AVGO', 'MRK', 'ABT', 'ACN', 'CSCO',
                    'ADBE', 'NFLX', 'CMCSA', 'TXN', 'NKE', 'PM', 'LIN', 'QCOM', 'INTU', 'HON',
                    'AMGN', 'RTX', 'LOW', 'UPS', 'SBUX', 'DE', 'CAT', 'GS', 'MS', 'BLK'
                ];
            }

            // Step 2: Fetch data for all stocks using batch API
            console.log(`🔍 Screening ${stocksToScreen.length} stocks...`);
            
            // Split into batches of 10 to avoid API limits
            const BATCH_SIZE = 10;
            const batches = [];
            for (let i = 0; i < stocksToScreen.length; i += BATCH_SIZE) {
                batches.push(stocksToScreen.slice(i, i + BATCH_SIZE));
            }

            const allResults = [];
            
            for (const batch of batches) {
                try {
                    // Fetch batch data from marketdata API
                    const batchRes = await fetch(
                        `${API_BASE_URL}/api/marketdata/batch?symbols=${batch.join(',')}&endpoints=quote,profile,ratios`
                    );

                    if (batchRes.ok) {
                        const batchData = await batchRes.json();
                        const quoteData = batchData?.data?.quote || {};
                        const profileData = batchData?.data?.profile || {};
                        const ratiosData = batchData?.data?.ratios || {};

                        // Process each stock in the batch
                        for (const symbol of batch) {
                            try {
                                const quote = quoteData[symbol] || {};
                                const profile = profileData[symbol] || {};
                                const ratios = ratiosData[symbol] || {};

                                // Extract metrics
                                const marketCap = quote.marketCap || 
                                                profile.mktCap || 
                                                (ratios.marketCapTTM || ratios.marketCap) || 0;
                                
                                const peRatio = ratios.priceEarningsRatioTTM || 
                                               ratios.peRatioTTM || 
                                               ratios.peRatio || 0;
                                
                                const roe = (ratios.returnOnEquityTTM || ratios.roe || 0) * 100;
                                const debtToEquity = ratios.debtEquityRatio || 
                                                   ratios.debtToEquity || 
                                                   ratios.debtEquity || 0;
                                
                                const dividendYield = (ratios.dividendYieldTTM || 
                                                      ratios.dividendYield || 0) * 100;
                                
                                const revenueGrowth = (ratios.revenueGrowthTTM || 
                                                      ratios.revenueGrowth || 0) * 100;

                                const data = {
                                    symbol: symbol.toUpperCase(),
                                    name: profile.companyName || 
                                         quote.name || 
                                         quote.companyName || 
                                         symbol,
                                    price: quote.price || quote.c || 0,
                                    change: quote.changesPercentage || 
                                           (quote.dp ? parseFloat(quote.dp) : 0) || 0,
                                    marketCap: marketCap,
                                    peRatio: peRatio,
                                    priceToBook: ratios.priceToBookRatioTTM || 
                                               ratios.priceToBookRatio || 0,
                                    roe: roe,
                                    debtToEquity: debtToEquity,
                                    dividendYield: dividendYield,
                                    revenueGrowth: revenueGrowth,
                                    sector: profile.sector || quote.sector || 'Unknown'
                                };

                                // Apply filters
                                if (data.marketCap < filters.marketCapMin || data.marketCap > filters.marketCapMax) continue;
                                if (data.peRatio < filters.peRatioMin || data.peRatio > filters.peRatioMax) continue;
                                if (data.roe < filters.roeMin) continue;
                                if (data.dividendYield < filters.dividendYieldMin) continue;
                                if (data.debtToEquity > filters.debtToEquityMax) continue;
                                if (data.revenueGrowth < filters.revenueGrowthMin) continue;
                                if (filters.sector !== 'all' && data.sector !== filters.sector) continue;

                                allResults.push(data);
                            } catch (stockError) {
                                console.error(`Error processing ${symbol}:`, stockError);
                            }
                        }
                    }
                } catch (batchError) {
                    console.error('Batch fetch error:', batchError);
                }

                // Small delay between batches to respect rate limits
                if (batches.indexOf(batch) < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // Sort results by market cap (largest first)
            allResults.sort((a, b) => b.marketCap - a.marketCap);
            
            setResults(allResults);
            console.log(`✅ Screening complete: ${allResults.length} stocks match criteria`);
            
        } catch (error) {
            console.error('Screening error:', error);
            setError('Erreur lors du screening. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: parseFloat(value) || value }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-7xl w-full border border-gray-700 shadow-2xl my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-emerald-900/30 to-blue-900/30">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <i className="iconoir-filter text-emerald-400 text-xl"></i>
                            </span>
                            Screener Avancé
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Filtrez les titres selon vos critères
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-xmark text-gray-400 text-xl"></i>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Filters Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">Filtres</h3>

                            {/* Market Cap */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">Capitalisation Boursière</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Min (M$)"
                                            value={filters.marketCapMin / 1000000}
                                            onChange={(e) => updateFilter('marketCapMin', e.target.value * 1000000)}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Max (M$)"
                                            value={filters.marketCapMax / 1000000}
                                            onChange={(e) => updateFilter('marketCapMax', e.target.value * 1000000)}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* P/E Ratio */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">P/E Ratio</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.peRatioMin}
                                        onChange={(e) => updateFilter('peRatioMin', e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.peRatioMax}
                                        onChange={(e) => updateFilter('peRatioMax', e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* ROE */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">ROE Minimum (%)</label>
                                <input
                                    type="number"
                                    value={filters.roeMin}
                                    onChange={(e) => updateFilter('roeMin', e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Dividend Yield */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">Rendement Dividende Min (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={filters.dividendYieldMin}
                                    onChange={(e) => updateFilter('dividendYieldMin', e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Debt to Equity */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">Dette/Capitaux Max</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={filters.debtToEquityMax}
                                    onChange={(e) => updateFilter('debtToEquityMax', e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Revenue Growth */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">Croissance Rev. Min (%)</label>
                                <input
                                    type="number"
                                    value={filters.revenueGrowthMin}
                                    onChange={(e) => updateFilter('revenueGrowthMin', e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Sector */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">Secteur</label>
                                <select
                                    value={filters.sector}
                                    onChange={(e) => updateFilter('sector', e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                                >
                                    {sectors.map(sector => (
                                        <option key={sector} value={sector}>
                                            {sector === 'all' ? 'Tous les secteurs' : sector}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={runScreen}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Analyse en cours...' : '🔍 Lancer le Screening'}
                            </button>
                        </div>

                        {/* Presets */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">Préréglages</h3>

                            {/* Quick Presets */}
                            <div className="space-y-2 mb-4">
                                {Object.entries(presetFilters).map(([name, preset]) => (
                                    <button
                                        key={name}
                                        onClick={() => setFilters({ ...filters, ...preset })}
                                        className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>

                            {/* Save Custom Preset */}
                            <div className="border-t border-gray-700 pt-4">
                                <input
                                    type="text"
                                    placeholder="Nom du préréglage"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm mb-2"
                                />
                                <button
                                    onClick={savePreset}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm transition-colors"
                                >
                                    💾 Sauvegarder
                                </button>
                            </div>

                            {/* Saved Presets */}
                            {savedPresets.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="text-xs text-gray-400 mb-2">Mes préréglages:</div>
                                    {savedPresets.map((preset, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <button
                                                onClick={() => loadPreset(preset)}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm transition-colors"
                                            >
                                                {preset.name}
                                            </button>
                                            <button
                                                onClick={() => deletePreset(idx)}
                                                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 rounded transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">
                                Résultats ({results.length} titres)
                            </h3>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400">Analyse en cours...</p>
                                    <p className="text-gray-500 text-sm mt-2">Récupération des données depuis FMP</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12 text-red-400">
                                    <i className="iconoir-warning-triangle text-6xl mb-4 block"></i>
                                    <p>{error}</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="iconoir-search text-6xl mb-4 block"></i>
                                    <p>Aucun résultat. Lancez un screening pour voir les titres correspondants.</p>
                                    <p className="text-sm text-gray-500 mt-2">Essayez d'ajuster vos filtres pour obtenir plus de résultats.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {results.map((stock, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                                            className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-4 cursor-pointer transition-all border border-gray-700 hover:border-emerald-500"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-white font-bold text-lg">{stock.symbol}</div>
                                                    <div className="text-gray-400 text-sm">{stock.name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-white font-mono text-lg">
                                                        ${stock.price > 0 ? stock.price.toFixed(2) : 'N/A'}
                                                    </div>
                                                    <div className={`text-xs font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {stock.change !== 0 ? (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2) + '%' : '0.00%'}
                                                    </div>
                                                    <div className="text-gray-400 text-xs">{stock.sector}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 mt-3">
                                                <div className="bg-gray-900/50 rounded p-2 text-center">
                                                    <div className="text-xs text-gray-400">P/E</div>
                                                    <div className="text-white font-mono text-sm">{stock.peRatio.toFixed(1)}</div>
                                                </div>
                                                <div className="bg-gray-900/50 rounded p-2 text-center">
                                                    <div className="text-xs text-gray-400">ROE</div>
                                                    <div className="text-green-400 font-mono text-sm">{stock.roe.toFixed(1)}%</div>
                                                </div>
                                                <div className="bg-gray-900/50 rounded p-2 text-center">
                                                    <div className="text-xs text-gray-400">Div</div>
                                                    <div className="text-blue-400 font-mono text-sm">{stock.dividendYield.toFixed(1)}%</div>
                                                </div>
                                                <div className="bg-gray-900/50 rounded p-2 text-center">
                                                    <div className="text-xs text-gray-400">D/E</div>
                                                    <div className="text-white font-mono text-sm">{stock.debtToEquity.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.AdvancedScreenerModal = AdvancedScreenerModal;
