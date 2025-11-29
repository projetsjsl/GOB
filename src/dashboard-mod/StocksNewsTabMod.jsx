import React, { useState } from 'react';

// Minimal module version of StocksNewsTab using globals for data/handlers; this is a pilot stub.
const StocksNewsTabMod = () => {
    const dashboard = window.BetaCombinedDashboard || {};
    const isDarkMode = dashboard.isDarkMode ?? true;
    const tickers = dashboard.tickers ?? [];
    const stockData = dashboard.stockData ?? {};
    const newsData = dashboard.newsData ?? [];

    const [viewMode] = useState('list');

    if (tickers.length === 0) {
        return (
            <div className={`p-4 rounded border ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                Aucun ticker chargé.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Stocks & News (mod)</h2>
            <div className="space-y-2">
                {tickers.slice(0, 5).map((t) => {
                    const price = stockData[t]?.c ?? 'N/A';
                    const news = newsData.find(n => (n.title || '').toLowerCase().includes((t || '').toLowerCase()));
                    return (
                        <div key={t} className={`p-3 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                            <div className="flex justify-between">
                                <span className="font-mono font-bold">{t}</span>
                                <span className="text-sm">{price}</span>
                            </div>
                            {news && (
                                <div className="text-sm mt-2 opacity-80">
                                    {(news.title || '').slice(0, 100)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="text-xs opacity-60">Mode: {viewMode}</div>
        </div>
    );
};

export { StocksNewsTabMod };
