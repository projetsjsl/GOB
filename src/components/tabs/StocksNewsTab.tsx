import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

// Déclarations pour bibliothèques CDN
declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

            const StocksNewsTab = () => {
                const [stocksViewMode, setStocksViewMode] = useState('list'); // list par défaut (3 vues: list, cards, table)
                const [expandedStock, setExpandedStock] = useState(null);

                const renderMarketBadge = (type) => {
                    const isBull = type === 'bull';
                    return (
                        <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-semibold shadow-inner border ${
                                isBull
                                    ? isDarkMode
                                        ? 'bg-lime-900/70 border-lime-500/40 text-lime-300'
                                        : 'bg-lime-100 border-lime-400 text-lime-700'
                                    : isDarkMode
                                        ? 'bg-rose-900/70 border-rose-500/40 text-rose-200'
                                        : 'bg-rose-100 border-rose-300 text-rose-700'
                            }`}
                        >
                            {isBull ? '🐂' : '🐻'}
                        </span>
                    );
                };

                // Helper functions for news credibility scoring (définies dans le composant)
                const getNewsCredibilityScore = (sourceName) => {
                    if (!sourceName) return 50;

                    const source = sourceName.toLowerCase();

                    // Premium sources (90-100)
                    const premiumSources = ['bloomberg', 'reuters', 'wall street journal', 'wsj', 'financial times', 'ft'];
                    if (premiumSources.some(s => source.includes(s))) return 95;

                    // High credibility (75-89)
                    const highSources = ['cnbc', 'marketwatch', 'barron', 'seeking alpha', 'yahoo finance', 'morningstar', 'the economist'];
                    if (highSources.some(s => source.includes(s))) return 82;

                    // Medium credibility (50-74)
                    const mediumSources = ['forbes', 'benzinga', 'investor', 'zacks', 'motley fool', 'nasdaq', 'business insider'];
                    if (mediumSources.some(s => source.includes(s))) return 65;

                    // Low credibility (below 50)
                    return 40;
                };

                const getCredibilityTier = (score) => {
                    if (score >= 90) return 'premium';
                    if (score >= 75) return 'high';
                    if (score >= 50) return 'medium';
                    return 'low';
                };

                // Fonction pour formater les nombres
                const formatNumber = (num) => {
                    if (!num && num !== 0) return 'N/A';
                    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
                    return num.toLocaleString('fr-FR');
                };

                // Mapping des noms de compagnies pour affichage
                const companyNames = {
                    AAPL: 'Apple Inc.',
                    TSLA: 'Tesla Inc.',
                    GOOGL: 'Alphabet Inc.',
                    GOOG: 'Alphabet Inc.',
                    MSFT: 'Microsoft Corporation',
                    NVDA: 'NVIDIA Corporation',
                    AMZN: 'Amazon.com Inc.',
                    META: 'Meta Platforms Inc.',
                    NFLX: 'Netflix Inc.',
                    AMD: 'Advanced Micro Devices Inc.',
                    INTC: 'Intel Corporation',
                    CRM: 'Salesforce Inc.',
                    ORCL: 'Oracle Corporation',
                    CSCO: 'Cisco Systems Inc.',
                    ADBE: 'Adobe Inc.',
                    PYPL: 'PayPal Holdings Inc.',
                    DIS: 'The Walt Disney Company',
                    BA: 'The Boeing Company',
                    GE: 'General Electric Company',
                    JPM: 'JPMorgan Chase & Co.',
                    BAC: 'Bank of America Corporation',
                    WMT: 'Walmart Inc.',
                    HD: 'The Home Depot Inc.',
                    PG: 'Procter & Gamble Company',
                    JNJ: 'Johnson & Johnson',
                    V: 'Visa Inc.',
                    MA: 'Mastercard Incorporated',
                    UNH: 'UnitedHealth Group Inc.',
                    PFE: 'Pfizer Inc.',
                    MRK: 'Merck & Co. Inc.'
                };

                return (
                <div className="space-y-6">
                    {/* Message d'état si pas de données */}
                    {tickers.length === 0 && (
                        <div className={`p-6 rounded-xl border-2 transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gray-800 border-yellow-500/30'
                                : 'bg-yellow-50 border-yellow-200'
                        }`}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">⏳</span>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Chargement des données...
                                </h3>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Les titres et nouvelles sont en cours de chargement. Veuillez patienter quelques instants.
                            </p>
                            <button
                                onClick={async () => {
                                    await loadTickersFromSupabase();
                                    await fetchNews();
                                }}
                                className={`mt-4 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    isDarkMode
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                🔄 Forcer le chargement
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>📊 Titres & nouvelles</h2>
                        <div className="flex gap-2">
                            {/* Toggle Vue */}
                            <div className={`flex gap-1 p-1 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                            }`}>
                                <button
                                    onClick={() => setStocksViewMode('list')}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                                        stocksViewMode === 'list'
                                            ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                            : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                                    }`}
                                >
                                    📋 Liste
                                </button>
                                <button
                                    onClick={() => setStocksViewMode('cards')}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                                        stocksViewMode === 'cards'
                                            ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                            : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                                    }`}
                                >
                                    🎴 Cartes
                                </button>
                                <button
                                    onClick={() => setStocksViewMode('table')}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                                        stocksViewMode === 'table'
                                            ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                            : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                                    }`}
                                >
                                    📊 Tableau
                                </button>
                            </div>
                            <button
                                onClick={async () => {
                                    await refreshAllStocks();
                                    await fetchNews();
                                    await fetchLatestNewsForTickers();
                                }}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 ${
                                    isDarkMode
                                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                            >
                                {loading ? '⏳ Actualisation...' : '🔄 Actualiser'}
                            </button>
                        </div>
                    </div>

                    {lastUpdate && (
                        <p className="text-gray-400 text-sm">
                            Dernière mise à jour: {new Date(lastUpdate).toLocaleString('fr-FR')}
                        </p>
                    )}

                    {/* TOP MOVERS - Vue rapide */}
                    {tickers.length > 0 && (
                        <div className={`mt-6 p-6 rounded-xl transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                        }`}>
                            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <LucideIcon name="Fire" className="w-6 h-6 text-orange-500" />
                                Top Movers du Jour
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Top Gainers */}
                                <div className={`p-3 sm:p-4 rounded-lg ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                                    <h4 className={`text-base sm:text-sm font-bold mb-3 sm:mb-3 flex items-center gap-3 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                        <LucideIcon name="TrendingUp" className="w-5 h-5" />
                                        {renderMarketBadge('bull')}
                                        Top Gainers
                                    </h4>
                                    <div className="space-y-2.5 sm:space-y-2">
                                        {tickers
                                            .map(ticker => ({
                                                ticker,
                                                change: stockData[ticker]?.dp || 0,
                                                price: stockData[ticker]?.c || 0
                                            }))
                                            .filter(item => item.change > 0)
                                            .sort((a, b) => b.change - a.change)
                                            .slice(0, 5)
                                            .map((item, idx) => (
                                                <div
                                                    key={item.ticker}
                                                    className={`flex items-start justify-between p-2 sm:p-2 rounded cursor-pointer transition-all hover:scale-[1.02] ${
                                                        isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-100'
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedStock(item.ticker);
                                                        setActiveTab('intellistocks');
                                                    }}
                                                >
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                                                isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                                {idx + 1}
                                                            </div>
                                                            <img
                                                                src={getCompanyLogo(item.ticker)}
                                                                alt={item.ticker}
                                                                className="w-6 h-6 rounded flex-shrink-0"
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                            <span className={`font-mono font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} flex-shrink-0`}>
                                                                {item.ticker}
                                                            </span>
                                                            <div className="text-green-500 font-bold text-sm ml-auto flex-shrink-0">
                                                                +{item.change.toFixed(2)}% ↑
                                                            </div>
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0`}>
                                                                ${item.price.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Espace dédié pour les news avec placeholder */}
                                                        <div className={`mt-1 ml-8 min-h-[20px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {(() => {
                                                                const reason = extractMoveReason(item.ticker, item.change);
                                                                if (reason && reason !== '') {
                                                                    return (
                                                                        <div className={`text-xs flex items-start gap-2 leading-relaxed ${
                                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                        }`}>
                                                                            {tickerMoveReasons[item.ticker]?.source === 'Finviz AI' ? (
                                                                                <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                                        AI
                                                                                    </span>
                                                                                    <span className="leading-relaxed break-words">{reason}</span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-start gap-1.5">
                                                                                    <span className="text-blue-400 flex-shrink-0 text-sm">📰</span>
                                                                                    <span className="leading-relaxed break-words">{reason}</span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        Chargement des explications...
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Top Losers */}
                                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                                    <h4 className={`text-sm font-bold mb-3 flex items-center gap-3 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                                        <LucideIcon name="TrendingDown" className="w-5 h-5" />
                                        {renderMarketBadge('bear')}
                                        Top Losers
                                    </h4>
                                    <div className="space-y-2">
                                        {tickers
                                            .map(ticker => ({
                                                ticker,
                                                change: stockData[ticker]?.dp || 0,
                                                price: stockData[ticker]?.c || 0
                                            }))
                                            .filter(item => item.change < 0)
                                            .sort((a, b) => a.change - b.change)
                                            .slice(0, 5)
                                            .map((item, idx) => (
                                                <div
                                                    key={item.ticker}
                                                    className={`flex items-start justify-between p-2 rounded cursor-pointer transition-all hover:scale-[1.02] ${
                                                        isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedStock(item.ticker);
                                                        setActiveTab('intellistocks');
                                                    }}
                                                >
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                                                isDarkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {idx + 1}
                                                            </div>
                                                            <img
                                                                src={getCompanyLogo(item.ticker)}
                                                                alt={item.ticker}
                                                                className="w-6 h-6 rounded flex-shrink-0"
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                            <span className={`font-mono font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} flex-shrink-0`}>
                                                                {item.ticker}
                                                            </span>
                                                            <div className="text-red-500 font-bold text-sm ml-auto flex-shrink-0">
                                                                {item.change.toFixed(2)}% ↓
                                                            </div>
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0`}>
                                                                ${item.price.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Espace dédié pour les news avec placeholder */}
                                                        <div className={`mt-1 ml-8 min-h-[20px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {(() => {
                                                                const reason = extractMoveReason(item.ticker, item.change);
                                                                if (reason && reason !== '') {
                                                                    return (
                                                                        <div className={`text-xs flex items-start gap-2 leading-relaxed ${
                                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                        }`}>
                                                                            {tickerMoveReasons[item.ticker]?.source === 'Finviz AI' ? (
                                                                                <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                                        AI
                                                                                    </span>
                                                                                    <span className="leading-relaxed break-words">{reason}</span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-start gap-1.5">
                                                                                    <span className="text-blue-400 flex-shrink-0 text-sm">📰</span>
                                                                                    <span className="leading-relaxed break-words">{reason}</span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        Chargement des explications...
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYSES & OPINIONS D'ANALYSTES */}
                    {tickers.length > 0 && Object.keys(stockData).length > 0 && (
                        <div className={`mt-6 p-6 rounded-xl transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                        }`}>
                            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <LucideIcon name="Target" className="w-6 h-6 text-indigo-500" />
                                Analyses & Opinions d'Analystes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tickers
                                    .map(ticker => {
                                        const finnhubData = stockData[ticker];
                                        const recommendation = finnhubData?.recommendation?.[0];

                                        if (!recommendation) return null;

                                        const totalAnalysts = (recommendation.buy || 0) +
                                                            (recommendation.hold || 0) +
                                                            (recommendation.sell || 0) +
                                                            (recommendation.strongBuy || 0) +
                                                            (recommendation.strongSell || 0);

                                        if (totalAnalysts === 0) return null;

                                        const buyScore = (recommendation.strongBuy || 0) * 2 + (recommendation.buy || 0);
                                        const sellScore = (recommendation.strongSell || 0) * 2 + (recommendation.sell || 0);
                                        const holdScore = recommendation.hold || 0;

                                        let consensus = 'Hold';
                                        let consensusColor = 'yellow';
                                        if (buyScore > sellScore && buyScore > holdScore) {
                                            consensus = 'Buy';
                                            consensusColor = 'green';
                                        } else if (sellScore > buyScore && sellScore > holdScore) {
                                            consensus = 'Sell';
                                            consensusColor = 'red';
                                        }

                                        return {
                                            ticker,
                                            totalAnalysts,
                                            consensus,
                                            consensusColor,
                                            buyScore,
                                            sellScore,
                                            holdScore,
                                            recommendation
                                        };
                                    })
                                    .filter(item => item !== null)
                                    .sort((a, b) => b.totalAnalysts - a.totalAnalysts)
                                    .slice(0, 6)
                                    .map((item) => (
                                        <div
                                            key={item.ticker}
                                            className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                                                isDarkMode
                                                    ? 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600'
                                                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                                            }`}
                                            onClick={() => {
                                                setSelectedStock(item.ticker);
                                                setActiveTab('intellistocks');
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={getCompanyLogo(item.ticker)}
                                                        alt={item.ticker}
                                                        className="w-8 h-8 rounded"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                    <span className={`font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {item.ticker}
                                                    </span>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    item.consensusColor === 'green'
                                                        ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                        : item.consensusColor === 'red'
                                                        ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                                }`}>
                                                    {item.consensus === 'Buy' ? 'ACHAT' : item.consensus === 'Sell' ? 'VENTE' : 'CONSERVER'}
                                                </div>
                                            </div>

                                            <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {item.totalAnalysts} analyste{item.totalAnalysts > 1 ? 's' : ''}
                                            </div>

                                            <div className="space-y-1.5">
                                                {item.recommendation.strongBuy > 0 && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Strong Buy</span>
                                                        <span className="font-bold text-green-500">{item.recommendation.strongBuy}</span>
                                                    </div>
                                                )}
                                                {item.recommendation.buy > 0 && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Buy</span>
                                                        <span className="font-bold text-green-400">{item.recommendation.buy}</span>
                                                    </div>
                                                )}
                                                {item.recommendation.hold > 0 && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Hold</span>
                                                        <span className="font-bold text-yellow-500">{item.recommendation.hold}</span>
                                                    </div>
                                                )}
                                                {item.recommendation.sell > 0 && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sell</span>
                                                        <span className="font-bold text-red-400">{item.recommendation.sell}</span>
                                                    </div>
                                                )}
                                                {item.recommendation.strongSell > 0 && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Strong Sell</span>
                                                        <span className="font-bold text-red-500">{item.recommendation.strongSell}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                <div className="flex items-center gap-2">
                                                    <LucideIcon name="ArrowUpRight" className="w-3 h-3 text-gray-400" />
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Cliquer pour analyse complète
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {tickers.filter(ticker => {
                                const finnhubData = stockData[ticker];
                                const recommendation = finnhubData?.recommendation?.[0];
                                return recommendation && (
                                    (recommendation.buy || 0) +
                                    (recommendation.hold || 0) +
                                    (recommendation.sell || 0) +
                                    (recommendation.strongBuy || 0) +
                                    (recommendation.strongSell || 0)
                                ) > 0;
                            }).length === 0 && (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <LucideIcon name="AlertCircle" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Aucune recommandation d'analyste disponible pour le moment</p>
                                    <p className="text-sm mt-2">Les données seront chargées lors de la prochaine actualisation</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Debug des données déplacé vers Admin-JSLAI */}

                    {/* Vue LIST - Compacte */}
                    {stocksViewMode === 'list' && (
                        <div className="mt-8">
                            <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                                isDarkMode
                                    ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 shadow-blue-500/10'
                                    : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-blue-400/40 shadow-blue-400/10'
                            }`}>
                                <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>📊 Titres - Vue Liste</h2>

                                {tickers.length === 0 ? (
                                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <p className="text-lg font-semibold mb-2">Aucun titre disponible</p>
                                        <p className="text-sm">Les données sont en cours de chargement...</p>
                                    </div>
                                ) : Object.keys(stockData).length === 0 ? (
                                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <p className="text-lg font-semibold mb-2">Chargement des données de marché...</p>
                                        <p className="text-sm">Veuillez patienter quelques instants</p>
                                    </div>
                                ) : (
                                <div className="space-y-3">
                                    {tickers.map((ticker) => {
                                        const data = stockData[ticker] || {};
                                        const price = data.c || data.price || 0;
                                        const change = data.d || data.change || 0;
                                        const changePercent = data.dp || data.changePercent || 0;
                                        const isPositive = changePercent >= 0;

                                        return (
                                            <div
                                                key={ticker}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                                                    isDarkMode
                                                        ? 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600'
                                                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                                                }`}
                                                onClick={() => {
                                                    setSelectedStock(ticker);
                                                    setActiveTab('intellistocks');
                                                }}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <img
                                                        src={getCompanyLogo(ticker)}
                                                        alt={ticker}
                                                        className="w-12 h-12 rounded-lg"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                    <div className="flex-1">
                                                        <div className={`font-mono font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {ticker}
                                                        </div>
                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {companyNames[ticker] || ticker}
                                                        </div>
                                                        
                                                        {/* Espace dédié pour les news avec extractMoveReason */}
                                                        <div className={`mt-2 min-h-[20px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {extractMoveReason(ticker, changePercent) ? (
                                                                <div className={`text-xs flex items-start gap-2 ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>
                                                                    {tickerMoveReasons[ticker]?.source === 'Finviz AI' ? (
                                                                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                                AI
                                                                            </span>
                                                                            <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-start gap-1.5">
                                                                            <span className="text-blue-400 flex-shrink-0">📰</span>
                                                                            <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : tickerLatestNews[ticker] ? (
                                                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                    📰 <span className="italic">{tickerLatestNews[ticker].title.length > 70 ? tickerLatestNews[ticker].title.substring(0, 70) + '...' : tickerLatestNews[ticker].title}</span>
                                                                </div>
                                                            ) : (
                                                                <div className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                    Chargement des explications...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        ${price.toFixed(2)}
                                                    </div>
                                                    <div className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                                    </div>
                                                    </div>
                                                </div>
                                            );
                                    })}
                                </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Vue CARDS - Visuelle */}
                    {stocksViewMode === 'cards' && (
                        <div className="mt-8">
                            <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                                isDarkMode
                                    ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 shadow-blue-500/10'
                                    : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-blue-400/40 shadow-blue-400/10'
                            }`}>
                                <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>🎴 Titres - Vue Cartes</h2>

                                {tickers.length === 0 ? (
                                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <p className="text-lg font-semibold mb-2">Aucun titre disponible</p>
                                        <p className="text-sm">Les données sont en cours de chargement...</p>
                                    </div>
                                ) : Object.keys(stockData).length === 0 ? (
                                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <p className="text-lg font-semibold mb-2">Chargement des données de marché...</p>
                                        <p className="text-sm">Veuillez patienter quelques instants</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {tickers.map((ticker) => {
                                        const data = stockData[ticker] || {};
                                        const price = data.c || data.price || 0;
                                        const change = data.d || data.change || 0;
                                        const changePercent = data.dp || data.changePercent || 0;
                                        const high = data.h || 0;
                                        const low = data.l || 0;
                                        const volume = data.v || 0;
                                        const isPositive = changePercent >= 0;

                                        return (
                                            <div
                                                key={ticker}
                                                className={`p-6 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                                                    isDarkMode
                                                        ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-700/70 hover:to-gray-800/70 border border-gray-600'
                                                        : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200 shadow-lg'
                                                }`}
                                                onClick={() => {
                                                    setSelectedStock(ticker);
                                                    setActiveTab('intellistocks');
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={getCompanyLogo(ticker)}
                                                            alt={ticker}
                                                            className="w-14 h-14 rounded-xl"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                        <div className="flex-1">
                                                            <div className={`font-mono font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {ticker}
                                                            </div>
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {companyNames[ticker] || ticker}
                                                            </div>
                                                            
                                                            {/* Espace dédié pour les news avec extractMoveReason */}
                                                            <div className={`mt-2 min-h-[24px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {extractMoveReason(ticker, changePercent) ? (
                                                                    <div className={`text-xs flex items-start gap-2 ${
                                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                    }`}>
                                                                        {tickerMoveReasons[ticker]?.source === 'Finviz AI' ? (
                                                                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                                                                    AI
                                                                                </span>
                                                                                <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-start gap-1.5">
                                                                                <span className="text-blue-400 flex-shrink-0">📰</span>
                                                                                <span className="leading-relaxed">{extractMoveReason(ticker, changePercent)}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : tickerLatestNews[ticker] ? (
                                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                        📰 <span className="italic">{tickerLatestNews[ticker].title.length > 60 ? tickerLatestNews[ticker].title.substring(0, 60) + '...' : tickerLatestNews[ticker].title}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        Chargement des explications...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        isPositive
                                                            ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                            : 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                    }`}>
                                                        {isPositive ? '▲' : '▼'}
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        ${price.toFixed(2)}
                                                    </div>
                                                    <div className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                                                    </div>
                                                </div>

                                                <div className={`grid grid-cols-2 gap-2 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                    <div>
                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Haut</div>
                                                        <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${high.toFixed(2)}</div>
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bas</div>
                                                        <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${low.toFixed(2)}</div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Volume</div>
                                                        <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(volume)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Section Données Financières & Actualités (Finnhub) - PRINCIPALE */}
                    {stocksViewMode === 'table' && (
                    <div className="mt-8">
                        <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                            isDarkMode 
                                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 shadow-blue-500/10' 
                                : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-blue-400/40 shadow-blue-400/10'
                        }`}>
                            <div className="text-center mb-6">
                                <h2 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    📊 Données Financières & Actualités
                                </h2>
                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode 
                                        ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' 
                                        : 'bg-gray-700/80 text-gray-200 border border-gray-600/50'
                                }`}>
                                    <span className="mr-2">🔗</span>
                                    Source: Finnhub API
                                </div>
                                <p className={`text-sm mt-3 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    Données en temps réel avec 3 actualités par titre
                                </p>
                            </div>
                            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 relative text-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b-2 transition-colors duration-300 ${
                                            isDarkMode ? 'border-blue-500/50 bg-gray-900' : 'border-blue-400/50 bg-gray-100'
                                        }`}>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>📈 Ticker</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>💰 Prix</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>📊 Change</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>📈 P/E</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>💎 Dividende</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>🏢 Secteur</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>⭐ Rating</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>😊 Sentiment</th>
                                            <th className={`text-left py-2 px-3 font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>⚡ Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickers.map(ticker => {
                                            // Données de Finnhub uniquement
                                            const finnhubData = stockData[ticker];
                                            const price = finnhubData?.c ? `$${finnhubData.c.toFixed(2)}` : 'N/A';
                                            const change = finnhubData?.d ? `${finnhubData.d > 0 ? '+' : ''}${finnhubData.d.toFixed(2)}` : 'N/A';
                                            const changePercent = finnhubData?.dp ? `${finnhubData.dp > 0 ? '+' : ''}${finnhubData.dp.toFixed(2)}%` : 'N/A';
                                            const changeColor = finnhubData?.d > 0 ? 'text-green-400' : finnhubData?.d < 0 ? 'text-red-400' : 'text-gray-400';
                                            
                                            // Données de profil Finnhub
                                            const profile = finnhubData?.profile;
                                            const fundamentals = finnhubData?.fundamentals;
                                            const peRatio = fundamentals?.peRatio
                                                ? (Number.isFinite(fundamentals.peRatio) ? fundamentals.peRatio.toFixed(2) : fundamentals.peRatio)
                                                : (profile?.pe ? profile.pe.toFixed(2) : 'N/A');
                                            const dividendYield = fundamentals?.dividendYield
                                                ? `${(Number(fundamentals.dividendYield) * 100).toFixed(2)}%`
                                                : (profile?.dividend ? `${(profile.dividend * 100).toFixed(2)}%` : 'N/A');
                                            const sector = fundamentals?.sector || profile?.industry || 'N/A';
                                            
                                            // Données de recommandation Finnhub
                                            const recommendation = finnhubData?.recommendation;
                                            const rating = recommendation?.length > 0 ? 
                                                (recommendation[0].buy + recommendation[0].strongBuy > recommendation[0].sell + recommendation[0].strongSell ? 'Achat' : 
                                                 recommendation[0].sell + recommendation[0].strongSell > recommendation[0].buy + recommendation[0].strongBuy ? 'Vente' : 'Neutre') : 'N/A';
                                            
                                            // 2 actualités les plus crédibles pour ce ticker
                                            const tickerNews = sortNewsByCredibility(
                                                newsData.filter(article => {
                                                const text = (article.title + ' ' + article.description).toLowerCase();
                                                return text.includes(ticker.toLowerCase());
                                                })
                                            ).slice(0, 2);
                                            
                                            // Analyse du sentiment
                                            const analyzeSentiment = (title, description) => {
                                                const text = (title + ' ' + description).toLowerCase();
                                                const positiveWords = ['hausse', 'croissance', 'gain', 'profit', 'positif', 'amélioration', 'succès', 'fort', 'solide'];
                                                const negativeWords = ['baisse', 'chute', 'perte', 'négatif', 'déclin', 'faible', 'problème', 'risque', 'inquiétude'];
                                                
                                                const positiveCount = positiveWords.filter(word => text.includes(word)).length;
                                                const negativeCount = negativeWords.filter(word => text.includes(word)).length;
                                                
                                                if (positiveCount > negativeCount) return { sentiment: 'Positif', color: 'text-green-400' };
                                                if (negativeCount > positiveCount) return { sentiment: 'Négatif', color: 'text-red-400' };
                                                return { sentiment: 'Neutre', color: 'text-gray-400' };
                                            };
                                            
                                            const sentiment = tickerNews.length > 0 ? analyzeSentiment(tickerNews[0].title, tickerNews[0].description) : { sentiment: 'N/A', color: 'text-gray-400' };
                                            
                                            return (
                                                <React.Fragment key={ticker}>
                                                    {/* Ligne principale - STYLE PRINCIPAL */}
                                                    <tr className={`border-b-2 transition-all duration-300 hover:scale-[1.02] ${
                                                        isDarkMode 
                                                            ? 'border-gray-600/50 hover:bg-gradient-to-r hover:from-gray-800/80 hover:to-gray-700/80 hover:shadow-lg hover:shadow-blue-500/10' 
                                                            : 'border-gray-300/50 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-white/80 hover:shadow-lg hover:shadow-blue-400/10'
                                                    }`}>
                                                        <td className="py-4 px-3">
                                                            <div className="flex items-center gap-3">
                                                                <img 
                                                                    src={getCompanyLogo(ticker)} 
                                                                    alt={`${ticker} logo`}
                                                                    className="w-8 h-8 rounded-lg shadow-md"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                                <span className={`font-mono font-bold text-xl transition-colors duration-300 ${
                                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                                }`}>{ticker}</span>
                                                            </div>
                                                        </td>
                                                        <td className={`py-2 px-3 font-bold transition-colors duration-300 ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>{price}</td>
                                                        <td className={`py-2 px-3 font-semibold transition-colors duration-300 ${changeColor}`}>
                                                            {change} ({changePercent})
                                                        </td>
                                                        <td className={`py-2 px-3 font-medium transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}>{peRatio}</td>
                                                        <td className={`py-2 px-3 font-medium transition-colors duration-300 ${
                                                            isDarkMode ? 'text-green-300' : 'text-green-600'
                                                        }`}>{dividendYield}</td>
                                                        <td className={`py-2 px-3 text-sm transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                        }`}>{cleanText(sector)}</td>
                                                        <td className="py-4 px-3">
                                                            <span className={`px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 ${
                                                                rating === 'Achat' ? 'bg-green-500 text-white' :
                                                                rating === 'Vente' ? 'bg-red-500 text-white' :
                                                                'bg-yellow-500 text-black'
                                                            }`}>
                                                                {rating}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-3">
                                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-300 ${
                                                                sentiment.sentiment === 'Positif' ? 'bg-green-100 text-green-800' :
                                                                sentiment.sentiment === 'Négatif' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                <span className="text-lg">
                                                                    {sentiment.sentiment === 'Positif' ? '😊' : 
                                                                     sentiment.sentiment === 'Négatif' ? '😟' : '😐'}
                                                                </span>
                                                                <span className="font-semibold">{sentiment.sentiment}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-3">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStock(ticker);
                                                                    setActiveTab('intellistocks');
                                                                }}
                                                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] shadow ${
                                                                    isDarkMode
                                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/25'
                                                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-400/25'
                                                                }`}
                                                            >
                                                                📊 Voir dans JLab
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Ligne Finviz - Ce qui bouge (si disponible) */}
                                                    {finvizNews[ticker] && (
                                                        <tr className={`border-b-2 transition-all duration-300 ${
                                                            isDarkMode
                                                                ? 'border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 hover:from-purple-900/30 hover:to-indigo-900/30'
                                                                : 'border-purple-400/30 bg-gradient-to-r from-purple-50/60 to-indigo-50/60 hover:from-purple-100/80 hover:to-indigo-100/80'
                                                        }`}>
                                                            <td colSpan="9" className="py-4 px-4">
                                                                <div className="flex items-start gap-3">
                                                                    {/* Icône étoile (sparkles) */}
                                                                    <div className={`p-2 rounded-full ${
                                                                        isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                                                                    }`}>
                                                                        <LucideIcon name="Sparkles" className="w-5 h-5 text-purple-500" />
                                                                    </div>

                                                                    {/* Contenu */}
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                                isDarkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-200 text-purple-700'
                                                                            }`}>
                                                                                🔥 CE QUI BOUGE
                                                                            </span>
                                                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                {finvizNews[ticker].date}
                                                                            </span>
                                                                        </div>
                                                                        <p className={`text-sm font-medium leading-relaxed ${
                                                                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                                                        }`}>
                                                                            {finvizNews[ticker].headline}
                                                                        </p>
                                                                        {finvizNews[ticker].link && (
                                                                            <a
                                                                                href={finvizNews[ticker].link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className={`text-xs mt-2 inline-flex items-center gap-1 hover:underline ${
                                                                                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                                                                }`}
                                                                            >
                                                                                <LucideIcon name="ExternalLink" className="w-3 h-3" />
                                                                                Lire l'article complet
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {/* Lignes d'actualités (3 maximum) - STYLE AMÉLIORÉ */}
                                                    {tickerNews.map((news, newsIndex) => (
                                                        <tr key={`${ticker}-news-${newsIndex}`} className={`border-b-2 transition-all duration-300 hover:scale-[1.01] ${
                                                            isDarkMode 
                                                                ? 'border-gray-600/30 bg-gradient-to-r from-gray-800/40 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/60' 
                                                                : 'border-gray-300/30 bg-gradient-to-r from-gray-50/60 to-white/60 hover:from-gray-100/80 hover:to-gray-50/80'
                                                        }`}>
                                                            <td colSpan="9" className="py-6 px-4">
                                                                <div className={`transition-colors duration-300 ${
                                                                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                                }`}>
                                                                    <div className="flex items-start gap-4">
                                                                        {(() => {
                                                                            const newsIconData = getNewsIcon(news.title, news.description, news.sentiment);
                                                                            return (
                                                                        <div className={`p-3 rounded-full transition-colors duration-300 ${
                                                                                    isDarkMode ? 'bg-gray-600/20' : 'bg-gray-200/60'
                                                                        }`}>
                                                                                    <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                                                        </div>
                                                                            );
                                                                        })()}
                                                                        <div className="flex-1">
                                                                            <h5 className={`font-bold text-lg mb-3 transition-colors duration-300 ${
                                                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                                                            }`}>
                                                                                {news.url ? (
                                                                                    <a 
                                                                                        href={news.url} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className={`hover:underline transition-colors duration-300 ${
                                                                                            isDarkMode 
                                                                                                ? 'text-blue-300 hover:text-blue-200' 
                                                                                                : 'text-blue-600 hover:text-blue-700'
                                                                                        }`}
                                                                                    >
                                                                                        {cleanText(news.title)}
                                                                                    </a>
                                                                                ) : (
                                                                                    cleanText(news.title)
                                                                                )}
                                                                            </h5>
                                                                            <p className={`text-base mb-4 leading-relaxed transition-colors duration-300 ${
                                                                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                                            }`}>
                                                                                {cleanText(news.description)}
                                                                            </p>
                                                                            <div className={`flex items-center gap-4 text-sm transition-colors duration-300 ${
                                                                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                                            }`}>
                                                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                                                                }`}>
                                                                                    <span className="font-semibold">{news.source?.name || 'Source inconnue'}</span>
                                                                                </div>
                                                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                                                                }`}>
                                                                                    <span>🕒</span>
                                                                                    <span>
                                                                                        {news.publishedAt ? 
                                                                                            new Date(news.publishedAt).toLocaleString('fr-FR') : 
                                                                                            'Date inconnue'
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                {news.url && (
                                                                                    <a 
                                                                                        href={news.url} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                                                                                            isDarkMode 
                                                                                                ? 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg shadow-gray-500/25' 
                                                                                                : 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg shadow-gray-400/25'
                                                                                        }`}
                                                                                    >
                                                                                        📖 Lire l'article
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className={`text-center mt-8 p-6 rounded-xl transition-colors duration-300 ${
                                isDarkMode 
                                    ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20' 
                                    : 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-300/30'
                            }`}>
                                <div className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                }`}>
                                    📜 Section Principale - Données Financières
                                </div>
                                <div className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    Faites défiler pour voir toutes les données • Source: Finnhub API • 3 actualités par titre
                                </div>
                                <div className={`text-xs mt-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    Données mises à jour automatiquement toutes les 5 minutes
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Message si aucune donnée */}
                    {tickers.length === 0 && (
                        <div className="bg-yellow-900/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-300/20">
                            <div className="flex items-center gap-3">
                                <span className="text-yellow-400 text-2xl">⚠️</span>
                                <div>
                                    <h3 className="text-yellow-200 font-semibold">Aucun ticker configuré</h3>
                                    <p className="text-yellow-300/80 text-sm mt-1">
                                        Ajoutez des tickers dans l'onglet Seeking Alpha pour voir les données ici.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== SECTION ACTUALITÉS SÉPARÉE ===== */}
                    {newsData.length > 0 && (
                        <div className="mt-12">
                            <div className={`backdrop-blur-sm rounded-2xl p-8 border-2 shadow-2xl transition-colors duration-300 ${
                                isDarkMode
                                    ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-purple-500/30 shadow-purple-500/10'
                                    : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-purple-400/40 shadow-purple-400/10'
                            }`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        📰 Actualités du Marché
                                    </h2>
                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                            : 'bg-purple-100 text-purple-700 border border-purple-300'
                                    }`}>
                                        {newsData.length} articles
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {newsData.slice(0, 12).map((article, index) => {
                                        const credibilityScore = getNewsCredibilityScore(article.source?.name || '');
                                        const credibilityTier = getCredibilityTier(credibilityScore);

                                        return (
                                            <div
                                                key={index}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    if (article.url) {
                                                        window.open(article.url, '_blank', 'noopener,noreferrer');
                                                    }
                                                }}
                                                onKeyDown={(event) => {
                                                    if ((event.key === 'Enter' || event.key === ' ') && article.url) {
                                                        event.preventDefault();
                                                        window.open(article.url, '_blank', 'noopener,noreferrer');
                                                    }
                                                }}
                                                className={`p-6 rounded-xl cursor-pointer transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                                    isDarkMode
                                                        ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-700/70 hover:to-gray-800/70 border border-gray-600'
                                                        : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200 shadow-lg'
                                                }`}
                                            >
                                                {/* Source et crédibilité */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        credibilityTier === 'premium'
                                                            ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                                            : credibilityTier === 'high'
                                                            ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                            : credibilityTier === 'medium'
                                                            ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                                            : credibilityTier === 'low'
                                                            ? 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                                                            : 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                    }`}>
                                                        {article.source?.name || 'Source inconnue'}
                                                    </div>
                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Titre */}
                                                <h3 className={`font-bold text-lg mb-3 line-clamp-2 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                    {article.title}
                                                </h3>

                                                {/* Description */}
                                                {article.description && (
                                                    <p className={`text-sm mb-4 line-clamp-3 transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                    }`}>
                                                        {article.description}
                                                    </p>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 mt-4">
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-center text-sm font-semibold transition-all ${
                                                            isDarkMode
                                                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                        }`}
                                                    >
                                                        <IconoirIcon name="ExternalLink" className="w-4 h-4 inline mr-1" />
                                                        Lire
                                                    </a>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            summarizeWithEmma(article.url, article.title);
                                                        }}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-center text-sm font-semibold transition-all ${
                                                            isDarkMode
                                                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                                                        }`}
                                                    >
                                                        <IconoirIcon name="Brain" className="w-4 h-4 inline mr-1" />
                                                        Emma
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {newsData.length > 12 && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setActiveTab('markets-economy')}
                                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                                isDarkMode
                                                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                                            }`}
                                        >
                                            Voir toutes les actualités ({newsData.length}) →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            );
        };

            // ============================================
            // COMPOSANT INTELLISTOCKS
            // ============================================

export default StocksNewsTab;
