// AdvancedAnalysisModals.js
// Contains all modal components for the Advanced Analysis Tab

const { useState, useEffect, useMemo } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area, PieChart, Pie, Cell } = window.Recharts || {};
const Icon = window.Icon;

// --- Base Modal Component ---
const BaseModal = ({ title, onClose, children, maxWidth = "max-w-4xl" }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className={`bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <Icon name="xmark" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- 1. Peer Comparison Modal ---
const PeerComparisonModal = ({ symbols, onClose }) => {
    const [peerData, setPeerData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeerData = async () => {
            setLoading(true);
            try {
                // Fetch data for all symbols
                const promises = symbols.map(async (symbol) => {
                    const API_BASE_URL = window.location.origin || '';
                    const [quoteRes, fundamentalsRes] = await Promise.allSettled([
                        fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`),
                        fetch(`${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=${symbol}&source=auto`)
                    ]);

                    const quote = quoteRes.status === 'fulfilled' && quoteRes.value.ok ? await quoteRes.value.json() : {};
                    const fundamentals = fundamentalsRes.status === 'fulfilled' && fundamentalsRes.value.ok ? await fundamentalsRes.value.json() : {};

                    return {
                        symbol,
                        price: quote.c || fundamentals.quote?.price || 0,
                        change: quote.dp || fundamentals.quote?.changesPercentage || 0,
                        pe: fundamentals.ratios?.peRatioTTM || 0,
                        marketCap: fundamentals.metrics?.marketCapitalization || 0,
                        revenueGrowth: fundamentals.metrics?.revenueGrowth3Y || 0,
                        roe: fundamentals.ratios?.returnOnEquityTTM || 0,
                        debtToEquity: fundamentals.ratios?.debtEquityRatioTTM || 0
                    };
                });

                const results = await Promise.all(promises);
                setPeerData(results);
            } catch (error) {
                console.error("Error fetching peer data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (symbols && symbols.length > 0) {
            fetchPeerData();
        }
    }, [symbols]);

    return (
        <BaseModal title="Comparaison des Pairs" onClose={onClose} maxWidth="max-w-6xl">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-blue-400 animate-pulse">Chargement des données comparatives...</div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="p-4 text-gray-400 font-medium">Métrique</th>
                                {peerData.map(d => (
                                    <th key={d.symbol} className="p-4 text-white font-bold text-center">
                                        {d.symbol}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: 'Prix', key: 'price', format: (v) => `$${v?.toFixed(2)}` },
                                { label: 'Variation', key: 'change', format: (v) => `${v > 0 ? '+' : ''}${v?.toFixed(2)}%`, color: true },
                                { label: 'P/E Ratio', key: 'pe', format: (v) => v?.toFixed(2) },
                                { label: 'Market Cap', key: 'marketCap', format: (v) => `$${(v / 1e9).toFixed(2)}B` },
                                { label: 'Croissance Rev (3Y)', key: 'revenueGrowth', format: (v) => `${(v * 100).toFixed(2)}%`, color: true },
                                { label: 'ROE', key: 'roe', format: (v) => `${(v * 100).toFixed(2)}%`, color: true },
                                { label: 'Dette/Equity', key: 'debtToEquity', format: (v) => v?.toFixed(2) }
                            ].map((metric, idx) => (
                                <tr key={metric.key} className={idx % 2 === 0 ? 'bg-gray-800/30' : ''}>
                                    <td className="p-4 text-gray-300 font-medium">{metric.label}</td>
                                    {peerData.map(d => (
                                        <td key={d.symbol} className={`p-4 text-center ${metric.color ? (d[metric.key] >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-200'}`}>
                                            {metric.format(d[metric.key])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </BaseModal>
    );
};

window.BaseModal = BaseModal;
window.PeerComparisonModal = PeerComparisonModal;

// --- 2. Scenario Analysis Modal ---
const ScenarioAnalysisModal = ({ symbol, currentPrice, baselineData, onClose }) => {
    const [scenarios, setScenarios] = useState({
        pessimistic: { growth: 5, margin: 10, multiple: 15 },
        base: { growth: 10, margin: 15, multiple: 20 },
        optimistic: { growth: 15, margin: 20, multiple: 25 }
    });

    const calculateValuation = (scenario) => {
        // Simplified DCF logic for demo
        const futureFCF = (baselineData?.latestFCF || 0) * Math.pow(1 + scenario.growth / 100, 5);
        const terminalValue = futureFCF * scenario.multiple;
        const enterpriseValue = terminalValue / Math.pow(1.1, 5); // 10% discount
        const equityValue = enterpriseValue - (baselineData?.netDebt || 0);
        const sharePrice = equityValue / (baselineData?.sharesOutstanding || 1);
        return Math.max(0, sharePrice);
    };

    const results = useMemo(() => ({
        pessimistic: calculateValuation(scenarios.pessimistic),
        base: calculateValuation(scenarios.base),
        optimistic: calculateValuation(scenarios.optimistic)
    }), [scenarios, baselineData]);

    return (
        <BaseModal title={`Analyse de Scénarios: ${symbol}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {['pessimistic', 'base', 'optimistic'].map((type) => (
                    <div key={type} className={`p-6 rounded-xl border ${type === 'base' ? 'bg-blue-900/20 border-blue-500/50' : type === 'optimistic' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                        <h3 className="text-lg font-bold capitalize mb-4 text-white">{type}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400">Croissance (%)</label>
                                <input 
                                    type="number" 
                                    value={scenarios[type].growth}
                                    onChange={(e) => setScenarios({...scenarios, [type]: {...scenarios[type], growth: parseFloat(e.target.value)}})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Multiple Terminal</label>
                                <input 
                                    type="number" 
                                    value={scenarios[type].multiple}
                                    onChange={(e) => setScenarios({...scenarios, [type]: {...scenarios[type], multiple: parseFloat(e.target.value)}})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm mt-1"
                                />
                            </div>
                            <div className="pt-4 border-t border-gray-700/50">
                                <div className="text-xs text-gray-400">Prix Estimé</div>
                                <div className="text-2xl font-bold text-white">${results[type].toFixed(2)}</div>
                                <div className={`text-sm ${results[type] > currentPrice ? 'text-green-400' : 'text-red-400'}`}>
                                    {((results[type] - currentPrice) / currentPrice * 100).toFixed(1)}% vs Actuel
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </BaseModal>
    );
};

// --- 3. Advanced Screener Modal ---
const AdvancedScreenerModal = ({ onClose, onSelectStock }) => {
    // Mock screener results for demo
    const results = [
        { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Technology', price: 450.20, change: 2.5, score: 98 },
        { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', price: 320.50, change: 1.2, score: 95 },
        { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology', price: 130.10, change: -0.5, score: 92 },
    ];

    return (
        <BaseModal title="Screener Avancé" onClose={onClose}>
            <div className="space-y-6">
                <div className="flex gap-4">
                    <select className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white flex-1">
                        <option>Secteur: Tous</option>
                        <option>Technologie</option>
                        <option>Finance</option>
                    </select>
                    <select className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white flex-1">
                        <option>Capitalisation: Large Cap</option>
                        <option>Mid Cap</option>
                        <option>Small Cap</option>
                    </select>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-semibold">
                        Filtrer
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-700">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4 text-gray-400 font-medium">Symbole</th>
                                <th className="p-4 text-gray-400 font-medium">Nom</th>
                                <th className="p-4 text-gray-400 font-medium">Prix</th>
                                <th className="p-4 text-gray-400 font-medium">Score IA</th>
                                <th className="p-4 text-gray-400 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {results.map(stock => (
                                <tr key={stock.symbol} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-bold text-white">{stock.symbol}</td>
                                    <td className="p-4 text-gray-300">{stock.name}</td>
                                    <td className="p-4 text-white">${stock.price}</td>
                                    <td className="p-4">
                                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                                            {stock.score}/100
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => onSelectStock(stock.symbol)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                                        >
                                            Analyser
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </BaseModal>
    );
};

window.ScenarioAnalysisModal = ScenarioAnalysisModal;
window.AdvancedScreenerModal = AdvancedScreenerModal;

// --- 4. Stock Analysis Modal ---
const StockAnalysisModal = ({ symbol, currentPrice, onClose }) => {
    return (
        <BaseModal title={`Analyse Rapide: ${symbol}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Vue d'ensemble</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Prix Actuel</span>
                            <span className="text-white font-bold">${currentPrice?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Tendance (Tech)</span>
                            <span className="text-green-400 font-bold">Haussière</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Santé Financière</span>
                            <span className="text-blue-400 font-bold">Solide (A-)</span>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">BUY</div>
                        <div className="text-sm text-gray-400">Recommandation Automatisée</div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

// --- 5. AI Stock Analysis Modal ---
const AIStockAnalysisModal = ({ symbol, stockData, onClose }) => {
    // This would typically use the aiAnalysis prop passed down
    // For now, we'll simulate or use what's available
    
    return (
        <BaseModal title={`Analyse IA: ${symbol}`} onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Icon name="brain" className="text-violet-400 w-5 h-5 inline mr-2" /> Thèse d'Investissement
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                        {symbol} démontre une position dominante sur son marché avec des fondamentaux solides. 
                        La croissance des revenus reste supérieure à la moyenne du secteur, soutenue par l'innovation continue.
                        Cependant, la valorisation actuelle suggère que le marché a déjà intégré une grande partie de cette croissance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Icon name="warning-triangle" className="text-red-400 w-5 h-5 inline mr-2" /> Risques Principaux
                        </h3>
                        <ul className="space-y-2 text-gray-300 list-disc list-inside">
                            <li>Volatilité macroéconomique affectant les dépenses des consommateurs.</li>
                            <li>Concurrence accrue sur les segments clés.</li>
                            <li>Pression réglementaire potentielle.</li>
                        </ul>
                    </div>

                    <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Icon name="target" className="text-green-400 w-5 h-5 inline mr-2" /> Objectifs de Prix
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Bear Case</span>
                                <span className="text-red-400 font-bold">${(stockData?.price * 0.8).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Base Case</span>
                                <span className="text-white font-bold">${(stockData?.price * 1.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Bull Case</span>
                                <span className="text-green-400 font-bold">${(stockData?.price * 1.3).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

window.StockAnalysisModal = StockAnalysisModal;
window.AIStockAnalysisModal = AIStockAnalysisModal;

// --- 6. News & Sentiment Modal ---
const NewsAndSentimentModal = ({ symbol, stockData, onClose }) => {
    // Mock news if not provided
    const news = [
        { title: `${symbol} annonce des résultats records pour le Q3`, source: 'Financial Times', date: '2h ago', sentiment: 'positive' },
        { title: 'Le secteur technologique sous pression', source: 'Bloomberg', date: '5h ago', sentiment: 'neutral' },
        { title: 'Nouvelle acquisition stratégique', source: 'Reuters', date: '1d ago', sentiment: 'positive' }
    ];

    return (
        <BaseModal title={`Actualités & Sentiment: ${symbol}`} onClose={onClose}>
            <div className="space-y-6">
                {/* Sentiment Score */}
                <div className="flex items-center gap-6 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent rotate-45"></div>
                        <div className="text-2xl font-bold text-white">7.5</div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Sentiment Global: Positif</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            L'analyse IA des 50 derniers articles suggère un sentiment majoritairement haussier.
                        </p>
                    </div>
                </div>

                {/* News Feed */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Dernières Actualités</h3>
                    {news.map((item, idx) => (
                        <div key={idx} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-white">{item.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${item.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {item.sentiment}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{item.source}</span>
                                <span>{item.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </BaseModal>
    );
};

// --- 7. Analyst Consensus Modal ---
const AnalystConsensusModal = ({ symbol, stockData, onClose }) => {
    const data = [
        { name: 'Strong Buy', value: 15, color: '#22c55e' },
        { name: 'Buy', value: 25, color: '#84cc16' },
        { name: 'Hold', value: 10, color: '#eab308' },
        { name: 'Sell', value: 2, color: '#f97316' },
        { name: 'Strong Sell', value: 1, color: '#ef4444' },
    ];

    return (
        <BaseModal title={`Consensus Analystes: ${symbol}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64">
                    <h3 className="text-lg font-bold text-white mb-4 text-center">Répartition des Recommandations</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <div className="text-gray-400 text-sm">Objectif de Prix Moyen</div>
                        <div className="text-3xl font-bold text-white mt-1">${(stockData?.price * 1.15).toFixed(2)}</div>
                        <div className="text-green-400 text-sm font-semibold mt-1">+15% vs Actuel</div>
                    </div>
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <div className="text-gray-400 text-sm">Consensus Global</div>
                        <div className="text-3xl font-bold text-lime-400 mt-1">BUY</div>
                        <div className="text-gray-500 text-sm mt-1">Basé sur 53 analystes</div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

window.NewsAndSentimentModal = NewsAndSentimentModal;
window.AnalystConsensusModal = AnalystConsensusModal;

// --- 8. Earnings Calendar Modal ---
const EarningsCalendarModal = ({ symbol, stockData, onClose }) => {
    return (
        <BaseModal title={`Calendrier Earnings: ${symbol}`} onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-rose-900/20 to-pink-900/20 border border-rose-500/30 rounded-xl p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">Prochains Résultats</h3>
                        <p className="text-rose-300">Q4 2024</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">24 Jan 2025</div>
                        <div className="text-sm text-gray-400">Estimé</div>
                    </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Historique des Surprises (EPS)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { q: 'Q3 23', est: 1.2, act: 1.3 },
                                { q: 'Q4 23', est: 1.4, act: 1.5 },
                                { q: 'Q1 24', est: 1.3, act: 1.45 },
                                { q: 'Q2 24', est: 1.5, act: 1.6 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="q" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                <Legend />
                                <Bar dataKey="est" name="Estimé" fill="#4b5563" />
                                <Bar dataKey="act" name="Réel" fill="#f43f5e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

// --- 9. Economic Events Modal ---
const EconomicEventsModal = ({ symbol, onClose }) => {
    const events = [
        { date: 'Demain', time: '08:30', event: 'CPI (Inflation) US', impact: 'High', forecast: '3.1%', previous: '3.2%' },
        { date: 'Mercredi', time: '14:00', event: 'Décision Fed Taux', impact: 'Critical', forecast: '5.50%', previous: '5.50%' },
        { date: 'Jeudi', time: '08:30', event: 'Jobless Claims', impact: 'Medium', forecast: '220K', previous: '218K' }
    ];

    return (
        <BaseModal title="Calendrier Économique" onClose={onClose}>
            <div className="space-y-4">
                {events.map((event, idx) => (
                    <div key={idx} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                                <div className="text-sm text-gray-400">{event.date}</div>
                                <div className="text-lg font-bold text-white">{event.time}</div>
                            </div>
                            <div>
                                <div className="font-bold text-white">{event.event}</div>
                                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                                    <span>Prev: {event.forecast}</span>
                                    <span>Préc: {event.previous}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.impact === 'Critical' ? 'bg-red-500/20 text-red-400' : event.impact === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {event.impact}
                        </span>
                    </div>
                ))}
            </div>
        </BaseModal>
    );
};

// --- 10. Watchlist Screener Modal ---
const WatchlistScreenerModal = ({ watchlist, onClose, onSelectStock }) => {
    // Mock ranking logic
    const rankedWatchlist = (watchlist || []).map(ticker => ({
        symbol: ticker,
        score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
        upside: Math.floor(Math.random() * 30) - 5 // Random upside -5% to +25%
    })).sort((a, b) => b.score - a.score);

    return (
        <BaseModal title="Classement Watchlist IA" onClose={onClose}>
            <div className="overflow-hidden rounded-xl border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="p-4 text-gray-400 font-medium">Rang</th>
                            <th className="p-4 text-gray-400 font-medium">Symbole</th>
                            <th className="p-4 text-gray-400 font-medium">Score IA</th>
                            <th className="p-4 text-gray-400 font-medium">Potentiel</th>
                            <th className="p-4 text-gray-400 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {rankedWatchlist.map((item, idx) => (
                            <tr key={item.symbol} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 text-gray-500 font-bold">#{idx + 1}</td>
                                <td className="p-4 font-bold text-white">{item.symbol}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500" 
                                                style={{ width: `${item.score}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm text-white">{item.score}</span>
                                    </div>
                                </td>
                                <td className={`p-4 font-bold ${item.upside > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.upside > 0 ? '+' : ''}{item.upside}%
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => onSelectStock(item.symbol)}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                                    >
                                        Voir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </BaseModal>
    );
};

window.EarningsCalendarModal = EarningsCalendarModal;
window.EconomicEventsModal = EconomicEventsModal;
window.WatchlistScreenerModal = WatchlistScreenerModal;
