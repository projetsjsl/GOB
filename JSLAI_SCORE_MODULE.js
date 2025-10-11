// ==========================================
// MODULE SCORE JSLAI™ - Code JavaScript Complet
// À intégrer dans public/beta-combined-dashboard.html
// ==========================================

/**
 * ÉTAPE 1: Ajouter les states dans BetaCombinedDashboard (ligne ~438)
 * Après les autres useState existants
 */

const STATES_TO_ADD = `
// Configuration du Score JSLAI™ (pondérations)
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
`;

/**
 * ÉTAPE 2: Fonction de calcul du Score JSLAI™
 * À placer dans fetchRealStockData(), après les calculs existants
 */

const CALCULATE_JSLAI_SCORE = `
// Calcul du Score JSLAI™ Global (0-100)
const calculateJSLAIScore = () => {
    let totalScore = 0;
    let scores = {};
    
    // 1. VALUATION (20 pts par défaut)
    let valuationScore = 50;
    if (peDiff < -20) valuationScore = 100;
    else if (peDiff < -10) valuationScore = 85;
    else if (peDiff < 0) valuationScore = 70;
    else if (peDiff < 10) valuationScore = 60;
    else if (peDiff < 20) valuationScore = 40;
    else valuationScore = 20;
    
    if (priceFCFDiff < -15) valuationScore = Math.min(100, valuationScore + 15);
    else if (priceFCFDiff > 15) valuationScore = Math.max(0, valuationScore - 15);
    
    scores.valuation = valuationScore;
    totalScore += (valuationScore * jslaiConfig.valuation) / 100;
    
    // 2. PROFITABILITY (20 pts par défaut)
    let profitabilityScore = 0;
    const latestIncome = incomeStatements?.data?.[0];
    const latestBalance = balanceSheets?.data?.[0];
    
    if (latestIncome && latestBalance) {
        const netMargin = (latestIncome.netIncome / latestIncome.revenue) * 100;
        const roe = (latestIncome.netIncome / latestBalance.totalStockholdersEquity) * 100;
        const roa = (latestIncome.netIncome / latestBalance.totalAssets) * 100;
        
        // Net Margin (33%)
        if (netMargin > 25) profitabilityScore += 33;
        else if (netMargin > 20) profitabilityScore += 28;
        else if (netMargin > 15) profitabilityScore += 23;
        else if (netMargin > 10) profitabilityScore += 18;
        else if (netMargin > 5) profitabilityScore += 13;
        else profitabilityScore += 5;
        
        // ROE (34%)
        if (roe > 25) profitabilityScore += 34;
        else if (roe > 20) profitabilityScore += 28;
        else if (roe > 15) profitabilityScore += 22;
        else if (roe > 10) profitabilityScore += 16;
        else if (roe > 5) profitabilityScore += 10;
        else profitabilityScore += 3;
        
        // ROA (33%)
        if (roa > 15) profitabilityScore += 33;
        else if (roa > 10) profitabilityScore += 26;
        else if (roa > 7) profitabilityScore += 20;
        else if (roa > 5) profitabilityScore += 14;
        else if (roa > 2) profitabilityScore += 8;
        else profitabilityScore += 2;
    }
    
    scores.profitability = profitabilityScore;
    totalScore += (profitabilityScore * jslaiConfig.profitability) / 100;
    
    // 3. GROWTH (15 pts par défaut)
    let growthScore = 50;
    if (incomeStatements?.data?.length >= 3) {
        const revenues = incomeStatements.data.slice(0, 3).map(i => i.revenue).reverse();
        const growthRate = ((revenues[2] - revenues[0]) / revenues[0]) * 100;
        
        if (growthRate > 30) growthScore = 100;
        else if (growthRate > 20) growthScore = 90;
        else if (growthRate > 15) growthScore = 80;
        else if (growthRate > 10) growthScore = 70;
        else if (growthRate > 5) growthScore = 60;
        else if (growthRate > 0) growthScore = 50;
        else if (growthRate > -5) growthScore = 40;
        else growthScore = 20;
    }
    
    scores.growth = growthScore;
    totalScore += (growthScore * jslaiConfig.growth) / 100;
    
    // 4. FINANCIAL HEALTH (20 pts par défaut)
    scores.financialHealth = financialStrength || 50;
    totalScore += ((financialStrength || 50) * jslaiConfig.financialHealth) / 100;
    
    // 5. MOMENTUM (10 pts par défaut)
    let momentumScore = 50;
    if (rsi14 > 70) momentumScore = 30;
    else if (rsi14 > 60) momentumScore = 50;
    else if (rsi14 > 50) momentumScore = 70;
    else if (rsi14 > 40) momentumScore = 75;
    else if (rsi14 > 30) momentumScore = 80;
    else momentumScore = 90;
    
    if (sma20Diff > 5 && sma50Diff > 5) momentumScore = Math.min(100, momentumScore + 15);
    else if (sma20Diff < -5 && sma50Diff < -5) momentumScore = Math.max(0, momentumScore - 15);
    
    scores.momentum = momentumScore;
    totalScore += (momentumScore * jslaiConfig.momentum) / 100;
    
    // 6. MOAT (10 pts par défaut)
    let moatScore = 50;
    if (latestIncome && latestBalance) {
        const netMargin = (latestIncome.netIncome / latestIncome.revenue) * 100;
        const roe = (latestIncome.netIncome / latestBalance.totalStockholdersEquity) * 100;
        
        if (netMargin > 20 && roe > 20) moatScore = 100;
        else if (netMargin > 15 && roe > 15) moatScore = 85;
        else if (netMargin > 10 && roe > 12) moatScore = 70;
        else if (netMargin > 7 && roe > 10) moatScore = 60;
        else moatScore = 40;
        
        if (earningPredictability > 80) moatScore = Math.min(100, moatScore + 10);
    }
    
    scores.moat = moatScore;
    totalScore += (moatScore * jslaiConfig.moat) / 100;
    
    // 7. SECTOR POSITION (5 pts par défaut)
    let sectorScore = 60;
    scores.sectorPosition = sectorScore;
    totalScore += (sectorScore * jslaiConfig.sectorPosition) / 100;
    
    return {
        total: Math.round(totalScore),
        breakdown: scores,
        interpretation: totalScore >= 85 ? 'Excellent' :
                       totalScore >= 75 ? 'Très Bon' :
                       totalScore >= 65 ? 'Bon' :
                       totalScore >= 50 ? 'Moyen' :
                       totalScore >= 35 ? 'Faible' : 'Mauvais',
        recommendation: totalScore >= 75 ? 'Achat Fort' :
                       totalScore >= 65 ? 'Achat' :
                       totalScore >= 50 ? 'Conserver' :
                       totalScore >= 35 ? 'Surveiller' : 'Éviter'
    };
};

const jslaiScore = calculateJSLAIScore();
`;

/**
 * ÉTAPE 3: Ajouter jslaiScore au return de fetchRealStockData
 */
const ADD_TO_RETURN = `
// Dans le return de fetchRealStockData, ajouter :
jslaiScore: jslaiScore
`;

/**
 * ÉTAPE 4: UI - Badge Score JSLAI™
 * À placer dans JStocksTab, au début des métriques (remplacer grid-cols-3 par grid-cols-4)
 */
const BADGE_JSLAI = `
<div className="grid grid-cols-4 gap-1.5">
    {/* Score JSLAI™ Global */}
    <div className={\`border rounded p-1.5 transition-colors duration-300 \${
        isDarkMode ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300'
    }\`}>
        <div className="text-[8px] text-gray-400 font-semibold mb-0.5">Score JSLAI™</div>
        <div className="flex items-center justify-between">
            <div className={\`text-xl font-bold \${
                jslaiScore.total >= 75 ? 'text-emerald-500' :
                jslaiScore.total >= 65 ? 'text-blue-500' :
                jslaiScore.total >= 50 ? 'text-yellow-500' :
                jslaiScore.total >= 35 ? 'text-orange-500' : 'text-red-500'
            }\`}>
                {jslaiScore.total || '--'}
                <span className="text-xs">/100</span>
            </div>
            <div className="text-right">
                <div className={\`text-[7px] font-bold \${
                    jslaiScore.total >= 75 ? 'text-emerald-500' :
                    jslaiScore.total >= 65 ? 'text-blue-500' :
                    jslaiScore.total >= 50 ? 'text-yellow-500' : 'text-red-500'
                }\`}>
                    {jslaiScore.interpretation}
                </div>
                <div className="text-[6px] text-gray-500">{jslaiScore.recommendation}</div>
            </div>
        </div>
    </div>
    
    {/* Les 3 autres badges existants restent inchangés */}
`;

console.log('📦 Module Score JSLAI™ prêt à être intégré');
console.log('👉 Suivez les instructions dans les commentaires ci-dessus');
