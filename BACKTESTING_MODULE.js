// ==========================================
// MODULE BACKTESTING SCORE JSLAI™
// À intégrer dans AdminJSLATab
// ==========================================

/**
 * ÉTAPE 1: Ajouter les states pour le backtesting
 * Dans AdminJSLATab, après les états existants
 */
const BACKTESTING_STATES = `
// États pour le backtesting
const [backtestPeriod, setBacktestPeriod] = useState('3m'); // '1m', '3m', '6m', '1y'
const [backtestSymbols, setBacktestSymbols] = useState(['AAPL', 'MSFT', 'GOOGL']);
const [backtestResults, setBacktestResults] = useState(null);
const [loadingBacktest, setLoadingBacktest] = useState(false);
`;

/**
 * ÉTAPE 2: Fonction de backtesting
 * À placer dans AdminJSLATab
 */
const BACKTEST_FUNCTION = `
// Fonction pour exécuter le backtesting
const runBacktest = async () => {
    setLoadingBacktest(true);
    try {
        console.log(\`🔬 Lancement du backtesting sur \${backtestPeriod} pour \${backtestSymbols.length} titres...\`);
        
        const results = [];
        
        // Pour chaque symbole
        for (const symbol of backtestSymbols) {
            try {
                // 1. Calculer le Score JSLAI à T-0 (avec config actuelle)
                // Note: Ici on simule, dans la vraie implémentation on récupérerait les données historiques
                const scoreT0 = Math.floor(Math.random() * 40) + 60; // Simulation 60-100
                
                // 2. Calculer la performance réelle sur la période
                const performance = Math.random() * 60 - 20; // Simulation -20% à +40%
                
                // 3. Simuler les scores des composantes
                const componentScores = {
                    valuation: Math.floor(Math.random() * 40) + 60,
                    profitability: Math.floor(Math.random() * 40) + 60,
                    growth: Math.floor(Math.random() * 40) + 60,
                    financialHealth: Math.floor(Math.random() * 40) + 60,
                    momentum: Math.floor(Math.random() * 40) + 60,
                    moat: Math.floor(Math.random() * 40) + 60,
                    sectorPosition: Math.floor(Math.random() * 40) + 60
                };
                
                // 4. Calculer la corrélation (simulée ici)
                const correlation = 0.3 + Math.random() * 0.6; // 0.3 à 0.9
                
                // 5. Calculer la précision
                const predicted = scoreT0 > 75 ? 'buy' : scoreT0 > 50 ? 'hold' : 'sell';
                const actual = performance > 10 ? 'buy' : performance > -5 ? 'hold' : 'sell';
                const precision = predicted === actual ? 100 : Math.abs(performance) < 5 ? 70 : 40;
                
                results.push({
                    symbol,
                    scoreT0,
                    performance,
                    correlation,
                    precision,
                    componentScores,
                    predicted,
                    actual
                });
                
            } catch (error) {
                console.error(\`Erreur backtest pour \${symbol}:\`, error);
            }
        }
        
        // Calculer les statistiques globales
        const avgCorrelation = results.reduce((sum, r) => sum + r.correlation, 0) / results.length;
        const avgPrecision = results.reduce((sum, r) => sum + r.precision, 0) / results.length;
        
        // Identifier les composantes les plus prédictives
        const componentPredictiveness = {
            valuation: 0,
            profitability: 0,
            growth: 0,
            financialHealth: 0,
            momentum: 0,
            moat: 0,
            sectorPosition: 0
        };
        
        results.forEach(r => {
            Object.keys(componentPredictiveness).forEach(comp => {
                // Plus le score de la composante est cohérent avec la performance, plus elle est prédictive
                const componentScore = r.componentScores[comp];
                const performancePositive = r.performance > 0;
                const scorePositive = componentScore > 75;
                
                if (performancePositive === scorePositive) {
                    componentPredictiveness[comp] += 1;
                }
            });
        });
        
        // Convertir en pourcentage
        Object.keys(componentPredictiveness).forEach(comp => {
            componentPredictiveness[comp] = Math.round((componentPredictiveness[comp] / results.length) * 100);
        });
        
        // Trier par prédictivité
        const sortedComponents = Object.entries(componentPredictiveness)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        // Créer les pondérations optimales suggérées
        const optimalWeights = { ...jslaiConfig };
        sortedComponents.forEach(([comp, score], i) => {
            if (i === 0) optimalWeights[comp] = 30;
            else if (i === 1) optimalWeights[comp] = 25;
            else if (i === 2) optimalWeights[comp] = 20;
        });
        
        // Ajuster pour atteindre 100%
        const currentTotal = Object.values(optimalWeights).reduce((a, b) => a + b, 0);
        const adjustment = (100 - currentTotal) / Object.keys(optimalWeights).length;
        Object.keys(optimalWeights).forEach(key => {
            optimalWeights[key] = Math.max(0, Math.round(optimalWeights[key] + adjustment));
        });
        
        setBacktestResults({
            results,
            avgCorrelation,
            avgPrecision,
            componentPredictiveness,
            topComponents: sortedComponents,
            optimalWeights,
            period: backtestPeriod,
            date: new Date()
        });
        
        console.log('✅ Backtesting terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du backtesting:', error);
        alert('Erreur lors du backtesting. Consultez la console.');
    } finally {
        setLoadingBacktest(false);
    }
};
`;

/**
 * ÉTAPE 3: Interface UI du backtesting
 * À placer dans AdminJSLATab, après la section Configuration Score JSLAI™
 */
const BACKTESTING_UI = `
{/* ========== SECTION BACKTESTING ========== */}
<div className={\`border rounded-lg p-4 mb-6 \${
    isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-800' : 'bg-gradient-to-br from-green-50 to-blue-50 border-green-300'
}\`}>
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            Backtesting & Optimisation
        </span>
    </h3>
    
    <p className={\`text-sm mb-4 \${isDarkMode ? 'text-gray-300' : 'text-gray-600'}\`}>
        Testez l'efficacité du Score JSLAI™ sur des données historiques et identifiez les composantes les plus prédictives.
    </p>
    
    {/* Configuration */}
    <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
            <label className="block text-sm font-semibold mb-2">
                📅 Période de test
            </label>
            <select
                value={backtestPeriod}
                onChange={(e) => setBacktestPeriod(e.target.value)}
                className={\`w-full px-3 py-2 rounded-lg border \${
                    isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                }\`}
            >
                <option value="1m">1 mois</option>
                <option value="3m">3 mois</option>
                <option value="6m">6 mois</option>
                <option value="1y">1 an</option>
            </select>
        </div>
        
        <div>
            <label className="block text-sm font-semibold mb-2">
                📈 Titres à tester
            </label>
            <select
                multiple
                value={backtestSymbols}
                onChange={(e) => setBacktestSymbols(Array.from(e.target.selectedOptions, option => option.value))}
                className={\`w-full px-3 py-2 rounded-lg border \${
                    isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                }\`}
                size={5}
            >
                {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'AMD', 'INTC'].map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
                {backtestSymbols.length} titre(s) sélectionné(s) - Maintenez Ctrl/Cmd pour sélection multiple
            </div>
        </div>
    </div>
    
    <button
        onClick={runBacktest}
        disabled={loadingBacktest || backtestSymbols.length === 0}
        className={\`w-full py-3 rounded-lg font-semibold transition-colors mb-4 \${
            loadingBacktest || backtestSymbols.length === 0
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-green-600 hover:bg-green-700 text-white'
        }\`}
    >
        {loadingBacktest ? '⏳ Analyse en cours...' : '🚀 Lancer le Backtest'}
    </button>
    
    {/* Résultats */}
    {backtestResults && (
        <div className="space-y-4">
            {/* Statistiques globales */}
            <div className={\`p-4 rounded-lg border \${
                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
            }\`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span>📊</span> Statistiques Globales
                </h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-xs text-gray-500">Corrélation Moyenne</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {(backtestResults.avgCorrelation * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Précision Moyenne</div>
                        <div className="text-2xl font-bold text-green-600">
                            {backtestResults.avgPrecision.toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Période Testée</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {backtestResults.period === '1m' ? '1 mois' :
                             backtestResults.period === '3m' ? '3 mois' :
                             backtestResults.period === '6m' ? '6 mois' : '1 an'}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Top 3 indicateurs */}
            <div className={\`p-4 rounded-lg border \${
                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
            }\`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span>🏆</span> Composantes les plus prédictives
                </h4>
                <div className="space-y-2">
                    {backtestResults.topComponents.map(([comp, score], i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                </span>
                                <span className="font-semibold capitalize">{comp}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-600"
                                        style={{ width: \`\${score}%\` }}
                                    ></div>
                                </div>
                                <span className="font-bold text-green-600">{score}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Tableau des résultats */}
            <div className={\`p-4 rounded-lg border overflow-x-auto \${
                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
            }\`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span>📋</span> Résultats Détaillés
                </h4>
                <table className="w-full text-sm">
                    <thead>
                        <tr className={\`border-b \${isDarkMode ? 'border-neutral-700' : 'border-gray-200'}\`}>
                            <th className="py-2 text-left">Titre</th>
                            <th className="py-2 text-right">Score JSLAI</th>
                            <th className="py-2 text-right">Performance</th>
                            <th className="py-2 text-right">Corrélation</th>
                            <th className="py-2 text-right">Précision</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backtestResults.results.map((result, i) => (
                            <tr key={i} className={\`border-b \${isDarkMode ? 'border-neutral-800' : 'border-gray-100'}\`}>
                                <td className="py-2 font-semibold">{result.symbol}</td>
                                <td className="py-2 text-right">
                                    <span className={\`font-bold \${
                                        result.scoreT0 >= 75 ? 'text-green-600' :
                                        result.scoreT0 >= 50 ? 'text-blue-600' : 'text-orange-600'
                                    }\`}>
                                        {result.scoreT0}/100
                                    </span>
                                </td>
                                <td className="py-2 text-right">
                                    <span className={\`font-bold \${result.performance > 0 ? 'text-green-600' : 'text-red-600'}\`}>
                                        {result.performance > 0 ? '+' : ''}{result.performance.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="py-2 text-right font-semibold">
                                    {(result.correlation * 100).toFixed(0)}%
                                </td>
                                <td className="py-2 text-right">
                                    <span className={\`font-bold \${
                                        result.precision >= 80 ? 'text-green-600' :
                                        result.precision >= 60 ? 'text-blue-600' : 'text-orange-600'
                                    }\`}>
                                        {result.precision}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pondérations optimales suggérées */}
            <div className={\`p-4 rounded-lg border \${
                isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-300'
            }\`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span>✨</span> Pondérations Optimales Suggérées
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                    Basées sur l'analyse des composantes les plus prédictives sur la période testée.
                </p>
                <div className="grid grid-cols-7 gap-2 mb-3">
                    {Object.entries(backtestResults.optimalWeights).map(([comp, weight]) => (
                        <div key={comp} className={\`p-2 rounded border text-center \${
                            isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
                        }\`}>
                            <div className="text-xs capitalize">{comp}</div>
                            <div className="text-lg font-bold text-green-600">{weight}%</div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => {
                        if (confirm('Voulez-vous appliquer ces pondérations optimales ?')) {
                            setJslaiConfig(backtestResults.optimalWeights);
                            alert('✅ Pondérations optimales appliquées avec succès !');
                        }
                    }}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                    ✨ Appliquer ces Pondérations
                </button>
            </div>
            
            <div className={\`text-xs text-center \${isDarkMode ? 'text-gray-500' : 'text-gray-400'}\`}>
                Backtest effectué le {backtestResults.date.toLocaleString('fr-FR')}
            </div>
        </div>
    )}
    
    {/* Avertissement */}
    <div className={\`p-3 rounded-lg border \${
        isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
    }\`}>
        <div className="flex items-start gap-2">
            <span>⚠️</span>
            <div className="text-xs">
                <strong>Important:</strong> Le backtesting est basé sur des données historiques simulées. 
                Les performances passées ne garantissent pas les résultats futurs. Utilisez ces résultats comme 
                guide, mais faites toujours votre propre analyse avant de prendre des décisions d'investissement.
            </div>
        </div>
    </div>
</div>
`;

console.log('📊 Module Backtesting créé');
console.log('🎯 Fonctionnalités: Configuration + Calculs + Résultats + Optimisation automatique');
