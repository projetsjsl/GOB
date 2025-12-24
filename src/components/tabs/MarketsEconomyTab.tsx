import React, { useRef, useEffect } from 'react';
import type { TabProps } from '../../types';
import { ExpandableComponent } from '../shared/ExpandableComponent';

export const MarketsEconomyTab: React.FC<TabProps> = (props) => {
    const {
        isDarkMode = true
    } = props;

    // Refs pour les widgets TradingView
    const marketOverviewRef = useRef<HTMLDivElement>(null);
    const heatmapRef = useRef<HTMLDivElement>(null);
    const screenerRef = useRef<HTMLDivElement>(null);
    const forexHeatmapRef = useRef<HTMLDivElement>(null);
    const economicCalendarRef = useRef<HTMLDivElement>(null);

    // Charger les widgets TradingView
    useEffect(() => {
        // Market Overview Widget
        if (marketOverviewRef.current) {
            marketOverviewRef.current.innerHTML = '';
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
            heatmapRef.current.innerHTML = '';
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
            screenerRef.current.innerHTML = '';
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

        // Forex Heatmap Widget
        if (forexHeatmapRef.current) {
            forexHeatmapRef.current.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "width": "100%",
                "height": "100%",
                "currencies": ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"],
                "isTransparent": false,
                "colorTheme": isDarkMode ? "dark" : "light",
                "locale": "fr"
            });
            forexHeatmapRef.current.appendChild(script);
        }

        // Economic Calendar Widget
        if (economicCalendarRef.current) {
            economicCalendarRef.current.innerHTML = '';
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "colorTheme": isDarkMode ? "dark" : "light",
                "isTransparent": false,
                "width": "100%",
                "height": "100%",
                "locale": "fr",
                "importanceFilter": "-1,0,1",
                "countryFilter": "us,ca,eu,gb,jp,cn"
            });
            economicCalendarRef.current.appendChild(script);
        }
        
        // CLEANUP: Prevent memory leaks by removing widget content on unmount/re-render
        return () => {
            if (marketOverviewRef.current) marketOverviewRef.current.innerHTML = '';
            if (heatmapRef.current) heatmapRef.current.innerHTML = '';
            if (screenerRef.current) screenerRef.current.innerHTML = '';
            if (forexHeatmapRef.current) forexHeatmapRef.current.innerHTML = '';
            if (economicCalendarRef.current) economicCalendarRef.current.innerHTML = '';
        };
    }, [isDarkMode]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>📊 Marchés & Économie</h2>
            </div>

            {/* ===== WIDGETS TRADING VIEW VISUELS ===== */}
            <div className="grid grid-cols-1 gap-6">
                
                {/* Market Overview Widget */}
                <ExpandableComponent title="Vue d'ensemble des Marchés" icon="📊" isDarkMode={isDarkMode}>
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
                </ExpandableComponent>

                {/* Stock Heatmap Widget */}
                <ExpandableComponent title="Heatmap Boursière" icon="🔥" isDarkMode={isDarkMode}>
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
                </ExpandableComponent>

                {/* Forex Heatmap Widget */}
                <ExpandableComponent title="Forex Heat Map" icon="💱" isDarkMode={isDarkMode}>
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800/50 border-yellow-500/30'
                            : 'bg-white border-yellow-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                💱 Forex Heat Map
                            </h3>
                            <p className={`text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Force relative des devises principales
                            </p>
                        </div>
                        <div ref={forexHeatmapRef} style={{height: '400px'}}></div>
                    </div>
                </ExpandableComponent>

                {/* Economic Calendar Widget */}
                <ExpandableComponent title="Calendrier Économique" icon="📅" isDarkMode={isDarkMode}>
                    <div className={`rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800/50 border-orange-500/30'
                            : 'bg-white border-orange-400/40'
                    }`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                📅 Calendrier Économique
                            </h3>
                            <p className={`text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Événements économiques à venir
                            </p>
                        </div>
                        <div ref={economicCalendarRef} style={{height: '500px'}}></div>
                    </div>
                </ExpandableComponent>

                {/* Screener Widget - Top Gainers/Losers */}
                <ExpandableComponent title="Screener - Top Gainers & Losers" icon="🚀" isDarkMode={isDarkMode}>
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
                </ExpandableComponent>
            </div>
        </div>
    );
};

export default MarketsEconomyTab;
