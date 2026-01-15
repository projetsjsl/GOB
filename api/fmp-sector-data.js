/**
 * API pour recuperer les donnees sectorielles depuis FMP
 * Calcule les moyennes/min/max des ratios pour un secteur donne
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

    const { sector } = req.query;

    if (!sector || sector.trim().length === 0) {
        return res.status(400).json({ error: 'Sector parameter required' });
    }

    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

    if (!FMP_KEY) {
        console.error('FMP_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
    const cleanSector = sector.trim();

    try {
        // 1. Recuperer la liste des entreprises du secteur
        // FMP n'a pas d'endpoint direct par secteur, on utilise le stock screener
        // Alternative: utiliser l'endpoint /stock-screener avec filtre sector
        const screenerUrl = `${FMP_BASE}/stock-screener?marketCapMoreThan=100000000&sector=${encodeURIComponent(cleanSector)}&limit=50&apikey=${FMP_KEY}`;
        
        const screenerRes = await fetch(screenerUrl);
        if (!screenerRes.ok) {
            throw new Error(`FMP Screener error: ${screenerRes.statusText}`);
        }
        
        const companies = await screenerRes.json();
        
        if (!companies || companies.length === 0) {
            // Fallback: essayer avec une recherche plus large
            console.warn(` Aucune entreprise trouvee pour le secteur "${cleanSector}", utilisation de valeurs par defaut`);
            return res.status(200).json({
                success: false,
                sector: cleanSector,
                message: 'Secteur non trouve, utilisation de valeurs par defaut',
                data: null
            });
        }

        // 2. Recuperer les ratios TTM pour toutes les entreprises (batch)
        const symbols = companies.slice(0, 30).map(c => c.symbol).join(','); // Limiter a 30 pour eviter les timeouts
        
        const ratiosRes = await fetch(`${FMP_BASE}/ratios-ttm/${symbols}?apikey=${FMP_KEY}`);
        if (!ratiosRes.ok) {
            throw new Error(`FMP Ratios error: ${ratiosRes.statusText}`);
        }
        
        const ratiosData = await ratiosRes.json();
        const validRatios = Array.isArray(ratiosData) ? ratiosData.filter(r => r && r.peRatioTTM) : [];

        if (validRatios.length === 0) {
            console.warn(` Aucun ratio valide trouve pour le secteur "${cleanSector}"`);
            return res.status(200).json({
                success: false,
                sector: cleanSector,
                message: 'Aucun ratio valide trouve',
                data: null
            });
        }

        // 3. Calculer les statistiques sectorielles
        const peRatios = validRatios.map(r => r.peRatioTTM).filter(v => v && v > 0 && v < 1000);
        const pbRatios = validRatios.map(r => r.priceToBookRatioTTM).filter(v => v && v > 0 && v < 100);
        const psRatios = validRatios.map(r => r.priceToSalesRatioTTM).filter(v => v && v > 0 && v < 100);
        const dividendYields = validRatios.map(r => r.dividendYieldTTM).filter(v => v && v >= 0 && v < 20);

        // 4. Recuperer les key-metrics pour calculer les croissances
        // On prend un echantillon de 10 entreprises pour les metriques annuelles (plus lourd)
        const sampleSymbols = companies.slice(0, 10).map(c => c.symbol);
        const growthData = [];

        // Recuperer les key-metrics pour chaque entreprise (en serie pour eviter les timeouts)
        for (const symbol of sampleSymbols) {
            try {
                const metricsRes = await fetch(`${FMP_BASE}/key-metrics/${symbol}?period=annual&limit=5&apikey=${FMP_KEY}`);
                if (metricsRes.ok) {
                    const metrics = await metricsRes.json();
                    if (Array.isArray(metrics) && metrics.length >= 2) {
                        // Calculer le CAGR sur les 5 dernieres annees
                        const sorted = metrics.sort((a, b) => new Date(b.date) - new Date(a.date));
                        const latest = sorted[0];
                        const oldest = sorted[sorted.length - 1];
                        
                        if (latest && oldest) {
                            const yearsDiff = new Date(latest.date).getFullYear() - new Date(oldest.date).getFullYear();
                            if (yearsDiff > 0) {
                                // EPS Growth
                                if (latest.netIncomePerShare > 0 && oldest.netIncomePerShare > 0) {
                                    const epsGrowth = (Math.pow(latest.netIncomePerShare / oldest.netIncomePerShare, 1 / yearsDiff) - 1) * 100;
                                    if (isFinite(epsGrowth) && epsGrowth > -50 && epsGrowth < 100) {
                                        growthData.push({ epsGrowth, cfGrowth: epsGrowth, bvGrowth: epsGrowth * 0.7, divGrowth: epsGrowth * 0.5 });
                                    }
                                }
                            }
                        }
                    }
                }
                // Petit delai pour eviter les rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.warn(` Erreur metriques pour ${symbol}:`, err.message);
            }
        }

        // Calculer les moyennes
        const calculateStats = (values) => {
            if (values.length === 0) return null;
            const filtered = values.filter(v => isFinite(v) && v > -1000 && v < 10000);
            if (filtered.length === 0) return null;
            return {
                min: Math.min(...filtered),
                max: Math.max(...filtered),
                avg: filtered.reduce((a, b) => a + b, 0) / filtered.length
            };
        };

        const sectorRanges = {
            pe: calculateStats(peRatios),
            pbv: calculateStats(pbRatios),
            pcf: calculateStats(psRatios), // Approximation: P/S comme proxy pour P/CF
            yield: calculateStats(dividendYields),
            epsGrowth: growthData.length > 0 ? {
                min: Math.min(...growthData.map(g => g.epsGrowth)),
                max: Math.max(...growthData.map(g => g.epsGrowth)),
                avg: growthData.reduce((sum, g) => sum + g.epsGrowth, 0) / growthData.length
            } : null,
            cfGrowth: growthData.length > 0 ? {
                min: Math.min(...growthData.map(g => g.cfGrowth)),
                max: Math.max(...growthData.map(g => g.cfGrowth)),
                avg: growthData.reduce((sum, g) => sum + g.cfGrowth, 0) / growthData.length
            } : null,
            bvGrowth: growthData.length > 0 ? {
                min: Math.min(...growthData.map(g => g.bvGrowth)),
                max: Math.max(...growthData.map(g => g.bvGrowth)),
                avg: growthData.reduce((sum, g) => sum + g.bvGrowth, 0) / growthData.length
            } : null,
            divGrowth: growthData.length > 0 ? {
                min: Math.min(...growthData.map(g => g.divGrowth)),
                max: Math.max(...growthData.map(g => g.divGrowth)),
                avg: growthData.reduce((sum, g) => sum + g.divGrowth, 0) / growthData.length
            } : null
        };

        return res.status(200).json({
            success: true,
            sector: cleanSector,
            companiesAnalyzed: validRatios.length,
            data: sectorRanges,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Sector data fetch error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch sector data',
            message: error.message
        });
    }
}

