/**
 * API Proxy pour récupérer les données complètes d'une compagnie
 * Utilise FMP pour: profile, key-metrics, prix historiques
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

    const { symbol } = req.query;

    if (!symbol || symbol.trim().length === 0) {
        return res.status(400).json({ error: 'Symbol parameter required' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;
    const FINNHUB_KEY = process.env.FINNHUB_API_KEY || process.env.FINNHUB_TOKEN;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    const cleanSymbol = symbol.toUpperCase();
    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

    try {
        // 1. Fetch Company Profile
        const profileRes = await fetch(`${FMP_BASE}/profile/${cleanSymbol}?apikey=${FMP_KEY}`);
        if (!profileRes.ok) throw new Error(`FMP Profile error: ${profileRes.statusText}`);
        const profileData = await profileRes.json();

        if (!profileData || profileData.length === 0) {
            return res.status(404).json({ error: `Symbol '${cleanSymbol}' not found` });
        }
        const profile = profileData[0];

        // 2. Fetch Key Metrics (Annual)
        const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${cleanSymbol}?period=annual&limit=10&apikey=${FMP_KEY}`);
        if (!metricsRes.ok) throw new Error(`FMP Metrics error: ${metricsRes.statusText}`);
        const metricsData = await metricsRes.json();

        // 3. Fetch Historical Prices for High/Low
        const priceRes = await fetch(`${FMP_BASE}/historical-price-full/${cleanSymbol}?serietype=line&timeseries=1825&apikey=${FMP_KEY}`);
        if (!priceRes.ok) throw new Error(`FMP Price error: ${priceRes.statusText}`);
        const priceData = await priceRes.json();

        // 4. Fetch Realtime Quote (Finnhub if available)
        let currentPrice = profile.price || 0;
        if (FINNHUB_KEY) {
            try {
                const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${FINNHUB_KEY}`);
                if (quoteRes.ok) {
                    const quoteData = await quoteRes.json();
                    if (quoteData.c) currentPrice = quoteData.c;
                }
            } catch (e) {
                console.warn('Finnhub quote fetch failed, using FMP price:', e.message);
            }
        }

        // 5. Process prices by year
        const pricesByYear = {};
        if (priceData.historical) {
            priceData.historical.forEach(day => {
                const year = new Date(day.date).getFullYear();
                if (!pricesByYear[year]) pricesByYear[year] = { high: 0, low: 999999 };

                const val = day.close;
                if (val > pricesByYear[year].high) pricesByYear[year].high = val;
                if (val < pricesByYear[year].low) pricesByYear[year].low = val;
            });
        }

        // 6. Map Metrics to AnnualData
        const annualData = metricsData.map(metric => {
            const year = new Date(metric.date).getFullYear();
            const priceStats = pricesByYear[year] || { high: 0, low: 0 };

            const high = priceStats.high > 0 ? priceStats.high : (metric.revenuePerShare * 20 || 0);
            const low = priceStats.low < 999999 && priceStats.low > 0 ? priceStats.low : (high * 0.5);

            const dps = metric.dividendPerShare !== undefined
                ? metric.dividendPerShare
                : (metric.netIncomePerShare * (metric.payoutRatio || 0));

            return {
                year: year,
                priceHigh: parseFloat(high.toFixed(2)),
                priceLow: parseFloat(low.toFixed(2)),
                cashFlowPerShare: parseFloat((metric.operatingCashFlowPerShare || 0).toFixed(2)),
                dividendPerShare: parseFloat((dps || 0).toFixed(2)),
                bookValuePerShare: parseFloat((metric.bookValuePerShare || 0).toFixed(2)),
                earningsPerShare: parseFloat((metric.netIncomePerShare || 0).toFixed(2)),
                isEstimate: false
            };
        }).sort((a, b) => a.year - b.year);

        // 7. Info Object
        const mappedInfo = {
            name: profile.companyName,
            sector: profile.sector,
            marketCap: (profile.mktCap / 1000000000).toFixed(1) + 'B',
        };

        return res.status(200).json({
            data: annualData.slice(-6), // Keep last 6 years
            info: mappedInfo,
            currentPrice: parseFloat(currentPrice.toFixed(2))
        });

    } catch (error) {
        console.error('Company data fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch company data',
            message: error.message
        });
    }
}
