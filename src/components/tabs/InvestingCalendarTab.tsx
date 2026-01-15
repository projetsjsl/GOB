// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { TabProps } from '../../types';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export const InvestingCalendarTab: React.FC<TabProps> = (props) => {
    const {
        isDarkMode = true,
        watchlistTickers: watchlistTickersProp = [],
        teamTickers: teamTickersProp = [],
        stockData: stockDataProp = {}
    } = props;

    const watchlistTickers = Array.isArray(watchlistTickersProp) ? watchlistTickersProp : [];
    const teamTickers = Array.isArray(teamTickersProp) ? teamTickersProp : [];
    const stockData = Object.keys(stockDataProp).length > 0 ? stockDataProp : {};

                // Refs pour les widgets TradingView
                const tradingViewForexRef = useRef(null);
                const tradingViewEventsRef = useRef(null);
                const tradingViewCrossRatesRef = useRef(null);
                const tradingViewHeatmapRef = useRef(null);
                const tradingViewHeatmapTSXRef = useRef(null);
                const tradingViewChartSPYRef = useRef(null);
                const tradingViewMarketQuotesRef = useRef(null);
                const tradingViewSymbolInfoRef = useRef(null);
                const tradingViewTimelineRef = useRef(null);
                const tradingViewScreenerRef = useRef(null);
                const tradingViewSymbolProfileRef = useRef(null);
                const tradingViewFinancialsRef = useRef(null);
                const tradingViewTechnicalAnalysisRef = useRef(null);

                // Refs pour suivre l'etat d'initialisation des widgets
                const forexInitialized = useRef(false);
                const eventsInitialized = useRef(false);
                const crossRatesInitialized = useRef(false);
                const heatmapInitialized = useRef(false);
                const heatmapTSXInitialized = useRef(false);
                const chartSPYInitialized = useRef(false);
                const marketQuotesInitialized = useRef(false);
                const symbolInfoInitialized = useRef(false);
                const timelineInitialized = useRef(false);
                const screenerInitialized = useRef(false);
                const symbolProfileInitialized = useRef(false);
                const financialsInitialized = useRef(false);
                const technicalAnalysisInitialized = useRef(false);

                // State pour les symboles configurables
                const [timelineSymbol, setTimelineSymbol] = useState('BITSTAMP:BTCUSD');
                const [searchQuery, setSearchQuery] = useState('');
                const [showSearchResults, setShowSearchResults] = useState(false);
                const searchInputRef = useRef(null);

                const resolveSymbolForTicker = (ticker: string) => {
                    const info = stockData?.[ticker];
                    if (info?.symbol && typeof info.symbol === 'string') {
                        if (info.symbol.includes(':')) return info.symbol;
                        if (info.exchange) {
                            return `${info.exchange}:${info.symbol}`;
                        }
                        return `NASDAQ:${info.symbol}`;
                    }
                    if (info?.exchange && info?.ticker) {
                        return `${info.exchange}:${info.ticker}`;
                    }
                    return ticker.includes(':') ? ticker : `NASDAQ:${ticker}`;
                };

                const baseSearchSymbols = useMemo(() => ([
                    { symbol: 'FOREXCOM:SPXUSD', name: 'SPY - S&P 500', category: ' Indices' },
                    { symbol: 'FOREXCOM:NSXUSD', name: 'QQQ - Nasdaq 100', category: ' Indices' },
                    { symbol: 'FOREXCOM:DJI', name: 'DJI - Dow Jones', category: ' Indices' },
                    { symbol: 'NASDAQ:AAPL', name: 'AAPL - Apple', category: ' Tech' },
                    { symbol: 'NASDAQ:MSFT', name: 'MSFT - Microsoft', category: ' Tech' },
                    { symbol: 'NASDAQ:GOOGL', name: 'GOOGL - Google', category: ' Tech' },
                    { symbol: 'NASDAQ:AMZN', name: 'AMZN - Amazon', category: ' Tech' },
                    { symbol: 'NASDAQ:NVDA', name: 'NVDA - NVIDIA', category: ' Tech' },
                    { symbol: 'NASDAQ:TSLA', name: 'TSLA - Tesla', category: ' Tech' },
                    { symbol: 'NASDAQ:META', name: 'META - Meta', category: ' Tech' },
                    { symbol: 'BITSTAMP:BTCUSD', name: 'BTC - Bitcoin', category: ' Crypto' },
                    { symbol: 'BITSTAMP:ETHUSD', name: 'ETH - Ethereum', category: ' Crypto' },
                    { symbol: 'NYSE:JPM', name: 'JPM - JPMorgan', category: ' Finance' },
                    { symbol: 'NYSE:BAC', name: 'BAC - Bank of America', category: ' Finance' },
                    { symbol: 'NYSE:GS', name: 'GS - Goldman Sachs', category: ' Finance' }
                ]), []);

                const watchlistSearchSymbols = useMemo(() => {
                    return (watchlistTickers || []).map((ticker) => ({
                        symbol: resolveSymbolForTicker(ticker),
                        name: `${ticker} - Watchlist`,
                        category: ' Watchlist'
                    }));
                }, [watchlistTickers, stockData]);

                const teamSearchSymbols = useMemo(() => {
                    return (teamTickers || []).map((ticker) => ({
                        symbol: resolveSymbolForTicker(ticker),
                        name: `${ticker} - Team`,
                        category: ' Team'
                    }));
                }, [teamTickers, stockData]);

                const availableSearchSymbols = useMemo(() => {
                    const merged = [...baseSearchSymbols, ...watchlistSearchSymbols, ...teamSearchSymbols];
                    const seen = new Set();
                    return merged.filter(item => {
                        if (seen.has(item.symbol)) {
                            return false;
                        }
                        seen.add(item.symbol);
                        return true;
                    });
                }, [baseSearchSymbols, watchlistSearchSymbols, teamSearchSymbols]);

                // Ecouter les changements de symbole depuis l'Advanced Chart (TradingView iframe)
                useEffect(() => {
                    const handleTradingViewMessage = (event) => {
                        // Securite: verifier que le message vient de TradingView
                        if (!event.origin.includes('tradingview.com')) return;

                        // Logger tous les messages pour debug
                        console.log(' TradingView message:', event.data);

                        // Detecter les differents formats de messages possibles
                        try {
                            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                            // Format 1: {name: 'tv-widget-symbol-changed', data: {symbol: 'NASDAQ:AAPL'}}
                            if (data.name === 'tv-widget-symbol-changed' && data.data?.symbol) {
                                console.log(' Symbol changed in Advanced Chart:', data.data.symbol);
                                setTimelineSymbol(data.data.symbol);
                            }

                            // Format 2: {type: 'symbol-change', symbol: 'NASDAQ:AAPL'}
                            if (data.type === 'symbol-change' && data.symbol) {
                                console.log(' Symbol changed in Advanced Chart:', data.symbol);
                                setTimelineSymbol(data.symbol);
                            }

                            // Format 3: direct symbol string
                            if (data.symbol && !data.name && !data.type) {
                                console.log(' Symbol changed in Advanced Chart:', data.symbol);
                                setTimelineSymbol(data.symbol);
                            }
                        } catch (error) {
                            // Si le parsing echoue, ce n'est pas grave, on ignore
                        }
                    };

                    window.addEventListener('message', handleTradingViewMessage);

                    return () => {
                        window.removeEventListener('message', handleTradingViewMessage);
                    };
                }, []);

                // Charger le script TradingView Forex Heat Map
                useEffect(() => {
                    //  TradingView-compliant widget initialization
                    const container = tradingViewForexRef.current;
                    if (!container || container.children.length > 0) return;

                    // Creer le div du widget
                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    // Creer et configurer le script
                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';
                    script.async = true;
                    script.text = JSON.stringify({
                        colorTheme: isDarkMode ? 'dark' : 'light',
                        isTransparent: true,
                        locale: 'fr',
                        currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'CNY'],
                        width: '100%',
                        height: 400
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    forexInitialized.current = true;

                    // Cleanup
                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            forexInitialized.current = false;
                        }
                    };
                }, [isDarkMode]);

                // Charger le script TradingView Events (Economic Calendar)
                useEffect(() => {
                    const container = tradingViewEventsRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
                    script.async = true;
                    script.text = JSON.stringify({
                        colorTheme: 'light',
                        isTransparent: false,
                        locale: 'en',
                        countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
                        importanceFilter: '-1,0,1',
                        width: 400,
                        height: 550
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    eventsInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            eventsInitialized.current = false;
                        }
                    };
                }, []);

                // Charger le script TradingView Forex Cross Rates
                useEffect(() => {
                    const container = tradingViewCrossRatesRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        colorTheme: isDarkMode ? 'dark' : 'light',
                        isTransparent: false,
                        locale: 'fr',
                        currencies: [
                            'EUR',
                            'USD',
                            'JPY',
                            'GBP',
                            'CHF',
                            'AUD',
                            'CAD',
                            'NZD',
                            'CNY'
                        ],
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        width: '100%',
                        height: 400
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    crossRatesInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            crossRatesInitialized.current = false;
                        }
                    };
                }, [isDarkMode]);

                // Charger le script TradingView Stock Heatmap
                useEffect(() => {
                    const container = tradingViewHeatmapRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        dataSource: 'AllUSA',
                        blockSize: 'market_cap_basic',
                        blockColor: 'change',
                        grouping: 'sector',
                        locale: 'fr',
                        symbolUrl: '',
                        colorTheme: 'dark',
                        exchanges: [],
                        hasTopBar: true,
                        isDataSetEnabled: true,
                        isZoomEnabled: true,
                        hasSymbolTooltip: true,
                        isMonoSize: false,
                        width: '100%',
                        height: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    heatmapInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            heatmapInitialized.current = false;
                        }
                    };
                }, []);

                // Charger le script TradingView Stock Heatmap TSX
                useEffect(() => {
                    const container = tradingViewHeatmapTSXRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        dataSource: 'TSX',
                        blockSize: 'market_cap_basic',
                        blockColor: 'change',
                        grouping: 'sector',
                        locale: 'fr',
                        symbolUrl: '',
                        colorTheme: 'dark',
                        exchanges: [],
                        hasTopBar: true,
                        isDataSetEnabled: true,
                        isZoomEnabled: true,
                        hasSymbolTooltip: true,
                        isMonoSize: false,
                        width: '100%',
                        height: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    heatmapTSXInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            heatmapTSXInitialized.current = false;
                        }
                    };
                }, []);

                // Charger le script TradingView Advanced Chart (synchronise)
                useEffect(() => {
                    const container = tradingViewChartSPYRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        allow_symbol_change: true,
                        calendar: false,
                        details: true,
                        hide_side_toolbar: false,
                        hide_top_toolbar: false,
                        hide_legend: false,
                        hide_volume: false,
                        hotlist: false,
                        interval: 'D',
                        locale: 'fr',
                        save_image: true,
                        style: '3',
                        symbol: timelineSymbol,
                        theme: 'dark',
                        timezone: 'America/Toronto',
                        backgroundColor: '#0F0F0F',
                        gridColor: 'rgba(242, 242, 242, 0.06)',
                        watchlist: [
                            'FOREXCOM:SPXUSD',
                            'FOREXCOM:NSXUSD',
                            'FOREXCOM:DJI',
                            'NASDAQ:AAPL',
                            'NASDAQ:MSFT',
                            'NASDAQ:GOOGL',
                            'NASDAQ:AMZN',
                            'NASDAQ:NVDA',
                            'NASDAQ:TSLA',
                            'NASDAQ:META',
                            'BITSTAMP:BTCUSD',
                            'BITSTAMP:ETHUSD',
                            'NYSE:JPM',
                            'NYSE:BAC',
                            'NYSE:GS'
                        ],
                        withdateranges: true,
                        range: 'YTD',
                        compareSymbols: [],
                        show_popup_button: true,
                        popup_height: '800',
                        popup_width: '1200',
                        studies: [
                            'STD;Smoothed%1Moving%1Average',
                            'STD;RSI'
                        ],
                        width: 1200,
                        height: 800
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    chartSPYInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            chartSPYInitialized.current = false;
                        }
                    };
                }, [timelineSymbol]);

                // Charger le script TradingView Market Quotes
                useEffect(() => {
                    const container = tradingViewMarketQuotesRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        colorTheme: 'dark',
                        locale: 'fr',
                        largeChartUrl: '',
                        isTransparent: false,
                        showSymbolLogo: true,
                        backgroundColor: '#0F0F0F',
                        support_host: 'https://www.tradingview.com',
                        width: 600,
                        height: 800,
                        symbolsGroups: [
                            {
                                name: 'Indices',
                                symbols: [
                                    { name: 'FOREXCOM:SPXUSD', displayName: 'S&P 500 Index' },
                                    { name: 'FOREXCOM:NSXUSD', displayName: 'US 100 Cash CFD' },
                                    { name: 'FOREXCOM:DJI', displayName: 'Dow Jones Industrial Average Index' },
                                    { name: 'TSX:TSX', displayName: 'TSX' },
                                    { name: 'XETR:DAX', displayName: 'DAX' },
                                    { name: 'GOMARKETS:FTSE100', displayName: 'FTSE100' },
                                    { name: 'INDEX:NKY', displayName: 'Nikkei 225' }
                                ]
                            },
                            {
                                name: 'Futures',
                                symbols: [
                                    { name: 'BMFBOVESPA:ISP1!', displayName: 'S&P 500' },
                                    { name: 'CMCMARKETS:GOLD', displayName: 'Gold' },
                                ]
                            },
                            {
                                name: 'Forex',
                                symbols: [
                                    { name: 'FX:USDCAD', displayName: 'USD to CAD' },
                                    { name: 'FX_IDC:CADUSD', displayName: 'CAD to USD' },
                                    { name: 'FX:EURCAD', displayName: 'EUR to CAD' },
                                    { name: 'SAXO:CADEUR', displayName: 'CAD to EUR' }
                                ]
                            }
                        ]
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    marketQuotesInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            marketQuotesInitialized.current = false;
                        }
                    };
                }, []);

                // Charger le script TradingView Symbol Info (synchronise)
                useEffect(() => {
                    const container = tradingViewSymbolInfoRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        symbol: timelineSymbol,
                        colorTheme: 'dark',
                        isTransparent: false,
                        locale: 'fr',
                        width: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    symbolInfoInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            symbolInfoInitialized.current = false;
                        }
                    };
                }, [timelineSymbol]);

                // Charger le script TradingView Timeline (configurable)
                useEffect(() => {
                    const container = tradingViewTimelineRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        feedMode: 'symbol',
                        symbol: timelineSymbol,
                        colorTheme: 'dark',
                        isTransparent: false,
                        displayMode: 'regular',
                        locale: 'fr',
                        width: '100%',
                        height: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    timelineInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            timelineInitialized.current = false;
                        }
                    };
                }, [timelineSymbol]);

                // Charger le script TradingView Screener
                useEffect(() => {
                    const container = tradingViewScreenerRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        market: 'america',
                        showToolbar: true,
                        defaultColumn: 'overview',
                        defaultScreen: 'most_capitalized',
                        isTransparent: false,
                        locale: 'fr',
                        colorTheme: 'dark',
                        width: '100%',
                        height: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    screenerInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            screenerInitialized.current = false;
                        }
                    };
                }, []);

                // Charger le script TradingView Symbol Profile (synchronise)
                useEffect(() => {
                    const container = tradingViewSymbolProfileRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        symbol: timelineSymbol,
                        colorTheme: 'dark',
                        isTransparent: false,
                        locale: 'fr',
                        width: '100%',
                        height: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    symbolProfileInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            symbolProfileInitialized.current = false;
                        }
                    };
                }, [timelineSymbol]);

                // Charger le script TradingView Financials (synchronise)
                useEffect(() => {
                    const container = tradingViewFinancialsRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        symbol: timelineSymbol,
                        colorTheme: 'dark',
                        displayMode: 'regular',
                        isTransparent: false,
                        locale: 'fr',
                        width: '100%',
                        height: '100%'
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    financialsInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            financialsInitialized.current = false;
                        }
                    };
                }, [timelineSymbol]);

                // Charger le script TradingView Technical Analysis (synchronise)
                useEffect(() => {
                    const container = tradingViewTechnicalAnalysisRef.current;
                    if (!container || container.children.length > 0) return;

                    const widgetDiv = document.createElement('div');
                    widgetDiv.className = 'tradingview-widget-container__widget';

                    const script = document.createElement('script');
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
                    script.type = 'text/javascript';
                    script.async = true;
                    script.text = JSON.stringify({
                        colorTheme: 'dark',
                        displayMode: 'multiple',
                        isTransparent: false,
                        locale: 'fr',
                        interval: '1M',
                        disableInterval: false,
                        width: '100%',
                        height: '100%',
                        symbol: timelineSymbol,
                        showIntervalTabs: true
                    });

                    widgetDiv.appendChild(script);
                    container.appendChild(widgetDiv);
                    technicalAnalysisInitialized.current = true;

                    return () => {
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            technicalAnalysisInitialized.current = false;
                        }
                    };
                }, [timelineSymbol]);

                return (
                    <div className="space-y-3 md:space-y-6">
                        {/* En-tete principal TESTS JS */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-100 to-purple-100'
                        }`}>
                            <div className="mb-2">
                                <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     TESTS JS - Widgets Financiers
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-blue-200' : 'text-blue-800'
                                }`}>
                                    Collection complete de 14 widgets TradingView et outils d'analyse financiere organises par categorie
                                </p>
                            </div>
                        </div>

                        {/* ========================================== */}
                        {/* SECTION 1:  CALENDRIERS & EVENEMENTS    */}
                        {/* ========================================== */}
                        <div className="mb-2 md:mb-4">
                            <div className={`flex items-center gap-2 md:gap-3 mb-2 md:mb-4 pb-2 border-b-2 ${
                                isDarkMode ? 'border-blue-500' : 'border-blue-600'
                            }`}>
                                <h3 className={`text-base md:text-lg lg:text-xl font-bold transition-colors duration-300 ${
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                     Calendriers & Evenements Economiques
                                </h3>
                            </div>
                        </div>

                        {/* Calendrier Economique Investing.com */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Calendrier Economique
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Calendrier economique complet avec evenements majeurs et donnees en temps reel
                                </p>
                            </div>

                            <div className="rounded-lg overflow-hidden relative h-[400px] md:h-[450px] lg:h-[500px]" style={{ background: 'transparent' }}>
                                {/* Overlay pour masquer le logo (toute la largeur) */}
                                <div
                                    className={`absolute top-0 left-0 z-10 ${
                                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                                    }`}
                                    style={{ width: '100%', height: '40px' }}
                                />
                                <iframe
                                    src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=6,5&calType=day&timeZone=8&lang=5&transparentBackground=1"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allowTransparency="true"
                                    marginWidth="0"
                                    marginHeight="0"
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    className="relative z-0"
                                    style={{ minWidth: '100%', background: 'transparent' }}
                                />
                            </div>
                        </div>

                        {/* ========================================== */}
                        {/* SECTION 2:  MARCHES FOREX                */}
                        {/* ========================================== */}
                        <div className="mb-4">
                            <div className={`flex items-center gap-3 mb-4 pb-2 border-b-2 ${
                                isDarkMode ? 'border-green-500' : 'border-green-600'
                            }`}>
                                <h3 className={`text-xl font-bold transition-colors duration-300 ${
                                    isDarkMode ? 'text-green-400' : 'text-green-600'
                                }`}>
                                     Marches Forex
                                </h3>
                            </div>
                        </div>

                        {/* Widget TradingView Forex Heat Map */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Forex Heat Map
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Carte de chaleur des devises en temps reel (EUR, USD, JPY, GBP, CHF, AUD, CAD, CNY)
                                </p>
                            </div>

                            <div className="h-[350px] md:h-[400px] lg:h-[450px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewForexRef}>
                                    {/* Le widget sera injecte ici par le script */}
                                </div>
                            </div>
                        </div>

                        {/* Widget TradingView Economic Calendar Events */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Economic Calendar Events
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Evenements economiques mondiaux par TradingView
                                </p>
                            </div>

                            <div className="h-[400px] md:h-[500px] lg:h-[600px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewEventsRef}>
                                    {/* Le widget sera injecte ici par le script */}
                                </div>
                            </div>
                        </div>

                        {/* Widget TradingView Forex Cross Rates */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Forex Cross Rates
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Taux de change croises pour 9 devises majeures (EUR, USD, JPY, GBP, CHF, AUD, CAD, NZD, CNY)
                                </p>
                            </div>

                            <div className="h-[350px] md:h-[400px] lg:h-[450px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewCrossRatesRef}>
                                    {/* Le widget sera injecte ici par le script */}
                                </div>
                            </div>
                        </div>

                        {/* ========================================== */}
                        {/* SECTION 3:  MARCHES BOURSIERS            */}
                        {/* ========================================== */}
                        <div className="mb-2 md:mb-4">
                            <div className={`flex items-center gap-2 md:gap-3 mb-2 md:mb-4 pb-2 border-b-2 ${
                                isDarkMode ? 'border-purple-500' : 'border-purple-600'
                            }`}>
                                <h3 className={`text-base md:text-lg lg:text-xl font-bold transition-colors duration-300 ${
                                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                     Marches Boursiers - Vues Globales
                                </h3>
                            </div>
                        </div>

                        {/* Widget TradingView Stock Heatmap */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Stock Heatmap All USA
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Carte thermique de toutes les actions americaines - Performance par secteur et capitalisation
                                </p>
                            </div>

                            <div className="h-[500px] md:h-[700px] lg:h-[900px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewHeatmapRef}>
                                    <div className="tradingview-widget-container__widget"></div>
                                    <div className={`tradingview-widget-copyright text-center text-xs mt-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <a
                                            href="https://fr.tradingview.com/heatmap/stock/"
                                            rel="noopener nofollow"
                                            target="_blank"
                                            className={`underline transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                            }`}
                                        >
                                            <span className="blue-text">Track all markets on TradingView</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Widget TradingView Stock Heatmap TSX */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Stock Heatmap TSX
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Carte thermique du Toronto Stock Exchange (TSX) - Performance par secteur et capitalisation
                                </p>
                            </div>

                            <div className="h-[500px] md:h-[700px] lg:h-[900px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewHeatmapTSXRef}>
                                    <div className="tradingview-widget-container__widget"></div>
                                    <div className={`tradingview-widget-copyright text-center text-xs mt-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <a
                                            href="https://fr.tradingview.com/heatmap/stock/"
                                            rel="noopener nofollow"
                                            target="_blank"
                                            className={`underline transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                            }`}
                                        >
                                            <span className="blue-text">Track all markets on TradingView</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Widget TradingView Market Quotes */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Market Quotes - Indices, Futures, Bonds, Forex
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Cotations en temps reel organisees par categories (Indices, Futures, Obligations US/CAN, Forex CAD)
                                </p>
                            </div>

                            <div className="h-[600px] md:h-[700px] lg:h-[850px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewMarketQuotesRef}>
                                    <div className="tradingview-widget-container__widget"></div>
                                    <div className={`tradingview-widget-copyright text-center text-xs mt-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <a
                                            href="https://fr.tradingview.com/markets/"
                                            rel="noopener nofollow"
                                            target="_blank"
                                            className={`underline transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                            }`}
                                        >
                                            <span className="blue-text">Track all markets on TradingView</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========================================== */}
                        {/* SECTION:  OUTILS D'ANALYSE FONDAMENTALE  */}
                        {/* ========================================== */}
                        <div className="mb-2 md:mb-4">
                            <div className={`flex items-center gap-2 md:gap-3 mb-2 md:mb-4 pb-2 border-b-2 ${
                                isDarkMode ? 'border-orange-500' : 'border-orange-600'
                            }`}>
                                <h3 className={`text-base md:text-lg lg:text-xl font-bold transition-colors duration-300 ${
                                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                                }`}>
                                     Outils d'Analyse Fondamentale
                                </h3>
                            </div>
                        </div>

                        {/* Widget FastGraphs */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     FastGraphs - Analyse Fondamentale
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Outil d'analyse fondamentale pour investisseurs a long terme. Visualisez la valeur intrinseque, les benefices, revenus, dividendes et ratios de valorisation.
                                </p>
                                <p className={`text-xs mt-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                                }`}>
                                     <a 
                                        href="https://fastgraphs.com/blog/if-you-are-a-long-term-investor-you-need-to-watch-this-introducing-fast-graphs/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="underline hover:opacity-80"
                                    >
                                        En savoir plus sur FastGraphs
                                    </a>
                                </p>
                            </div>

                            <div className="mb-4">
                                <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center">
                                    <label className={`text-sm font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Symbole:
                                    </label>
                                    <input
                                        type="text"
                                        id="fastgraphs-symbol"
                                        defaultValue="AAPL"
                                        placeholder="Ex: AAPL, MSFT, GOOGL"
                                        className={`px-3 py-2 rounded-lg border-2 text-sm md:text-base transition-all duration-300 ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
                                        } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50`}
                                        style={{ minWidth: '200px' }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                const symbolInput = document.getElementById('fastgraphs-symbol');
                                                const symbol = symbolInput?.value?.toUpperCase().trim() || 'AAPL';
                                                const iframe = document.getElementById('fastgraphs-iframe');
                                                if (iframe) {
                                                    iframe.src = `https://www.fastgraphs.com/secure/fg.php?ticker=${symbol}`;
                                                }
                                                window.open(`https://www.fastgraphs.com/secure/fg.php?ticker=${symbol}`, '_blank');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const symbolInput = document.getElementById('fastgraphs-symbol');
                                            const symbol = symbolInput?.value?.toUpperCase().trim() || 'AAPL';
                                            const iframe = document.getElementById('fastgraphs-iframe');
                                            if (iframe) {
                                                iframe.src = `https://www.fastgraphs.com/secure/fg.php?ticker=${symbol}`;
                                            }
                                            window.open(`https://www.fastgraphs.com/secure/fg.php?ticker=${symbol}`, '_blank');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-300 ${
                                            isDarkMode
                                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                                        } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50`}
                                    >
                                        Mettre a jour l'iframe + Ouvrir
                                    </button>
                                </div>
                            </div>

                            {/* Iframe FastGraphs */}
                            <div className="mb-4">
                                <div className={`rounded-lg overflow-hidden relative h-[600px] md:h-[700px] lg:h-[800px] border-2 transition-colors duration-300 ${
                                    isDarkMode 
                                        ? 'border-orange-500/30 bg-gray-800' 
                                        : 'border-orange-400/40 bg-white'
                                }`}>
                                    <iframe
                                        id="fastgraphs-iframe"
                                        src="https://www.fastgraphs.com/secure/fg.php?ticker=AAPL"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        allowTransparency="true"
                                        marginWidth="0"
                                        marginHeight="0"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                        className="relative z-0"
                                        style={{ minWidth: '100%', background: 'transparent' }}
                                        title="FastGraphs - Analyse Fondamentale"
                                        onError={() => {
                                            console.warn('FastGraphs iframe failed to load - authentication may be required');
                                        }}
                                    />
                                    {/* Overlay message si l'iframe ne charge pas */}
                                    <div 
                                        id="fastgraphs-overlay"
                                        className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none ${
                                            isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
                                        }`}
                                        style={{ display: 'none' }}
                                    >
                                        <div className="text-center p-6">
                                            <div className={`text-4xl mb-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                                                
                                            </div>
                                            <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Authentification requise
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Utilisez les boutons ci-dessous pour acceder a FastGraphs
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Boutons d'acces alternatifs */}
                            <div className={`rounded-lg overflow-hidden relative p-6 border-2 transition-colors duration-300 ${
                                isDarkMode 
                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30' 
                                    : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400/40'
                            }`}>
                                <div className="text-center">
                                    <h3 className={`text-lg md:text-xl font-bold mb-3 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Acces alternatif a FastGraphs
                                    </h3>
                                    <p className={`text-xs md:text-sm mb-4 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Si l'iframe ne s'affiche pas, utilisez ces boutons pour ouvrir FastGraphs dans un nouvel onglet
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                        <a
                                            href="https://www.fastgraphs.com/secure/fg.php?ticker=AAPL"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-6 py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 ${
                                                isDarkMode
                                                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20'
                                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                                            } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50`}
                                        >
                                             Ouvrir FastGraphs (AAPL)
                                        </a>
                                        <a
                                            href="https://www.fastgraphs.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-6 py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 border-2 ${
                                                isDarkMode
                                                    ? 'bg-transparent border-orange-500 hover:bg-orange-500/20 text-orange-400'
                                                    : 'bg-transparent border-orange-500 hover:bg-orange-500/10 text-orange-600'
                                            } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50`}
                                        >
                                             Visiter FastGraphs.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`mt-4 text-xs text-center transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                <p>
                                    <strong>Note:</strong> FastGraphs est un service d'abonnement qui necessite une connexion pour acceder aux graphiques detailles.{' '}
                                    <a 
                                        href="https://fastgraphs.com/blog/if-you-are-a-long-term-investor-you-need-to-watch-this-introducing-fast-graphs/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`underline transition-colors duration-300 ${
                                            isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-800'
                                        }`}
                                    >
                                        En savoir plus sur FastGraphs
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* BLOC UNIFIE:  ANALYSE COMPLETE - 6 WIDGETS SYNCHRONISES                */}
                        {/* ========================================================================= */}
                        <div className={`rounded-xl border-2 md:border-4 shadow-2xl transition-all duration-300 mb-3 md:mb-6 ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-red-500'
                                : 'bg-gradient-to-br from-white via-gray-50 to-white border-red-600'
                        }`}>
                            {/* En-tete du Bloc Unifie avec Selecteur de Symbole */}
                            <div className={`p-3 md:p-4 border-b-2 md:border-b-4 transition-colors duration-300 ${
                                isDarkMode ? 'border-red-500 bg-gray-800/50' : 'border-red-600 bg-gray-100/50'
                            }`}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-3 md:mb-4">
                                    <div className="flex-1">
                                        <h2 className={`text-lg md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                            isDarkMode ? 'text-red-400' : 'text-red-600'
                                        }`}>
                                             Analyse Complete - {timelineSymbol.split(':')[1] || timelineSymbol}
                                        </h2>
                                        <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            6 widgets synchronises pour une analyse financiere complete. Changez le symbole pour mettre a jour tous les widgets simultanement.
                                        </p>
                                    </div>
                                    <div className="relative w-full md:w-auto">
                                        {/* Search Input - Style TradingView */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery || timelineSymbol.split(':')[1] || ''}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowSearchResults(true);
                                                }}
                                                onFocus={() => setShowSearchResults(true)}
                                                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                                                placeholder="Search symbols... (e.g., AAPL, BTC)"
                                                className={`flex-1 md:w-64 px-3 md:px-4 py-2 rounded-lg border-2 text-sm md:text-base font-medium transition-all duration-300 ${
                                                    isDarkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500 focus:border-blue-500'
                                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-500 focus:border-blue-500'
                                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                                            />
                                            <div className={`text-xs px-2 md:px-3 py-2 rounded-lg font-mono font-bold whitespace-nowrap ${
                                                isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {timelineSymbol.split(':')[1]}
                                            </div>
                                        </div>

                                        {/* Autocomplete Results - Style TradingView */}
                                        {showSearchResults && searchQuery && (
                                            <div className={`absolute top-full left-0 mt-2 w-full md:w-80 max-h-96 overflow-y-auto rounded-lg border-2 shadow-2xl z-50 ${
                                                isDarkMode
                                                    ? 'bg-gray-800 border-gray-600'
                                                    : 'bg-white border-gray-300'
                                            }`}>
                                                {(() => {
                                                    const filtered = availableSearchSymbols.filter(s =>
                                                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                                                    );

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div className={`px-4 py-3 text-sm ${
                                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                            }`}>
                                                                No symbols found for "{searchQuery}"
                                                            </div>
                                                        );
                                                    }

                                                    return filtered.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setTimelineSymbol(item.symbol);
                                                                setSearchQuery('');
                                                                setShowSearchResults(false);
                                                            }}
                                                            className={`px-4 py-3 cursor-pointer transition-colors ${
                                                                isDarkMode
                                                                    ? 'hover:bg-gray-700 border-b border-gray-700'
                                                                    : 'hover:bg-gray-100 border-b border-gray-200'
                                                            } last:border-b-0`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className={`font-semibold ${
                                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                                    }`}>
                                                                        {item.symbol.split(':')[1]}
                                                                    </div>
                                                                    <div className={`text-xs ${
                                                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                                    }`}>
                                                                        {item.name.split(' - ')[1]}
                                                                    </div>
                                                                </div>
                                                                <div className={`text-xs ${
                                                                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                                                }`}>
                                                                    {item.category}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Corps du Bloc - Layout Style TradingView Compact */}
                            <div className="p-2 md:p-4">
                                {/* Grille CSS avec gap de 16px (style compact) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4">

                                    {/* 1. Symbol Info - PLEINE LARGEUR */}
                                    <div className={`rounded-lg p-2 md:p-3 transition-colors duration-300 lg:col-span-2 ${
                                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                    }`}>
                                        <h3 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                             Symbol Info
                                        </h3>
                                        <div className="h-[300px] md:h-[380px]">
                                            <div className="tradingview-widget-container h-full" ref={tradingViewSymbolInfoRef}></div>
                                        </div>
                                    </div>

                                    {/* 2. Advanced Chart - PLEINE LARGEUR */}
                                    <div className={`rounded-lg p-2 md:p-3 transition-colors duration-300 lg:col-span-2 ${
                                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                    }`}>
                                        <h3 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                             {timelineSymbol.split(':')[1]} - Graphique Avance
                                        </h3>
                                        <p className={`text-xs mb-2 transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            Cliquez sur un symbole dans la watchlist pour changer tous les widgets
                                        </p>
                                        <div className="h-[400px] md:h-[650px] lg:h-[750px]">
                                            <div className="tradingview-widget-container h-full" ref={tradingViewChartSPYRef}></div>
                                        </div>
                                    </div>

                                    {/* 3. Symbol Profile - 1 COLONNE */}
                                    <div className={`rounded-lg p-2 md:p-3 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                    }`}>
                                        <h3 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                             Profil de l'Entreprise
                                        </h3>
                                        <div className="h-[300px] md:h-[400px]">
                                            <div className="tradingview-widget-container h-full" ref={tradingViewSymbolProfileRef}></div>
                                        </div>
                                    </div>

                                    {/* 4. Timeline - 1 COLONNE */}
                                    <div className={`rounded-lg p-2 md:p-3 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                    }`}>
                                        <h3 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                             Timeline - Fil d'Actualite
                                        </h3>
                                        <div className="h-[300px] md:h-[400px]">
                                            <div className="tradingview-widget-container h-full" ref={tradingViewTimelineRef}></div>
                                        </div>
                                    </div>

                                    {/* 5. Financials - PLEINE LARGEUR */}
                                    <div className={`rounded-lg p-2 md:p-3 transition-colors duration-300 lg:col-span-2 ${
                                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                    }`}>
                                        <h3 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                             Etats Financiers
                                        </h3>
                                        <div className="h-[350px] md:h-[450px]">
                                            <div className="tradingview-widget-container h-full" ref={tradingViewFinancialsRef}></div>
                                        </div>
                                    </div>

                                    {/* 6. Technical Analysis - PLEINE LARGEUR */}
                                    <div className={`rounded-lg p-2 md:p-3 transition-colors duration-300 lg:col-span-2 ${
                                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                    }`}>
                                        <h3 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                             Analyse Technique
                                        </h3>
                                        <div className="h-[300px] md:h-[400px]">
                                            <div className="tradingview-widget-container h-full" ref={tradingViewTechnicalAnalysisRef}></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Widget TradingView Screener (Non synchronise - reste separe) */}
                        <div className={`p-3 md:p-6 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="mb-3 md:mb-6">
                                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                     Screener de Titres
                                </h2>
                                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Outil de filtrage et d'analyse des actions du marche americain avec criteres personnalisables
                                </p>
                            </div>

                            <div className="h-[600px] md:h-[700px] lg:h-[800px]">
                                <div className="tradingview-widget-container h-full" ref={tradingViewScreenerRef}>
                                    <div className="tradingview-widget-container__widget"></div>
                                    <div className={`tradingview-widget-copyright text-center text-xs mt-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <a
                                            href="https://fr.tradingview.com/screener/"
                                            rel="noopener nofollow"
                                            target="_blank"
                                            className={`underline transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                            }`}
                                        >
                                            <span className="blue-text">Track all markets on TradingView</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                );
            };


            // ============================================================================
            // COMPOSANT YIELD CURVE (COURBE DES TAUX)
            // ============================================================================


export default InvestingCalendarTab;
