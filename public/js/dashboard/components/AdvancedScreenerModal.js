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
        try {
            // Get list of stocks to screen (you would typically have a predefined list)
            const stocksToScreen = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT'];

            const screenResults = await Promise.all(
                stocksToScreen.map(async (symbol) => {
                    try {
                        const [metricsRes, ratiosRes, quoteRes] = await Promise.all([
                            window.StockAnalysisAPI.fetchKeyMetrics(symbol, 1),
                            window.StockAnalysisAPI.fetchFinancialRatios(symbol, 1),
                            fetch(`${window.location.origin}/api/fmp?endpoint=quote&symbol=${symbol}`)
                                .then(r => r.json())
                        ]);

                        const metrics = Array.isArray(metricsRes?.data) ? metricsRes.data : (Array.isArray(metricsRes) ? metricsRes : []);
                        const ratios = Array.isArray(ratiosRes?.data) ? ratiosRes.data : (Array.isArray(ratiosRes) ? ratiosRes : []);
                        const quoteArray = Array.isArray(quoteRes?.data) ? quoteRes.data : (Array.isArray(quoteRes) ? quoteRes : []);
                        const quote = quoteArray[0] || {};

                        const data = {
                            symbol,
                            name: quote.name || quote.companyName || symbol,
                            price: quote.price || quote.c || 0,
                            marketCap: metrics[0]?.marketCap || 0,
                            peRatio: metrics[0]?.peRatio || 0,
                            priceToBook: metrics[0]?.priceToBookRatio || 0,
                            roe: (ratios[0]?.returnOnEquityTTM || 0) * 100,
                            debtToEquity: ratios[0]?.debtEquityRatio || 0,
                            dividendYield: (metrics[0]?.dividendYieldTTM || 0) * 100,
                            revenueGrowth: (metrics[0]?.revenueGrowth || 0) * 100,
                            sector: quote.sector || 'Unknown'
                        };

                        // Apply filters
                        if (data.marketCap < filters.marketCapMin || data.marketCap > filters.marketCapMax) return null;
                        if (data.peRatio < filters.peRatioMin || data.peRatio > filters.peRatioMax) return null;
                        if (data.roe < filters.roeMin) return null;
                        if (data.dividendYield < filters.dividendYieldMin) return null;
                        if (data.debtToEquity > filters.debtToEquityMax) return null;
                        if (data.revenueGrowth < filters.revenueGrowthMin) return null;
                        if (filters.sector !== 'all' && data.sector !== filters.sector) return null;

                        return data;
                    } catch (error) {
                        console.error(`Error screening ${symbol}:`, error);
                        return null;
                    }
                })
            );

            setResults(screenResults.filter(r => r !== null));
        } catch (error) {
            console.error('Screening error:', error);
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
                                <Icon name="filter" className="w-5 h-5 text-emerald-400" />
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
                        <Icon name="xmark" className="w-5 h-5 text-gray-400" />
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
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Analyse en cours...' : <><Icon name="search" className="w-5 h-5" /> Lancer le Screening</>}
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
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icon name="floppy-disk" className="w-4 h-4" /> Sauvegarder
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
                                                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 rounded transition-colors flex items-center justify-center"
                                            >
                                                <Icon name="trash" className="w-4 h-4" />
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

                            {results.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Icon name="search" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                    <p>Aucun résultat. Lancez un screening pour voir les titres correspondants.</p>
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
                                                    <div className="text-white font-mono text-lg">${stock.price.toFixed(2)}</div>
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
