/**
 * API Endpoint pour synchroniser automatiquement les tickers 3p1 avec des valeurs N/A
 * 
 * GET /api/3p1-sync-na
 *   - Analyse tous les tickers et identifie ceux avec N/A
 *   - Retourne la liste des tickers a synchroniser
 * 
 * POST /api/3p1-sync-na
 *   - Synchronise automatiquement tous les tickers avec N/A
 *   - Retourne un rapport de synchronisation
 * 
 * Query params:
 *   - action: 'analyze' (default) ou 'sync'
 *   - limit: nombre maximum de tickers a traiter (default: 100)
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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
    const { action = 'analyze', limit = 100 } = req.query;

    try {
        // 1. Charger les tickers depuis Supabase
        const { data: tickers, error: tickersError } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector, source')
            .eq('is_active', true)
            .limit(parseInt(limit));

        if (tickersError) {
            throw new Error(`Erreur Supabase: ${tickersError.message}`);
        }

        if (!tickers || tickers.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun ticker trouve',
                naTickers: [],
                validTickers: [],
                errorTickers: []
            });
        }

        // 2. Pour chaque ticker, recuperer les donnees depuis FMP via l'API interne
        const naTickers = [];
        const validTickers = [];
        const errorTickers = [];

        // Utiliser l'API interne pour recuperer les donnees
        // Construire l'URL de base depuis la requete
        let apiBaseUrl = 'http://localhost:3000';
        if (req.headers.host) {
            const protocol = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https');
            apiBaseUrl = `${protocol}://${req.headers.host}`;
        } else if (process.env.VERCEL_URL) {
            apiBaseUrl = `https://${process.env.VERCEL_URL}`;
        }

        for (let i = 0; i < Math.min(tickers.length, limit); i++) {
            const ticker = tickers[i];
            const symbol = ticker.ticker.toUpperCase();

            try {
                // Appeler l'API fmp-company-data
                const apiUrl = `${apiBaseUrl}/api/fmp-company-data?symbol=${encodeURIComponent(symbol)}`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    if (response.status === 404) {
                        errorTickers.push({
                            ticker: symbol,
                            companyName: ticker.company_name,
                            reason: 'Symbole introuvable dans FMP'
                        });
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();

                // Verifier si le ticker a des valeurs N/A
                const hasNA = hasNAValues(result.data || [], result.info || {}, result.currentPrice || 0);

                if (hasNA) {
                    naTickers.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        sector: ticker.sector,
                        reason: 'JPEGY null ou donnees invalides',
                        dataYears: (result.data || []).length,
                        currentPrice: result.currentPrice || 0
                    });
                } else {
                    validTickers.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        dataYears: (result.data || []).length,
                        currentPrice: result.currentPrice || 0
                    });
                }

            } catch (error) {
                errorTickers.push({
                    ticker: symbol,
                    companyName: ticker.company_name,
                    reason: error.message || 'Erreur inconnue'
                });
            }

            // Attendre un peu entre les requetes pour eviter de surcharger
            if (i < Math.min(tickers.length, limit) - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 3. Si action = 'sync', declencher la synchronisation
        if (action === 'sync' && naTickers.length > 0) {
            // Note: La synchronisation reelle doit etre faite cote client
            // car les donnees sont stockees dans localStorage
            // On retourne juste la liste des tickers a synchroniser
            return res.status(200).json({
                success: true,
                message: `${naTickers.length} tickers avec N/A identifies`,
                action: 'sync',
                naTickers: naTickers.map(t => t.ticker),
                naTickersDetails: naTickers,
                validTickers: validTickers.length,
                errorTickers: errorTickers.length,
                totalAnalyzed: tickers.length
            });
        }

        // 5. Si action = 'validate', rechercher des corrections potentielles
        if (action === 'validate' && (naTickers.length > 0 || errorTickers.length > 0)) {
            const validationResults = [];
            const tickersToValidate = [...errorTickers, ...naTickers];
            
            console.log(` Validation de ${tickersToValidate.length} tickers problematiques...`);
            
            for (let i = 0; i < tickersToValidate.length; i++) {
                const problemTicker = tickersToValidate[i];
                const companyName = problemTicker.companyName;
                
                if (!companyName) continue;
                
                try {
                    // Recherche intelligente dans FMP
                    const searchUrl = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(companyName)}&limit=5&apikey=${fmpApiKey}`;
                    const searchResponse = await fetch(searchUrl);
                    const searchResults = await searchResponse.json();
                    
                    if (Array.isArray(searchResults) && searchResults.length > 0) {
                        // Trouver le meilleur match
                        const bestMatch = searchResults.find(r => 
                            r.name && r.name.toUpperCase() === companyName.toUpperCase() &&
                            r.currency === 'USD' // Prioriser USD souvent
                        ) || searchResults[0];
                        
                        if (bestMatch && bestMatch.symbol !== problemTicker.ticker) {
                            validationResults.push({
                                currentTicker: problemTicker.ticker,
                                suggestedTicker: bestMatch.symbol,
                                companyName: bestMatch.name,
                                exchange: bestMatch.exchangeShortName,
                                reason: 'Found better match via FMP Search',
                                confidence: 'High'
                            });
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to validate ${problemTicker.ticker}:`, err);
                }
                
                // Rate limiting
                if (i < tickersToValidate.length - 1) await new Promise(r => setTimeout(r, 200));
            }
            
            return res.status(200).json({
                success: true,
                message: 'Validation terminee',
                action: 'validate',
                validationResults,
                scannedCount: tickersToValidate.length
            });
        }

        // 4. Retourner l'analyse (par defaut)
        return res.status(200).json({
            success: true,
            message: 'Analyse terminee',
            action: 'analyze',
            totalTickers: tickers.length,
            naTickers: naTickers.map(t => t.ticker),
            naTickersDetails: naTickers,
            validTickers: validTickers.length,
            errorTickers: errorTickers,
            summary: {
                total: tickers.length,
                valid: validTickers.length,
                na: naTickers.length,
                errors: errorTickers.length
            }
        });

    } catch (error) {
        console.error(' Erreur 3p1-sync-na:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur inconnue'
        });
    }
}

/**
 * Verifie si un ticker a des valeurs N/A
 */
function hasNAValues(data, info, currentPrice) {
    if (!data || data.length === 0) return true;
    
    const hasValidData = data.some(d => 
        (d.earningsPerShare && d.earningsPerShare > 0) || 
        (d.cashFlowPerShare && d.cashFlowPerShare > 0) || 
        (d.bookValuePerShare && d.bookValuePerShare > 0)
    );
    
    if (!hasValidData) return true;
    if (!currentPrice || currentPrice <= 0 || !isFinite(currentPrice)) return true;

    // Simuler les assumptions par defaut
    const assumptions = {
        currentPrice,
        baseYear: data[data.length - 1].year,
        growthRateEPS: 5.0,
        growthRateCF: 5.0,
        growthRateBV: 3.0,
        growthRateDiv: 1.0
    };

    const jpegy = calculateJPEGY(data, assumptions);
    return jpegy === null;
}

/**
 * Calcule le JPEGY
 */
function calculateJPEGY(data, assumptions) {
    if (!data || data.length === 0) return null;
    
    const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
    if (!baseYearData) return null;

    const currentPrice = Math.max(assumptions.currentPrice || 0, 0.01);
    if (currentPrice <= 0 || !isFinite(currentPrice)) return null;

    const eps = baseYearData.earningsPerShare || 0;
    const dividend = baseYearData.dividendPerShare || 0;
    const basePE = eps > 0 ? currentPrice / eps : null;
    
    if (!basePE || !isFinite(basePE) || basePE <= 0) return null;

    const growthRate = assumptions.growthRateEPS || 0;
    const yieldRate = dividend > 0 ? (dividend / currentPrice) * 100 : 0;
    const growthPlusYield = growthRate + yieldRate;

    if (growthPlusYield <= 0.01) return null;

    const jpegy = basePE / growthPlusYield;
    
    if (!isFinite(jpegy) || jpegy < 0 || jpegy > 100) return null;
    
    return jpegy;
}

