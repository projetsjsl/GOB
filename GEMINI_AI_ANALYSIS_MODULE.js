// ==========================================
// MODULE ANALYSE IA GEMINI™
// À intégrer dans public/beta-combined-dashboard.html
// ==========================================

/**
 * ÉTAPE 1: Ajouter les states dans JStocksTab (après les états existants)
 */
const STATES_AI_ANALYSIS = `
// États pour l'analyse IA Gemini
const [aiAnalysis, setAiAnalysis] = useState(null);
const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);

// Option pour inclure la watchlist
const [includeWatchlist, setIncludeWatchlist] = useState(false);
`;

/**
 * ÉTAPE 2: Modifier la liste des stocks pour inclure la watchlist
 */
const MODIFY_STOCKS_LIST = `
// Modifier la const stocks existante :
const baseStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'INTC', name: 'Intel Corp.' }
];

// Ajouter les titres de la watchlist si l'option est cochée
const stocks = includeWatchlist 
    ? [...baseStocks, ...watchlistTickers.map(ticker => ({ symbol: ticker, name: ticker }))]
    : baseStocks;
`;

/**
 * ÉTAPE 3: Fonction generateAiAnalysis
 * À placer après fetchRealStockData
 */
const FUNCTION_GENERATE_AI_ANALYSIS = `
// Fonction pour générer l'analyse IA avec Gemini
const generateAiAnalysis = async (stockData) => {
    if (!stockData) return;
    
    setLoadingAiAnalysis(true);
    try {
        const symbol = stockData.quote?.symbol || selectedStock;
        
        // Préparer toutes les données pour Gemini
        const dataForAI = {
            symbol: symbol,
            company: stockData.profile?.companyName || symbol,
            sector: stockData.profile?.sector || 'N/A',
            
            // Prix et variation
            currentPrice: stockData.quote?.price,
            change: stockData.quote?.change,
            changePercent: stockData.quote?.changesPercentage,
            
            // Score JSLAI
            jslaiScore: stockData.jslaiScore?.total,
            jslaiInterpretation: stockData.jslaiScore?.interpretation,
            jslaiRecommendation: stockData.jslaiScore?.recommendation,
            jslaiBreakdown: stockData.jslaiScore?.breakdown,
            
            // Ratios financiers
            peRatio: stockData.ratios?.peRatio,
            pegRatio: stockData.ratios?.pegRatio,
            roe: stockData.ratios?.roe,
            roa: stockData.ratios?.roa,
            debtEquity: stockData.ratios?.debtEquity,
            currentRatio: stockData.ratios?.currentRatio,
            profitMargin: stockData.ratios?.profitMargin,
            
            // Métriques avancées
            financialStrength: stockData.advancedMetrics?.financialStrength,
            earningPredictability: stockData.advancedMetrics?.earningPredictability,
            peVsHistorical: stockData.advancedMetrics?.peVsHistorical,
            priceFCFVsHistorical: stockData.advancedMetrics?.priceFCFVsHistorical,
            performanceSinceLow: stockData.advancedMetrics?.performanceSinceLow,
            
            // RSI et momentum
            rsi14: stockData.rsi?.rsi14,
            rsi2: stockData.rsi?.rsi2,
            
            // Moyennes mobiles
            sma20Diff: stockData.movingAverages?.sma20?.diff,
            sma50Diff: stockData.movingAverages?.sma50?.diff,
            sma200Diff: stockData.movingAverages?.sma200?.diff,
            maTrend: stockData.movingAverages?.interpretation?.trend,
            
            // Sentiment
            sentiment: stockData.sentiment?.overall,
            sentimentScore: stockData.sentiment?.score
        };
        
        // Appeler l'API Gemini
        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: \`En tant qu'analyste financier expert francophone, génère une analyse détaillée et professionnelle du titre \${symbol}.

**DONNÉES DISPONIBLES:**
\${JSON.stringify(dataForAI, null, 2)}

**STRUCTURE DEMANDÉE:**

## 1. 📊 Synthèse Executive
- Situation actuelle en 2-3 phrases
- Recommandation claire (Achat/Conserver/Vendre)

## 2. 🎯 Analyse du Score JSLAI™ (\${dataForAI.jslaiScore}/100)
- Interprétation du score global
- Forces identifiées dans les composantes
- Faiblesses à surveiller
- Cohérence avec la valorisation de marché

## 3. 💎 Analyse Fondamentale
### Valorisation
- P/E Ratio: \${dataForAI.peRatio} (vs historique: \${dataForAI.peVsHistorical?.diff?.toFixed(1)}%)
- Price/FCF vs historique: \${dataForAI.priceFCFVsHistorical?.diff?.toFixed(1)}%
- Conclusion sur la valorisation

### Rentabilité
- ROE: \${dataForAI.roe}%
- ROA: \${dataForAI.roa}%
- Marge nette: \${dataForAI.profitMargin}%
- Qualité des bénéfices

### Solidité Financière
- Score de force financière: \${dataForAI.financialStrength}/100
- Prévisibilité des bénéfices: \${dataForAI.earningPredictability}/100
- Interprétation de la santé du bilan

## 4. 📈 Analyse Technique
- RSI(14): \${dataForAI.rsi14} → Interprétation
- Moyennes mobiles: \${dataForAI.maTrend}
- Momentum général et tendance
- Performance depuis le plus bas 5 ans: \${dataForAI.performanceSinceLow?.toFixed(1)}%

## 5. ⚡ Opportunités et Risques
### Opportunités (3 principales)
1. [À identifier selon les données]
2. [À identifier selon les données]
3. [À identifier selon les données]

### Risques (3 principaux)
1. [À identifier selon les données]
2. [À identifier selon les données]
3. [À identifier selon les données]

## 6. 💡 Recommandation Finale
- Position suggérée: [Achat Fort/Achat/Conserver/Vendre]
- Justification basée sur l'analyse
- Horizon d'investissement recommandé
- Prix cible suggéré (optionnel, si pertinent)

**STYLE:**
- Professionnel et concis
- Basé UNIQUEMENT sur les données fournies
- Utiliser des émojis pour la lisibilité
- Français de qualité, style CFA
- Être franc sur les limites (pas de spéculation)
\`
                }],
                temperature: 0.7,
                maxTokens: 2500
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(\`Erreur API Gemini: \${response.status} - \${errorData.error || response.statusText}\`);
        }
        
        const data = await response.json();
        const analysisText = data.response || data.text || data.candidates?.[0]?.content || 'Analyse non disponible';
        
        setAiAnalysis({
            text: analysisText,
            timestamp: new Date(),
            symbol: symbol
        });
        
        console.log('✅ Analyse IA générée avec succès pour', symbol);
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération de l\\'analyse IA:', error);
        setAiAnalysis({
            text: \`⚠️ **Analyse IA temporairement indisponible**

Impossible de générer l'analyse automatique pour le moment.

**Raisons possibles:**
- Clé API Gemini non configurée ou invalide
- Quota API dépassé
- Problème de connexion réseau
- Service temporairement indisponible

**Solution:**
1. Vérifiez votre clé API Gemini dans l'onglet Admin-JSLAI
2. Consultez la console pour plus de détails
3. Réessayez dans quelques instants

**Erreur technique:** \${error.message}\`,
            timestamp: new Date(),
            symbol: selectedStock,
            error: true
        });
    } finally {
        setLoadingAiAnalysis(false);
    }
};
`;

/**
 * ÉTAPE 4: Modifier le useEffect pour appeler generateAiAnalysis
 */
const MODIFY_USEEFFECT = `
// Dans useEffect de chargement des données, après setStockDataIntelli(realData)
// Ajouter :
console.log('🤖 Génération de l\\'analyse IA avec Gemini...');
generateAiAnalysis(realData);
`;

/**
 * ÉTAPE 5: UI - Checkbox "Inclure Watchlist"
 * À placer après le select de sélection de titre
 */
const UI_CHECKBOX_WATCHLIST = `
{/* Checkbox pour inclure la watchlist */}
<label className={\`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors \${
    isDarkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
}\`}>
    <input
        type="checkbox"
        checked={includeWatchlist}
        onChange={(e) => setIncludeWatchlist(e.target.checked)}
        className="cursor-pointer"
    />
    <span>+ Watchlist ({watchlistTickers.length})</span>
</label>
`;

/**
 * ÉTAPE 6: UI - Section Analyse IA
 * À placer avant le footer de JStocksTab
 */
const UI_ANALYSIS_SECTION = `
{/* Analyse IA Gemini™ - Section dédiée */}
<div className={\`mt-2 border rounded-lg p-3 transition-colors duration-300 \${
    isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300'
}\`}>
    <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Analyse IA par Gemini™
            </span>
            {loadingAiAnalysis && (
                <span className="text-xs text-blue-500 animate-pulse">⚡ Génération en cours...</span>
            )}
        </h3>
        <button
            onClick={() => generateAiAnalysis(stockDataIntelli)}
            disabled={loadingAiAnalysis || !stockDataIntelli}
            className={\`px-3 py-1 text-xs rounded font-semibold transition-colors \${
                loadingAiAnalysis || !stockDataIntelli
                    ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
            }\`}
        >
            🔄 Régénérer
        </button>
    </div>
    
    <div className={\`border rounded p-3 max-h-96 overflow-y-auto \${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
    }\`}>
        {loadingAiAnalysis ? (
            <div className="text-center py-8">
                <div className="text-4xl mb-2 animate-bounce">🤖</div>
                <div className={\`text-sm font-semibold \${isDarkMode ? 'text-gray-300' : 'text-gray-700'}\`}>
                    Gemini analyse {selectedStock}...
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Cela peut prendre 10-15 secondes
                </div>
                <div className="mt-4 flex justify-center">
                    <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 animate-pulse" style={{animation: 'pulse 1.5s ease-in-out infinite'}}></div>
                    </div>
                </div>
            </div>
        ) : aiAnalysis ? (
            <div className={\`prose prose-sm max-w-none \${
                isDarkMode ? 'prose-invert' : ''
            } \${aiAnalysis.error ? 'text-red-500' : ''}\`}>
                <div 
                    className={\`\${isDarkMode ? 'text-gray-200' : 'text-gray-800'}\`}
                    dangerouslySetInnerHTML={{ 
                        __html: aiAnalysis.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                            .replace(/^#{1,3}\\s+(.*?)$/gm, '<h3 class="font-bold text-base mt-4 mb-2">$1</h3>')
                            .replace(/^-\\s+(.*?)$/gm, '<li class="ml-4">$1</li>')
                            .replace(/(<li>.*<\\/li>)/gs, '<ul class="list-disc pl-5 space-y-1 my-2">$1</ul>')
                            .replace(/\\n\\n/g, '<br/><br/>')
                            .replace(/^###\\s+(.*?)$/gm, '<h4 class="font-semibold text-sm mt-3 mb-1">$1</h4>')
                    }} 
                />
                <div className={\`text-xs mt-4 pt-2 border-t \${
                    isDarkMode ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-200'
                }\`}>
                    📅 Généré le {aiAnalysis.timestamp.toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })} pour <strong>{aiAnalysis.symbol}</strong>
                </div>
            </div>
        ) : (
            <div className="text-center py-8">
                <div className="text-4xl mb-2">💡</div>
                <div className={\`text-sm \${isDarkMode ? 'text-gray-300' : 'text-gray-700'}\`}>
                    Sélectionnez un titre pour voir l'analyse IA
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    L'analyse se génère automatiquement à chaque changement de titre
                </div>
                <div className={\`mt-3 text-xs \${isDarkMode ? 'text-gray-600' : 'text-gray-500'}\`}>
                    Propulsé par Gemini™ - Analyse basée sur {Object.keys(stockDataIntelli || {}).length}+ points de données
                </div>
            </div>
        )}
    </div>
</div>
`;

console.log('🤖 Module Analyse IA Gemini™ prêt');
console.log('📊 Inclut: États + Fonction + UI + Checkbox Watchlist');
