/**
 * API pour récupérer les données fondamentales historiques
 * Utilisé par l'onglet FastGraph Analysis
 * Données sources: FMP (Financial Modeling Prep)
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol, type } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol parameter required' });
    }

    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (!FMP_API_KEY) {
        return res.status(503).json({ error: 'FMP API key not configured' });
    }

    try {
        const data = {};
        const baseUrl = 'https://financialmodelingprep.com/api/v3';

        // Type de données à récupérer (all par défaut)
        const dataTypes = type ? [type] : ['all'];
        const shouldFetchAll = dataTypes.includes('all');

        // 1. Historical Price Data (pour le graphique principal)
        if (shouldFetchAll || dataTypes.includes('price')) {
            const priceUrl = `${baseUrl}/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`;
            const priceRes = await fetch(priceUrl);
            const priceData = await priceRes.json();
            data.historicalPrice = priceData.historical || [];
        }

        // 2. Income Statements (revenus, bénéfices, EPS)
        if (shouldFetchAll || dataTypes.includes('income')) {
            const incomeUrl = `${baseUrl}/income-statement/${symbol}?limit=40&apikey=${FMP_API_KEY}`;
            const incomeRes = await fetch(incomeUrl);
            const incomeData = await incomeRes.json();
            data.incomeStatements = incomeData || [];
        }

        // 3. Balance Sheets (actifs, dettes, equity)
        if (shouldFetchAll || dataTypes.includes('balance')) {
            const balanceUrl = `${baseUrl}/balance-sheet-statement/${symbol}?limit=40&apikey=${FMP_API_KEY}`;
            const balanceRes = await fetch(balanceUrl);
            const balanceData = await balanceRes.json();
            data.balanceSheets = balanceData || [];
        }

        // 4. Cash Flow Statements
        if (shouldFetchAll || dataTypes.includes('cashflow')) {
            const cashflowUrl = `${baseUrl}/cash-flow-statement/${symbol}?limit=40&apikey=${FMP_API_KEY}`;
            const cashflowRes = await fetch(cashflowUrl);
            const cashflowData = await cashflowRes.json();
            data.cashFlowStatements = cashflowData || [];
        }

        // 5. Key Metrics (P/E, P/B, ROE, etc.)
        if (shouldFetchAll || dataTypes.includes('metrics')) {
            const metricsUrl = `${baseUrl}/key-metrics/${symbol}?limit=40&apikey=${FMP_API_KEY}`;
            const metricsRes = await fetch(metricsUrl);
            const metricsData = await metricsRes.json();
            data.keyMetrics = metricsData || [];
        }

        // 6. Financial Ratios (P/E ratio historique, etc.)
        if (shouldFetchAll || dataTypes.includes('ratios')) {
            const ratiosUrl = `${baseUrl}/ratios/${symbol}?limit=40&apikey=${FMP_API_KEY}`;
            const ratiosRes = await fetch(ratiosUrl);
            const ratiosData = await ratiosRes.json();
            data.financialRatios = ratiosData || [];
        }

        // 7. Dividend History
        if (shouldFetchAll || dataTypes.includes('dividends')) {
            const dividendUrl = `${baseUrl}/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`;
            const dividendRes = await fetch(dividendUrl);
            const dividendData = await dividendRes.json();
            data.dividendHistory = dividendData.historical || [];
        }

        // 8. Enterprise Value (EV, Market Cap historique)
        if (shouldFetchAll || dataTypes.includes('enterprise')) {
            const evUrl = `${baseUrl}/enterprise-values/${symbol}?limit=40&apikey=${FMP_API_KEY}`;
            const evRes = await fetch(evUrl);
            const evData = await evRes.json();
            data.enterpriseValues = evData || [];
        }

        // 9. Financial Growth (croissance YoY)
        if (shouldFetchAll || dataTypes.includes('growth')) {
            const growthUrl = `${baseUrl}/financial-growth/${symbol}?limit=20&apikey=${FMP_API_KEY}`;
            const growthRes = await fetch(growthUrl);
            const growthData = await growthRes.json();
            data.financialGrowth = growthData || [];
        }

        // 10. Company Profile (info de base)
        if (shouldFetchAll || dataTypes.includes('profile')) {
            const profileUrl = `${baseUrl}/profile/${symbol}?apikey=${FMP_API_KEY}`;
            const profileRes = await fetch(profileUrl);
            const profileData = await profileRes.json();
            data.profile = profileData[0] || {};
        }

        // Calculer des métriques dérivées pour FAST Graphs style
        if (shouldFetchAll) {
            data.computed = computeFastGraphMetrics(data);
        }

        return res.status(200).json({
            success: true,
            symbol,
            timestamp: new Date().toISOString(),
            data
        });

    } catch (error) {
        console.error('Error fetching fundamental data:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Calcule des métriques style FAST Graphs
 */
function computeFastGraphMetrics(data) {
    const computed = {};

    try {
        // Price vs Fair Value (basé sur P/E moyen)
        if (data.financialRatios && data.historicalPrice) {
            const avgPE = calculateAveragePE(data.financialRatios);
            computed.fairValue = data.incomeStatements?.map(stmt => ({
                date: stmt.date,
                fairValue: stmt.eps * avgPE,
                eps: stmt.eps
            })) || [];
        }

        // Dividend Growth Rate
        if (data.dividendHistory && data.dividendHistory.length > 1) {
            const dividends = data.dividendHistory.sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );
            const years = dividends.length;
            const latestDiv = dividends[dividends.length - 1]?.dividend || 0;
            const oldestDiv = dividends[0]?.dividend || 0;
            computed.dividendCAGR = years > 1 && oldestDiv > 0
                ? Math.pow(latestDiv / oldestDiv, 1 / years) - 1
                : 0;
        }

        // Earnings Growth Rate (CAGR)
        if (data.incomeStatements && data.incomeStatements.length > 1) {
            const statements = data.incomeStatements.sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );
            const years = statements.length;
            const latestEPS = statements[statements.length - 1]?.eps || 0;
            const oldestEPS = statements[0]?.eps || 0;
            computed.earningsCAGR = years > 1 && oldestEPS > 0
                ? Math.pow(latestEPS / oldestEPS, 1 / years) - 1
                : 0;
        }

        // Revenue Growth Rate
        if (data.incomeStatements && data.incomeStatements.length > 1) {
            const statements = data.incomeStatements.sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );
            const years = statements.length;
            const latestRev = statements[statements.length - 1]?.revenue || 0;
            const oldestRev = statements[0]?.revenue || 0;
            computed.revenueCAGR = years > 1 && oldestRev > 0
                ? Math.pow(latestRev / oldestRev, 1 / years) - 1
                : 0;
        }

        // Free Cash Flow Trend
        if (data.cashFlowStatements) {
            computed.fcfTrend = data.cashFlowStatements.map(stmt => ({
                date: stmt.date,
                fcf: stmt.freeCashFlow,
                fcfPerShare: stmt.freeCashFlow / (data.profile?.mktCap / data.profile?.price || 1)
            }));
        }

        // Valuation Metrics Over Time
        if (data.keyMetrics) {
            computed.valuationHistory = data.keyMetrics.map(m => ({
                date: m.date,
                peRatio: m.peRatio,
                pbRatio: m.pbRatio,
                pfcfRatio: m.pfcfRatio,
                evToEbitda: m.enterpriseValueOverEBITDA,
                roe: m.roe,
                roic: m.roic
            }));
        }

    } catch (error) {
        console.error('Error computing metrics:', error);
    }

    return computed;
}

/**
 * Calcule le P/E moyen sur les 5 dernières années
 */
function calculateAveragePE(ratios) {
    if (!ratios || ratios.length === 0) return 15; // P/E par défaut

    const validPEs = ratios
        .slice(0, 20) // 5 ans de données trimestrielles
        .map(r => r.priceEarningsRatio)
        .filter(pe => pe && pe > 0 && pe < 100); // Filtrer les valeurs aberrantes

    if (validPEs.length === 0) return 15;

    return validPEs.reduce((sum, pe) => sum + pe, 0) / validPEs.length;
}
