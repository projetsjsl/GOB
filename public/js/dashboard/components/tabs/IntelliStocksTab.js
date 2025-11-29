// Auto-converted from monolithic dashboard file
// Component: IntelliStocksTab

const { useState, useEffect, useRef, useCallback } = React;

const IntelliStocksTab = ({ isDarkMode }) => {
                const [time, setTime] = useState(new Date());
                const [selectedStock, setSelectedStock] = useState('AAPL');
                const [timeframe, setTimeframe] = useState('1D');
                const [menuOpen, setMenuOpen] = useState(false);
                const [stockDataIntelli, setStockDataIntelli] = useState(null);
                const [loadingIntelli, setLoadingIntelli] = useState(true);
                const [connected, setConnected] = useState(false);
                const [lastUpdateIntelli, setLastUpdateIntelli] = useState(null);
                // Helppop: visibilité et liste des violations détectées
                const [showHelp, setShowHelp] = useState(false);
                const [violations, setViolations] = useState([]);
                // Screener visibility
                const [showScreener, setShowScreener] = useState(false);
                
                // 🎯 Configuration du Score JSLAI™ (pondérations)
                const [jslaiConfig, setJslaiConfig] = useState(() => {
                    const saved = localStorage.getItem('jslaiConfig');
                    return saved ? JSON.parse(saved) : {
                        valuation: 20,        // Multiples de valorisation
                        profitability: 20,    // Marges, ROE, ROA
                        growth: 15,           // Croissance revenus & EPS
                        financialHealth: 20,  // Bilan, dette, liquidité
                        momentum: 10,         // RSI, tendances, moyennes mobiles
                        moat: 10,             // Avantage concurrentiel
                        sectorPosition: 5     // Position dans le secteur
                    };
                });

                // Sauvegarder la config JSLAI
                useEffect(() => {
                    localStorage.setItem('jslaiConfig', JSON.stringify(jslaiConfig));
                }, [jslaiConfig]);

                // Optimisation: useCallback pour generateMockData
                const generateMockData = useCallback((symbol) => {
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
                                title: `${symbol} annonce résultats trimestriels record`,
                                publishedDate: new Date(Date.now() - 2*3600000).toISOString(),
                                site: 'Reuters'
                            },
                            {
                                title: `Nouveau partenariat stratégique annoncé`,
                                publishedDate: new Date(Date.now() - 5*3600000).toISOString(),
                                site: 'Bloomberg'
                            },
                            {
                                title: `Analystes relèvent objectif de prix`,
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
                            summary: 'Sentiment globalement positif avec optimisme modéré'
                        },
                        insights: {
                            catalysts: [
                                'Résultats trimestriels supérieurs aux attentes',
                                'Innovation produit majeure annoncée',
                                'Expansion internationale réussie'
                            ],
                            risks: [
                                'Concurrence accrue dans le secteur',
                                'Incertitudes macroéconomiques',
                                'Volatilité des marchés'
                            ],
                            consensus: 'bullish',
                            reasoning: 'Les fondamentaux solides et la croissance continue justifient un sentiment positif'
                        }
                    };
                }, []);

                // 🎯 CALCULATED SENTIMENT - No AI, pure data-driven analysis
                // Replaces Perplexity AI with free calculated metrics

                // Optimisation: useCallback pour calculateSentiment
                const calculateSentiment = useCallback((symbol, stockData) => {
                    const { quote, metrics, ratios, profile, news } = stockData;

                    console.log(`📊 Calculating sentiment for ${symbol} from financial data...`);

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
                }, []);

                // Optimisation: useCallback pour fetchRealStockData
                const fetchRealStockData = useCallback(async (symbol, currentTimeframe = '1D') => {
                    try {
                        console.log(`🔍 Récupération des données réelles pour ${symbol}...`);
                        
                        // Déterminer le timeframe et les paramètres pour les données historiques
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
                                // Calculer le nombre de jours depuis le début de l'année
                                const now = new Date();
                                const startOfYear = new Date(now.getFullYear(), 0, 1);
                                const daysSinceStart = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
                                historicalLimit = Math.min(daysSinceStart, 365);
                                break;
                            default:
                                historicalTimeframe = '1day';
                                historicalLimit = 30;
                        }

                        // Appels parallèles aux APIs hybrides (Base locale + APIs externes)
                        
// Appels parallèles aux APIs avec gestion d'erreur améliorée
const [quoteResult, profileResult, ratiosResult, newsResult, intradayResult, analystResult, earningsResult] = await Promise.allSettled([
  fetchHybridData(symbol, 'quote'),
  fetchHybridData(symbol, 'profile'),
  fetchHybridData(symbol, 'ratios'),
  fetchHybridData(symbol, 'news'),
  fetchHybridData(symbol, 'prices'),
  fetchHybridData(symbol, 'analyst'),
  fetchHybridData(symbol, 'earnings')
]);

                        // Parser les résultats hybrides avec indicateurs de fallback
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
                        
                        
// Log des données récupérées avec indicateurs de fallback
console.log('✅ Données récupérées:', { 
  hasQuote: !!quote, 
  hasProfile: !!profile, 
  hasRatios: !!ratios,
  hasNews: !!news,
  hasIntraday: !!intradayData,
  hasAnalyst: !!analystData,
  hasEarnings: !!earningsData,
  fallbackIndicators: fallbackIndicators
});

// Calculer le pourcentage de données réelles
const totalSections = Object.keys(fallbackIndicators).length;
const fallbackSections = Object.values(fallbackIndicators).filter(Boolean).length;
const productionSections = totalSections - fallbackSections;
const qualityPercentage = Math.round((productionSections / totalSections) * 100);

console.log(`📊 Qualité des données: ${qualityPercentage}% (${productionSections}/${totalSections} sections en production)`);

// Gestion des erreurs
const errors = [];
if (!quote) errors.push('Quote manquant');
if (!profile) errors.push('Profile manquant');
if (!ratios) errors.push('Ratios manquant');
if (!news) errors.push('News manquant');

if (errors.length > 0) {
  console.warn('⚠️ Données manquantes:', errors);
  // setMessage removed - was causing infinite loop due to undefined reference
}

console.log('✅ Données hybrides récupérées:', { 
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

                        // 🎯 Calcul du Score JSLAI™ Global (0-100)
                        const calculateJSLAIScore = () => {
                            let totalScore = 0;
                            let scores = {};
                            
                            // 1. VALUATION (basé sur P/E ratio)
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
                            
                            // 2. PROFITABILITY (basé sur ROE)
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
                            
                            // 3. GROWTH (basé sur croissance revenue + marges)
                            const grossMargin = ratios?.data?.[0]?.grossProfitMarginTTM || ratios?.grossProfitMarginTTM || null;
                            const netMargin = ratios?.data?.[0]?.netProfitMarginTTM || ratios?.netProfitMarginTTM || null;
                            let growthScore = 60; // Neutre par défaut

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

                            // 4. FINANCIAL HEALTH (basé sur debt/equity + current ratio)
                            const de = ratios?.data?.[0]?.debtEquityRatioTTM || ratios?.debtEquityRatioTTM || null;
                            const currentRatio = ratios?.data?.[0]?.currentRatio || ratios?.currentRatio || null;
                            let healthScore = 50;

                            // Score basé sur D/E
                            let deScore = 50;
                            if (de !== null) {
                                if (de < 0.3) deScore = 100;
                                else if (de < 0.5) deScore = 85;
                                else if (de < 1.0) deScore = 70;
                                else if (de < 1.5) deScore = 55;
                                else if (de < 2.0) deScore = 40;
                                else deScore = 25;
                            }

                            // Score basé sur Current Ratio (liquidité)
                            let liquidityScore = 50;
                            if (currentRatio !== null) {
                                if (currentRatio > 3.0) liquidityScore = 100;
                                else if (currentRatio > 2.0) liquidityScore = 85;
                                else if (currentRatio > 1.5) liquidityScore = 70;
                                else if (currentRatio > 1.0) liquidityScore = 55;
                                else if (currentRatio > 0.5) liquidityScore = 40;
                                else liquidityScore = 25;
                            }

                            // Moyenne pondérée: 60% D/E, 40% liquidité
                            healthScore = Math.round((deScore * 0.6) + (liquidityScore * 0.4));
                            scores.financialHealth = healthScore;
                            totalScore += (healthScore * jslaiConfig.financialHealth) / 100;

                            // 5. MOMENTUM (basé sur performance récente)
                            const priceChange = quote?.dp || 0; // Variation % depuis fermeture
                            let momentumScore = 50;

                            if (priceChange > 10) momentumScore = 100; // +10%+ = très fort momentum
                            else if (priceChange > 5) momentumScore = 85;
                            else if (priceChange > 2) momentumScore = 70;
                            else if (priceChange > 0) momentumScore = 60;
                            else if (priceChange > -2) momentumScore = 45;
                            else if (priceChange > -5) momentumScore = 30;
                            else momentumScore = 15;

                            scores.momentum = momentumScore;
                            totalScore += (momentumScore * jslaiConfig.momentum) / 100;

                            // 6. MOAT (basé sur marges opérationnelles et brutes)
                            const operatingMargin = ratios?.data?.[0]?.operatingProfitMarginTTM || ratios?.operatingProfitMarginTTM || null;
                            let moatScore = 60; // Neutre par défaut

                            // Entreprises avec fortes marges = moat économique solide
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

                            // 7. SECTOR POSITION (basé sur beta - volatilité vs marché)
                            const beta = profile?.data?.[0]?.beta || profile?.beta || null;
                            let sectorScore = 60; // Neutre par défaut

                            // Beta < 1 = moins volatil que le marché (bon signe)
                            // Beta > 1 = plus volatil (risque)
                            if (beta !== null) {
                                if (beta < 0.5) sectorScore = 100; // Très stable
                                else if (beta < 0.8) sectorScore = 85;
                                else if (beta < 1.0) sectorScore = 75;
                                else if (beta < 1.2) sectorScore = 60;
                                else if (beta < 1.5) sectorScore = 45;
                                else sectorScore = 30; // Très volatil
                            }
                            scores.sectorPosition = sectorScore;
                            totalScore += (sectorScore * jslaiConfig.sectorPosition) / 100;
                            
                            const finalScore = Math.round(totalScore);
                            
                            return {
                                total: finalScore,
                                breakdown: scores,
                                interpretation: finalScore >= 85 ? 'Excellent' :
                                               finalScore >= 75 ? 'Très Bon' :
                                               finalScore >= 65 ? 'Bon' :
                                               finalScore >= 50 ? 'Moyen' :
                                               finalScore >= 35 ? 'Faible' : 'Mauvais',
                                recommendation: finalScore >= 75 ? 'Achat Fort' :
                                               finalScore >= 65 ? 'Achat' :
                                               finalScore >= 50 ? 'Conserver' :
                                               finalScore >= 35 ? 'Surveiller' : 'Éviter'
                            };
                        };

                        const jslaiScore = calculateJSLAIScore();

                        // 🎯 Calcul automatique du sentiment et insights basé sur les données réelles
                        // Plus besoin de Perplexity - on utilise les données gratuites des APIs
                        console.log('🤖 Calcul du sentiment et insights à partir des données réelles...');

                        // Calculer le sentiment basé sur le changement de prix et les ratios
                        const priceChange = quote?.dp || 0;
                        const roe = (ratios?.data?.[0]?.returnOnEquityTTM || ratios?.returnOnEquityTTM || 0) * 100;
                        const pe = ratios?.data?.[0]?.peRatioTTM || ratios?.peRatioTTM || 0;

                        // Score basé sur les fondamentaux (0-100)
                        let fundamentalScore = 50;
                        if (roe > 20) fundamentalScore += 20;
                        else if (roe > 15) fundamentalScore += 10;
                        if (pe > 0 && pe < 15) fundamentalScore += 15;
                        else if (pe > 0 && pe < 25) fundamentalScore += 5;

                        // Score basé sur le momentum (0-100)
                        let momentumScore = 60;
                        if (priceChange > 5) momentumScore = 85;
                        else if (priceChange > 2) momentumScore = 75;
                        else if (priceChange > 0) momentumScore = 65;
                        else if (priceChange > -2) momentumScore = 55;
                        else if (priceChange > -5) momentumScore = 45;
                        else momentumScore = 30;

                        // Sentiment global (moyenne pondérée: 60% fondamentaux, 40% momentum)
                        const overallSentiment = Math.round(fundamentalScore * 0.6 + momentumScore * 0.4);

                        // Générer catalysts basés sur les données
                        const catalysts = [];
                        if (roe > 20) catalysts.push(`ROE excellent à ${roe.toFixed(1)}%`);
                        if (priceChange > 2) catalysts.push(`Forte dynamique haussière (+${priceChange.toFixed(2)}%)`);
                        if (pe > 0 && pe < 15) catalysts.push(`Valorisation attractive (P/E: ${pe.toFixed(1)})`);
                        if (catalysts.length === 0) catalysts.push('Fondamentaux stables');

                        // Générer risques basés sur les données
                        const risks = [];
                        const debtEquity = ratios?.data?.[0]?.debtEquityRatioTTM || ratios?.debtEquityRatioTTM || 0;
                        if (debtEquity > 2) risks.push(`Endettement élevé (D/E: ${debtEquity.toFixed(2)})`);
                        if (priceChange < -5) risks.push('Momentum baissier significatif');
                        if (pe > 40) risks.push(`Valorisation élevée (P/E: ${pe.toFixed(1)})`);
                        if (risks.length === 0) risks.push('Volatilité de marché normale');

                        // Déterminer le consensus
                        let consensus = 'neutral';
                        if (overallSentiment >= 70) consensus = 'bullish';
                        else if (overallSentiment <= 45) consensus = 'bearish';

                        // Déterminer la recommandation basée sur le score JSLAI
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
                                summary: `Sentiment ${consensus === 'bullish' ? 'positif' : consensus === 'bearish' ? 'négatif' : 'neutre'} basé sur les fondamentaux et le momentum`
                            },
                            insights: {
                                catalysts,
                                risks,
                                consensus,
                                reasoning: `Score JSLAI™ de ${jslaiScore.total}/100 (${jslaiScore.interpretation}). ${jslaiScore.recommendation}.`
                            },
                            analyst: {
                                recommendation,
                                confidence,
                                keyPoints: [
                                    `Score JSLAI™: ${jslaiScore.total}/100`,
                                    `Sentiment: ${overallSentiment}/100`,
                                    `Tendance: ${consensus}`
                                ]
                            }
                        };

                        console.log('✅ Sentiment et insights calculés à partir des données réelles (sans Perplexity)');

                        // Construire l'objet de données structuré
                        return {
                            jslaiScore: jslaiScore,  // 🎯 Score JSLAI™ ajouté
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
                                // Si on a des données historiques réelles, les utiliser
                                if (intradayData && Array.isArray(intradayData) && intradayData.length > 0) {
                                    console.log(`📊 Données historiques réelles récupérées: ${intradayData.length} points`);
                                    return intradayData.map((candle, i) => ({
                                        date: candle.date || new Date(candle.timestamp || Date.now() - i * 60000).toLocaleString('fr-FR'),
                                        open: candle.open || 0,
                                        high: candle.high || 0,
                                        low: candle.low || 0,
                                        close: candle.close || 0,
                                volume: candle.volume || 0
                                    }));
                                }
                                
                                // Si on a des données dans le format FMP
                                if (intradayData?.historical && Array.isArray(intradayData.historical) && intradayData.historical.length > 0) {
                                    console.log(`📊 Données FMP historiques récupérées: ${intradayData.historical.length} points`);
                                    
                                    let filteredData = intradayData.historical;
                                    
                                    // Pour YTD, filtrer les données depuis le début de l'année
                                    if (currentTimeframe === 'YTD') {
                                        const currentYear = new Date().getFullYear();
                                        filteredData = intradayData.historical.filter(candle => {
                                            const candleDate = new Date(candle.date);
                                            return candleDate.getFullYear() === currentYear;
                                        });
                                        console.log(`📊 Données YTD filtrées: ${filteredData.length} points`);
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
                                
                                // Sinon, générer des données de fallback basées sur le prix actuel
                                const currentPrice = quote?.c || 0;
                                const change = quote?.d || 0;
                                const changePercent = quote?.dp || 0;
                                
                                if (currentPrice > 0) {
                                    // Générer des données selon le timeframe sélectionné
                                    const dataPoints = [];
                                    const basePrice = currentPrice - change; // Prix d'ouverture
                                    const timeframe = currentTimeframe; // Utiliser le timeframe passé en paramètre
                                    
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
                                            timeInterval = 30; // 1 mois depuis début d'année
                                            timeFormat = (i) => {
                                                const date = new Date();
                                                date.setMonth(i); // Janvier = 0, Décembre = 11
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
                                    
                                    // Générer des données historiques plus réalistes
                                    for (let i = 0; i < pointCount; i++) {
                                        const progress = i / (pointCount - 1); // 0 à 1
                                        
                                        // Calculer le prix historique basé sur la tendance et la volatilité
                                        let historicalPrice;
                                        
                                        if (timeframe === 'YTD') {
                                            // Pour YTD, commencer au prix d'ouverture de l'année
                                            const yearStartPrice = basePrice * (1 - changePercent / 100 * 0.8); // Prix approximatif début d'année
                                            const yearProgress = i / (pointCount - 1);
                                            historicalPrice = yearStartPrice + (yearProgress * (currentPrice - yearStartPrice));
                                        } else if (timeframe === '5A' || timeframe === 'MAX') {
                                            // Pour les périodes longues, simuler une croissance/évolution historique
                                            const yearsBack = timeframe === '5A' ? 5 : 10;
                                            const historicalMultiplier = 1 - (changePercent / 100) * (yearsBack * 0.2); // Évolution sur plusieurs années
                                            const startPrice = currentPrice * historicalMultiplier;
                                            historicalPrice = startPrice + (progress * (currentPrice - startPrice));
                                        } else {
                                            // Pour les périodes courtes, utiliser la logique existante
                                            const trend = changePercent > 0 ? 1 : -1;
                                            const volatility = Math.random() * 0.02 - 0.01; // ±1% de volatilité
                                            const priceVariation = (progress * change) + (volatility * basePrice);
                                            historicalPrice = Math.max(0.01, basePrice + priceVariation);
                                        }
                                        
                                        // Ajouter de la volatilité réaliste
                                        const volatility = Math.random() * 0.015 - 0.0075; // ±0.75% de volatilité
                                        const finalPrice = historicalPrice * (1 + volatility);
                                        
                                        // Calculer OHLC réalistes
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
                                            volume: Math.floor(Math.random() * 2000000) + 500000 // Volume plus réaliste
                                        });
                                    }
                                    
                                    console.log(`📊 Données ${timeframe} générées pour ${symbol}: ${dataPoints.length} points`);
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
                            // 🎯 Nouvelles données avec validation croisée
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
                                    'Analyse en cours des catalyseurs de marché',
                                    'Surveillance des annonces d\'entreprise',
                                    'Suivi des tendances du secteur'
                                ],
                                risks: aiData?.insights?.risks || [
                                    'Volatilité du marché',
                                    'Conditions macroéconomiques',
                                    'Concurrence sectorielle'
                                ],
                                consensus: aiData?.insights?.consensus || 'neutral',
                                reasoning: aiData?.insights?.reasoning || 'Analyse basée sur les données de marché actuelles'
                            },
                            // 🎯 Recommandations d'analyste IA (batch Perplexity)
                            aiAnalyst: aiData?.analyst ? {
                                recommendation: aiData.analyst.recommendation,
                                confidence: aiData.analyst.confidence,
                                keyPoints: aiData.analyst.keyPoints
                            } : null,
                            // 🎯 Indicateurs de fallback pour transparence
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
                }, [jslaiConfig]);

                // Chargement des données
                useEffect(() => {
                    const fetchData = async () => {
                        try {
                            setLoadingIntelli(true);
                            console.log(`📊 Chargement des données pour ${selectedStock}...`);
                            
                            // Essayer d'abord avec les vraies APIs
                            const realData = await fetchRealStockData(selectedStock, timeframe);
                            if (realData && realData.quote && realData.quote.price > 0) {
                                setStockDataIntelli(realData);
                                setConnected(true);
                                setLastUpdateIntelli(new Date());
                                console.log('✅ Données chargées avec succès');
                                
                                // Vérifier si les données intraday sont disponibles
                                if (!realData.intraday || realData.intraday.length === 0) {
                                    setViolations(prev => {
                                        // Éviter les doublons
                                        if (prev.find(v => v.code === 'intraday_missing')) return prev;
                                        return [
                                            ...prev,
                                            { code: 'intraday_missing', severity: 'low', message: 'Données intraday non disponibles - utilisation des données quote uniquement.' }
                                        ];
                                    });
                                }
                            } else {
                                throw new Error('Données invalides reçues de l\'API');
                            }
                        } catch (error) {
                            console.error('❌ Erreur lors du chargement:', error?.message || String(error));
                            setConnected(false);
                            
                            // Utiliser mock data en dernier recours
                            const mockData = generateMockData(selectedStock);
                            setStockDataIntelli(mockData);
                            
                            // Enregistrer une violation visible dans l'helppop
                            setViolations(prev => {
                                if (prev.find(v => v.code === 'data_fetch_error')) return prev;
                                return [
                                    ...prev,
                                    { code: 'data_fetch_error', severity: 'high', message: 'Échec de récupération API. Vérifiez votre connexion et les clés API.' }
                                ];
                            });
                            setShowHelp(true);
                        } finally {
                            setLoadingIntelli(false);
                        }
                    };
                    fetchData();
                    // ⚡ OPTIMISATION API: Pas d'auto-refresh
                    // Chargement uniquement au changement de stock ou manuel
                }, [selectedStock]);

                // 🔄 Rechargement du TradingView Mini Chart quand le ticker change - VAGUE 2
                useEffect(() => {
                    const container = document.getElementById('tradingview-mini-chart-jlab');
                    if (container) {
                        // Supprimer l'ancien widget
                        container.innerHTML = '';

                        // Créer le nouveau script avec le ticker mis à jour
                        const script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
                        script.async = true;
                        script.innerHTML = JSON.stringify({
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
                        container.appendChild(script);
                        console.log(`📊 TradingView Mini Chart rechargé pour ${selectedStock}`);
                    }
                }, [selectedStock, isDarkMode]);

                // ⚡ AUTO-REFRESH: Désactivé - Chargement unique à l'arrivée sur la page
                // L'utilisateur peut actualiser manuellement via le bouton refresh
                // Les caches API optimisent les appels répétés:
                // - Quotes: 5 min cache
                // - Fundamentals: 1h cache
                // - AI data: 30 min cache

                // Timer (désactivé pour éviter les actualisations inutiles)
                // useEffect(() => {
                //     const timer = setInterval(() => setTime(new Date()), 1000);
                //     return () => clearInterval(timer);
                // }, []);

                // Diagnostics environnementaux (violations) + ouverture auto du HelpPop
                useEffect(() => {
                    const newViolations = [];
                    try {
                        // Vérifier les bibliothèques de graphiques
                        const rechartsAvailable = typeof window.Recharts !== 'undefined' || 
                                                typeof Recharts !== 'undefined' ||
                                                (typeof window !== 'undefined' && window.Recharts);
                        
                        const chartJsAvailable = typeof Chart !== 'undefined' || 
                                               (typeof window !== 'undefined' && window.Chart);
                        
                        if (!rechartsAvailable && !chartJsAvailable) {
                            newViolations.push({
                                code: 'charts_missing',
                                severity: 'high',
                                message: 'Aucune bibliothèque de graphiques disponible — graphiques désactivés.'
                            });
                        } else if (!rechartsAvailable && chartJsAvailable) {
                            newViolations.push({
                                code: 'recharts_missing',
                                severity: 'medium',
                                message: 'Recharts non disponible — utilisation de Chart.js comme alternative.'
                            });
                        }
                    } catch (_) {
                        newViolations.push({ code: 'charts_missing', severity: 'high', message: 'Erreur de détection des bibliothèques de graphiques.' });
                    }

                    try {
                        // Vérifier les icônes (maintenant gérées par notre composant LucideIcon)
                        const iconsAvailable = typeof window.LucideIcon !== 'undefined' && 
                                             typeof window.LucideIcon === 'function';
                        
                        if (!iconsAvailable) {
                            newViolations.push({
                                code: 'icons_missing',
                                severity: 'low',
                                message: 'Composant d\'icônes personnalisé non disponible (fallback activé).'
                            });
                        }
                    } catch (_) {
                        newViolations.push({ code: 'icons_missing', severity: 'low', message: 'Composant d\'icônes personnalisé non disponible (fallback activé).' });
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
                
                // Optimisation: useCallback pour getMetricColor
                const getMetricColor = useCallback((metric, value) => {
                    if (value == null || value === 'N/A') return 'text-gray-400';
                    
                    const v = typeof value === 'string' ? parseFloat(value) : value;
                    if (isNaN(v)) return 'text-gray-400';
                    
                    switch(metric) {
                        case 'PE':
                            // P/E Ratio (Price to Earnings)
                            // Standards: S&P 500 moyenne historique ~15-20
                            // Source: Investopedia, Morningstar
                            if (v < 0) return 'text-red-500'; // Négatif = pertes
                            if (v < 15) return 'text-emerald-500'; // Sous-évalué / Excellent
                            if (v < 25) return 'text-blue-500'; // Juste valorisé / Bon
                            if (v < 35) return 'text-yellow-500'; // Légèrement surévalué / Attention
                            return 'text-red-500'; // Surévalué / Risque élevé
                            
                        case 'PEG':
                            // PEG Ratio (Price/Earnings to Growth)
                            // Standard: Peter Lynch suggère <1 = sous-évalué
                            // Source: "One Up on Wall Street" par Peter Lynch
                            if (v < 0) return 'text-red-500'; // Invalide
                            if (v < 1) return 'text-emerald-500'; // Sous-évalué / Excellent achat
                            if (v < 1.5) return 'text-blue-500'; // Juste valorisé / Bon
                            if (v < 2) return 'text-yellow-500'; // Légèrement cher / Attention
                            return 'text-green-500'; // Surévalué / Éviter
                            
                        case 'PS':
                            // P/S Ratio (Price to Sales)
                            // Standards varient par secteur, Tech: 2-5, Retail: 0.5-2
                            if (v < 1) return 'text-emerald-500'; // Sous-évalué
                            if (v < 3) return 'text-blue-500'; // Raisonnable
                            if (v < 5) return 'text-yellow-500'; // Élevé
                            return 'text-green-500'; // Très élevé
                            
                        case 'ROE':
                            // ROE (Return on Equity)
                            // Standard: Warren Buffett recherche >15% de manière constante
                            // Source: Berkshire Hathaway Letters to Shareholders
                            if (v < 0) return 'text-red-500'; // Perte / Très mauvais
                            if (v < 10) return 'text-green-500'; // Faible / Mauvais
                            if (v < 15) return 'text-yellow-500'; // Moyen / Acceptable
                            if (v < 20) return 'text-blue-500'; // Bon / Au-dessus moyenne
                            return 'text-emerald-500'; // Excellent / Supérieur
                            
                        case 'ROA':
                            // ROA (Return on Assets)
                            // Standard: >5% bon, >10% excellent pour la plupart des industries
                            // Source: Corporate Finance Institute
                            if (v < 0) return 'text-red-500'; // Perte
                            if (v < 5) return 'text-green-500'; // Faible utilisation des actifs
                            if (v < 10) return 'text-blue-500'; // Bon
                            if (v < 15) return 'text-emerald-500'; // Très bon
                            return 'text-emerald-400'; // Exceptionnel
                            
                        case 'DE':
                            // D/E Ratio (Debt to Equity)
                            // Standard: <1 sain, >2 risqué (varie selon secteur)
                            // Source: Financial Times, Wall Street Journal
                            if (v < 0.3) return 'text-emerald-500'; // Très faible endettement / Excellent
                            if (v < 0.7) return 'text-blue-500'; // Endettement sain / Bon
                            if (v < 1.5) return 'text-yellow-500'; // Endettement modéré / Attention
                            if (v < 2.5) return 'text-green-500'; // Endettement élevé / Risque
                            return 'text-red-500'; // Endettement très élevé / Danger
                            
                        case 'Margin':
                            // Marge Nette (Net Profit Margin)
                            // Standards: Tech 15-25%, Retail 2-5%, Services 10-20%
                            // Source: NYU Stern School of Business - Damodaran
                            if (v < 0) return 'text-red-500'; // Pertes
                            if (v < 5) return 'text-green-500'; // Faible rentabilité
                            if (v < 10) return 'text-yellow-500'; // Rentabilité modérée
                            if (v < 20) return 'text-blue-500'; // Bonne rentabilité
                            return 'text-emerald-500'; // Excellente rentabilité
                            
                        case 'Beta':
                            // Beta (Volatilité vs marché)
                            // Standard: 1 = volatilité du marché, <1 défensif, >1 agressif
                            // Source: Modern Portfolio Theory - Markowitz
                            if (v < 0) return 'text-purple-500'; // Inverse du marché / Rare
                            if (v < 0.8) return 'text-emerald-500'; // Très défensif / Faible volatilité
                            if (v < 1) return 'text-blue-500'; // Défensif / Stable
                            if (v < 1.3) return 'text-yellow-500'; // Légèrement volatile
                            if (v < 1.7) return 'text-green-500'; // Volatile
                            return 'text-red-500'; // Très volatile / Risque élevé
                            
                        case 'Div':
                            // Dividend Yield
                            // Standard: 2-5% sain, >7% potentiellement insoutenable
                            // Source: Dividend Aristocrats criteria
                            if (v < 1) return 'text-gray-400'; // Faible/Pas de dividende
                            if (v < 2) return 'text-blue-400'; // Dividende modeste
                            if (v < 4) return 'text-blue-500'; // Bon dividende
                            if (v < 6) return 'text-emerald-500'; // Excellent dividende
                            if (v < 8) return 'text-yellow-500'; // Élevé - vérifier soutenabilité
                            return 'text-green-500'; // Très élevé - risque de coupure
                            
                        case 'CurrentRatio':
                            // Current Ratio (Liquidité)
                            // Standard: 1.5-3 idéal, <1 problème de liquidité
                            if (v < 1) return 'text-red-500'; // Problème de liquidité
                            if (v < 1.5) return 'text-green-500'; // Liquidité juste
                            if (v < 2.5) return 'text-emerald-500'; // Liquidité saine
                            if (v < 3.5) return 'text-blue-500'; // Bonne liquidité
                            return 'text-yellow-500'; // Trop de liquidité non utilisée
                            
                        case 'QuickRatio':
                            // Quick Ratio (Test acide)
                            // Standard: >1 bon, >1.5 excellent
                            if (v < 0.5) return 'text-red-500'; // Problème majeur
                            if (v < 1) return 'text-green-500'; // Risque de liquidité
                            if (v < 1.5) return 'text-blue-500'; // Acceptable
                            return 'text-emerald-500'; // Excellent
                            
                        case 'EPS':
                            // Earnings Per Share (croissance)
                            // Analyser la tendance plutôt que la valeur absolue
                            if (v < 0) return 'text-red-500'; // Pertes
                            if (v < 1) return 'text-green-500'; // Faible
                            if (v < 3) return 'text-blue-500'; // Moyen
                            return 'text-emerald-500'; // Fort
                            
                        default:
                            return 'text-gray-400';
                    }
                }, []);

                // Optimisation: useCallback pour runScreenerForStocks
                const runScreenerForStocks = useCallback(async (stocksList) => {
                    setLoadingScreener(true);
                    try {
                        const results = [];
                        
                        // Parcourir les stocks fournis et récupérer leurs données
                        for (const stock of stocksList) {
                            try {
                                const [quoteRes, profileRes, ratiosRes] = await Promise.allSettled([
                                    fetch(`/api/marketdata?endpoint=quote&symbol=${stock.symbol}&source=auto`),
                                    fetch(`/api/fmp?endpoint=profile&symbol=${stock.symbol}`),
                                    fetch(`/api/fmp?endpoint=ratios&symbol=${stock.symbol}`)
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
                        console.log(`✅ Screener: ${results.length} résultats trouvés sur ${stocksList.length} titres`);
                    } catch (error) {
                        console.error('Erreur screener:', error);
                    } finally {
                        setLoadingScreener(false);
                    }
                }, [screenerFilters]);

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

                // Optimisation: useCallback pour formatNumber
                const formatNumber = useCallback((num, prefix = '', suffix = '') => {
                    if (!num && num !== 0) return 'N/A';
                    const n = parseFloat(num);
                    if (isNaN(n)) return 'N/A';
                    if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T${suffix}`;
                    if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B${suffix}`;
                    if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M${suffix}`;
                    if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K${suffix}`;
                    return `${prefix}${n.toFixed(2)}${suffix}`;
                }, []);

                // Optimisation: useCallback pour formatTimeAgo
                const formatTimeAgo = useCallback((dateString) => {
                    const date = new Date(dateString);
                    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
                    if (hours < 1) return 'maintenant';
                    if (hours < 24) return `${hours}h`;
                    return `${Math.floor(hours / 24)}j`;
                }, []);

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
                                <div className="text-sm text-gray-400">Chargement des données…</div>
                            </div>
                        </div>
                    );
                }

                // Composant de graphique simple (alternative à Recharts)
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
                                                            </td>
                                                            <td className="text-center p-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedStock(stock.symbol);
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
                                            {/* 🎯 Badge Score JSLAI™ avec Glow Animation - VAGUE 3+4 */}
                                            {stockDataIntelli?.jslaiScore && (
                                                <div className={`px-4 py-1.5 rounded text-sm font-bold border-2 ${
                                                    stockDataIntelli.jslaiScore.total >= 75 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-600 glow-pulse' :
                                                    stockDataIntelli.jslaiScore.total >= 65 ? 'bg-gray-900/30 text-gray-400 border-gray-600' :
                                                    stockDataIntelli.jslaiScore.total >= 50 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-600' :
                                                    'bg-red-900/30 text-red-400 border-red-600 glow-pulse-red'
                                                }`}>
                                                    🎯 JSLAI™ {stockDataIntelli.jslaiScore.total}/100
                                                </div>
                                            )}
                                            {/* Emma AI Analysis Button with Avatar */}
                                            <button
                                                onClick={() => {
                                                    const analysisRequest = `Analyse approfondie de ${selectedStock}: fondamentaux, techniques, actualités et recommandation d'investissement`;
                                                    // Set prefill message first, then switch tab after a short delay
                                                    setEmmaPrefillMessage(analysisRequest);
                                                    setTimeout(() => handleTabChange('ask-emma'), 50);
                                                }}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-semibold border-2 transition-all hover:scale-105 ${
                                                    isDarkMode
                                                        ? 'bg-purple-900/30 hover:bg-purple-800/40 text-purple-400 border-purple-600'
                                                        : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-400'
                                                }`}
                                                title={`Demander une analyse détaillée de ${selectedStock} à Emma IA`}
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
                                                    📊 Qualité: {stockDataIntelli.dataQuality.quality_percentage}% ({stockDataIntelli.dataQuality.production_sections}/{stockDataIntelli.dataQuality.total_sections} réelles)
                                                    {stockDataIntelli.dataQuality.status === 'EXCELLENT' && ' ✅'}
                                                    {stockDataIntelli.dataQuality.status === 'GOOD' && ' 🟢'}
                                                    {stockDataIntelli.dataQuality.status === 'FAIR' && ' 🟡'}
                                                    {stockDataIntelli.dataQuality.status === 'POOR' && ' 🔴'}
                                                </>
                                            ) : (
                                                'Mode Démo Hybride • FMP + Perplexity AI'
                                            )}
                                            {stockDataIntelli?.jslaiScore && (
                                                <span className="ml-2">• {stockDataIntelli.jslaiScore.interpretation} ({stockDataIntelli.jslaiScore.recommendation})</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoadingIntelli(true);
                                                console.log('🔄 Actualisation des données...');
                                                const realData = await fetchRealStockData(selectedStock, timeframe);
                                                if (realData && realData.quote && realData.quote.price > 0) {
                                                    setStockDataIntelli(realData);
                                                    setConnected(true);
                                                    setLastUpdateIntelli(new Date());
                                                    console.log('✅ Données actualisées avec succès');
                                                } else {
                                                    throw new Error('Données invalides reçues de l\'API');
                                                }
                                            } catch (error) {
                                                console.error('❌ Erreur lors de l\'actualisation:', error);
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
                                        <span>🤖</span>
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
                                                            setSelectedStock(stock.symbol);
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
                                            title={violations.length ? 'Diagnostics: problèmes détectés' : 'Aide IntelliStocks'}
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
                                                            <div className="text-[10px] text-gray-500">Mode Démo Hybride • FMP + Perplexity</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setShowHelp(false)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}>
                                                        <LucideIcon name="X" className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                </div>
                                                <div className="p-3 space-y-2 text-[11px]">
                                                    {violations.length > 0 ? (
                                                        <div>
                                                            <div className={`mb-1 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Problèmes détectés</div>
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
                                                            Aucun problème détecté.
                                                        </div>
                                                    )}

                                                    <div className={`pt-1 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`} />
                                                    <div className="space-y-1">
                                                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Conseils rapides</div>
                                        <ul className="list-disc pl-4 space-y-1 text-gray-500">
                                            <li>Les graphiques utilisent Chart.js pour afficher les données en temps réel.</li>
                                            <li>Les données proviennent de FMP et Marketaux via les APIs configurées.</li>
                                            <li>Actualisez avec le bouton rafraîchir pour recharger les dernières données du marché.</li>
                                            <li>Les graphiques s'adaptent au thème sombre/clair automatiquement.</li>
                                        </ul>
                                        
                                        <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`} />
                                        <div className="space-y-1">
                                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Code couleur des métriques</div>
                                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span>Excellent / Sous-évalué</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                                                    <span>Bon / Juste valorisé</span>
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
                                            <div className={`font-semibold text-[10px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Standards utilisés</div>
                                            <ul className="space-y-0.5 text-[9px] text-gray-500">
                                                <li><strong>P/E:</strong> &lt;15 excellent, 15-25 bon, &gt;25 élevé</li>
                                                <li><strong>PEG:</strong> &lt;1 sous-évalué (Peter Lynch), &gt;2 surévalué</li>
                                                <li><strong>ROE:</strong> &gt;20% excellent (Warren Buffett), &gt;15% bon</li>
                                                <li><strong>D/E:</strong> &lt;0.7 sain, &gt;2 risqué</li>
                                                <li><strong>Marge:</strong> &gt;20% excellente, 10-20% bonne</li>
                                                <li><strong>Beta:</strong> &lt;1 défensif, &gt;1.5 volatil</li>
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
                                            <p className="text-[8px] text-gray-600">{profile.companyName || currentStock?.name} • {profile.sector || 'NASDAQ'}</p>
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
                                                    // Détruire l'ancien graphique s'il existe
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
                                                                    display: timeframe === '1D' ? false : true, // Afficher les dates pour les périodes longues
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
                                                📈 Chargement des données du graphique...
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-1 mt-1.5">
                                    {['1D', '1W', '1M', '3M', '6M', '1A', '5A', 'MAX', 'YTD'].map((period) => (
                                            <button
                                                key={period}
                                                onClick={async () => {
                                                    setTimeframe(period);
                                                    // Recharger les données avec le nouveau timeframe
                                                    try {
                                                        setLoadingIntelli(true);
                                                        console.log(`📊 Changement de timeframe vers ${period}...`);
                                                        const realData = await fetchRealStockData(selectedStock, period);
                                                        if (realData && realData.quote && realData.quote.price > 0) {
                                                            setStockDataIntelli(realData);
                                                            setConnected(true);
                                                            setLastUpdateIntelli(new Date());
                                                            console.log(`✅ Données ${period} chargées avec succès`);
                                                        }
                                                    } catch (error) {
                                                        console.error('❌ Erreur lors du changement de timeframe:', error);
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
                                                    📊 Chargement du volume...
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
                                                if (container && !container.hasChildNodes()) {
                                                    // Créer le script TradingView
                                                    const script = document.createElement('script');
                                                    script.type = 'text/javascript';
                                                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
                                                    script.async = true;
                                                    script.innerHTML = JSON.stringify({
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
                                                    container.appendChild(script);
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
                                            {movingAverages.interpretation?.trend === 'Haussier fort' && '📈 '}
                                            {movingAverages.interpretation?.trend === 'Baissier fort' && '📉 '}
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
                                                    {movingAverages.sma20?.diff > 0 ? ' ↑' : ' ↓'}
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
                                                    ? '💡 Proche de la moyenne - Zone de consolidation'
                                                    : movingAverages.sma20?.diff > 5 
                                                    ? '🚀 Fort au-dessus - Momentum haussier'
                                                    : movingAverages.sma20?.diff < -5
                                                    ? '⚠️ Fort en-dessous - Pression baissière'
                                                    : movingAverages.sma20?.diff > 0
                                                    ? '✅ Au-dessus - Signal positif'
                                                    : '⚠️ En-dessous - Signal négatif'}
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
                                                    {movingAverages.sma50?.diff > 0 ? ' ↑' : ' ↓'}
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
                                                    ? '📊 Tendance moyen terme positive'
                                                    : movingAverages.sma50?.diff < 0 && movingAverages.sma20?.diff < 0
                                                    ? '📉 Tendance moyen terme négative'
                                                    : movingAverages.sma50?.diff > 0
                                                    ? '⚡ Support potentiel - Test en cours'
                                                    : '⚠️ Résistance - Vigilance recommandée'}
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
                                                    {movingAverages.sma200?.diff > 0 ? ' ↑' : ' ↓'}
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
                                                    ? '🎯 Bull Market confirmé - Tendance long terme haussière'
                                                    : movingAverages.sma200?.diff > 0
                                                    ? '✅ Au-dessus SMA200 - Marché haussier'
                                                    : movingAverages.sma200?.diff < -10
                                                    ? '🐻 Bear Market - Tendance long terme baissière'
                                                    : '⚠️ En-dessous SMA200 - Marché baissier'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Interprétation des croisements */}
                                    {(movingAverages.sma20 && movingAverages.sma50) && (
                                        <div className={`mt-2 p-2 border rounded text-[8px] ${
                                            movingAverages.sma20.value > movingAverages.sma50.value && movingAverages.sma50.value > movingAverages.sma200.value
                                                ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                                                : movingAverages.sma20.value < movingAverages.sma50.value && movingAverages.sma50.value < movingAverages.sma200.value
                                                ? (isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                                                : (isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700')
                                        }`}>
                                            <div className="font-semibold mb-1 flex items-center gap-2">
                                                <Icon emoji="📊" size={16} />
                                                Analyse des Croisements
                                            </div>
                                            {movingAverages.sma20.value > movingAverages.sma50.value && movingAverages.sma50.value > movingAverages.sma200.value ? (
                                                <div>✅ Configuration idéale : SMA20 &gt; SMA50 &gt; SMA200. Tendance haussière confirmée sur tous les horizons temporels.</div>
                                            ) : movingAverages.sma20.value < movingAverages.sma50.value && movingAverages.sma50.value < movingAverages.sma200.value ? (
                                                <div>⚠️ Configuration baissière : SMA20 &lt; SMA50 &lt; SMA200. Pression vendeuse sur tous les horizons. Prudence recommandée.</div>
                                            ) : movingAverages.sma20.value > movingAverages.sma50.value ? (
                                                <div>⚡ Croisement récent possible : SMA20 au-dessus de SMA50. Signal de retournement haussier à confirmer.</div>
                                            ) : (
                                                <div>📉 Moyennes désalignées : Configuration mixte. Attendre confirmation de tendance avant prise de position.</div>
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
                                            <div className="mb-2"><Icon emoji="📊" size={24} /></div>
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
                                                <div className="text-[9px] text-gray-500 mb-1 font-semibold">🚀 Catalyseurs</div>
                                                {insights.catalysts.map((cat, i) => (
                                                    <div key={i} className="text-[8px] text-emerald-400 mb-0.5">• {cat}</div>
                                                ))}
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-gray-500 mb-1 font-semibold">⚠️ Risques</div>
                                                {insights.risks.map((risk, i) => (
                                                    <div key={i} className="text-[8px] text-green-400 mb-0.5">• {risk}</div>
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
                                                        {insights.consensus === 'bullish' ? '📈 Bullish' : 
                                                         insights.consensus === 'bearish' ? '📉 Bearish' : '➖ Neutre'}
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
                                            📊 Graphique Radar (Recharts nécessite une configuration avancée)
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
                                            {(sentiment.overall || 0) > 70 ? 'Très Bullish' : (sentiment.overall || 0) > 50 ? 'Bullish' : 'Neutre'}
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

                                {/* Sentiment détaillé */}
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
                                                📊 Graphique Sentiment
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
                                        News Temps Réel
                                    </h3>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {news.map((item, i) => (
                                            <div key={i} className={`p-1.5 border rounded transition-all cursor-pointer ${
                                                isDarkMode 
                                                    ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-750' 
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}>
                                                <div className="flex items-start justify-between mb-0.5">
                                                    <div className="text-[7px] px-1 py-0.5 rounded bg-emerald-900 text-emerald-500">📈</div>
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
                                        ✅ Dashboard Hybride Fonctionnel
                                    </div>
                                    <div className="text-[7px] text-gray-600">
                                        Mode Démo • FMP (données précises) + Perplexity (intelligence IA)
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] text-gray-500 font-bold">Hybride Optimal</div>
                                    <div className="text-[7px] text-gray-600">Précision + IA</div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            };

window.IntelliStocksTab = IntelliStocksTab;