/**
 * Stock Analysis API Integration Layer - FIXED VERSION
 * Now uses backend /api/ endpoints instead of direct FMP calls
 * This fixes the "apikey=undefined" and "YOUR_FMP_KEY" errors
 */

// ============================================================================
// CONFIGURATION - Using backend API endpoints
// ============================================================================
const API_BASE_URL = window.location.origin || '';

async function fetchJSONWithFallback(primaryUrl, fallbackUrl) {
    try {
        const res = await fetch(primaryUrl);
        if (res.ok) {
            return res.json();
        }
        throw new Error(`Primary failed ${res.status}`);
    } catch (err) {
        if (!fallbackUrl) throw err;
        try {
            const res2 = await fetch(fallbackUrl);
            if (res2.ok) return res2.json();
            throw new Error(`Fallback failed ${res2.status}`);
        } catch (err2) {
            console.error('Fallback error:', err2);
            throw err2;
        }
    }
}

/**
 * Fetch Income Statement (5 years)
 */
async function fetchIncomeStatement(symbol, years = 5) {
    try {
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=income-statement&symbol=${symbol}&period=annual&limit=${years}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=income-statement/${symbol}&params=period=annual&limit=${years}`
        );
        return { success: true, data: data.data || data };
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
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=balance-sheet-statement&symbol=${symbol}&period=annual&limit=${years}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=balance-sheet-statement/${symbol}&params=period=annual&limit=${years}`
        );
        return { success: true, data: data.data || data };
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
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=cash-flow-statement&symbol=${symbol}&period=annual&limit=${years}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=cash-flow-statement/${symbol}&params=period=annual&limit=${years}`
        );
        return { success: true, data: data.data || data };
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
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=key-metrics&symbol=${symbol}&period=annual&limit=${years}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=key-metrics/${symbol}&params=period=annual&limit=${years}`
        );
        return { success: true, data: data.data || data };
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
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=ratios&symbol=${symbol}&period=annual&limit=${years}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=ratios/${symbol}&params=period=annual&limit=${years}`
        );
        return { success: true, data: data.data || data };
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
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=discounted-cash-flow&symbol=${symbol}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=discounted-cash-flow/${symbol}`
        );
        return { success: true, data: data.data?.[0] || data[0] || data };
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
        const data = await fetchJSONWithFallback(
            `${API_BASE_URL}/api/fmp?endpoint=stock_peers&symbol=${symbol}`,
            `${API_BASE_URL}/api/fmp-proxy?endpoint=stock_peers&params=symbol=${symbol}`
        );
        return { success: true, data: data.data?.[0]?.peersList || data[0]?.peersList || [] };
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
        currentPrice,
        dcfData
    } = financialData;

    const {
        discountRate = 0.10, // 10% WACC par défaut
        terminalGrowthRate = 0.03, // 3% croissance perpétuelle
        projectionYears = 5
    } = assumptions;

    // Ensure arrays exist and have data
    const incomeStatementArray = Array.isArray(incomeStatement) ? incomeStatement : [];
    const balanceSheetArray = Array.isArray(balanceSheet) ? balanceSheet : [];
    const cashFlowArray = Array.isArray(cashFlow) ? cashFlow : [];
    const keyMetricsArray = Array.isArray(keyMetrics) ? keyMetrics : [];

    // Méthode 1: DCF (Discounted Cash Flow)
    let dcfValue = dcfData?.dcf || dcfData?.dcfValue || dcfData?.value || null;
    if (!dcfValue && cashFlowArray.length > 0) {
        const latestFCF = cashFlowArray[0].freeCashFlow || 0;
        const avgGrowth = calculateAverageGrowth(cashFlowArray.map(cf => cf.freeCashFlow));

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
        const netDebt = (balanceSheetArray[0]?.totalDebt || 0) - (balanceSheetArray[0]?.cashAndCashEquivalents || 0);
        const equityValue = enterpriseValue - netDebt;
        const sharesOutstanding = keyMetricsArray[0]?.numberOfShares || 1;

        dcfValue = equityValue / sharesOutstanding;
    }

    // Méthode 2: P/E Multiple
    let peValue = null;
    const peFromRatios = keyMetricsArray[0]?.peRatio || keyMetricsArray[0]?.pe || null;
    if (incomeStatementArray.length > 0 && keyMetricsArray.length > 0) {
        const eps = incomeStatementArray[0].eps || incomeStatementArray[0].epsdiluted || 0;
        const industryPE = 20; // P/E moyen du secteur (à ajuster)
        peValue = eps * industryPE;
    } else if (peFromRatios && currentPrice) {
        const eps = peFromRatios > 0 ? currentPrice / peFromRatios : 0;
        const industryPE = 20;
        peValue = eps * industryPE;
    }

    // Méthode 3: P/B Multiple
    let pbValue = null;
    if (balanceSheetArray.length > 0 && keyMetricsArray.length > 0) {
        const bookValuePerShare = keyMetricsArray[0].bookValuePerShare || 0;
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
 * Generate AI Insights using backend AI service
 */
async function generateAIInsights(symbol, financialData) {
    try {
        const { incomeStatement, balanceSheet, cashFlow, keyMetrics } = financialData;

        // Ensure arrays
        const incomeStatementArray = Array.isArray(incomeStatement) ? incomeStatement : [];
        const cashFlowArray = Array.isArray(cashFlow) ? cashFlow : [];
        const keyMetricsArray = Array.isArray(keyMetrics) ? keyMetrics : [];

        // Préparer le contexte pour l'IA
        const context = `
Analyse financière pour ${symbol}:

Revenus (5 ans): ${incomeStatementArray.slice(0, 5).map(is => `${is.date}: $${(is.revenue / 1e9).toFixed(2)}B`).join(', ')}
Bénéfice net (5 ans): ${incomeStatementArray.slice(0, 5).map(is => `${is.date}: $${(is.netIncome / 1e9).toFixed(2)}B`).join(', ')}
Marge nette: ${incomeStatementArray[0] ? ((incomeStatementArray[0].netIncome / incomeStatementArray[0].revenue) * 100).toFixed(1) : 'N/A'}%
ROE: ${keyMetricsArray[0]?.roe ? (keyMetricsArray[0].roe * 100).toFixed(1) : 'N/A'}%
Ratio D/E: ${keyMetricsArray[0]?.debtToEquity?.toFixed(2) || 'N/A'}
Free Cash Flow: $${cashFlowArray[0] ? (cashFlowArray[0].freeCashFlow / 1e9).toFixed(2) : 'N/A'}B

Fournis une analyse concise (max 150 mots) couvrant:
1. Forces principales (2-3 points)
2. Faiblesses/risques (2-3 points)
3. Tendances clés observées
4. Perspective d'investissement
`;

        // Use backend AI service
        const response = await fetch(`${API_BASE_URL}/api/ai-services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: 'openai',
                prompt: context,
                max_tokens: 500
            })
        });

        const data = await response.json();
        const analysis = data.choices?.[0]?.message?.content || 'Analyse non disponible';

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

        if (inSection) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
                points.push(trimmed.replace(/^[-•\d.]\s*/, ''));
            } else if (trimmed === '' || trimmed.match(/^\d+\./)) {
                inSection = false;
            }
        }

        if (points.length >= 3) break;
    }

    return points.length > 0 ? points : [`${section} à analyser`];
}

/**
 * Fetch complete analysis data for a symbol
 */
async function fetchCompleteAnalysis(symbol) {
    try {
        // Use batch API for efficiency
        const batchResponse = await fetch(
            `${API_BASE_URL}/api/marketdata/batch?symbols=${symbol}&endpoints=quote,fundamentals`
        );
        const batchData = await batchResponse.json();

        const quote = batchData.data?.quote?.[symbol] || {};
        const fundamentals = batchData.data?.fundamentals?.[symbol] || {};

        // Fetch detailed financial statements
        const [
            incomeStatementRes,
            balanceSheetRes,
            cashFlowRes,
            keyMetricsRes,
            ratiosRes,
            dcfRes,
            peersRes
        ] = await Promise.allSettled([
            fetchIncomeStatement(symbol),
            fetchBalanceSheet(symbol),
            fetchCashFlowStatement(symbol),
            fetchKeyMetrics(symbol),
            fetchFinancialRatios(symbol),
            fetchDCFValuation(symbol),
            fetchCompanyPeers(symbol)
        ]);

        const incomeStatement = incomeStatementRes.status === 'fulfilled' ? incomeStatementRes.value.data : [];
        const balanceSheet = balanceSheetRes.status === 'fulfilled' ? balanceSheetRes.value.data : [];
        const cashFlow = cashFlowRes.status === 'fulfilled' ? cashFlowRes.value.data : [];
        const keyMetrics = keyMetricsRes.status === 'fulfilled' ? keyMetricsRes.value.data : [];
        const ratios = ratiosRes.status === 'fulfilled' ? ratiosRes.value.data : [];
        const dcf = dcfRes.status === 'fulfilled' ? dcfRes.value.data : null;
        const peers = peersRes.status === 'fulfilled' ? peersRes.value.data : [];

        const currentPrice = quote.c || quote.price || fundamentals.quote?.price || 0;

        // Calculate fair value
        const valuation = calculateFairValue({
            incomeStatement,
            balanceSheet,
            cashFlow,
            keyMetrics,
            currentPrice,
            dcfData: dcf
        });

        // Generate AI insights
        const aiInsights = await generateAIInsights(symbol, {
            incomeStatement,
            balanceSheet,
            cashFlow,
            keyMetrics
        });

        return {
            success: true,
            symbol,
            currentPrice,
            quote,
            fundamentals,
            incomeStatement,
            balanceSheet,
            cashFlow,
            keyMetrics,
            ratios,
            dcf,
            peers,
            valuation,
            aiInsights
        };

    } catch (error) {
        console.error('Error in fetchCompleteAnalysis:', error);
        return {
            success: false,
            error: error.message,
            symbol
        };
    }
}

// Expose functions globally (compatibility with legacy window.StockAnalysisAPI)
const stockAnalysisExports = {
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

window.stockAnalysisAPI = stockAnalysisExports;
window.StockAnalysisAPI = stockAnalysisExports;
