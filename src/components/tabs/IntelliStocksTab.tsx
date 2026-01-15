// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { TabProps } from '../../types';
import Icon from '../shared/Icon';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

// FastGraph Expandable Section Component
const FastGraphSection: React.FC<{ isDarkMode: boolean; LucideIcon: any }> = ({ isDarkMode, LucideIcon }) => {
    const [isExpanded, setIsExpanded] = useState(() => {
        return localStorage.getItem('fastgraph_expanded') === 'true';
    });
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [sessionUrl, setSessionUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Save expand state
    useEffect(() => {
        localStorage.setItem('fastgraph_expanded', String(isExpanded));
    }, [isExpanded]);

    // Auto-login when expanded
    useEffect(() => {
        if (isExpanded && !sessionUrl && !isLoading) {
            handleAutoLogin();
        }
    }, [isExpanded]);

    const handleAutoLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/fastgraphs-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error('Echec de la connexion FastGraphs');
            }

            const data = await response.json();

            if (data.success && data.session) {
                setSessionUrl(data.session.url);
            } else {
                throw new Error('Session non disponible');
            }
        } catch (err: any) {
            console.error('FastGraph login error:', err);
            setError(err.message || 'Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const fastgraphUrl = sessionUrl || 'https://www.fastgraphs.com/';

    return (
        <div className={`mb-2 rounded-xl transition-all duration-300 ${
            isDarkMode
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/20 transition-colors duration-200 rounded-t-xl"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                        <LucideIcon name="TrendingUp" className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                             FastGraphs
                        </h3>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Analyse fondamentale et graphiques de titres
                            {sessionUrl && <span className="ml-2 text-green-500"> Session active</span>}
                        </p>
                    </div>
                </div>
                <LucideIcon
                    name={isExpanded ? "ChevronUp" : "ChevronDown"}
                    className={`w-5 h-5 transition-transform duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                />
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-3">
                    {/* Info Banner */}
                    <div className={`p-3 rounded-lg ${
                        isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                        <p className={`text-xs ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                            <strong>FastGraphs</strong> fournit des analyses fondamentales detaillees et des graphiques de valorisation pour les titres.
                        </p>
                    </div>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Connexion a FastGraphs...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && !isLoading && (
                        <div className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'
                        }`}>
                            <p className={`text-xs ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                                 {error}
                            </p>
                            <button
                                onClick={handleAutoLogin}
                                className={`mt-2 px-3 py-1 rounded text-xs font-semibold ${
                                    isDarkMode ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 hover:bg-red-600'
                                } text-white`}
                            >
                                Reessayer
                            </button>
                        </div>
                    )}

                    {/* Iframe */}
                    {!isLoading && !error && (
                        <>
                            {!iframeLoaded && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Chargement de FastGraphs...
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className={`relative rounded-lg overflow-hidden ${iframeLoaded ? 'block' : 'hidden'}`}>
                                <iframe
                                    src={fastgraphUrl}
                                    className="w-full h-[700px] rounded-lg"
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                                    onLoad={() => setIframeLoaded(true)}
                                    title="FastGraphs"
                                />
                            </div>
                        </>
                    )}

                    {/* Open in New Tab Button */}
                    <div className="flex justify-end">
                        <a
                            href={fastgraphUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                                isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            <LucideIcon name="ExternalLink" className="w-3 h-3" />
                            Ouvrir dans un nouvel onglet
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export const IntelliStocksTab: React.FC<TabProps> = memo((props) => {
    const {
        isDarkMode = true,
        API_BASE_URL = '',
        selectedStock: selectedStockProp,
        setSelectedStock: setSelectedStockProp,
        LucideIcon: LucideIconProp,
        emmaPopulateWatchlist
    } = props;
                const apiBase = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

                // Safe fallback for emmaPopulateJLab function
                const emmaPopulateJLab = emmaPopulateWatchlist ||
                    (typeof window !== 'undefined' ? (window as any).emmaPopulateJLab : undefined) ||
                    (() => console.log(' Emma Populate JLab - Feature coming soon'));
                const [time, setTime] = useState(new Date());
                const [internalSelectedStock, setInternalSelectedStock] = useState(selectedStockProp || 'AAPL');
                const [timeframe, setTimeframe] = useState('1D');
                const [menuOpen, setMenuOpen] = useState(false);
                const [stockDataIntelli, setStockDataIntelli] = useState(null);
                const [loadingIntelli, setLoadingIntelli] = useState(true);
                const [connected, setConnected] = useState(false);
                const [lastUpdateIntelli, setLastUpdateIntelli] = useState(null);
                // Helppop: visibilite et liste des violations detectees
                const [showHelp, setShowHelp] = useState(false);
                const [violations, setViolations] = useState([]);
                // Screener visibility
                const [showScreener, setShowScreener] = useState(false);

                useEffect(() => {
                    if (selectedStockProp && selectedStockProp !== internalSelectedStock) {
                        setInternalSelectedStock(selectedStockProp);
                    }
                }, [selectedStockProp]);

                const selectedStock = selectedStockProp ?? internalSelectedStock;
                const handleSelectStock = useCallback((symbol: string) => {
                    if (!selectedStockProp) {
                        setInternalSelectedStock(symbol);
                    }
                    setSelectedStockProp?.(symbol);
                }, [selectedStockProp, setSelectedStockProp]);
                
                //  Configuration du Score JSLAITM (ponderations)
                const [jslaiConfig, setJslaiConfig] = useState(() => {
                    const saved = localStorage.getItem('jslaiConfig');
                    return saved ? JSON.parse(saved) : {
                        valuation: 20,        // Multiples de valorisation
                        profitability: 20,    // Marges, ROE, ROA
                        growth: 15,           // Croissance revenus & EPS
                        financialHealth: 20,  // Bilan, dette, liquidite
                        momentum: 10,         // RSI, tendances, moyennes mobiles
                        moat: 10,             // Avantage concurrentiel
                        sectorPosition: 5     // Position dans le secteur
                    };
                });

                // Sauvegarder la config JSLAI
                useEffect(() => {
                    localStorage.setItem('jslaiConfig', JSON.stringify(jslaiConfig));
                }, [jslaiConfig]);

                // Generation de donnees mock
                const generateMockData = (symbol) => {
                    const basePrice = {
                        AAPL: 183.45, TSLA: 251.23, GOOGL: 143.12,
                        MSFT: 384.89, NVDA: 485.32, AMZN: 178.91
                    }[symbol] || 180;

                    const companyNames = {
                        AAPL: 'Apple Inc.', TSLA: 'Tesla Inc.', GOOGL: 'Alphabet Inc.',
                        MSFT: 'Microsoft Corp.', NVDA: 'NVIDIA Corp.', AMZN: 'Amazon.com Inc.'
                    };

                    return {
                        quote: {
                            symbol,
                            name: companyNames[symbol] || 'Company Inc.',
                            price: basePrice,
                            change: parseFloat((Math.random() * 6 - 2).toFixed(2)),
                            changesPercentage: parseFloat((Math.random() * 4 - 1).toFixed(2)),
                            volume: Math.floor(Math.random() * 50000000 + 30000000),
                            marketCap: Math.floor(Math.random() * 2000000000000 + 1000000000000),
                            avgVolume: Math.floor(Math.random() * 60000000 + 40000000)
                        },
                        intraday: Array.from({ length: 20 }, (_, i) => ({
                            date: `${9 + Math.floor(i/4)}:${(i % 4) * 15}`,
                            open: basePrice + (Math.random() * 4 - 2),
                            high: basePrice + (Math.random() * 5 - 1),
                            low: basePrice + (Math.random() * 3 - 3),
                            close: basePrice + (Math.random() * 4 - 2),
                            volume: Math.floor(Math.random() * 5000000 + 2000000)
                        })),
                        metrics: {
                            peRatioTTM: parseFloat((Math.random() * 40 + 15).toFixed(1)),
                            pegRatioTTM: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
                            priceToSalesRatioTTM: parseFloat((Math.random() * 8 + 2).toFixed(2)),
                            dividendYieldTTM: parseFloat((Math.random() * 0.03).toFixed(4))
                        },
                        ratios: {
                            debtEquityRatio: parseFloat((Math.random() * 2 + 0.3).toFixed(2)),
                            returnOnEquityTTM: parseFloat((Math.random() * 0.4 + 0.1).toFixed(3)),
                            returnOnAssetsTTM: parseFloat((Math.random() * 0.2 + 0.05).toFixed(3)),
                            netProfitMarginTTM: parseFloat((Math.random() * 0.3 + 0.1).toFixed(3)),
                        },
                        profile: {
                            companyName: companyNames[symbol] || 'Company Inc.',
                            price: basePrice,
                            beta: parseFloat((Math.random() * 0.6 + 0.8).toFixed(2)),
                            sector: 'Technology',
                            industry: 'Consumer Electronics'
                        },
                        news: [
                            {
                                title: `${symbol} annonce resultats trimestriels record`,
                                publishedDate: new Date(Date.now() - 2*3600000).toISOString(),
                                site: 'Reuters'
                            },
                            {
                                title: `Nouveau partenariat strategique annonce`,
                                publishedDate: new Date(Date.now() - 5*3600000).toISOString(),
                                site: 'Bloomberg'
                            },
                            {
                                title: `Analystes relevent objectif de prix`,
                                publishedDate: new Date(Date.now() - 8*3600000).toISOString(),
                                site: 'CNBC'
                            }
                        ],
                        sentiment: {
                            overall: Math.floor(Math.random() * 30 + 60),
                            news: Math.floor(Math.random() * 30 + 65),
                            social: Math.floor(Math.random() * 30 + 60),
                            institutional: Math.floor(Math.random() * 30 + 55),
                            retail: Math.floor(Math.random() * 30 + 70),
                            summary: 'Sentiment globalement positif avec optimisme modere'
                        },
                        insights: {
                            catalysts: [
                                'Resultats trimestriels superieurs aux attentes',
                                'Innovation produit majeure annoncee',
                                'Expansion internationale reussie'
                            ],
                            risks: [
                                'Concurrence accrue dans le secteur',
                                'Incertitudes macroeconomiques',
                                'Volatilite des marches'
                            ],
                            consensus: 'bullish',
                            reasoning: 'Les fondamentaux solides et la croissance continue justifient un sentiment positif'
                        }
                    };
                };

                //  CALCULATED SENTIMENT - No AI, pure data-driven analysis
                // Replaces Perplexity AI with free calculated metrics

                //  Calculate sentiment from financial data (NO AI, NO COST)
                const calculateSentiment = (symbol, stockData) => {
                    const { quote, metrics, ratios, profile, news } = stockData;

                    console.log(` Calculating sentiment for ${symbol} from financial data...`);

                    // 1. Calculate fundamental score (0-100)
                    let fundamentalScore = 50;

                    // ROE Analysis
                    const roe = (ratios?.returnOnEquityTTM || 0) * 100;
                    if (roe > 20) fundamentalScore += 20;
                    else if (roe > 15) fundamentalScore += 15;
                    else if (roe > 10) fundamentalScore += 10;
                    else if (roe < 5) fundamentalScore -= 10;

                    // P/E Ratio Analysis
                    const pe = metrics?.peRatioTTM || 0;
                    if (pe > 0 && pe < 15) fundamentalScore += 15;
                    else if (pe >= 15 && pe < 25) fundamentalScore += 10;
                    else if (pe >= 25 && pe < 35) fundamentalScore += 5;
                    else if (pe >= 50) fundamentalScore -= 10;

                    // Profit Margin Analysis
                    const margin = (ratios?.netProfitMarginTTM || 0) * 100;
                    if (margin > 20) fundamentalScore += 15;
                    else if (margin > 10) fundamentalScore += 10;
                    else if (margin > 5) fundamentalScore += 5;
                    else if (margin < 0) fundamentalScore -= 15;

                    // 2. Calculate momentum score (0-100)
                    const priceChange = quote?.changesPercentage || 0;
                    let momentumScore = 50;
                    if (priceChange > 5) momentumScore += 30;
                    else if (priceChange > 2) momentumScore += 20;
                    else if (priceChange > 0) momentumScore += 10;
                    else if (priceChange < -5) momentumScore -= 30;
                    else if (priceChange < -2) momentumScore -= 20;
                    else if (priceChange < 0) momentumScore -= 10;

                    // 3. Calculate overall sentiment
                    const overallSentiment = Math.round(fundamentalScore * 0.6 + momentumScore * 0.4);
                    const newsSentiment = Math.max(40, Math.min(80, overallSentiment + (Math.random() * 20 - 10)));

                    // 4. Determine consensus
                    let consensus = 'neutral';
                    if (overallSentiment >= 70) consensus = 'bullish';
                    else if (overallSentiment <= 40) consensus = 'bearish';

                    // 5. Generate recommendation
                    let recommendation = 'HOLD';
                    let confidence = 60;
                    if (overallSentiment >= 80) { recommendation = 'STRONG_BUY'; confidence = 85; }
                    else if (overallSentiment >= 65) { recommendation = 'BUY'; confidence = 75; }
                    else if (overallSentiment >= 55) { recommendation = 'HOLD'; confidence = 65; }
                    else if (overallSentiment >= 40) { recommendation = 'SELL'; confidence = 70; }
                    else { recommendation = 'STRONG_SELL'; confidence = 80; }

                    // 6. Generate insights
                    const catalysts = [];
                    const risks = [];

                    if (roe > 15) catalysts.push(`Strong ROE of ${roe.toFixed(1)}% indicates excellent profitability`);
                    if (margin > 10) catalysts.push(`Healthy profit margin of ${margin.toFixed(1)}% shows operational efficiency`);
                    if (priceChange > 2) catalysts.push(`Positive momentum with ${priceChange.toFixed(1)}% recent gain`);
                    if (catalysts.length === 0) catalysts.push('Analyzing financial metrics for opportunities');

                    if (pe > 40) risks.push(`High P/E ratio of ${pe.toFixed(1)} suggests potential overvaluation`);
                    const debtEquity = ratios?.debtEquityRatio || 0;
                    if (debtEquity > 2) risks.push(`Elevated debt-to-equity ratio of ${debtEquity.toFixed(2)} indicates leverage risk`);
                    if (priceChange < -2) risks.push(`Recent decline of ${priceChange.toFixed(1)}% shows negative momentum`);
                    if (risks.length === 0) risks.push('Monitoring market conditions and sector trends');

                    // Fill remaining slots
                    while (catalysts.length < 3) catalysts.push('Tracking fundamental performance indicators');
                    while (risks.length < 3) risks.push('Monitoring macroeconomic factors');

                    const keyPoints = [
                        `ROE: ${roe.toFixed(1)}% | P/E: ${pe.toFixed(1)} | Margin: ${margin.toFixed(1)}%`,
                        `Sentiment Score: ${overallSentiment}/100 (${consensus})`,
                        `Price momentum: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`
                    ];

                    return {
                        sentiment: {
                            overall: overallSentiment,
                            news: Math.round(newsSentiment),
                            summary: `${consensus.charAt(0).toUpperCase() + consensus.slice(1)} outlook based on ${roe > 15 ? 'strong' : 'moderate'} fundamentals and ${priceChange > 0 ? 'positive' : 'negative'} momentum`
                        },
                        insights: {
                            catalysts: catalysts.slice(0, 3),
                            risks: risks.slice(0, 3),
                            consensus,
                            reasoning: `Analysis based on ROE (${roe.toFixed(1)}%), profit margins (${margin.toFixed(1)}%), and technical momentum. ${consensus === 'bullish' ? 'Strong fundamentals support positive outlook' : consensus === 'bearish' ? 'Weak metrics suggest caution' : 'Mixed signals warrant neutral stance'}.`
                        },
                        analyst: {
                            recommendation,
                            confidence,
                            keyPoints
                        }
                    };
                };

                // Fonction pour recuperer les donnees reelles d'un stock
                const fetchRealStockData = async (symbol, currentTimeframe = '1D') => {
                    try {
                        console.log(` Recuperation des donnees reelles pour ${symbol}...`);
                        
                        // Determiner le timeframe et les parametres pour les donnees historiques
                        let historicalTimeframe, historicalLimit;
                        switch (currentTimeframe) {
                            case '1D':
                                historicalTimeframe = '15min';
                                historicalLimit = 20;
                                break;
                            case '1W':
                                historicalTimeframe = '1hour';
                                historicalLimit = 24;
                                break;
                            case '1M':
                                historicalTimeframe = '1day';
                                historicalLimit = 30;
                                break;
                            case '3M':
                                historicalTimeframe = '1day';
                                historicalLimit = 90;
                                break;
                            case '6M':
                                historicalTimeframe = '1day';
                                historicalLimit = 180;
                                break;
                            case '1A':
                                historicalTimeframe = '1day';
                                historicalLimit = 365;
                                break;
                            case '5A':
                                historicalTimeframe = '1week';
                                historicalLimit = 260;
                                break;
                            case 'MAX':
                                historicalTimeframe = '1month';
                                historicalLimit = 120;
                                break;
                            case 'YTD':
                                historicalTimeframe = '1day';
                                // Calculer le nombre de jours depuis le debut de l'annee
                                const now = new Date();
                                const startOfYear = new Date(now.getFullYear(), 0, 1);
                                const daysSinceStart = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
                                historicalLimit = Math.min(daysSinceStart, 365);
                                break;
                            default:
                                historicalTimeframe = '1day';
                                historicalLimit = 30;
                        }

                        // Appels paralleles aux APIs hybrides (Base locale + APIs externes)
                        
// Appels paralleles aux APIs avec gestion d'erreur amelioree
const [quoteResult, profileResult, ratiosResult, newsResult, intradayResult, analystResult, earningsResult] = await Promise.allSettled([
  fetchHybridData(symbol, 'quote'),
  fetchHybridData(symbol, 'profile'),
  fetchHybridData(symbol, 'ratios'),
  fetchHybridData(symbol, 'news'),
  fetchHybridData(symbol, 'prices'),
  fetchHybridData(symbol, 'analyst'),
  fetchHybridData(symbol, 'earnings')
]);

                        // Parser les resultats hybrides avec indicateurs de fallback
                        const quote = quoteResult.status === 'fulfilled' && quoteResult.value.success ? quoteResult.value.data : null;
                        const profile = profileResult.status === 'fulfilled' && profileResult.value.success ? profileResult.value.data : null;
                        const ratios = ratiosResult.status === 'fulfilled' && ratiosResult.value.success ? ratiosResult.value.data : null;
                        const news = newsResult.status === 'fulfilled' && newsResult.value.success ? newsResult.value.data : null;
                        const intradayData = intradayResult.status === 'fulfilled' && intradayResult.value.success ? intradayResult.value.data : null;
                        const analystData = analystResult.status === 'fulfilled' && analystResult.value.success ? analystResult.value.data : null;
                        const earningsData = earningsResult.status === 'fulfilled' && earningsResult.value.success ? earningsResult.value.data : null;
                        
                        // Collecter les indicateurs de fallback
                        const fallbackIndicators = {
                            quote: quoteResult.status === 'fulfilled' ? quoteResult.value.fallback || false : true,
                            profile: profileResult.status === 'fulfilled' ? profileResult.value.fallback || false : true,
                            ratios: ratiosResult.status === 'fulfilled' ? ratiosResult.value.fallback || false : true,
                            news: newsResult.status === 'fulfilled' ? newsResult.value.fallback || false : true,
                            intraday: intradayResult.status === 'fulfilled' ? intradayResult.value.fallback || false : true,
                            analyst: analystResult.status === 'fulfilled' ? analystResult.value.fallback || false : true,
                            earnings: earningsResult.status === 'fulfilled' ? earningsResult.value.fallback || false : true
                        };
                        
                        
// Log des donnees recuperees avec indicateurs de fallback
console.log(' Donnees recuperees:', { 
  hasQuote: !!quote, 
  hasProfile: !!profile, 
  hasRatios: !!ratios,
  hasNews: !!news,
  hasIntraday: !!intradayData,
  hasAnalyst: !!analystData,
  hasEarnings: !!earningsData,
  fallbackIndicators: fallbackIndicators
});

// Calculer le pourcentage de donnees reelles
const totalSections = Object.keys(fallbackIndicators).length;
const fallbackSections = Object.values(fallbackIndicators).filter(Boolean).length;
const productionSections = totalSections - fallbackSections;
const qualityPercentage = Math.round((productionSections / totalSections) * 100);

console.log(` Qualite des donnees: ${qualityPercentage}% (${productionSections}/${totalSections} sections en production)`);

// Gestion des erreurs
const errors = [];
if (!quote) errors.push('Quote manquant');
if (!profile) errors.push('Profile manquant');
if (!ratios) errors.push('Ratios manquant');
if (!news) errors.push('News manquant');

if (errors.length > 0) {
  console.warn(' Donnees manquantes:', errors);
  // setMessage removed - was causing infinite loop due to undefined reference
}

console.log(' Donnees hybrides recuperees:', { 
                            hasQuote: !!quote, 
                            hasProfile: !!profile, 
                            hasRatios: !!ratios, 
                            hasNews: !!news,
                            hasIntraday: !!intradayData,
                            hasAnalyst: !!analystData,
                            hasEarnings: !!earningsData,
                            quoteSource: quote?.source || 'unknown',
                            profileSource: profile?.source || 'unknown',
                            ratiosSource: ratios?.source || 'unknown',
                            quoteConfidence: quote?.metadata?.confidence || 0,
                            profileConfidence: profile?.metadata?.confidence || 0,
                            ratiosConfidence: ratios?.metadata?.confidence || 0,
                            quoteFreshness: quote?.metadata?.freshness || 'unknown',
                            profileFreshness: profile?.metadata?.freshness || 'unknown',
                            ratiosFreshness: ratios?.metadata?.freshness || 'unknown'
                        });

                        //  Calcul du Score JSLAITM Global (0-100)
                        const calculateJSLAIScore = () => {
                            let totalScore = 0;
                            let scores = {};
                            
                            // 1. VALUATION (base sur P/E ratio)
                            const pe = ratios?.data?.[0]?.peRatioTTM || ratios?.peRatioTTM || null;
                            let valuationScore = 50;
                            if (pe) {
                                if (pe < 10) valuationScore = 100;
                                else if (pe < 15) valuationScore = 85;
                                else if (pe < 20) valuationScore = 70;
                                else if (pe < 25) valuationScore = 55;
                                else if (pe < 30) valuationScore = 40;
                                else valuationScore = 25;
                            }
                            scores.valuation = valuationScore;
                            totalScore += (valuationScore * jslaiConfig.valuation) / 100;
                            
                            // 2. PROFITABILITY (base sur ROE)
                            const roe = ratios?.data?.[0]?.returnOnEquityTTM || ratios?.returnOnEquityTTM || null;
                            let profitabilityScore = 50;
                            if (roe) {
                                const roePercent = roe * 100;
                                if (roePercent > 25) profitabilityScore = 100;
                                else if (roePercent > 20) profitabilityScore = 85;
                                else if (roePercent > 15) profitabilityScore = 70;
                                else if (roePercent > 10) profitabilityScore = 55;
                                else if (roePercent > 5) profitabilityScore = 40;
                                else profitabilityScore = 25;
                            }
                            scores.profitability = profitabilityScore;
                            totalScore += (profitabilityScore * jslaiConfig.profitability) / 100;
                            
                            // 3. GROWTH (base sur croissance revenue + marges)
                            const grossMargin = ratios?.data?.[0]?.grossProfitMarginTTM || ratios?.grossProfitMarginTTM || null;
                            const netMargin = ratios?.data?.[0]?.netProfitMarginTTM || ratios?.netProfitMarginTTM || null;
                            let growthScore = 60; // Neutre par defaut

                            // Utiliser les marges comme proxy de croissance
                            if (grossMargin && netMargin) {
                                const avgMargin = (grossMargin + netMargin) / 2;
                                if (avgMargin > 0.30) growthScore = 100; // Marges >30% = excellente croissance
                                else if (avgMargin > 0.20) growthScore = 85;
                                else if (avgMargin > 0.15) growthScore = 70;
                                else if (avgMargin > 0.10) growthScore = 55;
                                else if (avgMargin > 0.05) growthScore = 40;
                                else growthScore = 25;
                            }
                            scores.growth = growthScore;
                            totalScore += (growthScore * jslaiConfig.growth) / 100;

                            // 4. FINANCIAL HEALTH (base sur debt/equity + current ratio)
                            const de = ratios?.data?.[0]?.debtEquityRatioTTM || ratios?.debtEquityRatioTTM || null;
                            const currentRatio = ratios?.data?.[0]?.currentRatio || ratios?.currentRatio || null;
                            let healthScore = 50;

                            // Score base sur D/E
                            let deScore = 50;
                            if (de !== null) {
                                if (de < 0.3) deScore = 100;
                                else if (de < 0.5) deScore = 85;
                                else if (de < 1.0) deScore = 70;
                                else if (de < 1.5) deScore = 55;
                                else if (de < 2.0) deScore = 40;
                                else deScore = 25;
                            }

                            // Score base sur Current Ratio (liquidite)
                            let liquidityScore = 50;
                            if (currentRatio !== null) {
                                if (currentRatio > 3.0) liquidityScore = 100;
                                else if (currentRatio > 2.0) liquidityScore = 85;
                                else if (currentRatio > 1.5) liquidityScore = 70;
                                else if (currentRatio > 1.0) liquidityScore = 55;
                                else if (currentRatio > 0.5) liquidityScore = 40;
                                else liquidityScore = 25;
                            }

                            // Moyenne ponderee: 60% D/E, 40% liquidite
                            healthScore = Math.round((deScore * 0.6) + (liquidityScore * 0.4));
                            scores.financialHealth = healthScore;
                            totalScore += (healthScore * jslaiConfig.financialHealth) / 100;

                            // 5. MOMENTUM (base sur performance recente)
                            const priceChange = quote?.dp || 0; // Variation % depuis fermeture
                            let momentumScore = 50;

                            if (priceChange > 10) momentumScore = 100; // +10%+ = tres fort momentum
                            else if (priceChange > 5) momentumScore = 85;
                            else if (priceChange > 2) momentumScore = 70;
                            else if (priceChange > 0) momentumScore = 60;
                            else if (priceChange > -2) momentumScore = 45;
                            else if (priceChange > -5) momentumScore = 30;
                            else momentumScore = 15;

                            scores.momentum = momentumScore;
                            totalScore += (momentumScore * jslaiConfig.momentum) / 100;

                            // 6. MOAT (base sur marges operationnelles et brutes)
                            const operatingMargin = ratios?.data?.[0]?.operatingProfitMarginTTM || ratios?.operatingProfitMarginTTM || null;
                            let moatScore = 60; // Neutre par defaut

                            // Entreprises avec fortes marges = moat economique solide
                            if (grossMargin && operatingMargin) {
                                const avgProfitMargin = (grossMargin + operatingMargin) / 2;
                                if (avgProfitMargin > 0.40) moatScore = 100; // Marges >40% = moat exceptionnel
                                else if (avgProfitMargin > 0.30) moatScore = 85;
                                else if (avgProfitMargin > 0.20) moatScore = 70;
                                else if (avgProfitMargin > 0.15) moatScore = 60;
                                else if (avgProfitMargin > 0.10) moatScore = 45;
                                else moatScore = 30;
                            }
                            scores.moat = moatScore;
                            totalScore += (moatScore * jslaiConfig.moat) / 100;

                            // 7. SECTOR POSITION (base sur beta - volatilite vs marche)
                            const beta = profile?.data?.[0]?.beta || profile?.beta || null;
                            let sectorScore = 60; // Neutre par defaut

                            // Beta < 1 = moins volatil que le marche (bon signe)
                            // Beta > 1 = plus volatil (risque)
                            if (beta !== null) {
                                if (beta < 0.5) sectorScore = 100; // Tres stable
                                else if (beta < 0.8) sectorScore = 85;
                                else if (beta < 1.0) sectorScore = 75;
                                else if (beta < 1.2) sectorScore = 60;
                                else if (beta < 1.5) sectorScore = 45;
                                else sectorScore = 30; // Tres volatil
                            }
                            scores.sectorPosition = sectorScore;
                            totalScore += (sectorScore * jslaiConfig.sectorPosition) / 100;
                            
                            const finalScore = Math.round(totalScore);
                            
                            return {
                                total: finalScore,
                                breakdown: scores,
                                interpretation: finalScore >= 85 ? 'Excellent' :
                                               finalScore >= 75 ? 'Tres Bon' :
                                               finalScore >= 65 ? 'Bon' :
                                               finalScore >= 50 ? 'Moyen' :
                                               finalScore >= 35 ? 'Faible' : 'Mauvais',
                                recommendation: finalScore >= 75 ? 'Achat Fort' :
                                               finalScore >= 65 ? 'Achat' :
                                               finalScore >= 50 ? 'Conserver' :
                                               finalScore >= 35 ? 'Surveiller' : 'Eviter'
                            };
                        };

                        const jslaiScore = calculateJSLAIScore();

                        //  Calcul automatique du sentiment et insights base sur les donnees reelles
                        // Plus besoin de Perplexity - on utilise les donnees gratuites des APIs
                        console.log(' Calcul du sentiment et insights a partir des donnees reelles...');

                        // Calculer le sentiment base sur le changement de prix et les ratios
                        const priceChange = quote?.dp || 0;
                        const roe = (ratios?.data?.[0]?.returnOnEquityTTM || ratios?.returnOnEquityTTM || 0) * 100;
                        const pe = ratios?.data?.[0]?.peRatioTTM || ratios?.peRatioTTM || 0;

                        // Score base sur les fondamentaux (0-100)
                        let fundamentalScore = 50;
                        if (roe > 20) fundamentalScore += 20;
                        else if (roe > 15) fundamentalScore += 10;
                        if (pe > 0 && pe < 15) fundamentalScore += 15;
                        else if (pe > 0 && pe < 25) fundamentalScore += 5;

                        // Score base sur le momentum (0-100)
                        let momentumScore = 60;
                        if (priceChange > 5) momentumScore = 85;
                        else if (priceChange > 2) momentumScore = 75;
                        else if (priceChange > 0) momentumScore = 65;
                        else if (priceChange > -2) momentumScore = 55;
                        else if (priceChange > -5) momentumScore = 45;
                        else momentumScore = 30;

                        // Sentiment global (moyenne ponderee: 60% fondamentaux, 40% momentum)
                        const overallSentiment = Math.round(fundamentalScore * 0.6 + momentumScore * 0.4);

                        // Generer catalysts bases sur les donnees
                        const catalysts = [];
                        if (roe > 20) catalysts.push(`ROE excellent a ${roe.toFixed(1)}%`);
                        if (priceChange > 2) catalysts.push(`Forte dynamique haussiere (+${priceChange.toFixed(2)}%)`);
                        if (pe > 0 && pe < 15) catalysts.push(`Valorisation attractive (P/E: ${pe.toFixed(1)})`);
                        if (catalysts.length === 0) catalysts.push('Fondamentaux stables');

                        // Generer risques bases sur les donnees
                        const risks = [];
                        const debtEquity = ratios?.data?.[0]?.debtEquityRatioTTM || ratios?.debtEquityRatioTTM || 0;
                        if (debtEquity > 2) risks.push(`Endettement eleve (D/E: ${debtEquity.toFixed(2)})`);
                        if (priceChange < -5) risks.push('Momentum baissier significatif');
                        if (pe > 40) risks.push(`Valorisation elevee (P/E: ${pe.toFixed(1)})`);
                        if (risks.length === 0) risks.push('Volatilite de marche normale');

                        // Determiner le consensus
                        let consensus = 'neutral';
                        if (overallSentiment >= 70) consensus = 'bullish';
                        else if (overallSentiment <= 45) consensus = 'bearish';

                        // Determiner la recommandation basee sur le score JSLAI
                        let recommendation = 'HOLD';
                        let confidence = overallSentiment;
                        if (jslaiScore.total >= 75) { recommendation = 'STRONG_BUY'; confidence = Math.min(90, confidence + 10); }
                        else if (jslaiScore.total >= 65) { recommendation = 'BUY'; confidence = Math.min(85, confidence + 5); }
                        else if (jslaiScore.total <= 35) { recommendation = 'SELL'; confidence = Math.min(85, confidence); }
                        else if (jslaiScore.total <= 25) { recommendation = 'STRONG_SELL'; confidence = Math.min(90, confidence); }

                        const aiData = {
                            sentiment: {
                                overall: overallSentiment,
                                news: momentumScore,
                                summary: `Sentiment ${consensus === 'bullish' ? 'positif' : consensus === 'bearish' ? 'negatif' : 'neutre'} base sur les fondamentaux et le momentum`
                            },
                            insights: {
                                catalysts,
                                risks,
                                consensus,
                                reasoning: `Score JSLAITM de ${jslaiScore.total}/100 (${jslaiScore.interpretation}). ${jslaiScore.recommendation}.`
                            },
                            analyst: {
                                recommendation,
                                confidence,
                                keyPoints: [
                                    `Score JSLAITM: ${jslaiScore.total}/100`,
                                    `Sentiment: ${overallSentiment}/100`,
                                    `Tendance: ${consensus}`
                                ]
                            }
                        };

                        console.log(' Sentiment et insights calcules a partir des donnees reelles (sans Perplexity)');

                        // Construire l'objet de donnees structure
                        return {
                            jslaiScore: jslaiScore,  //  Score JSLAITM ajoute
                            quote: {
                                symbol: symbol,
                                name: profile?.data?.[0]?.companyName || profile?.companyName || `${symbol} Inc.`,
                                price: quote?.c || 0,
                                change: quote?.d || 0,
                                changesPercentage: quote?.dp || 0,
                                volume: quote?.volume || 0,
                                marketCap: profile?.data?.[0]?.mktCap || profile?.mktCap || 0,
                                avgVolume: quote?.avgVolume || 0
                            },
                            intraday: (() => {
                                // Si on a des donnees historiques reelles, les utiliser
                                if (intradayData && Array.isArray(intradayData) && intradayData.length > 0) {
                                    console.log(` Donnees historiques reelles recuperees: ${intradayData.length} points`);
                                    return intradayData.map((candle, i) => ({
                                        date: candle.date || new Date(candle.timestamp || Date.now() - i * 60000).toLocaleString('fr-FR'),
                                        open: candle.open || 0,
                                        high: candle.high || 0,
                                        low: candle.low || 0,
                                        close: candle.close || 0,
                                volume: candle.volume || 0
                                    }));
                                }
                                
                                // Si on a des donnees dans le format FMP
                                if (intradayData?.historical && Array.isArray(intradayData.historical) && intradayData.historical.length > 0) {
                                    console.log(` Donnees FMP historiques recuperees: ${intradayData.historical.length} points`);
                                    
                                    let filteredData = intradayData.historical;
                                    
                                    // Pour YTD, filtrer les donnees depuis le debut de l'annee
                                    if (currentTimeframe === 'YTD') {
                                        const currentYear = new Date().getFullYear();
                                        filteredData = intradayData.historical.filter(candle => {
                                            const candleDate = new Date(candle.date);
                                            return candleDate.getFullYear() === currentYear;
                                        });
                                        console.log(` Donnees YTD filtrees: ${filteredData.length} points`);
                                    }
                                    
                                    return filteredData.map((candle, i) => ({
                                        date: candle.date || new Date(candle.timestamp || Date.now() - i * 60000).toLocaleString('fr-FR'),
                                        open: candle.open || 0,
                                        high: candle.high || 0,
                                        low: candle.low || 0,
                                        close: candle.close || 0,
                                        volume: candle.volume || 0
                                    }));
                                }
                                
                                // Sinon, generer des donnees de fallback basees sur le prix actuel
                                const currentPrice = quote?.c || 0;
                                const change = quote?.d || 0;
                                const changePercent = quote?.dp || 0;
                                
                                if (currentPrice > 0) {
                                    // Generer des donnees selon le timeframe selectionne
                                    const dataPoints = [];
                                    const basePrice = currentPrice - change; // Prix d'ouverture
                                    const timeframe = currentTimeframe; // Utiliser le timeframe passe en parametre
                                    
                                    let pointCount, timeInterval, timeFormat;
                                    
                                    switch (timeframe) {
                                        case '1D':
                                            pointCount = 20;
                                            timeInterval = 3; // 3 minutes
                                            timeFormat = (i) => {
                                                const time = new Date();
                                                time.setHours(9, i * timeInterval, 0, 0);
                                                return time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                            };
                                            break;
                                        case '1W':
                                            pointCount = 7;
                                            timeInterval = 1; // 1 jour
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setDate(date.getDate() - (6 - i));
                                                return date.toLocaleDateString('fr-FR', { weekday: 'short' });
                                            };
                                            break;
                                        case '1M':
                                            pointCount = 30;
                                            timeInterval = 1; // 1 jour
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setDate(date.getDate() - (29 - i));
                                                return date.toLocaleDateString('fr-FR', { day: '2-digit' });
                                            };
                                            break;
                                        case '3M':
                                            pointCount = 12;
                                            timeInterval = 7; // 1 semaine
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setDate(date.getDate() - (11 - i) * 7);
                                                return date.toLocaleDateString('fr-FR', { month: 'short' });
                                            };
                                            break;
                                        case '6M':
                                            pointCount = 24;
                                            timeInterval = 7; // 1 semaine
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setDate(date.getDate() - (23 - i) * 7);
                                                return date.toLocaleDateString('fr-FR', { month: 'short' });
                                            };
                                            break;
                                        case '1A':
                                            pointCount = 12;
                                            timeInterval = 30; // 1 mois
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() - (11 - i));
                                                return date.toLocaleDateString('fr-FR', { month: 'short' });
                                            };
                                            break;
                                        case '5A':
                                            pointCount = 20;
                                            timeInterval = 90; // 3 mois
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() - (19 - i) * 3);
                                                return date.toLocaleDateString('fr-FR', { year: '2-digit', month: 'short' });
                                            };
                                            break;
                                        case 'MAX':
                                            pointCount = 30;
                                            timeInterval = 120; // 4 mois
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() - (29 - i) * 4);
                                                return date.toLocaleDateString('fr-FR', { year: '2-digit', month: 'short' });
                                            };
                                            break;
                                        case 'YTD':
                                            pointCount = 12;
                                            timeInterval = 30; // 1 mois depuis debut d'annee
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setMonth(i); // Janvier = 0, Decembre = 11
                                                return date.toLocaleDateString('fr-FR', { month: 'short' });
                                            };
                                            break;
                                        default:
                                            pointCount = 20;
                                            timeInterval = 3;
                                            timeFormat = (i) => {
                                                const time = new Date();
                                                time.setHours(9, i * timeInterval, 0, 0);
                                                return time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                            };
                                    }
                                    
                                    // Generer des donnees historiques plus realistes
                                    for (let i = 0; i < pointCount; i++) {
                                        const progress = i / (pointCount - 1); // 0 a 1
                                        
                                        // Calculer le prix historique base sur la tendance et la volatilite
                                        let historicalPrice;
                                        
                                        if (timeframe === 'YTD') {
                                            // Pour YTD, commencer au prix d'ouverture de l'annee
                                            const yearStartPrice = basePrice * (1 - changePercent / 100 * 0.8); // Prix approximatif debut d'annee
                                            const yearProgress = i / (pointCount - 1);
                                            historicalPrice = yearStartPrice + (yearProgress * (currentPrice - yearStartPrice));
                                        } else if (timeframe === '5A' || timeframe === 'MAX') {
                                            // Pour les periodes longues, simuler une croissance/evolution historique
                                            const yearsBack = timeframe === '5A' ? 5 : 10;
                                            const historicalMultiplier = 1 - (changePercent / 100) * (yearsBack * 0.2); // Evolution sur plusieurs annees
                                            const startPrice = currentPrice * historicalMultiplier;
                                            historicalPrice = startPrice + (progress * (currentPrice - startPrice));
                                        } else {
                                            // Pour les periodes courtes, utiliser la logique existante
                                            const trend = changePercent > 0 ? 1 : -1;
                                            const volatility = Math.random() * 0.02 - 0.01; // 1% de volatilite
                                            const priceVariation = (progress * change) + (volatility * basePrice);
                                            historicalPrice = Math.max(0.01, basePrice + priceVariation);
                                        }
                                        
                                        // Ajouter de la volatilite realiste
                                        const volatility = Math.random() * 0.015 - 0.0075; // 0.75% de volatilite
                                        const finalPrice = historicalPrice * (1 + volatility);
                                        
                                        // Calculer OHLC realistes
                                        const open = i === 0 ? (timeframe === 'YTD' ? basePrice * 0.9 : basePrice) : dataPoints[i-1]?.close || finalPrice;
                                        const close = Math.max(0.01, finalPrice);
                                        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
                                        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
                                        
                                        dataPoints.push({
                                            date: timeFormat(i),
                                            open: open,
                                            high: high,
                                            low: low,
                                            close: close,
                                            volume: Math.floor(Math.random() * 2000000) + 500000 // Volume plus realiste
                                        });
                                    }
                                    
                                    console.log(` Donnees ${timeframe} generees pour ${symbol}: ${dataPoints.length} points`);
                                    return dataPoints;
                                }
                                
                                return [];
                            })(),
                            metrics: {
                                peRatioTTM: ratios?.valuation?.peRatio || null,
                                pegRatioTTM: ratios?.valuation?.pegRatio || null,
                                priceToSalesRatioTTM: ratios?.valuation?.psRatio || null,
                                dividendYieldTTM: ratios?.debt?.dividendYield || null
                            },
                            ratios: {
                                debtEquityRatio: ratios?.debt?.debtEquityRatio || null,
                                returnOnEquityTTM: ratios?.profitability?.returnOnEquity || null,
                                returnOnAssetsTTM: ratios?.profitability?.returnOnAssets || null,
                                netProfitMarginTTM: ratios?.profitability?.netProfitMargin || null,
                                currentRatio: ratios?.liquidity?.currentRatio || null,
                                quickRatio: ratios?.liquidity?.quickRatio || null,
                                grossProfitMargin: ratios?.profitability?.grossProfitMargin || null,
                                operatingProfitMargin: ratios?.profitability?.operatingIncomeMargin || null
                            },
                            profile: {
                                companyName: profile?.data?.[0]?.companyName || profile?.companyName || `${symbol} Inc.`,
                                price: quote?.c || 0,
                                beta: profile?.data?.[0]?.beta || profile?.beta || null,
                                sector: profile?.data?.[0]?.sector || profile?.sector || 'Unknown',
                                industry: profile?.data?.[0]?.industry || profile?.industry || 'Unknown'
                            },
                            news: news?.news?.slice(0, 5)?.map(article => ({
                                title: article.title,
                                source: article.source?.name || 'Marketaux',
                                time: article.publishedAt,
                                url: article.url || '#',
                                sentiment: article.sentiment || 'neutral'
                            })) || [],
                            sentiment: {
                                overall: aiData?.sentiment?.overall || 60,
                                news: aiData?.sentiment?.news || 65,
                                social: 60,  // Pas encore disponible via IA
                                institutional: 55,  // Pas encore disponible via IA
                                retail: 70,  // Pas encore disponible via IA
                                summary: aiData?.sentiment?.summary || 'Analyse en cours'
                            },
                            //  Nouvelles donnees avec validation croisee
                            analystRecommendations: analystData ? {
                                consensus: analystData.consensus?.rating || 'N/A',
                                targetPrice: analystData.consensus?.targetPrice || null,
                                upside: analystData.consensus?.upside || null,
                                analystCount: analystData.consensus?.analystCount || 0,
                                breakdown: analystData.breakdown || {},
                                confidence: analystData.validation?.confidence || 0,
                                sources: analystData.validation?.sources || []
                            } : null,
                            earningsCalendar: earningsData ? {
                                nextEarningsDate: earningsData.consensus?.nextEarningsDate || null,
                                estimatedEPS: earningsData.consensus?.estimatedEPS || null,
                                estimatedRevenue: earningsData.consensus?.estimatedRevenue || null,
                                upcoming: earningsData.upcoming || [],
                                historical: earningsData.historical?.slice(0, 4) || [],
                                statistics: earningsData.statistics || null,
                                confidence: earningsData.validation?.confidence || 0
                            } : null,
                            dataValidation: {
                                quote: {
                                    confidence: quote?.metadata?.confidence || 0,
                                    status: quote?.metadata?.freshness || 'unknown',
                                    source: quote?.source || 'unknown',
                                    lastUpdated: quote?.metadata?.lastUpdated || null
                                },
                                profile: {
                                    confidence: profile?.metadata?.confidence || 0,
                                    status: profile?.metadata?.freshness || 'unknown',
                                    source: profile?.source || 'unknown',
                                    lastUpdated: profile?.metadata?.lastUpdated || null
                                },
                                ratios: {
                                    confidence: ratios?.metadata?.confidence || 0,
                                    quality: ratios?.metadata?.dataQuality || 'Unknown',
                                    source: ratios?.source || 'unknown',
                                    lastUpdated: ratios?.metadata?.lastUpdated || null
                                }
                            },
                            insights: {
                                catalysts: aiData?.insights?.catalysts || [
                                    'Analyse en cours des catalyseurs de marche',
                                    'Surveillance des annonces d\'entreprise',
                                    'Suivi des tendances du secteur'
                                ],
                                risks: aiData?.insights?.risks || [
                                    'Volatilite du marche',
                                    'Conditions macroeconomiques',
                                    'Concurrence sectorielle'
                                ],
                                consensus: aiData?.insights?.consensus || 'neutral',
                                reasoning: aiData?.insights?.reasoning || 'Analyse basee sur les donnees de marche actuelles'
                            },
                            //  Recommandations d'analyste IA (batch Perplexity)
                            aiAnalyst: aiData?.analyst ? {
                                recommendation: aiData.analyst.recommendation,
                                confidence: aiData.analyst.confidence,
                                keyPoints: aiData.analyst.keyPoints
                            } : null,
                            //  Indicateurs de fallback pour transparence
                            fallbackIndicators: fallbackIndicators,
                            dataQuality: {
                                total_sections: totalSections,
                                fallback_sections: fallbackSections,
                                production_sections: productionSections,
                                quality_percentage: qualityPercentage,
                                status: qualityPercentage >= 80 ? 'EXCELLENT' : 
                                        qualityPercentage >= 60 ? 'GOOD' : 
                                        qualityPercentage >= 40 ? 'FAIR' : 'POOR'
                            }
                        };

                    } catch (error) {
                        console.error(`Error fetching real data for ${symbol}:`, error);
                        return null;
                    }
                };

                // Chargement des donnees
                useEffect(() => {
                    const fetchData = async () => {
                        try {
                            setLoadingIntelli(true);
                            console.log(` Chargement des donnees pour ${selectedStock}...`);
                            
                            // Essayer d'abord avec les vraies APIs
                            const realData = await fetchRealStockData(selectedStock, timeframe);
                            if (realData && realData.quote && realData.quote.price > 0) {
                                setStockDataIntelli(realData);
                                setConnected(true);
                                setLastUpdateIntelli(new Date());
                                console.log(' Donnees chargees avec succes');
                                
                                // Verifier si les donnees intraday sont disponibles
                                if (!realData.intraday || realData.intraday.length === 0) {
                                    setViolations(prev => {
                                        // Eviter les doublons
                                        if (prev.find(v => v.code === 'intraday_missing')) return prev;
                                        return [
                                            ...prev,
                                            { code: 'intraday_missing', severity: 'low', message: 'Donnees intraday non disponibles - utilisation des donnees quote uniquement.' }
                                        ];
                                    });
                                }
                            } else {
                                throw new Error('Donnees invalides recues de l\'API');
                            }
                        } catch (error) {
                            console.error(' Erreur lors du chargement:', error?.message || String(error));
                            setConnected(false);
                            
                            // Utiliser mock data en dernier recours
                            const mockData = generateMockData(selectedStock);
                            setStockDataIntelli(mockData);
                            
                            // Enregistrer une violation visible dans l'helppop
                            setViolations(prev => {
                                if (prev.find(v => v.code === 'data_fetch_error')) return prev;
                                return [
                                    ...prev,
                                    { code: 'data_fetch_error', severity: 'high', message: 'Echec de recuperation API. Verifiez votre connexion et les cles API.' }
                                ];
                            });
                            setShowHelp(true);
                        } finally {
                            setLoadingIntelli(false);
                        }
                    };
                    fetchData();
                    //  OPTIMISATION API: Pas d'auto-refresh
                    // Chargement uniquement au changement de stock ou manuel
                }, [selectedStock]);

                //  Rechargement du TradingView Mini Chart quand le ticker change - VAGUE 2
                useEffect(() => {
                    const container = document.getElementById('tradingview-mini-chart-jlab');
                    if (container && container.children.length === 0) {
                        //  TradingView-compliant: Use appendChild instead of innerHTML
                        // Reference: https://www.tradingview.com/widget-docs/tutorials/build-page/widget-integration/
                        const widgetContainer = document.createElement('div');
                        widgetContainer.className = 'tradingview-widget-container__widget';

                        // Creer le nouveau script avec le ticker mis a jour
                        const script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
                        script.async = true;
                        script.text = JSON.stringify({
                            "symbol": `NASDAQ:${selectedStock}`,
                            "width": "100%",
                            "height": "100%",
                            "locale": "fr",
                            "dateRange": "1D",
                            "colorTheme": isDarkMode ? "dark" : "light",
                            "isTransparent": false,
                            "autosize": true,
                            "largeChartUrl": ""
                        });
                        widgetContainer.appendChild(script);
                        container.appendChild(widgetContainer);
                    }

                    // CLEANUP: Prevent memory leaks by removing widget content on unmount
                    return () => {
                        const container = document.getElementById('tradingview-mini-chart-jlab');
                        if (container) {
                            //  Proper DOM cleanup instead of innerHTML
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                        }
                    };
                }, [selectedStock, isDarkMode]);

                //  AUTO-REFRESH: Desactive - Chargement unique a l'arrivee sur la page
                // L'utilisateur peut actualiser manuellement via le bouton refresh
                // Les caches API optimisent les appels repetes:
                // - Quotes: 5 min cache
                // - Fundamentals: 1h cache
                // - AI data: 30 min cache

                // Timer (desactive pour eviter les actualisations inutiles)
                // useEffect(() => {
                //     const timer = setInterval(() => setTime(new Date()), 1000);
                //     return () => clearInterval(timer);
                // }, []);

                // Diagnostics environnementaux (violations) + ouverture auto du HelpPop
                useEffect(() => {
                    const newViolations = [];
                    try {
                        // Verifier les bibliotheques de graphiques
                        const rechartsAvailable = typeof window.Recharts !== 'undefined' || 
                                                typeof Recharts !== 'undefined' ||
                                                (typeof window !== 'undefined' && window.Recharts);
                        
                        const chartJsAvailable = typeof Chart !== 'undefined' || 
                                               (typeof window !== 'undefined' && window.Chart);
                        
                        if (!rechartsAvailable && !chartJsAvailable) {
                            newViolations.push({
                                code: 'charts_missing',
                                severity: 'high',
                                message: 'Aucune bibliotheque de graphiques disponible - graphiques desactives.'
                            });
                        } else if (!rechartsAvailable && chartJsAvailable) {
                            newViolations.push({
                                code: 'recharts_missing',
                                severity: 'medium',
                                message: 'Recharts non disponible - utilisation de Chart.js comme alternative.'
                            });
                        }
                    } catch (_) {
                        newViolations.push({ code: 'charts_missing', severity: 'high', message: 'Erreur de detection des bibliotheques de graphiques.' });
                    }

                    try {
                        // Verifier les icones (maintenant gerees par notre composant LucideIcon)
                        const iconsAvailable = typeof window.LucideIcon !== 'undefined' && 
                                             typeof window.LucideIcon === 'function';
                        
                        if (!iconsAvailable) {
                            newViolations.push({
                                code: 'icons_missing',
                                severity: 'low',
                                message: 'Composant d\'icones personnalise non disponible (fallback active).'
                            });
                        }
                    } catch (_) {
                        newViolations.push({ code: 'icons_missing', severity: 'low', message: 'Composant d\'icones personnalise non disponible (fallback active).' });
                    }

                    setViolations(newViolations);
                    if (newViolations.length > 0) {
                        setShowHelp(true);
                    }
                }, []);

                const stocks = [
                    { symbol: 'AAPL', name: 'Apple Inc.' },
                    { symbol: 'TSLA', name: 'Tesla Inc.' },
                    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
                    { symbol: 'MSFT', name: 'Microsoft Corp.' },
                    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
                    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
                    { symbol: 'META', name: 'Meta Platforms Inc.' },
                    { symbol: 'NFLX', name: 'Netflix Inc.' },
                    { symbol: 'AMD', name: 'Advanced Micro Devices' },
                    { symbol: 'INTC', name: 'Intel Corporation' },
                ];
                
                // Fonction pour determiner la couleur d'un indicateur
                // Basee sur les standards de l'industrie financiere et les meilleures pratiques d'analyse
                const getMetricColor = (metric, value) => {
                    if (value == null || value === 'N/A') return 'text-gray-400';
                    
                    const v = typeof value === 'string' ? parseFloat(value) : value;
                    if (isNaN(v)) return 'text-gray-400';
                    
                    switch(metric) {
                        case 'PE':
                            // P/E Ratio (Price to Earnings)
                            // Standards: S&P 500 moyenne historique ~15-20
                            // Source: Investopedia, Morningstar
                            if (v < 0) return 'text-red-500'; // Negatif = pertes
                            if (v < 15) return 'text-emerald-500'; // Sous-evalue / Excellent
                            if (v < 25) return 'text-blue-500'; // Juste valorise / Bon
                            if (v < 35) return 'text-yellow-500'; // Legerement surevalue / Attention
                            return 'text-red-500'; // Surevalue / Risque eleve
                            
                        case 'PEG':
                            // PEG Ratio (Price/Earnings to Growth)
                            // Standard: Peter Lynch suggere <1 = sous-evalue
                            // Source: "One Up on Wall Street" par Peter Lynch
                            if (v < 0) return 'text-red-500'; // Invalide
                            if (v < 1) return 'text-emerald-500'; // Sous-evalue / Excellent achat
                            if (v < 1.5) return 'text-blue-500'; // Juste valorise / Bon
                            if (v < 2) return 'text-yellow-500'; // Legerement cher / Attention
                            return 'text-green-500'; // Surevalue / Eviter
                            
                        case 'PS':
                            // P/S Ratio (Price to Sales)
                            // Standards varient par secteur, Tech: 2-5, Retail: 0.5-2
                            if (v < 1) return 'text-emerald-500'; // Sous-evalue
                            if (v < 3) return 'text-blue-500'; // Raisonnable
                            if (v < 5) return 'text-yellow-500'; // Eleve
                            return 'text-green-500'; // Tres eleve
                            
                        case 'ROE':
                            // ROE (Return on Equity)
                            // Standard: Warren Buffett recherche >15% de maniere constante
                            // Source: Berkshire Hathaway Letters to Shareholders
                            if (v < 0) return 'text-red-500'; // Perte / Tres mauvais
                            if (v < 10) return 'text-green-500'; // Faible / Mauvais
                            if (v < 15) return 'text-yellow-500'; // Moyen / Acceptable
                            if (v < 20) return 'text-blue-500'; // Bon / Au-dessus moyenne
                            return 'text-emerald-500'; // Excellent / Superieur
                            
                        case 'ROA':
                            // ROA (Return on Assets)
                            // Standard: >5% bon, >10% excellent pour la plupart des industries
                            // Source: Corporate Finance Institute
                            if (v < 0) return 'text-red-500'; // Perte
                            if (v < 5) return 'text-green-500'; // Faible utilisation des actifs
                            if (v < 10) return 'text-blue-500'; // Bon
                            if (v < 15) return 'text-emerald-500'; // Tres bon
                            return 'text-emerald-400'; // Exceptionnel
                            
                        case 'DE':
                            // D/E Ratio (Debt to Equity)
                            // Standard: <1 sain, >2 risque (varie selon secteur)
                            // Source: Financial Times, Wall Street Journal
                            if (v < 0.3) return 'text-emerald-500'; // Tres faible endettement / Excellent
                            if (v < 0.7) return 'text-blue-500'; // Endettement sain / Bon
                            if (v < 1.5) return 'text-yellow-500'; // Endettement modere / Attention
                            if (v < 2.5) return 'text-green-500'; // Endettement eleve / Risque
                            return 'text-red-500'; // Endettement tres eleve / Danger
                            
                        case 'Margin':
                            // Marge Nette (Net Profit Margin)
                            // Standards: Tech 15-25%, Retail 2-5%, Services 10-20%
                            // Source: NYU Stern School of Business - Damodaran
                            if (v < 0) return 'text-red-500'; // Pertes
                            if (v < 5) return 'text-green-500'; // Faible rentabilite
                            if (v < 10) return 'text-yellow-500'; // Rentabilite moderee
                            if (v < 20) return 'text-blue-500'; // Bonne rentabilite
                            return 'text-emerald-500'; // Excellente rentabilite
                            
                        case 'Beta':
                            // Beta (Volatilite vs marche)
                            // Standard: 1 = volatilite du marche, <1 defensif, >1 agressif
                            // Source: Modern Portfolio Theory - Markowitz
                            if (v < 0) return 'text-purple-500'; // Inverse du marche / Rare
                            if (v < 0.8) return 'text-emerald-500'; // Tres defensif / Faible volatilite
                            if (v < 1) return 'text-blue-500'; // Defensif / Stable
                            if (v < 1.3) return 'text-yellow-500'; // Legerement volatile
                            if (v < 1.7) return 'text-green-500'; // Volatile
                            return 'text-red-500'; // Tres volatile / Risque eleve
                            
                        case 'Div':
                            // Dividend Yield
                            // Standard: 2-5% sain, >7% potentiellement insoutenable
                            // Source: Dividend Aristocrats criteria
                            if (v < 1) return 'text-gray-400'; // Faible/Pas de dividende
                            if (v < 2) return 'text-blue-400'; // Dividende modeste
                            if (v < 4) return 'text-blue-500'; // Bon dividende
                            if (v < 6) return 'text-emerald-500'; // Excellent dividende
                            if (v < 8) return 'text-yellow-500'; // Eleve - verifier soutenabilite
                            return 'text-green-500'; // Tres eleve - risque de coupure
                            
                        case 'CurrentRatio':
                            // Current Ratio (Liquidite)
                            // Standard: 1.5-3 ideal, <1 probleme de liquidite
                            if (v < 1) return 'text-red-500'; // Probleme de liquidite
                            if (v < 1.5) return 'text-green-500'; // Liquidite juste
                            if (v < 2.5) return 'text-emerald-500'; // Liquidite saine
                            if (v < 3.5) return 'text-blue-500'; // Bonne liquidite
                            return 'text-yellow-500'; // Trop de liquidite non utilisee
                            
                        case 'QuickRatio':
                            // Quick Ratio (Test acide)
                            // Standard: >1 bon, >1.5 excellent
                            if (v < 0.5) return 'text-red-500'; // Probleme majeur
                            if (v < 1) return 'text-green-500'; // Risque de liquidite
                            if (v < 1.5) return 'text-blue-500'; // Acceptable
                            return 'text-emerald-500'; // Excellent
                            
                        case 'EPS':
                            // Earnings Per Share (croissance)
                            // Analyser la tendance plutot que la valeur absolue
                            if (v < 0) return 'text-red-500'; // Pertes
                            if (v < 1) return 'text-green-500'; // Faible
                            if (v < 3) return 'text-blue-500'; // Moyen
                            return 'text-emerald-500'; // Fort
                            
                        default:
                            return 'text-gray-400';
                    }
                };
                
                // Fonction pour executer le screener (utilise la liste de stocks fournie)
                const runScreenerForStocks = async (stocksList) => {
                    setLoadingScreener(true);
                    try {
                        const results = [];
                        
                        // Parcourir les stocks fournis et recuperer leurs donnees
                        for (const stock of stocksList) {
                            try {
                                const [quoteRes, profileRes, ratiosRes] = await Promise.allSettled([
                                    fetch(`${apiBase}/api/marketdata?endpoint=quote&symbol=${stock.symbol}&source=auto`),
                                    fetch(`${apiBase}/api/fmp?endpoint=profile&symbol=${stock.symbol}`),
                                    fetch(`${apiBase}/api/fmp?endpoint=ratios&symbol=${stock.symbol}`)
                                ]);
                                
                                const quote = quoteRes.status === 'fulfilled' && quoteRes.value.ok 
                                    ? await quoteRes.value.json() : null;
                                const profile = profileRes.status === 'fulfilled' && profileRes.value.ok 
                                    ? await profileRes.value.json() : null;
                                const ratios = ratiosRes.status === 'fulfilled' && ratiosRes.value.ok 
                                    ? await ratiosRes.value.json() : null;
                                
                                const stockData = {
                                    symbol: stock.symbol,
                                    name: stock.name,
                                    price: quote?.c || 0,
                                    change: quote?.dp || 0,
                                    marketCap: profile?.data?.[0]?.mktCap || profile?.mktCap || 0,
                                    pe: ratios?.data?.[0]?.peRatioTTM || ratios?.peRatioTTM || null,
                                    roe: ratios?.data?.[0]?.returnOnEquityTTM || ratios?.returnOnEquityTTM || null,
                                    debtEquity: ratios?.data?.[0]?.debtEquityRatioTTM || ratios?.debtEquityRatioTTM || null,
                                    sector: profile?.data?.[0]?.sector || profile?.sector || 'Unknown'
                                };
                                
                                // Appliquer les filtres
                                if (stockData.marketCap >= screenerFilters.minMarketCap &&
                                    (!stockData.pe || stockData.pe <= screenerFilters.maxPE) &&
                                    (!stockData.roe || (stockData.roe * 100) >= screenerFilters.minROE) &&
                                    (!stockData.debtEquity || stockData.debtEquity <= screenerFilters.maxDebtEquity) &&
                                    (screenerFilters.sector === 'all' || stockData.sector === screenerFilters.sector)) {
                                    results.push(stockData);
                                }
                            } catch (error) {
                                console.error(`Erreur pour ${stock.symbol}:`, error);
                            }
                        }
                        
                        setScreenerResults(results);
                        console.log(` Screener: ${results.length} resultats trouves sur ${stocksList.length} titres`);
                    } catch (error) {
                        console.error('Erreur screener:', error);
                    } finally {
                        setLoadingScreener(false);
                    }
                };

                const currentStock = stocks.find(s => s.symbol === selectedStock);
                const quote = stockDataIntelli?.quote || {};
                const metrics = stockDataIntelli?.metrics || {};
                const ratios = stockDataIntelli?.ratios || {};
                const profile = stockDataIntelli?.profile || {};
                const intraday = stockDataIntelli?.intraday || [];
                const news = stockDataIntelli?.news || [];
                const sentiment = stockDataIntelli?.sentiment || {};
                const insights = stockDataIntelli?.insights || {};
                const historicalRatios = stockDataIntelli?.historicalRatios || [];
                const movingAverages = stockDataIntelli?.movingAverages || {};

                const formatNumber = (num, prefix = '', suffix = '') => {
                    if (!num && num !== 0) return 'N/A';
                    const n = parseFloat(num);
                    if (isNaN(n)) return 'N/A';
                    if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T${suffix}`;
                    if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B${suffix}`;
                    if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M${suffix}`;
                    if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K${suffix}`;
                    return `${prefix}${n.toFixed(2)}${suffix}`;
                };

                const formatTimeAgo = (dateString) => {
                    const date = new Date(dateString);
                    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
                    if (hours < 1) return 'maintenant';
                    if (hours < 24) return `${hours}h`;
                    return `${Math.floor(hours / 24)}j`;
                };

                const technicalIndicators = {
                    RSI: { value: 67.8, signal: 'Achat' },
                    MACD: { value: 2.34, signal: 'Bullish' },
                    SMA_50: { value: (quote.price || 0) * 0.98, signal: 'Au-dessus' },
                    SMA_200: { value: (quote.price || 0) * 0.94, signal: 'Au-dessus' },
                };

                const orderFlow = { buyVolume: 68.4, sellVolume: 31.6 };

                const peerComparison = [
                    { name: 'AAPL', pe: metrics.peRatioTTM || 29.8, growth: 12.5, margin: (ratios.netProfitMarginTTM || 0.25) * 100 },
                    { name: 'MSFT', pe: 35.2, growth: 15.8, margin: 32.1 },
                    { name: 'GOOGL', pe: 24.6, growth: 18.2, margin: 28.7 },
                    { name: 'AMZN', pe: 52.3, growth: 22.1, margin: 8.9 },
                ];

                if (loadingIntelli) {
                    return (
                        <div className={`min-h-screen p-2 flex items-center justify-center transition-colors duration-300 ${
                            isDarkMode ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'
                        }`}>
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
                                <div className="text-sm text-gray-400">Chargement des donnees...</div>
                            </div>
                        </div>
                    );
                }
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

                // Reference locale pour utiliser le composant global
                const LucideIcon = LucideIconProp || (({ name, className = '' }) => (
                    <span className={className}>{name}</span>
                ));

                return (
                    <div className={`min-h-screen p-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'
                    }`}>
                        {/* FastGraph Section - Expandable */}
                        <FastGraphSection isDarkMode={isDarkMode} LucideIcon={LucideIcon} />

                        {/* Screener */}
                        {showScreener && (
                            <div className={`mb-2 border rounded-lg p-3 transition-colors duration-300 ${
                                isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <LucideIcon name="Filter" className="w-4 h-4 text-blue-500" />
                                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                             Screener de Titres
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
                                            <option value="Healthcare">Sante</option>
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
                                    {loadingScreener ? ' Analyse en cours...' : ' Lancer le Screener'}
                                </button>
                                
                                {/* Resultats */}
                                {screenerResults.length > 0 && (
                                    <div className="mt-3">
                                        <div className="text-xs text-gray-500 mb-2">
                                            {screenerResults.length} titre(s) trouve(s)
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
                                                            </td>
                                                            <td className="text-center p-2">
                                                                <button
                                                                    onClick={() => {
                                                                        handleSelectStock(stock.symbol);
                                                                        setShowScreener(false);
                                                                    }}
                                                                    className="px-2 py-1 bg-gray-800 text-white rounded text-[9px] hover:bg-gray-700 transition-colors"
                                                                >
                                                                    Voir
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Header */}
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 border rounded-lg transition-colors duration-300 ${
                                        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                    }`}>
                                        <LucideIcon name="Activity" className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <h1 className={`text-base font-bold flex items-center gap-2 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            Expert Trading Analytics
                                            {connected ? (
                                                <LucideIcon name="Wifi" className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <LucideIcon name="WifiOff" className="w-3 h-3 text-red-500" />
                                            )}
                                            {/*  Badge Score JSLAITM avec Glow Animation - VAGUE 3+4 */}
                                            {stockDataIntelli?.jslaiScore && (
                                                <div className={`px-4 py-1.5 rounded text-sm font-bold border-2 ${
                                                    stockDataIntelli.jslaiScore.total >= 75 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-600 glow-pulse' :
                                                    stockDataIntelli.jslaiScore.total >= 65 ? 'bg-gray-900/30 text-gray-400 border-gray-600' :
                                                    stockDataIntelli.jslaiScore.total >= 50 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-600' :
                                                    'bg-red-900/30 text-red-400 border-red-600 glow-pulse-red'
                                                }`}>
                                                     JSLAITM {stockDataIntelli.jslaiScore.total}/100
                                                </div>
                                            )}
                                            {/* Emma AI Analysis Button with Avatar */}
                                            <button
                                                onClick={() => {
                                                    const analysisRequest = `Analyse approfondie de ${selectedStock}: fondamentaux, techniques, actualites et recommandation d'investissement`;
                                                    // Set prefill message first, then switch tab after a short delay
                                                    setEmmaPrefillMessage(analysisRequest);
                                                    setTimeout(() => handleTabChange('ask-emma'), 50);
                                                }}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-semibold border-2 transition-all hover:scale-105 ${
                                                    isDarkMode
                                                        ? 'bg-purple-900/30 hover:bg-purple-800/40 text-purple-400 border-purple-600'
                                                        : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-400'
                                                }`}
                                                title={`Demander une analyse detaillee de ${selectedStock} a Emma IA`}
                                            >
                                                <img
                                                    src="EMMA-JSLAI-GOB-dark.jpg"
                                                    alt="Emma"
                                                    className="w-4 h-4 rounded-full"
                                                />
                                                Analyse d'Emma IA
                                            </button>
                                        </h1>
                                        <p className="text-[8px] text-gray-600">
                                            {stockDataIntelli?.dataQuality ? (
                                                <>
                                                     Qualite: {stockDataIntelli.dataQuality.quality_percentage}% ({stockDataIntelli.dataQuality.production_sections}/{stockDataIntelli.dataQuality.total_sections} reelles)
                                                    {stockDataIntelli.dataQuality.status === 'EXCELLENT' && ' '}
                                                    {stockDataIntelli.dataQuality.status === 'GOOD' && ' '}
                                                    {stockDataIntelli.dataQuality.status === 'FAIR' && ' '}
                                                    {stockDataIntelli.dataQuality.status === 'POOR' && ' '}
                                                </>
                                            ) : (
                                                'Mode Demo Hybride - FMP + Perplexity AI'
                                            )}
                                            {stockDataIntelli?.jslaiScore && (
                                                <span className="ml-2">- {stockDataIntelli.jslaiScore.interpretation} ({stockDataIntelli.jslaiScore.recommendation})</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoadingIntelli(true);
                                                console.log(' Actualisation des donnees...');
                                                const realData = await fetchRealStockData(selectedStock, timeframe);
                                                if (realData && realData.quote && realData.quote.price > 0) {
                                                    setStockDataIntelli(realData);
                                                    setConnected(true);
                                                    setLastUpdateIntelli(new Date());
                                                    console.log(' Donnees actualisees avec succes');
                                                } else {
                                                    throw new Error('Donnees invalides recues de l\'API');
                                                }
                                            } catch (error) {
                                                console.error(' Erreur lors de l\'actualisation:', error);
                                                setConnected(false);
                                            } finally {
                                                setLoadingIntelli(false);
                                            }
                                        }}
                                        className={`p-1.5 border rounded-md transition-all ${
                                            isDarkMode 
                                                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                : 'bg-white hover:bg-gray-100 border-gray-300'
                                        }`}
                                    >
                                        <LucideIcon name="RefreshCw" className="w-3 h-3 text-gray-400" />
                                    </button>

                                    <button
                                        onClick={emmaPopulateJLab}
                                        disabled={loadingIntelli}
                                        className={`px-3 py-1.5 border rounded-lg transition-all flex items-center gap-2 ${
                                            isDarkMode 
                                                ? 'bg-purple-900 hover:bg-purple-800 border-purple-800 text-purple-200' 
                                                : 'bg-purple-600 hover:bg-purple-700 border-purple-600 text-white'
                                        } disabled:opacity-50`}
                                    >
                                        <span></span>
                                        <span className="text-xs font-semibold">Emma Populate</span>
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpen(!menuOpen)}
                                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all ${
                                                isDarkMode 
                                                    ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                    : 'bg-white hover:bg-gray-100 border-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <div className={`text-xs font-bold transition-colors duration-300 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>{selectedStock}</div>
                                                <div className="text-[8px] text-gray-600">{profile.companyName || currentStock?.name}</div>
                                            </div>
                                            <LucideIcon name="ChevronDown" className={`w-3 h-3 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {menuOpen && (
                                            <div className={`absolute top-full mt-1 right-0 w-48 border rounded-lg shadow-2xl overflow-hidden z-50 transition-colors duration-300 ${
                                                isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                            }`}>
                                                {stocks.map((stock) => (
                                                    <button
                                                        key={stock.symbol}
                                                        onClick={() => {
                                                            handleSelectStock(stock.symbol);
                                                            setMenuOpen(false);
                                                        }}
                                                        className={`w-full p-2 flex items-center justify-between transition-all text-xs ${
                                                            selectedStock === stock.symbol 
                                                                ? (isDarkMode ? 'bg-neutral-800' : 'bg-gray-100')
                                                                : (isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-50')
                                                        }`}
                                                    >
                                                        <div className="text-left">
                                                            <div className={`font-bold transition-colors duration-300 ${
                                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                                            }`}>{stock.symbol}</div>
                                                            <div className="text-[8px] text-gray-600">{stock.name}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs font-mono font-bold text-gray-300">
                                            {time.toLocaleTimeString('fr-FR')}
                                        </div>
                                        <div className="text-[8px] text-gray-600">
                                            {time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>

                                <div className="flex gap-1">
                                        <button 
                                            onClick={() => setShowScreener(!showScreener)}
                                            className={`p-1.5 border rounded-md transition-all ${
                                                showScreener
                                                    ? 'bg-gray-800 border-gray-800'
                                                    : (isDarkMode 
                                                        ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                        : 'bg-white hover:bg-gray-100 border-gray-300')
                                            }`}
                                            title="Ouvrir le screener de titres"
                                        >
                                            <LucideIcon name="Filter" className={`w-3 h-3 ${showScreener ? 'text-white' : 'text-gray-500'}`} />
                                        </button>
                                        <button className={`p-1.5 border rounded-md transition-all ${
                                            isDarkMode 
                                                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                : 'bg-white hover:bg-gray-100 border-gray-300'
                                        }`}>
                                            <LucideIcon name="Bell" className="w-3 h-3 text-gray-500" />
                                        </button>
                                        <button className={`p-1.5 border rounded-md transition-all ${
                                            isDarkMode 
                                                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                : 'bg-white hover:bg-gray-100 border-gray-300'
                                        }`}>
                                            <LucideIcon name="Search" className="w-3 h-3 text-gray-500" />
                                        </button>
                                        <button className={`p-1.5 border rounded-md transition-all ${
                                            isDarkMode 
                                                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                : 'bg-white hover:bg-gray-100 border-gray-300'
                                        }`}>
                                            <LucideIcon name="Settings" className="w-3 h-3 text-gray-500" />
                                        </button>
                                    {/* HelpPop / Violations */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowHelp(!showHelp)}
                                            className={`p-1.5 border rounded-md transition-all ${
                                                isDarkMode 
                                                    ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                                                    : 'bg-white hover:bg-gray-100 border-gray-300'
                                            }`}
                                            title={violations.length ? 'Diagnostics: problemes detectes' : 'Aide IntelliStocks'}
                                        >
                                            <div className="relative">
                                                <LucideIcon name={violations.length ? 'AlertTriangle' : 'HelpCircle'} className={`w-3 h-3 ${violations.length ? 'text-yellow-500' : 'text-gray-500'}`} />
                                                {violations.length > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                                                )}
                                            </div>
                                        </button>

                                        {showHelp && (
                                            <div className={`absolute right-0 mt-2 w-80 border rounded-xl shadow-2xl z-50 ${
                                                isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                            }`}>
                                                <div className={`p-3 border-b flex items-center justify-between gap-2 ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <LucideIcon name="LifeBuoy" className="w-4 h-4 text-blue-500" />
                                                        <div>
                                                            <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Aide & diagnostics IntelliStocks</div>
                                                            <div className="text-[10px] text-gray-500">Mode Demo Hybride - FMP + Perplexity</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setShowHelp(false)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}>
                                                        <LucideIcon name="X" className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                </div>
                                                <div className="p-3 space-y-2 text-[11px]">
                                                    {violations.length > 0 ? (
                                                        <div>
                                                            <div className={`mb-1 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Problemes detectes</div>
                                                            <ul className="space-y-1">
                                                                {violations.map((v, i) => (
                                                                    <li key={i} className={`p-2 rounded border ${
                                                                        v.severity === 'high' ? (isDarkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800') :
                                                                        v.severity === 'medium' ? (isDarkMode ? 'bg-yellow-900/30 border-yellow-800 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800') :
                                                                        (isDarkMode ? 'bg-gray-900/30 border-gray-800 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800')
                                                                    }`}>
                                                                        {v.message}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className={`p-2 rounded border ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                                            Aucun probleme detecte.
                                                        </div>
                                                    )}

                                                    <div className={`pt-1 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`} />
                                                    <div className="space-y-1">
                                                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Conseils rapides</div>
                                        <ul className="list-disc pl-4 space-y-1 text-gray-500">
                                            <li>Les graphiques utilisent Chart.js pour afficher les donnees en temps reel.</li>
                                            <li>Les donnees proviennent de FMP et Marketaux via les APIs configurees.</li>
                                            <li>Actualisez avec le bouton rafraichir pour recharger les dernieres donnees du marche.</li>
                                            <li>Les graphiques s'adaptent au theme sombre/clair automatiquement.</li>
                                        </ul>
                                        
                                        <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`} />
                                        <div className="space-y-1">
                                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Code couleur des metriques</div>
                                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span>Excellent / Sous-evalue</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                                                    <span>Bon / Juste valorise</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    <span>Moyen / Attention</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span>Faible / Risque</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span>Mauvais / Danger</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                    <span>Non disponible</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`} />
                                        <div className="space-y-1">
                                            <div className={`font-semibold text-[10px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Standards utilises</div>
                                            <ul className="space-y-0.5 text-[9px] text-gray-500">
                                                <li><strong>P/E:</strong> &lt;15 excellent, 15-25 bon, &gt;25 eleve</li>
                                                <li><strong>PEG:</strong> &lt;1 sous-evalue (Peter Lynch), &gt;2 surevalue</li>
                                                <li><strong>ROE:</strong> &gt;20% excellent (Warren Buffett), &gt;15% bon</li>
                                                <li><strong>D/E:</strong> &lt;0.7 sain, &gt;2 risque</li>
                                                <li><strong>Marge:</strong> &gt;20% excellente, 10-20% bonne</li>
                                                <li><strong>Beta:</strong> &lt;1 defensif, &gt;1.5 volatil</li>
                                            </ul>
                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid Layout */}
                        <div className="grid grid-cols-12 gap-2">
                            
                            {/* Colonne gauche */}
                            <div className="col-span-8 space-y-2">
                                
                                {/* Graphique principal - VAGUE 3+4: Modern Effects */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 hover-lift shine-effect ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h2 className={`text-sm font-bold mb-0.5 transition-colors duration-300 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{selectedStock}</h2>
                                            <p className="text-[8px] text-gray-600">{profile.companyName || currentStock?.name} - {profile.sector || 'NASDAQ'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold transition-colors duration-300 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>${parseFloat(quote.price || 0).toFixed(2)}</div>
                                            <div className={`flex items-center gap-1 justify-end text-xs ${parseFloat(quote.changesPercentage || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {parseFloat(quote.changesPercentage || 0) >= 0 ? (
                                                    <LucideIcon name="ArrowUpRight" className="w-3 h-3" />
                                                ) : (
                                                    <LucideIcon name="ArrowDownRight" className="w-3 h-3" />
                                                )}
                                                <span className="font-semibold">
                                                    {parseFloat(quote.changesPercentage || 0) >= 0 ? '+' : ''}{parseFloat(quote.changesPercentage || 0).toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ width: '100%', height: 140 }}>
                                        {typeof Chart !== 'undefined' && intraday && intraday.length > 0 ? (
                                            <canvas key={`chart-${selectedStock}-${timeframe}`} ref={(canvas) => {
                                                if (canvas) {
                                                    // Detruire l'ancien graphique s'il existe
                                                    if (canvas.chart) {
                                                        canvas.chart.destroy();
                                                        canvas.chart = null;
                                                    }
                                                    
                                                    const ctx = canvas.getContext('2d');
                                                    canvas.chart = new Chart(ctx, {
                                                        type: 'line',
                                                        data: {
                                                            labels: intraday.map(d => d.date),
                                                            datasets: [{
                                                                label: 'Prix',
                                                                data: intraday.map(d => d.close),
                                                                borderColor: parseFloat(quote.changesPercentage || 0) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                                                                backgroundColor: parseFloat(quote.changesPercentage || 0) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                tension: 0.4,
                                                                fill: true,
                                                                borderWidth: 2
                                                            }]
                                                        },
                                                        options: {
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: { display: false },
                                                                tooltip: {
                                                                    mode: 'index',
                                                                    intersect: false,
                                                                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                                    titleColor: isDarkMode ? '#fff' : '#000',
                                                                    bodyColor: isDarkMode ? '#fff' : '#000',
                                                                    borderColor: isDarkMode ? '#444' : '#ddd',
                                                                    borderWidth: 1
                                                                }
                                                            },
                                                            scales: {
                                                                x: {
                                                                    display: timeframe === '1D' ? false : true, // Afficher les dates pour les periodes longues
                                                                    grid: { display: false },
                                                                    ticks: {
                                                                        color: isDarkMode ? '#888' : '#666',
                                                                        font: { size: 8 },
                                                                        maxTicksLimit: 6
                                                                    }
                                                                },
                                                                y: {
                                                                    display: true,
                                                                    position: 'right',
                                                                    grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                                                                    ticks: {
                                                                        color: isDarkMode ? '#888' : '#666',
                                                                        font: { size: 10 },
                                                                        callback: function(value) {
                                                                            return '$' + value.toFixed(2);
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            }} width="100%" height="140"></canvas>
                                        ) : (
                                            <div className="text-center text-gray-500 text-xs py-8">
                                                 Chargement des donnees du graphique...
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-1 mt-1.5">
                                    {['1D', '1W', '1M', '3M', '6M', '1A', '5A', 'MAX', 'YTD'].map((period) => (
                                            <button
                                                key={period}
                                                onClick={async () => {
                                                    setTimeframe(period);
                                                    // Recharger les donnees avec le nouveau timeframe
                                                    try {
                                                        setLoadingIntelli(true);
                                                        console.log(` Changement de timeframe vers ${period}...`);
                                                        const realData = await fetchRealStockData(selectedStock, period);
                                                        if (realData && realData.quote && realData.quote.price > 0) {
                                                            setStockDataIntelli(realData);
                                                            setConnected(true);
                                                            setLastUpdateIntelli(new Date());
                                                            console.log(` Donnees ${period} chargees avec succes`);
                                                        }
                                                    } catch (error) {
                                                        console.error(' Erreur lors du changement de timeframe:', error);
                                                    } finally {
                                                        setLoadingIntelli(false);
                                                    }
                                                }}
                                                className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
                                                    timeframe === period 
                                                        ? (isDarkMode 
                                                            ? 'bg-neutral-700 text-white border border-neutral-600' 
                                                            : 'bg-gray-300 text-gray-900 border border-gray-400')
                                                        : (isDarkMode 
                                                            ? 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-800 text-gray-500' 
                                                            : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600')
                                                }`}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Volume */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="BarChart3" className="w-3 h-3 text-gray-500" />
                                        Volume & Flux d'Ordres
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div style={{ width: '100%', height: 80 }}>
                                            {typeof Chart !== 'undefined' && intraday.length > 0 ? (
                                                <canvas ref={(canvas) => {
                                                    if (canvas && !canvas.chart) {
                                                        const ctx = canvas.getContext('2d');
                                                        canvas.chart = new Chart(ctx, {
                                                            type: 'bar',
                                                            data: {
                                                                labels: intraday.map(d => d.date),
                                                                datasets: [{
                                                                    label: 'Volume',
                                                                    data: intraday.map(d => d.volume),
                                                                    backgroundColor: intraday.map((d, i) => {
                                                                        if (i === 0) return 'rgba(34, 197, 94, 0.6)';
                                                                        return d.close >= intraday[i-1].close 
                                                                            ? 'rgba(34, 197, 94, 0.6)' 
                                                                            : 'rgba(239, 68, 68, 0.6)';
                                                                    }),
                                                                    borderColor: intraday.map((d, i) => {
                                                                        if (i === 0) return 'rgb(34, 197, 94)';
                                                                        return d.close >= intraday[i-1].close 
                                                                            ? 'rgb(34, 197, 94)' 
                                                                            : 'rgb(239, 68, 68)';
                                                                    }),
                                                                    borderWidth: 1
                                                                }]
                                                            },
                                                            options: {
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: {
                                                                    legend: { display: false },
                                                                    tooltip: {
                                                                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                                        titleColor: isDarkMode ? '#fff' : '#000',
                                                                        bodyColor: isDarkMode ? '#fff' : '#000'
                                                                    }
                                                                },
                                                                scales: {
                                                                    x: { display: false },
                                                                    y: { 
                                                                        display: true,
                                                                        position: 'right',
                                                                        grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                                                                        ticks: {
                                                                            color: isDarkMode ? '#888' : '#666',
                                                                            font: { size: 9 }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    }
                                                }} width="100%" height="80"></canvas>
                                            ) : (
                                                <div className="text-center text-gray-500 text-xs py-4">
                                                     Chargement du volume...
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className={`flex items-center justify-between p-1.5 border rounded text-[9px] transition-colors duration-300 ${
                                                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <span className="text-gray-500">Acheteurs</span>
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-16 h-1.5 rounded-full overflow-hidden ${
                                                        isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'
                                                    }`}>
                                                        <div className="h-full bg-emerald-500" style={{ width: `${orderFlow.buyVolume}%` }}></div>
                                                    </div>
                                                    <span className="text-emerald-500 font-bold">{orderFlow.buyVolume}%</span>
                                                </div>
                                            </div>
                                            <div className={`flex items-center justify-between p-1.5 border rounded text-[9px] transition-colors duration-300 ${
                                                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <span className="text-gray-500">Vendeurs</span>
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-16 h-1.5 rounded-full overflow-hidden ${
                                                        isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'
                                                    }`}>
                                                        <div className="h-full bg-red-500" style={{ width: `${orderFlow.sellVolume}%` }}></div>
                                                    </div>
                                                    <span className="text-red-500 font-bold">{orderFlow.sellVolume}%</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                <div className={`p-1.5 border rounded text-center transition-colors duration-300 ${
                                                    isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div className="text-[8px] text-gray-600">Volume</div>
                                                    <div className={`text-xs font-bold transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>{formatNumber(quote.volume)}</div>
                                                </div>
                                                <div className={`p-1.5 border rounded text-center transition-colors duration-300 ${
                                                    isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div className="text-[8px] text-gray-600">Cap</div>
                                                    <div className={`text-xs font-bold transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>{formatNumber(quote.marketCap)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TradingView Mini Chart - VAGUE 2: Quick Wins + VAGUE 3+4: Modern Effects */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 hover-lift shine-effect ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-2 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="LineChart" className="w-3 h-3 text-gray-500" />
                                        TradingView Mini Chart
                                    </h3>
                                    <div style={{ height: '250px' }}>
                                        <div
                                            id="tradingview-mini-chart-jlab"
                                            className="tradingview-widget-container"
                                            style={{ height: '100%', width: '100%' }}
                                            ref={(container) => {
                                                if (container && container.children.length === 0) {
                                                    //  TradingView-compliant: Use appendChild instead of innerHTML
                                                    const widgetContainer = document.createElement('div');
                                                    widgetContainer.className = 'tradingview-widget-container__widget';

                                                    // Creer le script TradingView
                                                    const script = document.createElement('script');
                                                    script.type = 'text/javascript';
                                                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
                                                    script.async = true;
                                                    script.text = JSON.stringify({
                                                        "symbol": `NASDAQ:${selectedStock}`,
                                                        "width": "100%",
                                                        "height": "100%",
                                                        "locale": "fr",
                                                        "dateRange": "1D",
                                                        "colorTheme": isDarkMode ? "dark" : "light",
                                                        "isTransparent": false,
                                                        "autosize": true,
                                                        "largeChartUrl": ""
                                                    });
                                                    widgetContainer.appendChild(script);
                                                    container.appendChild(widgetContainer);
                                                }
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Moyennes Mobiles - Analyse des Croisements */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="TrendingUp" className="w-3 h-3 text-gray-500" />
                                        Moyennes Mobiles & Croisements
                                    </h3>
                                    
                                    {/* Indicateur de tendance global */}
                                    <div className={`mb-2 p-2 border rounded text-center ${
                                        movingAverages.interpretation?.trend?.includes('Haussier fort') 
                                            ? (isDarkMode ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50 border-emerald-200')
                                            : movingAverages.interpretation?.trend?.includes('Haussier') 
                                            ? (isDarkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-800 border-gray-700')
                                            : movingAverages.interpretation?.trend?.includes('Baissier fort')
                                            ? (isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200')
                                            : movingAverages.interpretation?.trend?.includes('Baissier')
                                            ? (isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200')
                                            : (isDarkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-50 border-gray-200')
                                    }`}>
                                        <div className="text-[8px] text-gray-500 mb-0.5">Tendance Globale</div>
                                        <div className={`text-xs font-bold ${
                                            movingAverages.interpretation?.trend?.includes('Haussier') ? 'text-emerald-500' :
                                            movingAverages.interpretation?.trend?.includes('Baissier') ? 'text-red-500' :
                                            'text-gray-400'
                                        }`}>
                                            {movingAverages.interpretation?.trend === 'Haussier fort' && ' '}
                                            {movingAverages.interpretation?.trend === 'Baissier fort' && ' '}
                                            {movingAverages.interpretation?.trend || 'Calcul en cours...'}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        {/* SMA 20 */}
                                        <div className={`p-1.5 border rounded transition-colors duration-300 ${
                                            isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-[9px] font-semibold text-gray-400">SMA 20 jours</div>
                                                <div className="text-[9px] text-gray-500">
                                                    ${movingAverages.sma20?.value?.toFixed(2) || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className={`text-[8px] font-semibold ${
                                                    movingAverages.sma20?.diff > 0 ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                    {movingAverages.interpretation?.sma20}
                                                    {movingAverages.sma20?.diff > 0 ? ' ^' : ' v'}
                                                </div>
                                                <div className={`text-xs font-bold ${
                                                    Math.abs(movingAverages.sma20?.diff || 0) > 5 
                                                        ? (movingAverages.sma20?.diff > 0 ? 'text-emerald-500' : 'text-red-500')
                                                        : 'text-blue-500'
                                                }`}>
                                                    {movingAverages.sma20?.diff > 0 ? '+' : ''}{movingAverages.sma20?.diff?.toFixed(2) || 0}%
                                                </div>
                                            </div>
                                            <div className="text-[7px] text-gray-500 mt-1 italic">
                                                {Math.abs(movingAverages.sma20?.diff || 0) < 2 
                                                    ? ' Proche de la moyenne - Zone de consolidation'
                                                    : movingAverages.sma20?.diff > 5 
                                                    ? ' Fort au-dessus - Momentum haussier'
                                                    : movingAverages.sma20?.diff < -5
                                                    ? ' Fort en-dessous - Pression baissiere'
                                                    : movingAverages.sma20?.diff > 0
                                                    ? ' Au-dessus - Signal positif'
                                                    : ' En-dessous - Signal negatif'}
                                            </div>
                                        </div>
                                        
                                        {/* SMA 50 */}
                                        <div className={`p-1.5 border rounded transition-colors duration-300 ${
                                            isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-[9px] font-semibold text-gray-400">SMA 50 jours</div>
                                                <div className="text-[9px] text-gray-500">
                                                    ${movingAverages.sma50?.value?.toFixed(2) || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className={`text-[8px] font-semibold ${
                                                    movingAverages.sma50?.diff > 0 ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                    {movingAverages.interpretation?.sma50}
                                                    {movingAverages.sma50?.diff > 0 ? ' ^' : ' v'}
                                                </div>
                                                <div className={`text-xs font-bold ${
                                                    Math.abs(movingAverages.sma50?.diff || 0) > 5 
                                                        ? (movingAverages.sma50?.diff > 0 ? 'text-emerald-500' : 'text-red-500')
                                                        : 'text-blue-500'
                                                }`}>
                                                    {movingAverages.sma50?.diff > 0 ? '+' : ''}{movingAverages.sma50?.diff?.toFixed(2) || 0}%
                                                </div>
                                            </div>
                                            <div className="text-[7px] text-gray-500 mt-1 italic">
                                                {movingAverages.sma50?.diff > 0 && movingAverages.sma20?.diff > 0
                                                    ? ' Tendance moyen terme positive'
                                                    : movingAverages.sma50?.diff < 0 && movingAverages.sma20?.diff < 0
                                                    ? ' Tendance moyen terme negative'
                                                    : movingAverages.sma50?.diff > 0
                                                    ? ' Support potentiel - Test en cours'
                                                    : ' Resistance - Vigilance recommandee'}
                                            </div>
                                        </div>
                                        
                                        {/* SMA 200 */}
                                        <div className={`p-1.5 border rounded transition-colors duration-300 ${
                                            isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-[9px] font-semibold text-gray-400">SMA 200 jours</div>
                                                <div className="text-[9px] text-gray-500">
                                                    ${movingAverages.sma200?.value?.toFixed(2) || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className={`text-[8px] font-semibold ${
                                                    movingAverages.sma200?.diff > 0 ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                    {movingAverages.interpretation?.sma200}
                                                    {movingAverages.sma200?.diff > 0 ? ' ^' : ' v'}
                                                </div>
                                                <div className={`text-xs font-bold ${
                                                    Math.abs(movingAverages.sma200?.diff || 0) > 10 
                                                        ? (movingAverages.sma200?.diff > 0 ? 'text-emerald-500' : 'text-red-500')
                                                        : 'text-blue-500'
                                                }`}>
                                                    {movingAverages.sma200?.diff > 0 ? '+' : ''}{movingAverages.sma200?.diff?.toFixed(2) || 0}%
                                                </div>
                                            </div>
                                            <div className="text-[7px] text-gray-500 mt-1 italic">
                                                {movingAverages.sma200?.diff > 10
                                                    ? ' Bull Market confirme - Tendance long terme haussiere'
                                                    : movingAverages.sma200?.diff > 0
                                                    ? ' Au-dessus SMA200 - Marche haussier'
                                                    : movingAverages.sma200?.diff < -10
                                                    ? ' Bear Market - Tendance long terme baissiere'
                                                    : ' En-dessous SMA200 - Marche baissier'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Interpretation des croisements */}
                                    {(movingAverages.sma20 && movingAverages.sma50) && (
                                        <div className={`mt-2 p-2 border rounded text-[8px] ${
                                            movingAverages.sma20.value > movingAverages.sma50.value && movingAverages.sma50.value > movingAverages.sma200.value
                                                ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                                                : movingAverages.sma20.value < movingAverages.sma50.value && movingAverages.sma50.value < movingAverages.sma200.value
                                                ? (isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                                                : (isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700')
                                        }`}>
                                            <div className="font-semibold mb-1 flex items-center gap-2">
                                                <Icon emoji="" size={16} />
                                                Analyse des Croisements
                                            </div>
                                            {movingAverages.sma20.value > movingAverages.sma50.value && movingAverages.sma50.value > movingAverages.sma200.value ? (
                                                <div> Configuration ideale : SMA20 &gt; SMA50 &gt; SMA200. Tendance haussiere confirmee sur tous les horizons temporels.</div>
                                            ) : movingAverages.sma20.value < movingAverages.sma50.value && movingAverages.sma50.value < movingAverages.sma200.value ? (
                                                <div> Configuration baissiere : SMA20 &lt; SMA50 &lt; SMA200. Pression vendeuse sur tous les horizons. Prudence recommandee.</div>
                                            ) : movingAverages.sma20.value > movingAverages.sma50.value ? (
                                                <div> Croisement recent possible : SMA20 au-dessus de SMA50. Signal de retournement haussier a confirmer.</div>
                                            ) : (
                                                <div> Moyennes desalignees : Configuration mixte. Attendre confirmation de tendance avant prise de position.</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Indicateurs */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="Activity" className="w-3 h-3 text-gray-500" />
                                        Indicateurs Techniques
                                    </h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {Object.entries(technicalIndicators).map(([key, value]) => {
                                            const signalColor = value.signal === 'Achat' || value.signal === 'Bullish' || value.signal === 'Au-dessus'
                                                ? 'text-emerald-500'
                                                : value.signal === 'Neutre'
                                                ? 'text-blue-500'
                                                : 'text-red-500';
                                            
                                            return (
                                                <div key={key} className={`flex items-center justify-between p-1.5 border rounded transition-colors duration-300 ${
                                                    isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div>
                                                        <div className="font-semibold text-[9px] text-gray-400">{key.replace('_', ' ')}</div>
                                                        <div className={`text-[8px] font-semibold ${signalColor}`}>{value.signal}</div>
                                                    </div>
                                                    <div className={`text-sm font-bold ${signalColor}`}>
                                                        {typeof value.value === 'number' ? value.value.toFixed(2) : value.value}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Fondamentaux */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="DollarSign" className="w-3 h-3 text-gray-500" />
                                        Analyse Fondamentale
                                    </h3>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { label: 'P/E', value: metrics.peRatioTTM, suffix: 'x', metric: 'PE' },
                                            { label: 'PEG', value: metrics.pegRatioTTM, suffix: '', metric: 'PEG' },
                                            { label: 'P/S', value: metrics.priceToSalesRatioTTM, suffix: 'x', metric: 'PS' },
                                            { label: 'ROE', value: ratios.returnOnEquityTTM ? (ratios.returnOnEquityTTM * 100) : null, suffix: '%', metric: 'ROE', isPercent: true },
                                            { label: 'ROA', value: ratios.returnOnAssetsTTM ? (ratios.returnOnAssetsTTM * 100) : null, suffix: '%', metric: 'ROA', isPercent: true },
                                            { label: 'D/E', value: ratios.debtEquityRatio, suffix: 'x', metric: 'DE' },
                                            { label: 'Marge', value: ratios.netProfitMarginTTM ? (ratios.netProfitMarginTTM * 100) : null, suffix: '%', metric: 'Margin', isPercent: true },
                                            { label: 'Beta', value: profile.beta, suffix: '', metric: 'Beta' },
                                            { label: 'Div', value: metrics.dividendYieldTTM ? (metrics.dividendYieldTTM * 100) : null, suffix: '%', metric: 'Div', isPercent: true },
                                        ].map((metric) => (
                                            <div key={metric.label} className={`p-1.5 border rounded text-center transition-colors duration-300 ${
                                                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <div className="text-[8px] text-gray-600 mb-0.5">{metric.label}</div>
                                                <div className={`text-xs font-bold transition-colors duration-300 ${
                                                    getMetricColor(metric.metric, metric.value)
                                                }`}>
                                                    {metric.value != null ? 
                                                        (typeof metric.value === 'number' ? metric.value.toFixed(metric.isPercent ? 1 : 2) + metric.suffix : metric.value) 
                                                        : 'N/A'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ratios Historiques */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-2 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="TrendingUp" className="w-3 h-3 text-gray-500" />
                                        Ratios Historiques (Tendances)
                                    </h3>
                                    
                                    {historicalRatios.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* Graphique P/E Ratio */}
                                            <div className={`border rounded p-1.5 ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="text-[9px] font-semibold text-gray-400 mb-1">P/E Ratio (Price to Earnings)</div>
                                                <div style={{ width: '100%', height: 60 }}>
                                                    <canvas ref={(canvas) => {
                                                        if (canvas && !canvas.chart && historicalRatios.length > 0) {
                                                            const ctx = canvas.getContext('2d');
                                                            const peData = historicalRatios.map(r => r.peRatioTTM).filter(v => v != null).reverse();
                                                            const labels = historicalRatios.map(r => new Date(r.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })).reverse();
                                                            
                                                            canvas.chart = new Chart(ctx, {
                                                                type: 'line',
                                                                data: {
                                                                    labels: labels,
                                                                    datasets: [{
                                                                        label: 'P/E',
                                                                        data: peData,
                                                                        borderColor: 'rgb(59, 130, 246)',
                                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                                        tension: 0.3,
                                                                        fill: true,
                                                                        borderWidth: 2,
                                                                        pointRadius: 2
                                                                    }]
                                                                },
                                                                options: {
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        legend: { display: false },
                                                                        tooltip: {
                                                                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                                            titleColor: isDarkMode ? '#fff' : '#000',
                                                                            bodyColor: isDarkMode ? '#fff' : '#000',
                                                                            borderColor: isDarkMode ? '#444' : '#ddd',
                                                                            borderWidth: 1
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        x: { 
                                                                            display: true,
                                                                            grid: { display: false },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 }
                                                                            }
                                                                        },
                                                                        y: { 
                                                                            display: true,
                                                                            position: 'right',
                                                                            grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }} width="100%" height="60"></canvas>
                                                </div>
                                            </div>

                                            {/* Graphique ROE */}
                                            <div className={`border rounded p-1.5 ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="text-[9px] font-semibold text-gray-400 mb-1">ROE (Return on Equity)</div>
                                                <div style={{ width: '100%', height: 60 }}>
                                                    <canvas ref={(canvas) => {
                                                        if (canvas && !canvas.chart && historicalRatios.length > 0) {
                                                            const ctx = canvas.getContext('2d');
                                                            const roeData = historicalRatios.map(r => r.returnOnEquityTTM ? r.returnOnEquityTTM * 100 : null).filter(v => v != null).reverse();
                                                            const labels = historicalRatios.map(r => new Date(r.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })).reverse();
                                                            
                                                            canvas.chart = new Chart(ctx, {
                                                                type: 'line',
                                                                data: {
                                                                    labels: labels,
                                                                    datasets: [{
                                                                        label: 'ROE %',
                                                                        data: roeData,
                                                                        borderColor: 'rgb(34, 197, 94)',
                                                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                                        tension: 0.3,
                                                                        fill: true,
                                                                        borderWidth: 2,
                                                                        pointRadius: 2
                                                                    }]
                                                                },
                                                                options: {
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        legend: { display: false },
                                                                        tooltip: {
                                                                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                                            titleColor: isDarkMode ? '#fff' : '#000',
                                                                            bodyColor: isDarkMode ? '#fff' : '#000',
                                                                            borderColor: isDarkMode ? '#444' : '#ddd',
                                                                            borderWidth: 1,
                                                                            callbacks: {
                                                                                label: (context) => `ROE: ${context.parsed.y.toFixed(2)}%`
                                                                            }
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        x: { 
                                                                            display: true,
                                                                            grid: { display: false },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 }
                                                                            }
                                                                        },
                                                                        y: { 
                                                                            display: true,
                                                                            position: 'right',
                                                                            grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 },
                                                                                callback: (value) => value.toFixed(1) + '%'
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }} width="100%" height="60"></canvas>
                                                </div>
                                            </div>

                                            {/* Graphique Debt to Equity */}
                                            <div className={`border rounded p-1.5 ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="text-[9px] font-semibold text-gray-400 mb-1">D/E Ratio (Debt to Equity)</div>
                                                <div style={{ width: '100%', height: 60 }}>
                                                    <canvas ref={(canvas) => {
                                                        if (canvas && !canvas.chart && historicalRatios.length > 0) {
                                                            const ctx = canvas.getContext('2d');
                                                            const deData = historicalRatios.map(r => r.debtEquityRatioTTM).filter(v => v != null).reverse();
                                                            const labels = historicalRatios.map(r => new Date(r.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })).reverse();
                                                            
                                                            canvas.chart = new Chart(ctx, {
                                                                type: 'bar',
                                                                data: {
                                                                    labels: labels,
                                                                    datasets: [{
                                                                        label: 'D/E',
                                                                        data: deData,
                                                                        backgroundColor: deData.map(v => v > 1 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)'),
                                                                        borderColor: deData.map(v => v > 1 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'),
                                                                        borderWidth: 1
                                                                    }]
                                                                },
                                                                options: {
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        legend: { display: false },
                                                                        tooltip: {
                                                                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                                            titleColor: isDarkMode ? '#fff' : '#000',
                                                                            bodyColor: isDarkMode ? '#fff' : '#000',
                                                                            borderColor: isDarkMode ? '#444' : '#ddd',
                                                                            borderWidth: 1
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        x: { 
                                                                            display: true,
                                                                            grid: { display: false },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 }
                                                                            }
                                                                        },
                                                                        y: { 
                                                                            display: true,
                                                                            position: 'right',
                                                                            grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }} width="100%" height="60"></canvas>
                                                </div>
                                            </div>

                                            {/* Graphique Profit Margin */}
                                            <div className={`border rounded p-1.5 ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="text-[9px] font-semibold text-gray-400 mb-1">Marge Nette (Net Profit Margin)</div>
                                                <div style={{ width: '100%', height: 60 }}>
                                                    <canvas ref={(canvas) => {
                                                        if (canvas && !canvas.chart && historicalRatios.length > 0) {
                                                            const ctx = canvas.getContext('2d');
                                                            const marginData = historicalRatios.map(r => r.netProfitMarginTTM ? r.netProfitMarginTTM * 100 : null).filter(v => v != null).reverse();
                                                            const labels = historicalRatios.map(r => new Date(r.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })).reverse();
                                                            
                                                            canvas.chart = new Chart(ctx, {
                                                                type: 'line',
                                                                data: {
                                                                    labels: labels,
                                                                    datasets: [{
                                                                        label: 'Marge %',
                                                                        data: marginData,
                                                                        borderColor: 'rgb(168, 85, 247)',
                                                                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                                                        tension: 0.3,
                                                                        fill: true,
                                                                        borderWidth: 2,
                                                                        pointRadius: 2
                                                                    }]
                                                                },
                                                                options: {
                                                                    responsive: true,
                                                                    maintainAspectRatio: false,
                                                                    plugins: {
                                                                        legend: { display: false },
                                                                        tooltip: {
                                                                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                                            titleColor: isDarkMode ? '#fff' : '#000',
                                                                            bodyColor: isDarkMode ? '#fff' : '#000',
                                                                            borderColor: isDarkMode ? '#444' : '#ddd',
                                                                            borderWidth: 1,
                                                                            callbacks: {
                                                                                label: (context) => `Marge: ${context.parsed.y.toFixed(2)}%`
                                                                            }
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        x: { 
                                                                            display: true,
                                                                            grid: { display: false },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 }
                                                                            }
                                                                        },
                                                                        y: { 
                                                                            display: true,
                                                                            position: 'right',
                                                                            grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                                                                            ticks: { 
                                                                                color: isDarkMode ? '#888' : '#666',
                                                                                font: { size: 8 },
                                                                                callback: (value) => value.toFixed(1) + '%'
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }} width="100%" height="60"></canvas>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 text-xs py-4">
                                            <div className="mb-2"><Icon emoji="" size={24} /></div>
                                            <div>Chargement des ratios historiques...</div>
                                        </div>
                                    )}
                                </div>

                                {/* Insights */}
                                {insights.catalysts && (
                                    <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                    }`}>
                                        <h3 className="text-[10px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                            <LucideIcon name="Brain" className="w-3 h-3 text-gray-500" />
                                            Insights IA (Perplexity)
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="text-[9px] text-gray-500 mb-1 font-semibold"> Catalyseurs</div>
                                                {insights.catalysts.map((cat, i) => (
                                                    <div key={i} className="text-[8px] text-emerald-400 mb-0.5">- {cat}</div>
                                                ))}
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-gray-500 mb-1 font-semibold"> Risques</div>
                                                {insights.risks.map((risk, i) => (
                                                    <div key={i} className="text-[8px] text-green-400 mb-0.5">- {risk}</div>
                                                ))}
                                            </div>
                                            <div className={`p-1.5 border rounded transition-colors duration-300 ${
                                                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <div className="text-[9px] text-gray-500 mb-0.5">Consensus : 
                                                    <span className={`ml-1 font-bold ${
                                                        insights.consensus === 'bullish' ? 'text-emerald-500' :
                                                        insights.consensus === 'bearish' ? 'text-red-500' : 'text-gray-400'
                                                    }`}>
                                                        {insights.consensus === 'bullish' ? ' Bullish' : 
                                                         insights.consensus === 'bearish' ? ' Bearish' : ' Neutre'}
                                                    </span>
                                                </div>
                                                <div className="text-[8px] text-gray-400">{insights.reasoning}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Comparaison */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[10px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="TrendingUp" className="w-3 h-3 text-gray-500" />
                                        Comparaison Pairs
                                    </h3>
                                    <div style={{ width: '100%', height: 120 }}>
                                        <div className="text-center text-gray-500 text-xs py-8">
                                             Graphique Radar (Recharts necessite une configuration avancee)
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Colonne droite */}
                            <div className="col-span-4 space-y-2">
                                
                                {/* Stats */}
                                <div className="space-y-1.5">
                                    <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                    }`}>
                                        <div className="text-[8px] text-gray-600 mb-0.5">Capitalisation</div>
                                        <div className={`text-base font-bold transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>{formatNumber(quote.marketCap)}</div>
                                        <div className="text-[8px] text-gray-500">P/E: {metrics.peRatioTTM?.toFixed(1) || 'N/A'}</div>
                                    </div>

                                    <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                    }`}>
                                        <div className="text-[8px] text-gray-600 mb-0.5">Sentiment IA</div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="text-base font-bold text-emerald-500">{sentiment.overall || 0}%</div>
                                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                                                isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'
                                            }`}>
                                                <div className="h-full bg-emerald-500" style={{ width: `${sentiment.overall || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="text-[8px] text-emerald-500 mt-0.5">
                                            {(sentiment.overall || 0) > 70 ? 'Tres Bullish' : (sentiment.overall || 0) > 50 ? 'Bullish' : 'Neutre'}
                                        </div>
                                    </div>

                                    <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                    }`}>
                                        <div className="text-[8px] text-gray-600 mb-0.5">Prix Actuel</div>
                                        <div className={`text-base font-bold transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>${parseFloat(quote.price || 0).toFixed(2)}</div>
                                        <div className="text-[8px] text-emerald-500 mt-0.5">Volume: {formatNumber(quote.volume)}</div>
                                    </div>
                                </div>

                                {/* Sentiment detaille */}
                                {sentiment.overall && (
                                    <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                    }`}>
                                        <h3 className="text-[9px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                            <LucideIcon name="Brain" className="w-3 h-3 text-gray-500" />
                                            Sentiment IA
                                        </h3>
                                        <div style={{ width: '100%', height: 90 }}>
                                            <div className="text-center text-gray-500 text-xs py-6">
                                                 Graphique Sentiment
                                            </div>
                                        </div>
                                        {sentiment.summary && (
                                            <div className={`mt-1.5 p-1.5 border rounded transition-colors duration-300 ${
                                                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <div className="text-[8px] text-gray-400">{sentiment.summary}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* News */}
                                <div className={`border rounded-lg p-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                                }`}>
                                    <h3 className="text-[9px] font-bold mb-1.5 flex items-center gap-1 text-gray-400">
                                        <LucideIcon name="Newspaper" className="w-3 h-3 text-gray-500" />
                                        News Temps Reel
                                    </h3>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {news.map((item, i) => (
                                            <div key={i} className={`p-1.5 border rounded transition-all cursor-pointer ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-750' 
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}>
                                                <div className="flex items-start justify-between mb-0.5">
                                                    <div className="text-[7px] px-1 py-0.5 rounded bg-emerald-900 text-emerald-500"></div>
                                                    <span className="text-[7px] text-gray-600">{formatTimeAgo(item.publishedDate)}</span>
                                                </div>
                                                <div className={`font-semibold text-[8px] mb-0.5 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>{item.title}</div>
                                                <div className="text-[7px] text-gray-500">{item.site}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`mt-2 p-1.5 border rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-300'
                        }`}>
                            <div className="flex items-center gap-2">
                                <LucideIcon name="AlertCircle" className="w-3 h-3 text-gray-500" />
                                <div className="flex-1">
                                    <div className="font-semibold text-[9px] text-gray-400">
                                         Dashboard Hybride Fonctionnel
                                    </div>
                                    <div className="text-[7px] text-gray-600">
                                        Mode Demo - FMP (donnees precises) + Perplexity (intelligence IA)
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] text-gray-500 font-bold">Hybride Optimal</div>
                                    <div className="text-[7px] text-gray-600">Precision + IA</div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
});

// Set display name for debugging
IntelliStocksTab.displayName = 'IntelliStocksTab';

export default IntelliStocksTab;
