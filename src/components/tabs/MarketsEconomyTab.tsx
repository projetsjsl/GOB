import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

            const MarketsEconomyTab = () => {
                const [localFrenchOnly, setLocalFrenchOnly] = useState(false);
                const [selectedSource, setSelectedSource] = useState('all'); // Filtre source
                const [selectedMarket, setSelectedMarket] = useState('all'); // Filtre marché
                const [selectedTheme, setSelectedTheme] = useState('all'); // Filtre thème
                const [localFilteredNews, setLocalFilteredNews] = useState([]);

                // Refs pour les widgets TradingView
                const marketOverviewRef = useRef(null);
                const heatmapRef = useRef(null);
                const screenerRef = useRef(null);

                // Listes de filtres
                const sources = ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'MarketWatch', 'La Presse', 'Les Affaires'];
                const markets = ['US', 'Canada', 'Europe', 'Asie'];
                const themes = ['Tech', 'Finance', 'Énergie', 'Santé', 'Crypto', 'IA'];

                // Charger les widgets TradingView
                React.useEffect(() => {
                    // Market Overview Widget
                    if (marketOverviewRef.current) {
                        const script = document.createElement('script');
                        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
                        script.async = true;
                        script.innerHTML = JSON.stringify({
                            "colorTheme": isDarkMode ? "dark" : "light",
                            "dateRange": "1D",
                            "showChart": true,
                            "locale": "fr",
                            "width": "100%",
                            "height": "100%",
                            "largeChartUrl": "",
                            "isTransparent": false,
                            "showSymbolLogo": true,
                            "showFloatingTooltip": true,
                            "tabs": [
                                {
                                    "title": "Indices",
                                    "symbols": [
                                        {"s": "FOREXCOM:SPXUSD", "d": "S&P 500"},
                                        {"s": "FOREXCOM:NSXUSD", "d": "US 100"},
                                        {"s": "FOREXCOM:DJI", "d": "Dow 30"},
                                        {"s": "INDEX:NKY", "d": "Nikkei 225"},
                                        {"s": "INDEX:DEU40", "d": "DAX Index"},
                                        {"s": "FOREXCOM:UKXGBP", "d": "UK 100"}
                                    ]
                                },
                                {
                                    "title": "Forex",
                                    "symbols": [
                                        {"s": "FX:EURUSD", "d": "EUR/USD"},
                                        {"s": "FX:GBPUSD", "d": "GBP/USD"},
                                        {"s": "FX:USDJPY", "d": "USD/JPY"},
                                        {"s": "FX:USDCAD", "d": "USD/CAD"}
                                    ]
                                },
                                {
                                    "title": "Crypto",
                                    "symbols": [
                                        {"s": "BINANCE:BTCUSDT", "d": "Bitcoin"},
                                        {"s": "BINANCE:ETHUSDT", "d": "Ethereum"},
                                        {"s": "BINANCE:BNBUSDT", "d": "BNB"},
                                        {"s": "BINANCE:SOLUSDT", "d": "Solana"}
                                    ]
                                }
                            ]
                        });
                        marketOverviewRef.current.appendChild(script);
                    }

                    // Heatmap Widget
                    if (heatmapRef.current) {
                        const script = document.createElement('script');
                        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                        script.async = true;
                        script.innerHTML = JSON.stringify({
                            "exchanges": [],
                            "dataSource": "SPX500",
                            "grouping": "sector",
                            "blockSize": "market_cap_basic",
                            "blockColor": "change",
                            "locale": "fr",
                            "symbolUrl": "",
                            "colorTheme": isDarkMode ? "dark" : "light",
                            "hasTopBar": true,
                            "isDataSetEnabled": true,
                            "isZoomEnabled": true,
                            "hasSymbolTooltip": true,
                            "width": "100%",
                            "height": "100%"
                        });
                        heatmapRef.current.appendChild(script);
                    }

                    // Screener Widget
                    if (screenerRef.current) {
                        const script = document.createElement('script');
                        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
                        script.async = true;
                        script.innerHTML = JSON.stringify({
                            "width": "100%",
                            "height": "100%",
                            "defaultColumn": "overview",
                            "defaultScreen": "most_capitalized",
                            "market": "america",
                            "showToolbar": true,
                            "colorTheme": isDarkMode ? "dark" : "light",
                            "locale": "fr",
                            "isTransparent": false
                        });
                        screenerRef.current.appendChild(script);
                    }
                }, [isDarkMode]);

                // Fonction pour détecter la source avec variations de noms
                const matchesSource = (articleSource, selectedSource) => {
                    if (!articleSource || !selectedSource) return false;
                    const source = articleSource.toLowerCase();
                    const selected = selectedSource.toLowerCase();
                    
                    // Mapping des variations de noms de sources
                    const sourceVariations = {
                        'bloomberg': ['bloomberg', 'bloomberg.com', 'bloomberg news'],
                        'reuters': ['reuters', 'reuters.com', 'thomson reuters'],
                        'wsj': ['wsj', 'wall street journal', 'the wall street journal', 'wsj.com'],
                        'cnbc': ['cnbc', 'cnbc.com'],
                        'marketwatch': ['marketwatch', 'marketwatch.com', 'market watch'],
                        'la presse': ['la presse', 'lapresse', 'lapresse.ca', 'presse'],
                        'les affaires': ['les affaires', 'lesaffaires', 'lesaffaires.com', 'affaires']
                    };
                    
                    // Vérifier correspondance exacte
                    if (source.includes(selected) || selected.includes(source)) return true;
                    
                    // Vérifier les variations
                    const variations = sourceVariations[selected];
                    if (variations) {
                        return variations.some(variation => source.includes(variation));
                    }
                    
                    return false;
                };

                // État pour suivre si les résultats sont exacts ou approximatifs
                const [isApproximateMatch, setIsApproximateMatch] = useState(false);

                // Filtrer les nouvelles à l'affichage avec système de fallback intelligent
                React.useEffect(() => {
                    let filtered = newsData;
                    let hasExactMatches = true;

                    // Appliquer le filtre français si activé
                    if (localFrenchOnly) {
                        filtered = filtered.filter(article => isFrenchArticle(article));
                    }

                    // Appliquer le filtre source avec détection flexible
                    if (selectedSource !== 'all') {
                        const beforeFilter = filtered.length;
                        filtered = filtered.filter(article =>
                            matchesSource(article.source?.name, selectedSource)
                        );
                        // Si aucun résultat, essayer un filtrage plus large
                        if (filtered.length === 0 && beforeFilter > 0) {
                            filtered = newsData.filter(article => {
                                const sourceName = (article.source?.name || '').toLowerCase();
                                const selected = selectedSource.toLowerCase();
                                // Recherche partielle plus large
                                return sourceName.includes(selected) || selected.includes(sourceName);
                            });
                            hasExactMatches = false;
                        }
                    }

                    // Appliquer le filtre marché (basé sur mots-clés) avec fallback
                    if (selectedMarket !== 'all') {
                        const marketKeywords = {
                            'US': ['u.s.', 'united states', 'american', 'wall street', 'nasdaq', 'dow', 's&p', 'sp500', 'federal reserve', 'fed', 'sec', 'new york', 'nyse', 'us market', 'us economy'],
                            'Canada': ['canada', 'canadian', 'toronto', 'tsx', 'montreal', 'quebec', 'ontario', 'alberta', 'vancouver', 'canadian market', 'canadian economy', 'bank of canada', 'boc'],
                            'Europe': ['europe', 'european', 'eu', 'ecb', 'london', 'frankfurt', 'paris', 'ftse', 'dax', 'cac', 'eurozone', 'euro', 'uk', 'germany', 'france', 'italy', 'spain'],
                            'Asie': ['asia', 'asian', 'china', 'chinese', 'japan', 'japanese', 'tokyo', 'shanghai', 'hong kong', 'nikkei', 'south korea', 'korean', 'singapore', 'india', 'indian', 'taiwan']
                        };
                        const beforeFilter = filtered.length;
                        filtered = filtered.filter(article => {
                            const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                            return marketKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
                        });
                        // Si aucun résultat, essayer avec moins de mots-clés
                        if (filtered.length === 0 && beforeFilter > 0) {
                            const fallbackKeywords = {
                                'US': ['us', 'usa', 'america'],
                                'Canada': ['canada'],
                                'Europe': ['europe', 'eu'],
                                'Asie': ['asia', 'china', 'japan']
                            };
                            filtered = newsData.filter(article => {
                                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                                return fallbackKeywords[selectedMarket]?.some(keyword => text.includes(keyword));
                            });
                            hasExactMatches = false;
                        }
                    }

                    // Appliquer le filtre thème avec fallback
                    if (selectedTheme !== 'all') {
                        const themeKeywords = {
                            'Tech': ['tech', 'technology', 'software', 'cloud', 'apple', 'google', 'microsoft', 'amazon', 'meta', 'tesla', 'nvidia', 'amd', 'intel', 'samsung', 'iphone', 'android', 'ai', 'artificial intelligence'],
                            'Finance': ['bank', 'banque', 'finance', 'financial', 'trading', 'investment', 'investor', 'credit', 'loan', 'mortgage', 'interest rate', 'fed', 'central bank', 'stock market', 'equity', 'bond'],
                            'Énergie': ['energy', 'oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind', 'nuclear', 'exxon', 'chevron', 'bp', 'shell', 'crude', 'barrel', 'opec'],
                            'Santé': ['health', 'healthcare', 'pharma', 'pharmaceutical', 'medical', 'drug', 'medicine', 'vaccine', 'hospital', 'medicare', 'pfizer', 'moderna', 'johnson & johnson'],
                            'Crypto': ['crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'coinbase', 'binance', 'crypto market', 'digital currency'],
                            'IA': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'openai', 'nvidia', 'neural network', 'llm', 'large language model']
                        };
                        const beforeFilter = filtered.length;
                        filtered = filtered.filter(article => {
                            const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                            return themeKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
                        });
                        // Si aucun résultat, essayer avec mots-clés plus généraux
                        if (filtered.length === 0 && beforeFilter > 0) {
                            const fallbackKeywords = {
                                'Tech': ['tech', 'technology'],
                                'Finance': ['finance', 'financial', 'bank'],
                                'Énergie': ['energy', 'oil', 'gas'],
                                'Santé': ['health', 'medical'],
                                'Crypto': ['crypto', 'bitcoin'],
                                'IA': ['ai', 'artificial intelligence']
                            };
                            filtered = newsData.filter(article => {
                                const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
                                return fallbackKeywords[selectedTheme]?.some(keyword => text.includes(keyword));
                            });
                            hasExactMatches = false;
                        }
                    }

                    // Si toujours aucun résultat, afficher toutes les nouvelles avec un message
                    if (filtered.length === 0 && newsData.length > 0) {
                        filtered = newsData.slice(0, 20); // Limiter à 20 pour éviter la surcharge
                        hasExactMatches = false;
                    }

                    setIsApproximateMatch(!hasExactMatches);
                    setLocalFilteredNews(filtered);
                }, [newsData, localFrenchOnly, selectedSource, selectedMarket, selectedTheme]);

                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>📰 Marchés & Économie</h2>
                            <div className="flex gap-2">
                                {/* Toggle Français */}
                                <button
                                    onClick={() => setLocalFrenchOnly(!localFrenchOnly)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                        localFrenchOnly
                                            ? 'bg-blue-600 text-white'
                                            : (isDarkMode
                                                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900')
                                    }`}
                                >
                                    🇫🇷 Français {localFrenchOnly && '✓'}
                                </button>
                                <button
                                    onClick={fetchNews}
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

                        {/* ===== WIDGETS TRADING VIEW VISUELS ===== */}
                        <div className="grid grid-cols-1 gap-6 mt-6">
                            {/* Market Overview Widget */}
                            <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                                isDarkMode
                                    ? 'bg-gray-800/50 border-blue-500/30'
                                    : 'bg-white border-blue-400/40'
                            }`}>
                                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        📊 Vue d'ensemble des Marchés (Temps Réel)
                                    </h3>
                                    <p className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Indices majeurs, Forex, Crypto - Données en direct
                                    </p>
                                </div>
                                <div ref={marketOverviewRef} style={{height: '400px'}}></div>
                            </div>

                            {/* Stock Heatmap Widget */}
                            <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                                isDarkMode
                                    ? 'bg-gray-800/50 border-green-500/30'
                                    : 'bg-white border-green-400/40'
                            }`}>
                                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        🔥 Heatmap Boursière
                                    </h3>
                                    <p className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Visualisation des performances par secteur
                                    </p>
                                </div>
                                <div ref={heatmapRef} style={{height: '500px'}}></div>
                            </div>

                            {/* Screener Widget - Top Gainers/Losers */}
                            <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                                isDarkMode
                                    ? 'bg-gray-800/50 border-purple-500/30'
                                    : 'bg-white border-purple-400/40'
                            }`}>
                                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        🚀 Screener - Top Gainers & Losers
                                    </h3>
                                    <p className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Actions les plus performantes et en baisse
                                    </p>
                                </div>
                                <div ref={screenerRef} style={{height: '500px'}}></div>
                            </div>
                        </div>

                        {/* Statistiques */}
                        <div className={`p-4 rounded-xl transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {localFilteredNews.length}
                                    </div>
                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Articles filtrés
                                    </div>
                                </div>
                                <LucideIcon name="Newspaper" className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            </div>
                        </div>

                        {/* Filtres */}
                        <div className={`p-6 rounded-xl transition-colors duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                🔍 Filtres
                            </h3>

                            {/* Filtre Source */}
                            <div className="mb-4">
                                <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    📰 Source
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedSource('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            selectedSource === 'all'
                                                ? 'bg-blue-600 text-white'
                                                : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                        }`}
                                    >
                                        Toutes
                                    </button>
                                    {sources.map(source => (
                                        <button
                                            key={source}
                                            onClick={() => setSelectedSource(source)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                selectedSource === source
                                                    ? 'bg-blue-600 text-white'
                                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                            }`}
                                        >
                                            {source}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filtre Marché */}
                            <div className="mb-4">
                                <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    🌍 Marché
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedMarket('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            selectedMarket === 'all'
                                                ? 'bg-green-600 text-white'
                                                : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                        }`}
                                    >
                                        Tous
                                    </button>
                                    {markets.map(market => (
                                        <button
                                            key={market}
                                            onClick={() => setSelectedMarket(market)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                selectedMarket === market
                                                    ? 'bg-green-600 text-white'
                                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                            }`}
                                        >
                                            {market}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filtre Thème */}
                            <div>
                                <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    🏷️ Thématique
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedTheme('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            selectedTheme === 'all'
                                                ? 'bg-purple-600 text-white'
                                                : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                        }`}
                                    >
                                        Toutes
                                    </button>
                                    {themes.map(theme => (
                                        <button
                                            key={theme}
                                            onClick={() => setSelectedTheme(theme)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                selectedTheme === theme
                                                    ? 'bg-purple-600 text-white'
                                                    : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                            }`}
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message informatif pour les résultats approximatifs */}
                            {isApproximateMatch && localFilteredNews.length > 0 && (
                                <div className={`mt-4 p-4 rounded-lg border-2 ${
                                    isDarkMode
                                        ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-200'
                                        : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">💡</span>
                                        <div>
                                            <p className="font-semibold mb-1">Résultats similaires affichés</p>
                                            <p className="text-sm">
                                                Aucun résultat exact trouvé pour les filtres sélectionnés. Nous affichons des articles similaires qui pourraient vous intéresser.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Liste des nouvelles */}
                        <div className="space-y-4">
                            {localFilteredNews.length === 0 ? (
                                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <LucideIcon name="AlertCircle" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-semibold mb-2">
                                        {localFrenchOnly ? 'Aucun article en français trouvé' : 'Aucune nouvelle disponible'}
                                    </p>
                                    <p className="text-sm">
                                        {localFrenchOnly
                                            ? 'Essayez de désactiver le filtre français ou actualisez les données'
                                            : 'Cliquez sur Actualiser pour charger les dernières nouvelles'}
                                    </p>
                                </div>
                            ) : (
                                localFilteredNews.map((article, index) => {
                                    const newsIconData = getNewsIcon(article.title, article.description, article.sentiment);
                                    const credibility = getSourceCredibility(article.source?.name);

                                    return (
                                        <div
                                            key={index}
                                            className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                                                isDarkMode
                                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600'
                                                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Icône */}
                                                <div className={`p-3 rounded-full transition-colors duration-300 ${
                                                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'
                                                }`}>
                                                    <LucideIcon name={newsIconData.icon} className={`w-6 h-6 ${newsIconData.color}`} />
                                                </div>

                                                {/* Contenu */}
                                                <div className="flex-1">
                                                    {/* Titre */}
                                                    <h3 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {article.url ? (
                                                            <a
                                                                href={article.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`hover:underline transition-colors duration-300 ${
                                                                    isDarkMode
                                                                        ? 'text-blue-300 hover:text-blue-200'
                                                                        : 'text-blue-600 hover:text-blue-700'
                                                                }`}
                                                            >
                                                                {cleanText(article.title)}
                                                            </a>
                                                        ) : (
                                                            cleanText(article.title)
                                                        )}
                                                    </h3>

                                                    {/* Description */}
                                                    <p className={`text-base mb-4 leading-relaxed transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                    }`}>
                                                        {cleanText(article.description)}
                                                    </p>

                                                    {/* Métadonnées */}
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        {/* Source avec badge de crédibilité */}
                                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
                                                            credibility >= 100
                                                                ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                                                                : credibility >= 85
                                                                ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                                                : credibility >= 75
                                                                ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                                                : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700')
                                                        }`}>
                                                            {credibility >= 100 && <span className="text-xs">⭐</span>}
                                                            <span className="text-xs font-semibold">{article.source?.name || 'Source inconnue'}</span>
                                                        </div>

                                                        {/* Date */}
                                                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {new Date(article.publishedAt || article.publishedDate).toLocaleString('fr-FR')}
                                                        </span>

                                                        {/* Badge français */}
                                                        {isFrenchArticle(article) && (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                                                                🇫🇷 FR
                                                            </span>
                                                        )}

                                                        {/* Bouton Résumé avec Emma */}
                                                        {article.url && (
                                                            <button
                                                                onClick={() => summarizeWithEmma(article.url, article.title)}
                                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                                                                    isDarkMode
                                                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                                                                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white'
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-1">
                                                                    <LucideIcon name="Brain" className="w-3 h-3" />
                                                                    Résumé avec Emma
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            };

            // Configuration des onglets (après déclaration de TOUS les composants)
            // Note: Les icônes Iconoir sont générées automatiquement via getTabIconClass()
            const tabs = [
                { id: 'markets-economy', label: 'Marchés & Économie', component: MarketsEconomyTab },
                { id: 'stocks-news', label: 'Titres & Nouvelles', component: StocksNewsTab },
                { id: 'ask-emma', label: 'Emma IA™', component: AskEmmaTab },
                { id: 'yield-curve', label: '📈 Yield Curve', component: YieldCurveTab },
                { id: 'intellistocks', label: 'JLab™', component: IntelliStocksTab },
                { id: 'plus', label: 'Plus', component: PlusTab },
                { id: 'admin-jsla', label: 'Admin JSLAI', component: AdminJSLaiTab },
                { id: 'dans-watchlist', label: 'Dan\'s Watchlist', component: DansWatchlistTab },
                { id: 'scrapping-sa', label: 'Seeking Alpha', component: ScrappingSATab },
                { id: 'seeking-alpha', label: 'Stocks News', component: SeekingAlphaTab },
                { id: 'email-briefings', label: 'Emma En Direct', component: EmailBriefingsTab },
                { id: 'economic-calendar', label: 'Calendrier Économique', component: EconomicCalendarTab },
                { id: 'investing-calendar', label: 'TESTS JS', component: InvestingCalendarTab }
            ];

            return (
                <div className={`min-h-screen transition-colors duration-300 ${
                    isDarkMode
                        ? 'bg-black'
                        : 'bg-white'
                }`}>
                    {/* Professional/Fun Mode Toggle Button */}

                    {/* Intro Emma IA - première visite de session */}
                    {showEmmaIntro && activeTab === 'ask-emma' && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                            <div className="text-center">
                                <div className="mb-6">
                                    <img
                                        src={'EMMA-JSLAI-GOB-dark.jpg'}
                                        alt="Emma IA"
                                        className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-emerald-500"
                                    />
                                </div>
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">Emma IA</h2>
                                <p className="text-emerald-300 text-lg">Analyste financière virtuelle • JSL AI</p>
                            </div>
                        </div>
                    )}

                    {/* Intro Dan's Watchlist - première visite de session */}
                    {showDanIntro && activeTab === 'dans-watchlist' && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                            <div className="text-center">
                                <div className="mb-6">
                                    <img
                                        src={`images/daniel-ouellet2.jpg?v=${Date.now()}`}
                                        alt="Daniel Ouellet"
                                        className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-blue-500"
                                    />
                                </div>
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">Dan's Watchlist</h2>
                                <p className="text-blue-300 text-lg">Watchlist Daniel Ouellet • GOB</p>
                            </div>
                        </div>
                    )}

                    {/* Intro JLab - première visite de session */}
                    {showJLabIntro && activeTab === 'intellistocks' && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                            <div className="text-center">
                                <div className="mb-6">
                                    <img
                                        src={'jlab.png'}
                                        alt="JLab"
                                        className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-green-500"
                                    />
                                </div>
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">JLab™</h2>
                                <p className="text-green-300 text-lg">Laboratoire d'analyse financière • JSL AI</p>
                            </div>
                        </div>
                    )}

                    {/* Intro Seeking Alpha - première visite de session */}
                    {showSeekingAlphaIntro && activeTab === 'scrapping-sa' && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                            <div className="text-center">
                                <div className="mb-6">
                                    <img
                                        src={'seekingalpha.png'}
                                        alt="Seeking Alpha"
                                        className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-green-500"
                                    />
                                </div>
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">Seeking Alpha</h2>
                                <p className="text-green-300 text-lg">Scraping & Analysis • JSL AI</p>
                            </div>
                        </div>
                    )}
                    {/* Header - Bloomberg Style - Always Dark */}
                    <header className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black border-b border-green-500/20 md:ml-20">
                        {/* Bloomberg-style animated background pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)',
                                backgroundSize: '100% 4px'
                            }}></div>
                        </div>

                        <div className="max-w-7xl mx-auto px-6 py-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    {/* Logo avec effet Bloomberg */}
                                    <div className="relative p-3 rounded-lg bg-green-500/10 border border-green-500/30 shadow-lg shadow-green-500/10">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent rounded-lg"></div>
                                        <img
                                            src="/logojslaidark.jpg"
                                            alt="JSL AI Logo"
                                            className="w-20 h-20 object-contain relative z-10"
                                        />
                                    </div>

                                    <div className="border-l border-green-500/30 pl-6 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h1 className="text-4xl font-black tracking-tight text-white" style={{fontFamily: "'Avenir Pro 85 Heavy', 'Avenir Next', 'Avenir', 'Montserrat', 'Inter', sans-serif", fontWeight: 900, letterSpacing: '-0.02em'}}>
                                                    TERMINAL FINANCIER
                                                    <br />
                                                    <span className="avenir-heavy text-3xl" style={{color: '#4ade80', fontWeight: 900}}>Emma IA</span>
                                                    <span className="ml-3 text-xs font-normal px-2 py-1 rounded bg-green-500/20 text-green-300">BÊTA</span>
                                                </h1>
                                                <p className="text-xs font-medium tracking-wider mt-1 font-['Inter'] text-gray-400">
                                                    Propulsé par <span className="font-bold text-green-400">JSL AI</span> - Tous droits réservés
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-auto">
                                    {/* Live indicator */}
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                                        isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'
                                    }`}>
                                        <div className="relative">
                                            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></div>
                                            <div className={`absolute inset-0 w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} animate-ping opacity-75`}></div>
                                        </div>
                                        <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>LIVE</span>
                                    </div>

                                    {/* Theme toggle - icône seulement */}
                                    <button
                                        onClick={toggleTheme}
                                        className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105 border ${
                                            isDarkMode
                                                ? 'bg-gray-800 hover:bg-gray-700 border-green-500/30 text-green-400'
                                                : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                                        }`}
                                        title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
                                    >
                                        <span className="text-sm">{isDarkMode ? '☀️' : '🌙'}</span>
                                    </button>

                                    {/* Bouton de déconnexion - icône seulement */}
                                    <button
                                        onClick={() => {
                                            if (confirm('Voulez-vous vraiment vous déconnecter?')) {
                                                // Nettoyer toutes les données de session
                                                sessionStorage.clear();
                                                localStorage.clear();
                                                
                                                // Rediriger vers la page de login
                                                window.location.href = '/login.html';
                                            }
                                        }}
                                        className={`p-1.5 rounded-md transition-all duration-300 hover:scale-105 border ${
                                            isDarkMode
                                                ? 'bg-gray-800 hover:bg-gray-700 border-red-500/30 text-red-400'
                                                : 'bg-white hover:bg-gray-50 border-red-300 text-red-600'
                                        }`}
                                        title="Déconnexion"
                                    >
                                        <i className="iconoir-log-out text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bloomberg-style bottom accent line */}
                        <div className="h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                    </header>

                    {/* TradingView Ticker Tape Widget - Bandeau de cotations */}
                    <div className="tradingview-widget-container md:ml-20" ref={tickerTapeRef}>
                        <div className="tradingview-widget-container__widget"></div>
                    </div>

                    {/* Desktop Sidebar Navigation */}
                    <aside className={`hidden md:flex fixed left-0 top-0 h-full w-20 flex-col backdrop-blur-sm transition-all duration-300 z-40 ${
                        isDarkMode
                            ? 'bg-black/95 border-r border-green-500/10'
                            : 'bg-white/95 border-r-2 border-gray-200'
                    } ${showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {/* Logo section */}
                        <div className={`flex items-center justify-center h-20 border-b ${
                            isDarkMode ? 'border-green-500/10' : 'border-gray-200'
                        }`}>
                            <img
                                src="/logojslaidark.jpg"
                                alt="JSL AI"
                                className="w-12 h-12 object-contain"
                            />
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 overflow-y-auto py-4">
                            {tabs.map(tab => {
                                const iconClass = getTabIcon(tab.id);
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onMouseDown={withRipple}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`w-full flex flex-col items-center justify-center py-4 px-2 btn-ripple relative transition-all duration-300 group ${
                                            isActive
                                                ? (isDarkMode
                                                    ? 'text-green-400 bg-gradient-to-r from-gray-900/50 to-transparent'
                                                    : 'text-green-600 bg-gradient-to-r from-green-50 to-transparent')
                                                : (isDarkMode
                                                    ? 'text-gray-400 hover:text-green-300 hover:bg-gray-900/30'
                                                    : 'text-gray-600 hover:text-green-700 hover:bg-gray-50')
                                        }`}
                                        title={tab.label}
                                    >
                                        {/* Active indicator - left bar with glow */}
                                        {isActive && (
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r transition-all duration-300 ${
                                                isDarkMode 
                                                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                                                    : 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.4)]'
                                            }`}></div>
                                        )}

                                        {/* Icon Container with enhanced styling */}
                                        <div className={`relative mb-2 transition-all duration-300 ${
                                            isActive 
                                                ? 'scale-110' 
                                                : 'scale-100 group-hover:scale-105'
                                        }`}>
                                            {/* Glow effect for active icon */}
                                            {isActive && (
                                                <div className={`absolute inset-0 rounded-full blur-md opacity-50 transition-all duration-300 ${
                                                    isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                                }`} style={{
                                                    transform: 'scale(1.5)',
                                                    filter: 'blur(8px)'
                                                }}></div>
                                            )}
                                            
                                            {/* Icon with enhanced styling */}
                                            {iconClass ? (
                                                <i className={`${iconClass} text-2xl relative z-10 transition-all duration-300 ${
                                                    isActive
                                                        ? (isDarkMode 
                                                            ? 'drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]' 
                                                            : 'drop-shadow-[0_0_4px_rgba(22,163,74,0.6)]')
                                                        : 'drop-shadow-none'
                                                }`} style={{
                                                    display: 'inline-block',
                                                    filter: isActive 
                                                        ? (isDarkMode 
                                                            ? 'drop-shadow(0 0 6px rgba(34,197,94,0.8))' 
                                                            : 'drop-shadow(0 0 4px rgba(22,163,74,0.6))')
                                                        : 'none'
                                                }}></i>
                                            ) : (
                                                <span className="text-2xl">📊</span>
                                            )}
                                        </div>

                                        {/* Label (shown on hover) */}
                                        <span className={`text-xs font-semibold text-center leading-tight transition-all duration-300 ${
                                            isActive 
                                                ? 'opacity-100' 
                                                : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                            {tab.label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}
                                        </span>

                                        {/* Active dot indicator with pulse */}
                                        {isActive && (
                                            <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                                isDarkMode 
                                                    ? 'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]' 
                                                    : 'bg-green-600 shadow-[0_0_4px_rgba(22,163,74,0.6)]'
                                            } animate-pulse`}></span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Mobile Bottom Navigation Bar */}
                    <nav className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-sm transition-all duration-300 z-40 ${
                                            isDarkMode
                            ? 'bg-black/95 border-t border-green-500/10'
                            : 'bg-white/95 border-t-2 border-gray-200'
                    } ${showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex items-center justify-around px-2 pb-safe">
                            {tabs.slice(0, 5).map(tab => {
                                const iconClass = getTabIcon(tab.id);
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onMouseDown={withRipple}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`flex-1 flex flex-col items-center justify-center py-3 px-1 btn-ripple relative transition-all duration-300 group ${
                                            isActive
                                                ? (isDarkMode
                                                    ? 'text-green-400'
                                                    : 'text-green-600')
                                                : (isDarkMode
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600')
                                        }`}
                                    >
                                        {/* Active indicator - top bar with glow */}
                                        {isActive && (
                                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b transition-all duration-300 ${
                                                isDarkMode 
                                                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                                                    : 'bg-green-600 shadow-[0_0_6px_rgba(22,163,74,0.4)]'
                                            } animate-slide-down`}></div>
                                        )}

                                        {/* Icon Container with enhanced styling */}
                                        <div className={`relative mb-1 transition-all duration-300 ${
                                            isActive 
                                                ? 'scale-110' 
                                                : 'scale-100 group-hover:scale-105'
                                        }`}>
                                            {/* Glow effect for active icon */}
                                            {isActive && (
                                                <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-all duration-300 ${
                                                    isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                                }`} style={{
                                                    transform: 'scale(1.8)',
                                                    filter: 'blur(10px)'
                                                }}></div>
                                            )}
                                            
                                            {/* Icon with enhanced styling */}
                                            {iconClass ? (
                                                <i className={`${iconClass} text-2xl relative z-10 transition-all duration-300 ${
                                                    isActive
                                                        ? (isDarkMode 
                                                            ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]' 
                                                            : 'drop-shadow-[0_0_6px_rgba(22,163,74,0.7)]')
                                                        : 'drop-shadow-none'
                                                }`} style={{ display: 'inline-block' }}></i>
                                            ) : (
                                                <span className="text-2xl">📊</span>
                                            )}
                                        </div>

                                        {/* Label */}
                                        <span className={`text-xs font-semibold text-center leading-tight transition-all duration-300 ${
                                            isActive ? 'font-bold' : ''
                                        }`}>
                                            {tab.label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().split(' ')[0]}
                                        </span>
                                    </button>
                                );
                            })}

                            {/* Menu button for additional tabs */}
                            <button
                                onClick={() => {
                                    const moreTabs = tabs.slice(5);
                                    if (moreTabs.length > 0) {
                                        setShowMoreTabsOverlay(!showMoreTabsOverlay);
                                    }
                                }}
                                className={`flex-1 flex flex-col items-center justify-center py-3 px-1 btn-ripple relative transition-all duration-200 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                } ${showMoreTabsOverlay ? 'bg-opacity-10 bg-blue-500' : ''}`}
                            >
                                <i className="iconoir-menu text-2xl mb-1"></i>
                                <span className="text-xs font-medium">Plus</span>
                            </button>
                            </div>
                    </nav>

                    {/* Overlay pour les onglets supplémentaires */}
                    {showMoreTabsOverlay && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                                onClick={() => setShowMoreTabsOverlay(false)}
                            ></div>

                            {/* Overlay Panel */}
                            <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
                                showMoreTabsOverlay ? 'translate-y-0' : 'translate-y-full'
                            }`}>
                                <div className={`rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                    {/* Header */}
                                    <div className={`sticky top-0 px-6 py-4 border-b ${
                                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                <Icon emoji="📱" size={20} />
                                                Autres onglets
                                            </h3>
                                            <button
                                                onClick={() => setShowMoreTabsOverlay(false)}
                                                className={`p-2 rounded-full transition-colors ${
                                        isDarkMode
                                                        ? 'hover:bg-gray-700 text-gray-400'
                                                        : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                            </div>
                        </div>

                                    {/* Tabs List */}
                                    <div className="p-4">
                                        {tabs.slice(5).map((tab) => {
                                            const iconClass = getTabIcon(tab.id);
                                            const isActive = activeTab === tab.id;

                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => {
                                                        handleTabChange(tab.id);
                                                        setShowMoreTabsOverlay(false);
                                                    }}
                                                    className={`w-full flex items-center gap-4 p-4 rounded-xl mb-2 transition-all duration-300 group ${
                                                        isActive
                                                            ? isDarkMode
                                                                ? 'bg-gradient-to-r from-green-900/40 to-green-800/20 border-2 border-green-500 shadow-lg shadow-green-500/20'
                                                                : 'bg-gradient-to-r from-green-50 to-green-100/50 border-2 border-green-500 shadow-lg shadow-green-500/10'
                                                            : isDarkMode
                                                                ? 'bg-gray-700/50 hover:bg-gray-600/70 border-2 border-transparent hover:border-gray-600'
                                                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className={`relative flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
                                                        isActive
                                                            ? (isDarkMode
                                                                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/40'
                                                                : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30')
                                                            : (isDarkMode
                                                                ? 'bg-gray-600/50 text-gray-300 group-hover:bg-gray-500/70'
                                                                : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300')
                                                    }`}>
                                                        {/* Glow effect for active icon */}
                                                        {isActive && (
                                                            <div className={`absolute inset-0 rounded-xl blur-lg opacity-50 transition-all duration-300 ${
                                                                isDarkMode ? 'bg-green-500' : 'bg-green-400'
                                                            }`} style={{
                                                                transform: 'scale(1.3)',
                                                                filter: 'blur(12px)'
                                                            }}></div>
                                                        )}
                                                        
                                                        {/* Icon with enhanced styling */}
                                                        <i className={`${iconClass} text-2xl relative z-10 transition-all duration-300 ${
                                                            isActive
                                                                ? (isDarkMode 
                                                                    ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' 
                                                                    : 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]')
                                                                : 'drop-shadow-none'
                                                        } ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}></i>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className={`font-semibold ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {tab.label}
                                                        </div>
                                                    </div>
                                                    {isActive && (
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}

                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Audio UI feedback (désactivé par défaut jusqu'au premier geste utilisateur) */}
                    <audio ref={tabSoundRef} preload="auto" className="hidden">
                        <source src="https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3" type="audio/mpeg" />
                    </audio>
                    <audio ref={clickSoundRef} preload="auto" className="hidden">
                        <source src="https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3" type="audio/mpeg" />
                    </audio>

                    {/* Écran de chargement initial - Animation JLab */}
                    {showLoadingScreen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black emma-intro-overlay">
                            <div className="text-center">
                                <div className="mb-6">
                                    <img
                                        src={'jlab.png'}
                                        alt="JLab"
                                        className="emma-intro-image w-72 h-72 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-green-500"
                                    />
                                </div>
                                <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">JLab™</h2>
                                <p className="text-green-300 text-lg">Laboratoire d'analyse financière • JSL AI</p>
                            </div>
                        </div>
                    )}

                    {/* Contenu principal */}
                    <main className={`max-w-7xl mx-auto p-6 md:ml-20 pb-24 md:pb-6 transition-opacity duration-500 ${
                        showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}>
                        {activeTab === 'stocks-news' && <StocksNewsTab />}
                        {activeTab === 'markets-economy' && <MarketsEconomyTab />}
                        {activeTab === 'yield-curve' && <YieldCurveTab />}
                        {activeTab === 'intellistocks' && <IntelliStocksTab />}
                        {activeTab === 'ask-emma' && <AskEmmaTab
                            prefillMessage={emmaPrefillMessage}
                            setPrefillMessage={setEmmaPrefillMessage}
                            autoSend={emmaAutoSend}
                            setAutoSend={setEmmaAutoSend}
                            emmaConnected={emmaConnected}
                            setEmmaConnected={setEmmaConnected}
                            showPromptEditor={showPromptEditor}
                            setShowPromptEditor={setShowPromptEditor}
                            showTemperatureEditor={showTemperatureEditor}
                            setShowTemperatureEditor={setShowTemperatureEditor}
                            showLengthEditor={showLengthEditor}
                            setShowLengthEditor={setShowLengthEditor}
                        />}
                        {activeTab === 'plus' && <PlusTab />}
                        {activeTab === 'admin-jsla' && <AdminJSLaiTab
                            emmaConnected={emmaConnected}
                            setEmmaConnected={setEmmaConnected}
                            showPromptEditor={showPromptEditor}
                            setShowPromptEditor={setShowPromptEditor}
                            showTemperatureEditor={showTemperatureEditor}
                            setShowTemperatureEditor={setShowTemperatureEditor}
                            showLengthEditor={showLengthEditor}
                            setShowLengthEditor={setShowLengthEditor}
                        />}
                        {activeTab === 'dans-watchlist' && <DansWatchlistTab />}
                        {activeTab === 'scrapping-sa' && <ScrappingSATab />}
                        {activeTab === 'email-briefings' && <EmailBriefingsTab />}
                        {activeTab === 'seeking-alpha' && <SeekingAlphaTab />}
                        {activeTab === 'economic-calendar' && <EconomicCalendarTab />}
                        {activeTab === 'investing-calendar' && <InvestingCalendarTab />}
                    </main>

                    {/* Messages */}
                    {message && (
                        <div className={`fixed top-4 right-4 p-4 rounded-lg z-50 ${
                            message.type === 'error' ? 'bg-red-500' : 
                            message.type === 'success' ? 'bg-green-500' : 'bg-gray-700'
                        } text-white`}>
                            {message.text}
                        </div>
                    )}

                    {/* Modal de comparaison de peers */}
                    {showPeersModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                            <div className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
                                isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-300'
                            }`}>
                                {/* Header de la modal */}
                                <div className={`p-6 border-b ${
                                    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className={`text-2xl font-bold ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                🔍 Comparaison de Peers - {selectedTickerForPeers}
                                            </h2>
                                            <p className={`text-sm ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                Données de comparaison avec les entreprises du même secteur
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowPeersModal(false);
                                                setSelectedTickerForPeers(null);
                                                setPeersData(null);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${
                                                isDarkMode 
                                                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Contenu de la modal */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                    {loadingPeers ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Chargement des données de comparaison...
                                                </p>
                                            </div>
                                        </div>
                                    ) : peersData ? (
                                        <div className="space-y-6">
                                            {/* Métriques générales */}
                                            <div className={`rounded-lg p-4 ${
                                                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                            }`}>
                                                <h3 className={`text-lg font-semibold mb-3 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                    📊 Métriques du Secteur
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className={`p-3 rounded-lg ${
                                                        isDarkMode ? 'bg-gray-700' : 'bg-white'
                                                    }`}>
                                                        <div className={`text-sm ${
                                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>P/E Moyen</div>
                                                        <div className={`text-xl font-bold ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {peersData.data.metrics?.averagePE || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div className={`p-3 rounded-lg ${
                                                        isDarkMode ? 'bg-gray-700' : 'bg-white'
                                                    }`}>
                                                        <div className={`text-sm ${
                                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>Market Cap Moyen</div>
                                                        <div className={`text-xl font-bold ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {peersData.data.metrics?.averageMarketCap || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div className={`p-3 rounded-lg ${
                                                        isDarkMode ? 'bg-gray-700' : 'bg-white'
                                                    }`}>
                                                        <div className={`text-sm ${
                                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>Nombre de Peers</div>
                                                        <div className={`text-xl font-bold ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {peersData.data.peers?.length || 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tableau des peers */}
                                            <div className={`rounded-lg overflow-hidden ${
                                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                                            }`}>
                                                <h3 className={`text-lg font-semibold p-4 border-b ${
                                                    isDarkMode 
                                                        ? 'text-white border-gray-700 bg-gray-800' 
                                                        : 'text-gray-900 border-gray-200 bg-gray-50'
                                                }`}>
                                                    🏢 Liste des Peers
                                                </h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className={`${
                                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                                        }`}>
                                                            <tr>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>Symbole</th>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>Nom</th>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>Prix</th>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>Change</th>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>P/E</th>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>Market Cap</th>
                                                                <th className={`px-4 py-3 text-left text-sm font-medium ${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                }`}>Secteur</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {peersData.data.peers?.map((peer, index) => (
                                                                <tr key={index} className={`border-b ${
                                                                    isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                                                                }`}>
                                                                    <td className={`px-4 py-3 ${
                                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                                    }`}>
                                                                        <div className="flex items-center gap-2">
                                                                            <img 
                                                                                src={getCompanyLogo(peer.symbol)} 
                                                                                alt={`${peer.symbol} logo`}
                                                                                className="w-6 h-6 rounded"
                                                                                onError={(e) => {
                                                                                    e.target.style.display = 'none';
                                                                                }}
                                                                            />
                                                                            <span className="font-semibold">{peer.symbol}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className={`px-4 py-3 ${
                                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                    }`}>{peer.name}</td>
                                                                    <td className={`px-4 py-3 font-semibold ${
                                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                                    }`}>${peer.price}</td>
                                                                    <td className={`px-4 py-3 ${
                                                                        peer.change >= 0 
                                                                            ? 'text-green-500' 
                                                                            : 'text-red-500'
                                                                    }`}>
                                                                        {peer.change >= 0 ? '+' : ''}{peer.change}%
                                                                    </td>
                                                                    <td className={`px-4 py-3 ${
                                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                    }`}>{peer.pe}</td>
                                                                    <td className={`px-4 py-3 ${
                                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                    }`}>{peer.marketCap}</td>
                                                                    <td className={`px-4 py-3 ${
                                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                    }`}>{peer.sector}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Analyse */}
                                            {peersData.data.analysis && (
                                                <div className={`rounded-lg p-4 ${
                                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                                }`}>
                                                    <h3 className={`text-lg font-semibold mb-3 ${
                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        📈 Analyse Comparative
                                                    </h3>
                                                    <p className={`${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                        {peersData.data.analysis}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Lien vers Seeking Alpha */}
                                            <div className="text-center">
                                                <a
                                                    href={peersData.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                                        isDarkMode
                                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg'
                                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg'
                                                    }`}
                                                >
                                                    🌐 Voir sur Seeking Alpha
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className={`text-lg ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                ❌ Aucune donnée de comparaison disponible pour {selectedTickerForPeers}
                                            </div>
                                            <p className={`text-sm mt-2 ${
                                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                            }`}>
                                                Les données de peers seront disponibles après le scraping des pages de comparaison.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {showEmmaAvatar && (
                        <div className="fixed bottom-10 right-6 z-50 flex flex-col items-end gap-0.5 pointer-events-none">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border pointer-events-auto ${
                                isDarkMode ? 'bg-blue-500 text-white border-blue-300' : 'bg-blue-600 text-white border-blue-400'
                            }`}>
                                Emma IA
                            </span>
                            <div className={`px-4 py-2 rounded-full text-sm shadow-lg border pointer-events-auto -mt-0.5 ${
                                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                            }`}>
                                Bonjour {userDisplayName} !
                            </div>
                            <button
                                onClick={openAskEmma}
                                className="relative focus:outline-none pointer-events-auto -mt-1"
                                aria-label="Parler à Emma"
                                style={{ transition: 'transform 0.2s ease' }}
                            >
                                <img
                                    src={assistantAvatar}
                                    alt="Emma avatar"
                                    className="w-24 h-24 rounded-full shadow-2xl border-2 border-white object-cover"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmmaAvatar(false);
                                    }}
                                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                                    aria-label="Fermer Emma"
                                    title="Fermer"
                                >
                                    ×
                                </button>
                            </button>


export default MarketsEconomyTab;
