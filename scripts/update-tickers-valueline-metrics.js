/**
 * Script pour mettre à jour les métriques ValueLine dans Supabase
 * 
 * Usage: node scripts/update-tickers-valueline-metrics.js
 * 
 * Ce script permet de mettre à jour:
 * - security_rank (Financial Strength)
 * - earnings_predictability
 * - price_growth
 * - persistence
 * - price_stability
 * - beta (via API FMP)
 * 
 * Les données ValueLine doivent être fournies dans un fichier CSV ou JSON
 * ou directement dans le code ci-dessous.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL et SUPABASE_KEY doivent être définis dans .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// DONNÉES VALUELINE - À METTRE À JOUR AVEC LES VRAIES DONNÉES
// ============================================================================
// Format: { ticker: { securityRank, earningsPredictability, priceGrowth, persistence, priceStability } }
const valuelineData = {
    // Exemple de structure - À REMPLACER avec les vraies données
    'AAPL': {
        securityRank: 'A+',
        earningsPredictability: '100',
        priceGrowth: 'A++',
        persistence: 'A+',
        priceStability: '100'
    },
    // Ajouter tous les autres tickers ici...
};

// ============================================================================
// FONCTION POUR RÉCUPÉRER LE BETA VIA FMP
// ============================================================================
async function fetchBetaFromFMP(ticker) {
    const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;
    if (!FMP_KEY) {
        console.warn(`⚠️ FMP_API_KEY non configurée, beta non récupéré pour ${ticker}`);
        return null;
    }

    try {
        // Essayer d'abord le profile qui contient souvent le beta
        const profileRes = await fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_KEY}`);
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData && profileData.length > 0 && profileData[0].beta) {
                return parseFloat(profileData[0].beta);
            }
        }

        // Essayer key-metrics si beta pas dans profile
        const metricsRes = await fetch(`https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?period=annual&limit=1&apikey=${FMP_KEY}`);
        if (metricsRes.ok) {
            const metricsData = await metricsRes.json();
            if (metricsData && metricsData.length > 0 && metricsData[0].beta) {
                return parseFloat(metricsData[0].beta);
            }
        }

        return null;
    } catch (error) {
        console.error(`❌ Erreur récupération beta pour ${ticker}:`, error.message);
        return null;
    }
}

// ============================================================================
// FONCTION PRINCIPALE DE MISE À JOUR
// ============================================================================
async function updateTickersMetrics() {
    console.log('🚀 Début de la mise à jour des métriques ValueLine et Beta...\n');

    // 1. Récupérer tous les tickers actifs
    const { data: tickers, error: fetchError } = await supabase
        .from('tickers')
        .select('ticker')
        .eq('is_active', true);

    if (fetchError) {
        console.error('❌ Erreur récupération tickers:', fetchError);
        return;
    }

    if (!tickers || tickers.length === 0) {
        console.log('⚠️ Aucun ticker actif trouvé');
        return;
    }

    console.log(`📊 ${tickers.length} tickers actifs trouvés\n`);

    let updated = 0;
    let errors = 0;
    const updateDate = new Date('2025-12-03').toISOString(); // Date ValueLine

    // 2. Mettre à jour chaque ticker
    for (const { ticker } of tickers) {
        try {
            const tickerUpper = ticker.toUpperCase();
            const valuelineMetrics = valuelineData[tickerUpper];
            
            // Récupérer le beta via FMP
            const beta = await fetchBetaFromFMP(tickerUpper);
            
            // Préparer les données à mettre à jour
            const updateData = {
                updated_at: new Date().toISOString()
            };

            // Ajouter les métriques ValueLine si disponibles
            if (valuelineMetrics) {
                if (valuelineMetrics.securityRank) updateData.security_rank = valuelineMetrics.securityRank;
                if (valuelineMetrics.earningsPredictability) updateData.earnings_predictability = valuelineMetrics.earningsPredictability;
                if (valuelineMetrics.priceGrowth) updateData.price_growth = valuelineMetrics.priceGrowth;
                if (valuelineMetrics.persistence) updateData.persistence = valuelineMetrics.persistence;
                if (valuelineMetrics.priceStability) updateData.price_stability = valuelineMetrics.priceStability;
                updateData.valueline_updated_at = updateDate;
            }

            // Ajouter le beta si récupéré
            if (beta !== null) {
                updateData.beta = beta;
            }

            // Mettre à jour dans Supabase
            const { error: updateError } = await supabase
                .from('tickers')
                .update(updateData)
                .eq('ticker', tickerUpper);

            if (updateError) {
                console.error(`❌ Erreur mise à jour ${tickerUpper}:`, updateError.message);
                errors++;
            } else {
                const updates = [];
                if (valuelineMetrics) updates.push('ValueLine');
                if (beta !== null) updates.push(`Beta(${beta.toFixed(2)})`);
                console.log(`✅ ${tickerUpper}: ${updates.join(', ')}`);
                updated++;
            }

            // Petite pause pour éviter de surcharger les APIs
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`❌ Erreur traitement ${ticker}:`, error.message);
            errors++;
        }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${updated} tickers mis à jour`);
    console.log(`   ❌ ${errors} erreurs`);
    console.log(`\n✅ Mise à jour terminée!`);
}

// ============================================================================
// EXÉCUTION
// ============================================================================
if (require.main === module) {
    updateTickersMetrics()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { updateTickersMetrics, fetchBetaFromFMP };

