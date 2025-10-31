/**
 * Batch Market Data API - Optimized for multiple symbols
 * Reduces API costs by fetching multiple stocks in a single request
 * Includes caching and fallback mechanisms
 */

// Simple in-memory cache (expires after 60 seconds for real-time data)
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const FMP_API_KEY = process.env.FMP_API_KEY;

        if (!FMP_API_KEY) {
            return res.status(503).json({
                error: 'FMP_API_KEY not configured',
                fallback: true
            });
        }

        // Get symbols from query or body
        let symbols;
        if (req.method === 'POST' && req.body) {
            symbols = req.body.symbols;
        } else {
            symbols = req.query.symbols;
        }

        if (!symbols) {
            return res.status(400).json({
                error: 'Missing symbols parameter',
                example: '/api/batch-market-data?symbols=AAPL,MSFT,GOOGL'
            });
        }

        // Parse symbols (can be comma-separated string or array)
        const symbolArray = Array.isArray(symbols)
            ? symbols
            : symbols.split(',').map(s => s.trim().toUpperCase());

        // Validate symbol count (FMP allows up to 100 per request)
        if (symbolArray.length > 100) {
            return res.status(400).json({
                error: 'Too many symbols',
                message: 'Maximum 100 symbols per request',
                received: symbolArray.length
            });
        }

        // Check cache first
        const cacheKey = symbolArray.sort().join(',');
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`✅ Cache HIT for ${symbolArray.length} symbols`);
            return res.status(200).json({
                ...cached.data,
                cached: true,
                cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
            });
        }

        console.log(`🔄 Fetching batch data for ${symbolArray.length} symbols: ${symbolArray.join(', ')}`);

        // Batch fetch from FMP
        const symbolsParam = symbolArray.join(',');
        const fmpUrl = `https://financialmodelingprep.com/stable/quote?symbol=${symbolsParam}&apikey=${FMP_API_KEY}`;

        const startTime = Date.now();
        const response = await fetch(fmpUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GOB-Financial-Dashboard/1.0',
                'Accept-Encoding': 'gzip, deflate'
            }
        });

        const fetchTime = Date.now() - startTime;

        if (!response.ok) {
            throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Process and structure the data
        const quotes = {};
        const enrichedData = [];

        data.forEach(quote => {
            const symbol = quote.symbol;

            // Calculate metrics
            const change = quote.change || 0;
            const changePercent = quote.changesPercentage || 0;
            const volume = quote.volume || 0;
            const avgVolume = quote.avgVolume || volume;
            const volumeRatio = avgVolume > 0 ? (volume / avgVolume) : 1;

            // Enrich with calculated fields
            const enriched = {
                symbol,
                name: quote.name || symbol,
                price: quote.price || 0,
                change,
                changePercent,
                volume,
                avgVolume,
                volumeRatio,
                marketCap: quote.marketCap || 0,
                pe: quote.pe || null,
                dayLow: quote.dayLow || 0,
                dayHigh: quote.dayHigh || 0,
                yearLow: quote.yearLow || 0,
                yearHigh: quote.yearHigh || 0,
                open: quote.open || 0,
                previousClose: quote.previousClose || 0,
                timestamp: quote.timestamp || Date.now() / 1000,
                exchange: quote.exchange || 'NASDAQ',
                // Visual indicators
                trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
                volumeStrength: volumeRatio > 1.5 ? 'high' : volumeRatio < 0.5 ? 'low' : 'normal',
                // Performance metrics
                dayRange: quote.dayHigh && quote.dayLow ? {
                    low: quote.dayLow,
                    high: quote.dayHigh,
                    current: quote.price,
                    percentage: ((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow) * 100).toFixed(1)
                } : null,
                yearRange: quote.yearHigh && quote.yearLow ? {
                    low: quote.yearLow,
                    high: quote.yearHigh,
                    current: quote.price,
                    percentage: ((quote.price - quote.yearLow) / (quote.yearHigh - quote.yearLow) * 100).toFixed(1)
                } : null
            };

            quotes[symbol] = enriched;
            enrichedData.push(enriched);
        });

        // Calculate aggregate statistics
        const stats = {
            total: enrichedData.length,
            gainers: enrichedData.filter(q => q.changePercent > 0).length,
            losers: enrichedData.filter(q => q.changePercent < 0).length,
            neutral: enrichedData.filter(q => q.changePercent === 0).length,
            avgChange: enrichedData.length > 0
                ? (enrichedData.reduce((sum, q) => sum + q.changePercent, 0) / enrichedData.length).toFixed(2)
                : 0,
            totalVolume: enrichedData.reduce((sum, q) => sum + q.volume, 0),
            highestGainer: enrichedData.reduce((max, q) => q.changePercent > max.changePercent ? q : max, enrichedData[0] || {}),
            highestLoser: enrichedData.reduce((min, q) => q.changePercent < min.changePercent ? q : min, enrichedData[0] || {})
        };

        const result = {
            success: true,
            symbols: symbolArray,
            count: enrichedData.length,
            quotes,
            data: enrichedData,
            stats,
            source: 'fmp',
            fetchTime,
            cached: false,
            timestamp: new Date().toISOString()
        };

        // Cache the result
        cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        // Cleanup old cache entries (keep max 50 entries)
        if (cache.size > 50) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
        }

        console.log(`✅ Batch fetch complete: ${enrichedData.length}/${symbolArray.length} symbols in ${fetchTime}ms`);

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Batch Market Data Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Batch fetch failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
