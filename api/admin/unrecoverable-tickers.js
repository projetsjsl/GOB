/**
 * API Endpoint pour identifier les tickers qui ne peuvent PAS être récupérés de FMP
 * même après tous les fallbacks et variantes de symboles
 * 
 * GET /api/admin/unrecoverable-tickers
 *   - Analyse tous les tickers actifs
 *   - Identifie ceux qui échouent définitivement (404, données invalides)
 *   - Retourne un rapport détaillé
 * 
 * Query params:
 *   - limit: nombre maximum de tickers à tester (default: 1000)
 *   - format: 'json' (default) ou 'csv'
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fmpApiKey = process.env.FMP_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
            success: false,
            error: 'Supabase configuration missing'
        });
    }

    if (!fmpApiKey) {
        return res.status(500).json({
            success: false,
            error: 'FMP_API_KEY not configured'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { limit = 1000, format = 'json' } = req.query;

    try {
        // 1. Charger les tickers actifs
        const { data: tickers, error: tickersError } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector, source')
            .eq('is_active', true)
            .order('ticker')
            .limit(parseInt(limit));

        if (tickersError) {
            throw new Error(`Erreur Supabase: ${tickersError.message}`);
        }

        if (!tickers || tickers.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun ticker actif trouvé',
                unrecoverable: [],
                recoverable: [],
                unknown: [],
                summary: {
                    total: 0,
                    unrecoverable: 0,
                    recoverable: 0,
                    unknown: 0
                }
            });
        }

        // 2. Construire l'URL de base pour l'API interne
        let apiBaseUrl = 'http://localhost:3000';
        if (req.headers.host) {
            const protocol = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https');
            apiBaseUrl = `${protocol}://${req.headers.host}`;
        } else if (process.env.VERCEL_URL) {
            apiBaseUrl = `https://${process.env.VERCEL_URL}`;
        }

        // 3. Tester chaque ticker
        const unrecoverable = [];
        const recoverable = [];
        const unknown = [];

        for (let i = 0; i < Math.min(tickers.length, parseInt(limit)); i++) {
            const ticker = tickers[i];
            const symbol = ticker.ticker.toUpperCase();

            try {
                // Appeler l'API fmp-company-data qui essaie tous les fallbacks
                const apiUrl = `${apiBaseUrl}/api/fmp-company-data?symbol=${encodeURIComponent(symbol)}`;
                const response = await fetch(apiUrl);

                // Si 404, le ticker n'existe pas dans FMP même après tous les fallbacks
                if (response.status === 404) {
                    const errorData = await response.json().catch(() => ({}));
                    unrecoverable.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        sector: ticker.sector,
                        source: ticker.source,
                        reason: '404 - Symbole introuvable dans FMP (tous fallbacks échoués)',
                        triedSymbols: errorData.tried || [symbol],
                        error: errorData.message || 'Not found'
                    });
                    continue;
                }

                // Si autre erreur HTTP, c'est peut-être récupérable (rate limit, etc.)
                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    unknown.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        sector: ticker.sector,
                        source: ticker.source,
                        reason: `HTTP ${response.status}`,
                        error: errorText.substring(0, 200)
                    });
                    continue;
                }

                // Si succès, vérifier que les données sont valides
                const data = await response.json();

                if (data.error) {
                    unrecoverable.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        sector: ticker.sector,
                        source: ticker.source,
                        reason: 'Erreur API',
                        error: data.error
                    });
                    continue;
                }

                // Vérifier que les données sont complètes
                const hasValidData = data.data && Array.isArray(data.data) && data.data.length > 0;
                const hasValidPrice = data.currentPrice && data.currentPrice > 0;
                const hasValidInfo = data.info && data.info.name;

                if (!hasValidData || !hasValidPrice || !hasValidInfo) {
                    unrecoverable.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        sector: ticker.sector,
                        source: ticker.source,
                        reason: 'Données incomplètes ou invalides',
                        dataYears: data.data?.length || 0,
                        currentPrice: data.currentPrice || 0,
                        hasInfo: !!data.info
                    });
                    continue;
                }

                // Ticker récupérable avec succès
                recoverable.push({
                    ticker: symbol,
                    companyName: ticker.company_name,
                    sector: ticker.sector,
                    source: ticker.source,
                    dataYears: data.data.length,
                    currentPrice: data.currentPrice,
                    actualSymbol: data.info.actualSymbol || symbol
                });

            } catch (error) {
                unknown.push({
                    ticker: symbol,
                    companyName: ticker.company_name,
                    sector: ticker.sector,
                    source: ticker.source,
                    reason: 'Erreur réseau ou exception',
                    error: error.message
                });
            }

            // Délai pour éviter le rate limiting
            if (i < Math.min(tickers.length, parseInt(limit)) - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // 4. Générer le rapport
        const summary = {
            total: tickers.length,
            unrecoverable: unrecoverable.length,
            recoverable: recoverable.length,
            unknown: unknown.length,
            unrecoverablePercent: ((unrecoverable.length / tickers.length) * 100).toFixed(1),
            recoverablePercent: ((recoverable.length / tickers.length) * 100).toFixed(1)
        };

        // 5. Grouper les non récupérables par raison
        const unrecoverableByReason = {};
        unrecoverable.forEach(t => {
            const reason = t.reason || 'Raison inconnue';
            if (!unrecoverableByReason[reason]) {
                unrecoverableByReason[reason] = [];
            }
            unrecoverableByReason[reason].push(t);
        });

        // 6. Retourner selon le format demandé
        if (format === 'csv') {
            // Format CSV
            const csvLines = [
                'Ticker,Company Name,Sector,Source,Reason,Error,Tried Symbols'
            ];

            unrecoverable.forEach(t => {
                const csv = [
                    t.ticker,
                    `"${(t.companyName || '').replace(/"/g, '""')}"`,
                    t.sector || '',
                    t.source || '',
                    `"${(t.reason || '').replace(/"/g, '""')}"`,
                    `"${(t.error || '').replace(/"/g, '""')}"`,
                    t.triedSymbols ? t.triedSymbols.join(';') : ''
                ].join(',');
                csvLines.push(csv);
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="unrecoverable-tickers.csv"');
            return res.status(200).send(csvLines.join('\n'));
        }

        // Format JSON (default)
        return res.status(200).json({
            success: true,
            message: 'Analyse terminée',
            summary,
            unrecoverable,
            unrecoverableByReason,
            recoverable: recoverable.length, // Juste le count pour réduire la taille
            unknown: unknown.length, // Juste le count
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur admin/unrecoverable-tickers:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur inconnue'
        });
    }
}

