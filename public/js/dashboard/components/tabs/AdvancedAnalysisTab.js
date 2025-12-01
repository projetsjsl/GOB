
// AdvancedAnalysisTab.js
// A clean, standalone component for the new advanced financial tools

const { useState, useEffect } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } = window.Recharts || {};

const AdvancedAnalysisTab = () => {
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showPeerComparison, setShowPeerComparison] = useState(false);
    const [showScenarioAnalysis, setShowScenarioAnalysis] = useState(false);
    const [showAdvancedScreener, setShowAdvancedScreener] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    // Load initial data
    useEffect(() => {
        fetchData(selectedStock);
    }, [selectedStock]);

    const fetchData = async (symbol) => {
        setLoading(true);
        try {
            // Use global fetchHybridData if available, otherwise fallback
            if (window.fetchHybridData) {
                const [quote, metrics, ratios] = await Promise.all([
                    window.fetchHybridData(symbol, 'quote'),
                    window.fetchHybridData(symbol, 'metrics'),
                    window.fetchHybridData(symbol, 'ratios')
                ]);

                setStockData({
                    quote: quote?.data || {},
                    metrics: metrics?.data || {},
                    ratios: ratios?.data || {},
                    symbol: symbol
                });
            } else {
                // Fallback mock data if API is not ready
                console.warn('fetchHybridData not found, using mock data');
                setStockData({
                    quote: { price: 150, change: 1.5, changesPercentage: 1.0 },
                    metrics: { peRatioTTM: 25 },
                    symbol: symbol
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const isDarkMode = true; // Force dark mode for now or get from context

    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-neutral-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Analyse Financière Pro 🚀
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Outils avancés pour l'investisseur intelligent
                    </p>
                </div>

                {/* Stock Selector */}
                <div className="flex items-center gap-4">
                    <div className="bg-gray-800 rounded-lg p-2 flex items-center gap-2 border border-gray-700">
                        <span className="text-gray-400 text-sm">Titre:</span>
                        <input
                            type="text"
                            value={selectedStock}
                            onChange={(e) => setSelectedStock(e.target.value.toUpperCase())}
                            className="bg-transparent text-white font-bold w-16 outline-none"
                        />
                    </div>
                    {stockData && (
                        <div className="text-right">
                            <div className="text-xl font-bold">${stockData.quote.price?.toFixed(2)}</div>
                            <div className={`text-sm ${stockData.quote.changesPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stockData.quote.changesPercentage >= 0 ? '+' : ''}{stockData.quote.changesPercentage?.toFixed(2)}%
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Analyse Approfondie (Main Card) */}
                <div
                    onClick={() => setShowAnalysisModal(true)}
                    className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl p-6 cursor-pointer hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <i className="iconoir-stats-report text-blue-400 text-3xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Analyse Approfondie Complète</h3>
                                <p className="text-gray-400 text-sm max-w-xl">
                                    Accédez au rapport complet : DCF, États Financiers, Ratios, et Analyse IA.
                                    Le centre de commande pour vos décisions d'investissement.
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                            Ouvrir <i className="iconoir-arrow-right"></i>
                        </div>
                    </div>
                </div>

                {/* 2. Comparaison Multi-Titres */}
                <div
                    onClick={() => setShowPeerComparison(true)}
                    className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-700/30 rounded-xl p-6 cursor-pointer hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/10 group"
                >
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i className="iconoir-group text-emerald-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Comparaison Pairs</h3>
                    <p className="text-gray-400 text-sm">
                        Comparez {selectedStock} avec ses concurrents directs sur plus de 10 métriques clés.
                    </p>
                </div>

                {/* 3. Analyse de Scénarios */}
                <div
                    onClick={() => setShowScenarioAnalysis(true)}
                    className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-xl p-6 cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10 group"
                >
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i className="iconoir-graph-up text-purple-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Simulateur de Scénarios</h3>
                    <p className="text-gray-400 text-sm">
                        Modélisation DCF interactive. Testez vos hypothèses (Optimiste, Base, Pessimiste).
                    </p>
                </div>

                {/* 4. Screener Avancé */}
                <div
                    onClick={() => setShowAdvancedScreener(true)}
                    className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-xl p-6 cursor-pointer hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/10 group"
                >
                    <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i className="iconoir-filter text-orange-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Screener Avancé</h3>
                    <p className="text-gray-400 text-sm">
                        Trouvez les pépites du marché avec des filtres personnalisés et des préréglages.
                    </p>
                </div>

                {/* 5. Export PDF */}
                <div
                    onClick={async () => {
                        if (stockData && window.PDFExporter) {
                            await window.PDFExporter.generateAnalysisReport(selectedStock, {
                                currentPrice: stockData.quote?.price || 0,
                                fairValue: stockData.metrics?.dcf || 0,
                                upside: 0, // To calculate
                                recommendation: 'BUY', // Mock
                                metrics: stockData.metrics || {},
                                aiInsights: {
                                    strengths: ['Strong Revenue Growth', 'High ROE'],
                                    weaknesses: ['High Valuation']
                                }
                            });
                        } else {
                            alert('Données non disponibles pour l\'export');
                        }
                    }}
                    className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-xl p-6 cursor-pointer hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
                >
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i className="iconoir-page text-cyan-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Export Rapport PDF</h3>
                    <p className="text-gray-400 text-sm">
                        Générez un rapport professionnel complet prêt à être partagé ou imprimé.
                    </p>
                </div>

            </div>

            {/* Modals Rendering */}
            {showPeerComparison && window.PeerComparisonModal && (
                <window.PeerComparisonModal
                    symbols={[selectedStock, 'MSFT', 'GOOGL', 'AMZN', 'NVDA']}
                    onClose={() => setShowPeerComparison(false)}
                />
            )}

            {showScenarioAnalysis && window.ScenarioAnalysisModal && (
                <window.ScenarioAnalysisModal
                    symbol={selectedStock}
                    currentPrice={stockData?.quote?.price || 0}
                    baselineData={{
                        latestFCF: 10000000000, // Mock or fetch
                        netDebt: 5000000000,
                        sharesOutstanding: 1000000000,
                        avgGrowth: 15
                    }}
                    onClose={() => setShowScenarioAnalysis(false)}
                />
            )}

            {showAdvancedScreener && window.AdvancedScreenerModal && (
                <window.AdvancedScreenerModal
                    onClose={() => setShowAdvancedScreener(false)}
                    onSelectStock={(symbol) => {
                        setSelectedStock(symbol);
                        setShowAdvancedScreener(false);
                    }}
                />
            )}

            {showAnalysisModal && window.StockAnalysisModal && (
                <window.StockAnalysisModal
                    symbol={selectedStock}
                    currentPrice={stockData?.quote?.price || 0}
                    onClose={() => setShowAnalysisModal(false)}
                />
            )}

        </div>
    );
};

window.AdvancedAnalysisTab = AdvancedAnalysisTab;
