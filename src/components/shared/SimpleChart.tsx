import React from 'react';

declare const Chart: any;

                const SimpleChart = ({ data, type = 'line', width = 300, height = 200 }) => {
                    const chartRef = useRef(null);
                    
                    useEffect(() => {
                        if (chartRef.current && typeof Chart !== 'undefined') {
                            const ctx = chartRef.current.getContext('2d');
                            new Chart(ctx, {
                                type: type,
                                data: data,
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    }
                                }
                            });
                        }
                    }, [data, type]);
                    
                    return (
                        <div className="w-full h-full">
                            <canvas ref={chartRef} width={width} height={height}></canvas>
                        </div>
                    );
                };

                // Référence locale pour utiliser le composant global
                const LucideIcon = window.LucideIcon;

                return (
                    <div className={`min-h-screen p-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'
                    }`}>
                        {/* Screener */}
                        {showScreener && (
                            <div className={`mb-2 border rounded-lg p-3 transition-colors duration-300 ${
                                isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <LucideIcon name="Filter" className="w-4 h-4 text-blue-500" />
                                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            🔍 Screener de Titres
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowScreener(false)}
                                        className={`p-1 rounded ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}
                                    >
                                        <LucideIcon name="X" className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                                
                                {/* Filtres */}
                                <div className="grid grid-cols-5 gap-2 mb-3">
                                    <div>
                                        <label className="text-[9px] text-gray-500 mb-1 block">Market Cap Min (B$)</label>
                                        <input
                                            type="number"
                                            value={screenerFilters.minMarketCap / 1e9}
                                            onChange={(e) => setScreenerFilters({...screenerFilters, minMarketCap: parseFloat(e.target.value || 0) * 1e9})}
                                            className={`w-full px-2 py-1 text-xs rounded border ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 mb-1 block">P/E Max</label>
                                        <input
                                            type="number"
                                            value={screenerFilters.maxPE}
                                            onChange={(e) => setScreenerFilters({...screenerFilters, maxPE: parseFloat(e.target.value || 50)})}
                                            className={`w-full px-2 py-1 text-xs rounded border ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 mb-1 block">ROE Min (%)</label>
                                        <input
                                            type="number"
                                            value={screenerFilters.minROE}
                                            onChange={(e) => setScreenerFilters({...screenerFilters, minROE: parseFloat(e.target.value || 0)})}
                                            className={`w-full px-2 py-1 text-xs rounded border ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 mb-1 block">D/E Max</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={screenerFilters.maxDebtEquity}
                                            onChange={(e) => setScreenerFilters({...screenerFilters, maxDebtEquity: parseFloat(e.target.value || 2)})}
                                            className={`w-full px-2 py-1 text-xs rounded border ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 mb-1 block">Secteur</label>
                                        <select
                                            value={screenerFilters.sector}
                                            onChange={(e) => setScreenerFilters({...screenerFilters, sector: e.target.value})}
                                            className={`w-full px-2 py-1 text-xs rounded border ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 text-white' 
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        >
                                            <option value="all">Tous</option>
                                            <option value="Technology">Technologie</option>
                                            <option value="Consumer Cyclical">Consommation</option>
                                            <option value="Healthcare">Santé</option>
                                            <option value="Financial">Finance</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => runScreenerForStocks(stocks)}
                                    disabled={loadingScreener}
                                    className={`w-full py-2 rounded text-sm font-semibold transition-colors ${
                                        loadingScreener
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                                    }`}
                                >
                                    {loadingScreener ? '⏳ Analyse en cours...' : '🔍 Lancer le Screener'}
                                </button>
                                
                                {/* Résultats */}
                                {screenerResults.length > 0 && (
                                    <div className="mt-3">
                                        <div className="text-xs text-gray-500 mb-2">
                                            {screenerResults.length} titre(s) trouvé(s)
                                        </div>
                                        <div className={`max-h-64 overflow-y-auto border rounded ${
                                            isDarkMode ? 'border-neutral-700' : 'border-gray-300'
                                        }`}>
                                            <table className="w-full text-xs">
                                                <thead className={`sticky top-0 ${isDarkMode ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                                                    <tr>
                                                        <th className="text-left p-2 text-gray-500">Symbole</th>
                                                        <th className="text-right p-2 text-gray-500">Prix</th>
                                                        <th className="text-right p-2 text-gray-500">Var %</th>
                                                        <th className="text-right p-2 text-gray-500">Cap.</th>
                                                        <th className="text-right p-2 text-gray-500">P/E</th>
                                                        <th className="text-right p-2 text-gray-500">ROE</th>
                                                        <th className="text-right p-2 text-gray-500">D/E</th>
                                                        <th className="text-center p-2 text-gray-500">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {screenerResults.map((stock) => (
                                                        <tr key={stock.symbol} className={`border-t ${
                                                            isDarkMode ? 'border-neutral-700 hover:bg-neutral-800' : 'border-gray-200 hover:bg-gray-50'
                                                        }`}>
                                                            <td className="p-2">
                                                                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.symbol}</div>
                                                                <div className="text-[9px] text-gray-500">{stock.name}</div>
                                                            </td>
                                                            <td className={`text-right p-2 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                ${stock.price.toFixed(2)}
                                                            </td>
                                                            <td className={`text-right p-2 font-semibold ${
                                                                stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                                                            }`}>
                                                                {(() => {
                                                                    const change = stock.change;
                                                                    if (!change) return '0.00%';
                                                                    const value = typeof change === 'number' ? change : 
                                                                                 typeof change === 'object' ? (change.raw || change.fmt || 0) : 
                                                                                 parseFloat(change) || 0;
                                                                    return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
                                                                })()}
                                                            </td>
                                                            <td className="text-right p-2 text-gray-400">
                                                                {formatNumber(stock.marketCap)}
                                                            </td>
                                                            <td className={`text-right p-2 font-semibold ${getMetricColor('PE', stock.pe)}`}>
                                                                {stock.pe ? stock.pe.toFixed(1) : 'N/A'}
                                                            </td>
                                                            <td className={`text-right p-2 font-semibold ${getMetricColor('ROE', stock.roe ? stock.roe * 100 : null)}`}>
                                                                {stock.roe ? (stock.roe * 100).toFixed(1) + '%' : 'N/A'}
                                                            </td>
                                                            <td className={`text-right p-2 font-semibold ${getMetricColor('DE', stock.debtEquity)}`}>
                                                                {stock.debtEquity ? stock.debtEquity.toFixed(2) : 'N/A'}

export default SimpleChart;
