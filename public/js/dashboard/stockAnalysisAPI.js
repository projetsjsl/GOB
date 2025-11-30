/**
 * Stock Analysis API Integration Layer
 * Handles data fetching from FMP, Finnhub, and Gemini APIs
 */

// FMP API Configuration
const FMP_API_KEY = window.emmaConfig?.fmpApiKey || 'YOUR_FMP_KEY';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Finnhub API Configuration  
const FINNHUB_API_KEY = window.emmaConfig?.finnhubApiKey || 'YOUR_FINNHUB_KEY';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Gemini API Configuration
const GEMINI_API_KEY = window.emmaConfig?.gemini?.apiKey || 'YOUR_GEMINI_KEY';

/**
 * Fetch Income Statement (5 years)
 */
async function fetchIncomeStatement(symbol, years = 5) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/income-statement/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching income statement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Balance Sheet (5 years)
 */
async function fetchBalanceSheet(symbol, years = 5) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/balance-sheet-statement/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching balance sheet:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Cash Flow Statement (5 years)
 */
async function fetchCashFlowStatement(symbol, years = 5) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/cash-flow-statement/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching cash flow:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Key Metrics (5 years)
 */
async function fetchKeyMetrics(symbol, years = 5) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/key-metrics/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching key metrics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Financial Ratios (5 years)
 */
async function fetchFinancialRatios(symbol, years = 5) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/ratios/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching ratios:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch DCF Valuation
 */
async function fetchDCFValuation(symbol) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/discounted-cash-flow/${symbol}?apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data: data[0] || data };
    } catch (error) {
        console.error('Error fetching DCF:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch Company Peers
 */
async function fetchCompanyPeers(symbol) {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/stock_peers?symbol=${symbol}&apikey=${FMP_API_KEY}`
        );
        const data = await response.json();
        return { success: true, data: data[0]?.peersList || [] };
    } catch (error) {
        console.error('Error fetching peers:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculate Fair Value using multiple methods
 */
function calculateFairValue(financialData, assumptions = {}) {
    const {
        incomeStatement,
        balanceSheet,
        cashFlow,
        keyMetrics,
        currentPrice
    } = financialData;

    const {
        discountRate = 0.10, // 10% WACC par défaut
        terminalGrowthRate = 0.03, // 3% croissance perpétuelle
        projectionYears = 5
    } = assumptions;

    // Méthode 1: DCF (Discounted Cash Flow)
    let dcfValue = null;
    if (cashFlow && cashFlow.length > 0) {
        const latestFCF = cashFlow[0].freeCashFlow || 0;
        const avgGrowth = calculateAverageGrowth(cashFlow.map(cf => cf.freeCashFlow));

        let totalPV = 0;
        let projectedFCF = latestFCF;

        // Projeter les FCF futurs
        for (let year = 1; year <= projectionYears; year++) {
            projectedFCF *= (1 + avgGrowth);
            const pv = projectedFCF / Math.pow(1 + discountRate, year);
            totalPV += pv;
        }

        // Valeur terminale
        const terminalValue = (projectedFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
        const pvTerminal = terminalValue / Math.pow(1 + discountRate, projectionYears);

        const enterpriseValue = totalPV + pvTerminal;
        const netDebt = (balanceSheet?.[0]?.totalDebt || 0) - (balanceSheet?.[0]?.cashAndCashEquivalents || 0);
        const equityValue = enterpriseValue - netDebt;
        const sharesOutstanding = keyMetrics?.[0]?.numberOfShares || 1;

        dcfValue = equityValue / sharesOutstanding;
    }

    // Méthode 2: P/E Multiple
    let peValue = null;
    if (incomeStatement && incomeStatement.length > 0 && keyMetrics && keyMetrics.length > 0) {
        const eps = incomeStatement[0].eps || 0;
        const industryPE = 20; // P/E moyen du secteur (à ajuster)
        peValue = eps * industryPE;
    }

    // Méthode 3: P/B Multiple
    let pbValue = null;
    if (balanceSheet && balanceSheet.length > 0 && keyMetrics && keyMetrics.length > 0) {
        const bookValuePerShare = keyMetrics[0].bookValuePerShare || 0;
        const industryPB = 3; // P/B moyen du secteur (à ajuster)
        pbValue = bookValuePerShare * industryPB;
    }

    // Moyenne pondérée des méthodes
    const values = [dcfValue, peValue, pbValue].filter(v => v !== null && v > 0);
    const fairValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

    // Calcul de la marge de sécurité
    const marginOfSafety = fairValue && currentPrice ?
        ((fairValue - currentPrice) / fairValue) * 100 : null;

    return {
        dcfValue,
        peValue,
        pbValue,
        fairValue,
        currentPrice,
        marginOfSafety,
        recommendation: marginOfSafety > 20 ? 'Strong Buy' :
            marginOfSafety > 10 ? 'Buy' :
                marginOfSafety > -10 ? 'Hold' :
                    marginOfSafety > -20 ? 'Sell' : 'Strong Sell'
    };
}

/**
 * Calculate average growth rate
 */
function calculateAverageGrowth(values) {
    if (!values || values.length < 2) return 0;

    const validValues = values.filter(v => v > 0);
    if (validValues.length < 2) return 0;

    let totalGrowth = 0;
    let count = 0;

    for (let i = 1; i < validValues.length; i++) {
        const growth = (validValues[i - 1] - validValues[i]) / Math.abs(validValues[i]);
        totalGrowth += growth;
        count++;
    }

    return count > 0 ? totalGrowth / count : 0;
}

/**
 * Generate AI Insights using Gemini
 */
async function generateAIInsights(symbol, financialData) {
    try {
        const { incomeStatement, balanceSheet, cashFlow, keyMetrics } = financialData;

        // Préparer le contexte pour Gemini
        const context = `
Analyse financière pour ${symbol}:

Revenus (5 ans): ${incomeStatement?.slice(0, 5).map(is => `${is.date}: $${(is.revenue / 1e9).toFixed(2)}B`).join(', ')}
Bénéfice net (5 ans): ${incomeStatement?.slice(0, 5).map(is => `${is.date}: $${(is.netIncome / 1e9).toFixed(2)}B`).join(', ')}
Marge nette: ${incomeStatement?.[0] ? ((incomeStatement[0].netIncome / incomeStatement[0].revenue) * 100).toFixed(1) : 'N/A'}%
ROE: ${keyMetrics?.[0]?.roe ? (keyMetrics[0].roe * 100).toFixed(1) : 'N/A'}%
Ratio D/E: ${keyMetrics?.[0]?.debtToEquity?.toFixed(2) || 'N/A'}
Free Cash Flow: $${cashFlow?.[0] ? (cashFlow[0].freeCashFlow / 1e9).toFixed(2) : 'N/A'}B

Fournis une analyse concise (max 150 mots) couvrant:
1. Forces principales (2-3 points)
2. Faiblesses/risques (2-3 points)
3. Tendances clés observées
4. Perspective d'investissement
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: context }] }]
                })
            }
        );

        const data = await response.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analyse non disponible';

        return {
            success: true,
            analysis,
            strengths: extractBulletPoints(analysis, 'Forces'),
            weaknesses: extractBulletPoints(analysis, 'Faiblesses'),
            trends: extractBulletPoints(analysis, 'Tendances'),
            outlook: extractBulletPoints(analysis, 'Perspective')
        };
    } catch (error) {
        console.error('Error generating AI insights:', error);
        return {
            success: false,
            error: error.message,
            analysis: 'Analyse IA temporairement indisponible'
        };
    }
}

/**
 * Extract bullet points from AI analysis
 */
function extractBulletPoints(text, section) {
    const lines = text.split('\n');
    const points = [];
    let inSection = false;

    for (const line of lines) {
        if (line.toLowerCase().includes(section.toLowerCase())) {
            inSection = true;
            continue;
        }
        if (inSection && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
            points.push(line.replace(/^[-•\d.]\s*/, '').trim());
        }
        if (inSection && line.trim() === '') {
            break;
        }
    }

    return points.slice(0, 3); // Max 3 points
}

/**
 * Fetch all financial data for analysis
 */
async function fetchCompleteAnalysis(symbol, currentPrice) {
    console.log(`📊 Fetching complete analysis for ${symbol}...`);

    const [
        incomeResult,
        balanceResult,
        cashFlowResult,
        metricsResult,
        ratiosResult,
        dcfResult,
        peersResult
    ] = await Promise.allSettled([
        fetchIncomeStatement(symbol),
        fetchBalanceSheet(symbol),
        fetchCashFlowStatement(symbol),
        fetchKeyMetrics(symbol),
        fetchFinancialRatios(symbol),
        fetchDCFValuation(symbol),
        fetchCompanyPeers(symbol)
    ]);

    const financialData = {
        incomeStatement: incomeResult.status === 'fulfilled' && incomeResult.value.success ? incomeResult.value.data : [],
        balanceSheet: balanceResult.status === 'fulfilled' && balanceResult.value.success ? balanceResult.value.data : [],
        cashFlow: cashFlowResult.status === 'fulfilled' && cashFlowResult.value.success ? cashFlowResult.value.data : [],
        keyMetrics: metricsResult.status === 'fulfilled' && metricsResult.value.success ? metricsResult.value.data : [],
        ratios: ratiosResult.status === 'fulfilled' && ratiosResult.value.success ? ratiosResult.value.data : [],
        dcf: dcfResult.status === 'fulfilled' && dcfResult.value.success ? dcfResult.value.data : null,
        peers: peersResult.status === 'fulfilled' && peersResult.value.success ? peersResult.value.data : [],
        currentPrice
    };

    // Calculate fair value
    const valuation = calculateFairValue(financialData);

    // Generate AI insights
    const aiInsights = await generateAIInsights(symbol, financialData);

    return {
        ...financialData,
        valuation,
        aiInsights
    };
}

// Export functions
window.StockAnalysisAPI = {
    fetchIncomeStatement,
    fetchBalanceSheet,
    fetchCashFlowStatement,
    fetchKeyMetrics,
    fetchFinancialRatios,
    fetchDCFValuation,
    fetchCompanyPeers,
    calculateFairValue,
    generateAIInsights,
    fetchCompleteAnalysis
};
