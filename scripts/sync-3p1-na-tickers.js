/**
 * Script pour synchroniser automatiquement les tickers 3p1 avec des valeurs N/A
 * 
 * Ce script :
 * 1. Charge tous les tickers actifs depuis Supabase
 * 2. Pour chaque ticker, appelle l'API backend /api/fmp-company-data pour récupérer les données
 * 3. Identifie les tickers avec des valeurs N/A (jpegy === null ou données invalides)
 * 4. Affiche un rapport détaillé
 * 
 * Usage: 
 *   node scripts/sync-3p1-na-tickers.js
 * 
 * Note: Ce script analyse les données mais ne les modifie pas directement.
 * Pour synchroniser, utilisez l'interface 3p1 ou créez un endpoint API dédié.
 */

import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.API_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables Supabase non configurées');
    console.error('   Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies dans .env');
    process.exit(1);
}

/**
 * Charge tous les tickers actifs depuis Supabase
 */
async function loadTickersFromSupabase() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tickers?is_active=eq.true&select=ticker,company_name,sector,source&limit=1000`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur Supabase: ${response.status} ${response.statusText}`);
        }

        const tickers = await response.json();
        console.log(`✅ ${tickers.length} tickers chargés depuis Supabase`);
        return tickers;
    } catch (error) {
        console.error('❌ Erreur chargement tickers:', error);
        throw error;
    }
}

/**
 * Récupère les données d'une compagnie via l'API backend
 */
async function fetchCompanyDataFromAPI(symbol) {
    const cleanSymbol = symbol.toUpperCase();
    
    try {
        const url = `${API_BASE_URL}/api/fmp-company-data?symbol=${encodeURIComponent(cleanSymbol)}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: `Symbole introuvable: ${errorData.tried?.join(', ') || cleanSymbol}`,
                    data: [],
                    info: {},
                    currentPrice: 0
                };
            }
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        return {
            success: true,
            data: result.data || [],
            info: result.info || {},
            currentPrice: result.currentPrice || 0
        };

    } catch (error) {
        console.error(`❌ Erreur fetch ${cleanSymbol}:`, error.message);
        return {
            success: false,
            error: error.message,
            data: [],
            info: {},
            currentPrice: 0
        };
    }
}

/**
 * Calcule le JPEGY pour déterminer si un ticker a des valeurs N/A
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

/**
 * Vérifie si un ticker a des valeurs N/A en simulant les calculs
 */
function hasNAValues(data, info, currentPrice) {
    // Vérifier si les données sont valides
    if (!data || data.length === 0) return true;
    
    // Vérifier si on a au moins une année avec des données valides
    const hasValidData = data.some(d => 
        (d.earningsPerShare && d.earningsPerShare > 0) || 
        (d.cashFlowPerShare && d.cashFlowPerShare > 0) || 
        (d.bookValuePerShare && d.bookValuePerShare > 0)
    );
    
    if (!hasValidData) return true;

    // Vérifier le prix actuel
    if (!currentPrice || currentPrice <= 0 || !isFinite(currentPrice)) return true;

    // Simuler les assumptions par défaut
    const assumptions = {
        currentPrice,
        baseYear: data[data.length - 1].year,
        growthRateEPS: 5.0,
        growthRateCF: 5.0,
        growthRateBV: 3.0,
        growthRateDiv: 1.0
    };

    // Calculer JPEGY
    const jpegy = calculateJPEGY(data, assumptions);
    
    // Si JPEGY est null, c'est un N/A
    return jpegy === null;
}

/**
 * Analyse tous les tickers et identifie ceux avec des valeurs N/A
 */
async function analyzeNATickers() {
    console.log('🚀 Démarrage de l\'analyse des tickers avec N/A...\n');
    console.log(`📡 API Base URL: ${API_BASE_URL}\n`);

    // 1. Charger les tickers depuis Supabase
    const tickers = await loadTickersFromSupabase();
    
    if (tickers.length === 0) {
        console.log('⚠️ Aucun ticker trouvé');
        return;
    }

    console.log(`📊 Analyse de ${tickers.length} tickers...\n`);

    // 2. Identifier les tickers avec N/A
    const naTickers = [];
    const validTickers = [];
    const errorTickers = [];
    const batchSize = 3;
    const delayBetweenBatches = 2000; // 2 secondes entre les batches

    for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        
        if (i > 0) {
            console.log(`⏳ Attente de ${delayBetweenBatches/1000}s avant le prochain batch...\n`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }

        await Promise.allSettled(
            batch.map(async (ticker) => {
                const symbol = ticker.ticker.toUpperCase();
                console.log(`🔍 [${i + batch.indexOf(ticker) + 1}/${tickers.length}] Vérification ${symbol}...`);
                
                const result = await fetchCompanyDataFromAPI(symbol);
                
                if (!result.success) {
                    console.log(`  ❌ ${symbol}: Erreur - ${result.error}`);
                    errorTickers.push({ 
                        ticker: symbol, 
                        reason: result.error,
                        companyName: ticker.company_name
                    });
                    return;
                }

                const hasNA = hasNAValues(result.data, result.info, result.currentPrice);
                
                if (hasNA) {
                    console.log(`  ⚠️ ${symbol}: Valeurs N/A détectées`);
                    console.log(`     Données: ${result.data.length} années`);
                    console.log(`     Prix actuel: ${result.currentPrice || 'N/A'}`);
                    naTickers.push({ 
                        ticker: symbol, 
                        reason: 'JPEGY null ou données invalides',
                        data: result.data,
                        info: result.info,
                        currentPrice: result.currentPrice,
                        companyName: ticker.company_name,
                        sector: ticker.sector
                    });
                } else {
                    console.log(`  ✅ ${symbol}: Données valides`);
                    validTickers.push({
                        ticker: symbol,
                        companyName: ticker.company_name,
                        dataYears: result.data.length,
                        currentPrice: result.currentPrice
                    });
                }
            })
        );
    }

    // 3. Afficher le résumé détaillé
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 RÉSUMÉ DE L'ANALYSE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📈 Total tickers analysés: ${tickers.length}`);
    console.log(`✅ Tickers valides: ${validTickers.length}`);
    console.log(`⚠️ Tickers avec N/A: ${naTickers.length}`);
    console.log(`❌ Tickers avec erreurs: ${errorTickers.length}\n`);

    if (naTickers.length > 0) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`⚠️ TICKERS AVEC VALEURS N/A (${naTickers.length})`);
        console.log(`${'='.repeat(70)}`);
        naTickers.forEach((item, index) => {
            console.log(`\n${index + 1}. ${item.ticker} - ${item.companyName || 'N/A'}`);
            console.log(`   Secteur: ${item.sector || 'N/A'}`);
            console.log(`   Raison: ${item.reason}`);
            console.log(`   Données: ${item.data.length} années`);
            console.log(`   Prix actuel: ${item.currentPrice || 'N/A'}`);
            
            // Afficher un résumé des données
            if (item.data.length > 0) {
                const latest = item.data[item.data.length - 1];
                console.log(`   Dernière année (${latest.year}):`);
                console.log(`     - EPS: ${latest.earningsPerShare || 'N/A'}`);
                console.log(`     - CF/Share: ${latest.cashFlowPerShare || 'N/A'}`);
                console.log(`     - BV/Share: ${latest.bookValuePerShare || 'N/A'}`);
                console.log(`     - Div/Share: ${latest.dividendPerShare || 'N/A'}`);
            }
        });
    }

    if (errorTickers.length > 0) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`❌ TICKERS AVEC ERREURS (${errorTickers.length})`);
        console.log(`${'='.repeat(70)}`);
        errorTickers.forEach((item, index) => {
            console.log(`${index + 1}. ${item.ticker} - ${item.companyName || 'N/A'}`);
            console.log(`   Erreur: ${item.reason}`);
        });
    }

    // 4. Recommandations
    console.log(`\n${'='.repeat(70)}`);
    console.log(`💡 RECOMMANDATIONS`);
    console.log(`${'='.repeat(70)}`);
    
    if (naTickers.length > 0) {
        console.log(`\nPour synchroniser les ${naTickers.length} tickers avec N/A:`);
        console.log(`1. Ouvrez l'application 3p1 dans votre navigateur`);
        console.log(`2. Allez dans l'onglet "KPI Dashboard"`);
        console.log(`3. Cliquez sur "Afficher N/A" pour filtrer les tickers avec N/A`);
        console.log(`4. Cliquez sur "Sync N/A" pour synchroniser uniquement ceux avec N/A`);
        console.log(`   OU`);
        console.log(`5. Cliquez sur "Sync avec critères" et sélectionnez "N/A Tickers"`);
        console.log(`\nLes tickers suivants devront être synchronisés:`);
        console.log(naTickers.map(t => t.ticker).join(', '));
    } else {
        console.log(`\n✅ Excellent! Aucun ticker avec N/A trouvé.`);
        console.log(`Tous les tickers ont des données valides.`);
    }

    if (errorTickers.length > 0) {
        console.log(`\n⚠️ ${errorTickers.length} ticker(s) ont des erreurs et nécessitent une attention:`);
        console.log(errorTickers.map(t => t.ticker).join(', '));
    }

    console.log(`\n${'='.repeat(70)}\n`);
}

// Exécuter le script
analyzeNATickers().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
